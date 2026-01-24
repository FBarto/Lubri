'use server';

import { prisma } from '../../lib/prisma';
import { revalidatePath } from "next/cache";
import { MAINTENANCE_ITEMS, MaintenanceStatus } from "./maintenance-data";
import { safeRevalidate } from './server-utils';
import { generateVehicleInsight } from './gemini';

export async function getVehicleAIInsight(vehicleId: number) {
    try {
        const history = await prisma.workOrder.findMany({
            where: { vehicleId, status: { in: ['COMPLETED', 'DELIVERED'] } },
            include: { saleItems: true, service: true },
            orderBy: { date: 'desc' },
            take: 5
        });

        if (history.length === 0) {
            return { success: true, insight: "🆕 Vehículo nuevo en el taller. Comienza a registrar su historia para recibir consejos inteligentes." };
        }

        const historyText = history.map(wo => {
            const items = wo.saleItems.map(i => i.description).join(', ');
            return `- ${new Date(wo.date).toLocaleDateString()}: ${wo.service.name} (${wo.mileage || '---'} km). Productos: ${items}.`;
        }).join('\n');

        const res = await generateVehicleInsight(historyText);
        return res;

    } catch (error) {
        console.error("Error in getVehicleAIInsight:", error);
        return { success: false, error: 'Error al generar recomendación AI' };
    }
}

export async function getVehicleMaintenanceHistory(vehicleId: number) {
    try {
        const workOrders = await prisma.workOrder.findMany({
            where: { vehicleId, status: { in: ['COMPLETED', 'DELIVERED'] } },
            include: { saleItems: true, service: true },
            orderBy: { date: 'desc' }
        });

        const findLast = (keywords: string[]) => {
            for (const wo of workOrders) {
                const foundItem = wo.saleItems.find(item =>
                    keywords.some(k => item.description.toLowerCase().includes(k))
                );

                const foundNote = keywords.some(k =>
                    (wo.notes?.toLowerCase().includes(k)) ||
                    (wo.service.name.toLowerCase().includes(k)) ||
                    (wo.serviceDetails && JSON.stringify(wo.serviceDetails).toLowerCase().includes(k))
                );

                if (foundItem || foundNote) {
                    const daysAgo = Math.floor((Date.now() - new Date(wo.date).getTime()) / (1000 * 60 * 60 * 24));

                    // Extra specific logic for oil type
                    let detail = foundItem?.description || null;
                    if (keywords.includes('"oil":') && wo.serviceDetails) {
                        const sd = wo.serviceDetails as any;
                        if (sd.oil?.type) detail = sd.oil.type;
                    }

                    return {
                        date: wo.date,
                        mileage: wo.mileage,
                        daysAgo,
                        detail
                    };
                }
            }
            return null;
        };

        const processCategory = (items: typeof MAINTENANCE_ITEMS['filters']) => {
            return items.map(item => {
                const last = findLast(item.keywords);
                let status: MaintenanceStatus['status'] = 'UNKNOWN';

                if (last) {
                    if (last.daysAgo && last.daysAgo > 365) status = 'WARNING';
                    else status = 'OK';
                }

                return {
                    key: item.key,
                    label: item.label,
                    lastDate: last?.date || null,
                    lastMileage: last?.mileage || null,
                    daysAgo: last?.daysAgo || null,
                    detail: last?.detail || null,
                    status
                };
            });
        };

        return {
            success: true,
            data: {
                filters: processCategory(MAINTENANCE_ITEMS.filters),
                fluids: processCategory(MAINTENANCE_ITEMS.fluids),
                services: processCategory(MAINTENANCE_ITEMS.services),
            }
        };

    } catch (error) {
        console.error('Maintenance history error:', error);
        return { success: false, error: 'Error calculating maintenance' };
    }
}

/**
 * Updates vehicle projections (avg daily km, next service date)
 * Triggered when a Work Order is marked as COMPLETED with mileage.
 */
export async function updateVehicleProjections(vehicleId: number, currentMileage: number) {
    try {
        const vehicle = await prisma.vehicle.findUnique({
            where: { id: vehicleId },
            include: {
                workOrders: {
                    where: { status: 'DELIVERED', NOT: { mileage: null } },
                    orderBy: { date: 'desc' },
                    take: 1
                }
            }
        });

        if (!vehicle) return;

        const now = new Date();
        let averageDailyKm = vehicle.averageDailyKm || 30;
        let predictedDate = new Date(now.getTime() + (333 * 24 * 60 * 60 * 1000));

        if (vehicle.workOrders.length > 0) {
            const lastWO = vehicle.workOrders[0];
            const prevMileage = lastWO.mileage || 0;
            const prevDate = new Date(lastWO.date);

            const deltaKM = currentMileage - prevMileage;
            const deltaDays = (now.getTime() - prevDate.getTime()) / (1000 * 60 * 60 * 24);

            if (deltaKM > 0 && deltaDays > 1) {
                averageDailyKm = deltaKM / deltaDays;
                averageDailyKm = Math.max(5, Math.min(200, averageDailyKm));

                const kmToNext = 10000;
                const daysToNext = kmToNext / averageDailyKm;

                predictedDate = new Date(now.getTime() + (daysToNext * 24 * 60 * 60 * 1000));
            }
        }

        await prisma.vehicle.update({
            where: { id: vehicleId },
            data: {
                mileage: currentMileage,
                lastServiceDate: now,
                lastServiceMileage: currentMileage,
                averageDailyKm: averageDailyKm,
                predictedNextService: predictedDate
            }
        });

        revalidatePath(`/admin/vehicles`);
        revalidatePath(`/portal`);

    } catch (error) {
        console.error("Error updating projections:", error);
    }
}

/**
 * Retrieves the items from the last specific service to pre-fill a new quote.
 * Tries to match historical items with current inventory codes/prices.
 */
export async function getLastServiceItems(vehicleId: number) {
    try {
        const lastOrder = await prisma.workOrder.findFirst({
            where: { vehicleId, status: { in: ['COMPLETED', 'DELIVERED'] } },
            orderBy: { date: 'desc' },
            include: {
                saleItems: true
            }
        });

        if (!lastOrder) return { success: false, error: 'No service history found' };

        // Match items with current Product table to get updated prices and stock
        const currentItems = await Promise.all(lastOrder.saleItems.map(async (item) => {
            // Try to find by Product ID first if stored
            let product = null;

            if (item.productId) {
                product = await prisma.product.findUnique({ where: { id: item.productId } });
            }

            // Fallback: Try by Name matching
            if (!product) {
                const candidates = await prisma.product.findMany({
                    where: {
                        name: { contains: item.description, mode: 'insensitive' },
                        active: true
                    },
                    take: 1
                });
                if (candidates.length > 0) product = candidates[0];
            }

            if (product) {
                return {
                    found: true,
                    id: product.id,
                    name: product.name,
                    price: product.price,
                    quantity: item.quantity,
                    stock: product.stock,
                    category: product.category,
                    type: item.type
                };
            } else {
                // Item exists in history but not in current catalog
                return {
                    found: false,
                    name: item.description,
                    price: item.unitPrice,
                    quantity: item.quantity,
                    estimate: true
                };
            }
        }));

        return {
            success: true,
            data: {
                date: lastOrder.date,
                mileage: lastOrder.mileage,
                items: currentItems
            }
        };

    } catch (error) {
        console.error("Error fetching last service items:", error);
        return { success: false, error: 'Database error' };
    }
}

export async function getRecentWorkOrders(vehicleId: number, limit: number = 5) {
    try {
        const orders = await prisma.workOrder.findMany({
            where: { vehicleId, status: { in: ['COMPLETED', 'DELIVERED'] } },
            orderBy: { date: 'desc' },
            take: limit,
            include: {
                saleItems: {
                    include: { product: true }
                },
                appointment: true
            }
        });
        return { success: true, data: orders };
    } catch (error) {
        return { success: false, error: 'Error fetching history' };
    }
}

// --- SMART ESTIMATE LOGIC ---

/**
 * Saves the "learned" preferences for a vehicle (e.g. which oil filter it uses).
 */
export async function saveVehicleLearnedSpecs(vehicleId: number, learnedData: any) {
    try {
        const vehicle = await prisma.vehicle.findUnique({ where: { id: vehicleId } });
        if (!vehicle) return { success: false, error: "Vehicle not found" };

        const currentSpecs = (vehicle.specifications as any) || {};
        const updatedSpecs = {
            ...currentSpecs,
            learned: {
                ...(currentSpecs.learned || {}),
                ...learnedData,
                lastUpdated: new Date()
            }
        };

        await prisma.vehicle.update({
            where: { id: vehicleId },
            data: {
                specifications: updatedSpecs
            }
        });
        return { success: true };
    } catch (error) {
        console.error("Error saving specs:", error);
        return { success: false, error: "Failed to save specs" };
    }
}

/**
 * Converts a quote into a real Work Order.
 */
export async function confirmQuoteAsWorkOrder(data: {
    vehicleId: number,
    clientId: number,
    items: any[],
    mileage?: number,
    userId?: number
}) {
    try {
        // 1. Find a default service for "Service General" or similar if not specified
        const defaultService = await prisma.service.findFirst({
            where: { name: { contains: 'Service', mode: 'insensitive' }, active: true }
        }) || await prisma.service.findFirst({ where: { active: true } });

        if (!defaultService) throw new Error("No active services found in database");

        // 2. Create a dummy Sale record (Quote/Service) to satisfy DB constraints if any
        // Some databases might require saleId in SaleItem (Check constraint found)
        const total = data.items.reduce((sum, i) => sum + (Number(i.price) * Number(i.quantity)), 0);

        const sale = await prisma.sale.create({
            data: {
                total: total,
                userId: data.userId || 1,
                paymentMethod: 'QUOTE',
            }
        });

        // 3. Create the Work Order (without nested items)
        const wo = await prisma.workOrder.create({
            data: {
                vehicleId: data.vehicleId,
                clientId: data.clientId,
                serviceId: defaultService.id,
                status: 'PENDING',
                mileage: data.mileage,
                price: total,
                userId: data.userId,
                saleId: sale.id,
                serviceDetails: { items: data.items } // Store items in JSON for EditModal consistency
            }
        });

        console.log('WorkOrder Created successfully:', wo.id);

        // 4. Create SaleItems individually
        for (const item of data.items) {
            await prisma.saleItem.create({
                data: {
                    saleId: sale.id,
                    workOrderId: wo.id,
                    type: item.type || 'PRODUCT',
                    description: item.name,
                    quantity: Number(item.quantity),
                    unitPrice: Number(item.price),
                    subtotal: Math.round(Number(item.price) * Number(item.quantity) * 100) / 100, // Avoid precision issues, keep as float
                    productId: item.productId || undefined,
                }
            });
        }

        // 5. Update Vehicle Projection (Basic update as it's PENDING)
        if (data.mileage) {
            await prisma.vehicle.update({
                where: { id: data.vehicleId },
                data: { mileage: Number(data.mileage) }
            });
        }

        // 6. Save Learned Specs (Filter codes)
        const filters = data.items
            .filter(i => i.category && i.category.includes('FILTER') && i.productId)
            .reduce((acc, i) => {
                acc[i.category.toLowerCase()] = {
                    productId: i.productId,
                    name: i.name,
                    code: i.code
                };
                return acc;
            }, {} as any);

        if (Object.keys(filters).length > 0) {
            await saveVehicleLearnedSpecs(data.vehicleId, filters);
        }

        safeRevalidate('/admin/smart-quote');
        safeRevalidate('/employee');

        return { success: true, workOrderId: wo.id };

    } catch (error: any) {
        console.error("Error confirming quote FULL ERROR:", error);
        return { success: false, error: 'Failed to create work order', details: error.message };
    }
}

/**
 * Generates a service estimate based on history or learned specs.
 * Applies presets (BASIC vs FULL).
 */
export async function suggestServiceEstimate(vehicleId: number, preset: 'BASIC' | 'FULL' = 'BASIC') {
    try {
        const vehicle = await prisma.vehicle.findUnique({
            where: { id: vehicleId }
        });

        if (!vehicle) return { success: false, error: 'Vehicle not found' };

        // 1. Try to get items from Learned Specs
        // TODO: Implement parsing of vehicle.specifications if we decide to trust it 100%
        // For now, we lean on "Last Service History" as the primary source of truth 
        // until 'specifications' is populated.

        // 2. Fallback to History
        const historyRes = await getLastServiceItems(vehicleId);
        if (!historyRes.success || !historyRes.data) {
            return { success: false, error: 'No history found for estimate' };
        }

        const allItems = historyRes.data.items;

        // 3. Categorize items using keywords
        const categorizedDetails = allItems.map(item => {
            const lowerName = item.name.toLowerCase();

            let category = 'OTHER';
            // Check Oil
            if (MAINTENANCE_ITEMS.fluids.find(f => f.key === 'engine_oil')?.keywords.some(k => lowerName.includes(k))) {
                category = 'ENGINE_OIL';
            }
            // Check Oil Filter
            else if (MAINTENANCE_ITEMS.filters.find(f => f.key === 'oil_filter')?.keywords.some(k => lowerName.includes(k))) {
                category = 'OIL_FILTER';
            }
            // Check Air Filter
            else if (MAINTENANCE_ITEMS.filters.find(f => f.key === 'air_filter')?.keywords.some(k => lowerName.includes(k))) {
                category = 'AIR_FILTER';
            }
            // Check Cabin Filter
            else if (MAINTENANCE_ITEMS.filters.find(f => f.key === 'cabin_filter')?.keywords.some(k => lowerName.includes(k))) {
                category = 'CABIN_FILTER';
            }
            // Check Fuel Filter
            else if (MAINTENANCE_ITEMS.filters.find(f => f.key === 'fuel_filter')?.keywords.some(k => lowerName.includes(k))) {
                category = 'FUEL_FILTER';
            }

            return { ...item, determinedCategory: category };
        });

        // 4. Filter based on Preset
        let suggestionItems = [];

        if (preset === 'BASIC') {
            // Oil + Oil Filter
            suggestionItems = categorizedDetails.filter(i =>
                i.determinedCategory === 'ENGINE_OIL' ||
                i.determinedCategory === 'OIL_FILTER'
            );
        } else {
            // FULL: Oil + All Filters
            suggestionItems = categorizedDetails.filter(i =>
                i.determinedCategory === 'ENGINE_OIL' ||
                i.determinedCategory.includes('_FILTER')
            );
        }

        return {
            success: true,
            data: {
                items: suggestionItems,
                source: 'HISTORY', // or 'LEARNED'
                lastServiceDate: historyRes.data.date
            }
        };

    } catch (error) {
        console.error("Error generating estimate:", error);
        return { success: false, error: 'Estimate generation failed' };
    }
}
