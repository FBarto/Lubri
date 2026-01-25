'use server';

import { prisma } from '../../lib/prisma';

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
            const items = Object.values(specs).map((s: any) => ({
                id: s.productId || Math.random(), // fallback id
                name: s.name,
                price: 0, // We need to fetch current price!
                quantity: 1,
                type: 'PRODUCT',
                isLearned: true
            }));

            // Fetch current prices
            for (const item of items) {
                if ((item as any).id) {
                    const p = await prisma.product.findUnique({ where: { id: Number((item as any).id) } });
                    if (p) {
                        item.price = p.price;
                        item.name = p.name; // Refresh name
                    }
                }
            }

            return { success: true, method: 'LEARNED', items };
        }

        // STRATEGY 2: HISTORY (The "Habit")
        // What did we put in this car last time?
        // We import dynamically to avoid circular deps if any, though likely fine.
        const { getLastServiceItems } = await import('./maintenance-actions');
        const lastService = await getLastServiceItems(vehicleId);

        if (lastService.success && lastService.data && lastService.data.items.length > 0) {
            // Filter for Oil/Filters only to be safe? Or return whole service?
            // Usually we want to replicate the maintenance.
            return { success: true, method: 'HISTORY', items: lastService.data.items };
        }

        // STRATEGY 3: COLLECTIVE INTELLIGENCE (The "Crowd")
        // What do other cars of this model use?
        const insights = await getVehicleInsights(vehicle.brand || '', vehicle.model || '');

        if (insights && insights.topProducts.length > 0) {
            const items = await Promise.all(insights.topProducts.map(async (p) => {
                // product: { name: 'Shell 10w40', count: 10, type: 'PRODUCT' }
                // We need to find the real product to get price
                const realProduct = await prisma.product.findFirst({
                    where: { name: p.name, active: true }
                });

                let qty = 1;
                // Smart Quantity Logic
                // If it's an OIL and seems to be 1 Liter (or not explicitly 4L/20L), default to 4.
                // Assuming type 'ACEITE' or similar if we had it, but loosely relying on product name or category if possible.
                // For now, if p.type is likely 'PRODUCT' (generic), we check name.
                const nameUpper = p.name.toUpperCase();
                const isOil = nameUpper.includes('ACEITE') || nameUpper.includes('HELIX') || nameUpper.includes('ELAION') || nameUpper.includes('TOTAL') || nameUpper.includes('CASTROL');
                const isLarge = nameUpper.includes('4L') || nameUpper.includes('4 L') || nameUpper.includes('20L') || nameUpper.includes('BIDON') || nameUpper.includes('BALDE');

                if (isOil && !isLarge) {
                    qty = 4; // Default to 4 liters for loose oil / 1L bottles
                }

                return {
                    id: realProduct?.id || Math.random(),
                    name: p.name,
                    price: realProduct?.price || 0,
                    quantity: qty,
                    type: p.type
                };
            }));

            return { success: true, method: 'CROWD', items };
        }

        return { success: false, error: 'No se encontraron datos suficientes para sugerir.' };

    } catch (error) {
        console.error('Smart Suggest Error:', error);
        return { success: false, error: 'Error interno de IA' };
    }
}
