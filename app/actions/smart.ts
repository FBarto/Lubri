'use server';

import { prisma } from '../../lib/prisma';
// import { getLastServiceItems } from './maintenance'; // Dynamic import used in original, keeping it dynamic or static?
// Dynamic import was likely used to avoid circular dependency or just lazy loading. 
// "maintenance" imports "gemini" etc. 
// Let's keep the logic but point to the right file.

export type SearchResult = {
    id: string | number;
    label: string;
    subLabel?: string;
    value: string;
    data?: any;
};

// 1. Search Vehicles (Make/Model)
export async function searchVehicleModels(query: string): Promise<SearchResult[]> {
    if (!query || query.length < 2) return [];

    const vehicles = await prisma.vehicle.findMany({
        where: {
            OR: [
                { model: { contains: query, mode: 'insensitive' } },
                { brand: { contains: query, mode: 'insensitive' } }
            ]
        },
        take: 20,
        distinct: ['brand', 'model']
    });

    return vehicles.map(v => ({
        id: v.id,
        label: `${v.brand || ''} ${v.model || ''}`.trim(),
        value: `${v.brand || ''} ${v.model || ''}`.trim(),
        subLabel: v.plate,
        data: { brand: v.brand, model: v.model }
    }));
}

// 2. Search Products (Oils, Filters)
export async function searchProducts(query: string, category?: string): Promise<SearchResult[]> {
    if (!query || query.length < 2) return [];

    const products = await prisma.product.findMany({
        where: {
            name: { contains: query, mode: 'insensitive' },
            ...(category ? { category: { contains: category, mode: 'insensitive' } } : {})
        },
        take: 20
    });

    return products.map(p => ({
        id: p.id,
        label: p.name,
        value: p.name,
        subLabel: `$${p.price.toFixed(2)} - Stock: ${p.stock}`
    }));
}

// 3. Get Insights (What filters/oils does this model usually use?)
export async function getVehicleInsights(brand: string, model: string) {
    if (!brand || !model) return null;

    // Use WorkOrders to find what was sold for this vehicle model
    // WorkOrder has relation 'vehicle'.
    // We want completed work orders.
    const workOrders = await prisma.workOrder.findMany({
        where: {
            vehicle: {
                brand: { equals: brand, mode: 'insensitive' },
                model: { equals: model, mode: 'insensitive' }
            },
            status: { not: 'PENDING' }
        },
        include: {
            saleItems: true
        },
        take: 50,
        orderBy: { date: 'desc' }
    });

    // Aggregate Items from WorkOrder.saleItems
    const productCounts: Record<string, { name: string, count: number, type: string }> = {};

    workOrders.forEach(wo => {
        wo.saleItems.forEach(item => {
            // item is SaleItem. Has 'description', 'type'.
            if (!productCounts[item.description]) {
                productCounts[item.description] = {
                    name: item.description,
                    count: 0,
                    type: item.type
                };
            }
            productCounts[item.description].count++;
        });
    });

    // Sort by frequency
    const topProducts = Object.values(productCounts)
        .sort((a, b) => b.count - a.count)
        .slice(0, 5); // Top 5 used items

    return {
        topProducts
    };
}

// Helper to adjust quantity for loose oils (default to 4L)
function applySmartQuantity(item: any) {
    let qty = item.quantity || 1;
    const nameUpper = (item.name || '').toUpperCase();
    const isOil = nameUpper.includes('ACEITE') || nameUpper.includes('HELIX') || nameUpper.includes('ELAION') || nameUpper.includes('TOTAL') || nameUpper.includes('CASTROL');
    const isLarge = nameUpper.includes('4L') || nameUpper.includes('4 L') || nameUpper.includes('20L') || nameUpper.includes('BIDON') || nameUpper.includes('BALDE');

    if (isOil && !isLarge) {
        qty = 4;
    }
    return { ...item, quantity: qty };
}

// 4. Smart Service Suggestion (The "Brain")
export async function suggestServiceItems(vehicleId: number) {
    try {
        const vehicle = await prisma.vehicle.findUnique({ where: { id: vehicleId } });
        if (!vehicle) return { success: false, error: 'Vehículo no encontrado' };

        // STRATEGY 1: LEARNED SPECS (The "Memory")
        // If we explicitly saved what filters/oil this car uses.
        const specs = (vehicle.specifications as any)?.learned;
        if (specs && Object.keys(specs).length > 0) {
            // Convert stored specs to QuoteItems
            // learned: { oil_filter: { productId: 1, name: 'Filter X', ... } }
            let items: any[] = Object.values(specs).map((s: any) => ({
                id: s.productId || Math.random(), // fallback id
                name: s.name,
                price: 0, // We need to fetch current price!
                quantity: 1,
                type: 'PRODUCT',
                isLearned: true
            }));

            // Fetch current prices
            for (let i = 0; i < items.length; i++) {
                const item = items[i];
                if (item.id && typeof item.id !== 'string') {
                    // It's a number (real ID) presumably
                }

                // If the spec had a real productId, try to fetch it to get price/name
                const specKey = Object.keys(specs)[i];
                const s = (specs as any)[specKey];

                if (s.productId) {
                    const p = await prisma.product.findUnique({ where: { id: Number(s.productId) } });
                    if (p) {
                        item.price = p.price;
                        item.name = p.name;
                    }
                }
                items[i] = applySmartQuantity(item);
            }

            return { success: true, data: { method: 'LEARNED', items } };
        }

        // STRATEGY 2: HISTORY (The "Habit")
        // What did we put in this car last time?
        // We import dynamically to avoid circular deps if any, though likely fine.
        const { getLastServiceItems } = await import('./maintenance');
        const lastService = await getLastServiceItems(vehicleId);

        if (lastService.success && lastService.data && lastService.data.items.length > 0) {
            // Apply Smart Quantity to history items too (incase they were saved as 1 unit loose)
            const items = lastService.data.items.map((item: any) => applySmartQuantity(item));
            // Filter for Oil/Filters only? Or return whole service?
            // Usually we want to replicate the maintenance.
            return { success: true, data: { method: 'HISTORY', items } };
        }

        // STRATEGY 3: COLLECTIVE INTELLIGENCE (The "Crowd")
        // What do other cars of this model use?
        const insights = await getVehicleInsights(vehicle.brand || '', vehicle.model || '');

        if (insights && insights.topProducts.length > 0) {
            const items = await Promise.all(insights.topProducts.map(async (p: any) => {
                // product: { name: 'Shell 10w40', count: 10, type: 'PRODUCT' }
                // We need to find the real product to get price
                const realProduct = await prisma.product.findFirst({
                    where: { name: p.name, active: true }
                });

                const rawItem = {
                    id: realProduct?.id || Math.random(),
                    name: p.name,
                    price: realProduct?.price || 0,
                    quantity: 1,
                    type: p.type
                };

                return applySmartQuantity(rawItem);
            }));

            return { success: true, data: { method: 'CROWD', items } };
        }

        return { success: false, error: 'No se encontraron datos suficientes para sugerir.' };

    } catch (error) {
        console.error('Smart Suggest Error:', error);
        return { success: false, error: 'Error interno de IA' };
    }
}
