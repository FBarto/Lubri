'use server';

import { prisma } from '../../lib/prisma';
import { revalidatePath } from "next/cache";
import { MAINTENANCE_ITEMS, MaintenanceStatus } from "../lib/maintenance-data";
import { safeRevalidate } from '../lib/server-utils';
import { generateVehicleInsight } from '../lib/gemini';
import { mapLegacyProductCode } from '../lib/product-mapper';
import { ActionResponse } from './types';

export async function getVehicleAIInsight(vehicleId: number): Promise<ActionResponse> {
    try {
        const history = await prisma.workOrder.findMany({
            where: { vehicleId, status: { in: ['COMPLETED', 'DELIVERED'] } },
            include: { saleItems: true, service: true },
            orderBy: { date: 'desc' },
            take: 5
        });

        if (history.length === 0) {
            return { success: true, data: "🆕 Vehículo nuevo en el taller. Comienza a registrar su historia para recibir consejos inteligentes." };
        }

        const historyText = history.map(wo => {
            const items = wo.saleItems.map(i => i.description).join(', ');
            return `- ${new Date(wo.date).toLocaleDateString()}: ${wo.service.name} (${wo.mileage || '---'} km). Productos: ${items}.`;
        }).join('\n');

        const res = await generateVehicleInsight(historyText);
        return { success: true, data: { insight: res.insight } };

    } catch (error) {
        console.error("Error in getVehicleAIInsight:", error);
        return { success: false, error: 'Error al generar recomendación AI' };
    }
}

export async function getVehicleMaintenanceHistory(vehicleId: number): Promise<ActionResponse> {
    try {
        const workOrders = await prisma.workOrder.findMany({
            where: { vehicleId, status: { in: ['COMPLETED', 'DELIVERED'] } },
            include: { saleItems: true, service: true },
            orderBy: { date: 'desc' }
        });

        const extractCapacity = (str: string) => {
            const match = str.match(/^(\d+([.,]\d+)?)\s*(L|LTS|LTS\.)?/i);
            return match ? match[1].replace(',', '.') : null;
        };

        const findLast = (keywords: string[], key?: string) => {
            for (const wo of workOrders) {
                const foundItem = wo.saleItems.find(item =>
                    keywords.some(k => item.description.toLowerCase().includes(k))
                );

                // Check if any keyword matches structured data or notes
                // For filters, "oil":true in JSON will match "oil" keyword
                const foundNote = keywords.some(k =>
                    (wo.notes?.toLowerCase().includes(k)) ||
                    (wo.service.name.toLowerCase().includes(k)) ||
                    (wo.serviceDetails && JSON.stringify(wo.serviceDetails).toLowerCase().includes(k))
                );

                // If we found a relevant item OR a note/data match, investigate deeper to confirm validity
                if (foundItem || foundNote) {
                    const daysAgo = Math.floor((Date.now() - new Date(wo.date).getTime()) / (1000 * 60 * 60 * 24));

                    let detail = foundItem?.description || null;
                    let extractedLiters = null;
                    let isValidMatch = !!foundItem;

                    if (wo.serviceDetails) {
                        const sd = wo.serviceDetails as any;

                        // --- Engine Oil ---
                        if (key === 'engine_oil') {
                            if (sd.oil?.type || sd.oil?.brand) {
                                const parts = [];
                                if (sd.oil.brand) parts.push(sd.oil.brand);
                                if (sd.oil.type) parts.push(sd.oil.type);
                                if (parts.length > 0) {
                                    detail = parts.join(' ');
                                    isValidMatch = true;
                                }
                                extractedLiters = sd.oil.liters || (sd.oil.type ? extractCapacity(sd.oil.type) : null);
                            }
                        }

                        // --- Filters ---
                        // Force validation if checkbox is checked, regardless of item match
                        else if (key === 'oil_filter') {
                            const txt = sd.filterDetails?.oil || sd.filters?.oilCode;
                            if (txt && txt.length > 1) { detail = txt; isValidMatch = true; }
                            if (sd.filters?.oil === true) { isValidMatch = true; if (!detail || detail.length < 2) detail = 'Cambiado'; }
                        }
                        else if (key === 'air_filter') {
                            const txt = sd.filterDetails?.air || sd.filters?.airCode;
                            if (txt && txt.length > 1) { detail = txt; isValidMatch = true; }
                            if (sd.filters?.air === true) { isValidMatch = true; if (!detail || detail.length < 2) detail = 'Cambiado'; }
                        }
                        else if (key === 'fuel_filter') {
                            const txt = sd.filterDetails?.fuel || sd.filters?.fuelCode;
                            if (txt && txt.length > 1) { detail = txt; isValidMatch = true; }
                            if (sd.filters?.fuel === true) { isValidMatch = true; if (!detail || detail.length < 2) detail = 'Cambiado'; }
                        }
                        else if (key === 'cabin_filter') {
                            const txt = sd.filterDetails?.cabin || sd.filters?.cabinCode;
                            if (txt && txt.length > 1) { detail = txt; isValidMatch = true; }
                            if (sd.filters?.cabin === true) { isValidMatch = true; if (!detail || detail.length < 2) detail = 'Cambiado'; }
                        }

                        // --- Fluids ---
                        else if (key === 'gearbox_oil' && sd.fluids?.gearbox) { detail = (typeof sd.fluids.gearbox === 'string' ? sd.fluids.gearbox : 'Revisado'); isValidMatch = true; }
                        else if (key === 'coolant' && sd.fluids?.coolant) { detail = (typeof sd.fluids.coolant === 'string' ? sd.fluids.coolant : 'Revisado'); isValidMatch = true; }
                        else if (key === 'brake_fluid' && sd.fluids?.brakes) { detail = (typeof sd.fluids.brakes === 'string' ? sd.fluids.brakes : 'Revisado'); isValidMatch = true; }
                    }

                    if (isValidMatch) {
                        return {
                            date: wo.date,
                            mileage: wo.mileage,
                            daysAgo,
                            detail,
                            liters: extractedLiters
                        };
                    }
                }
            }
            return null;
        };

        let detectedLiters: string | null = null;

        // Find latest valid capacity across ALL history as fallback
        for (const wo of workOrders) {
            if (wo.serviceDetails) {
                const sd = wo.serviceDetails as any;
                const cap = sd.oil?.liters || (sd.oil?.type ? extractCapacity(sd.oil.type) : null);
                if (cap) {
                    detectedLiters = cap;
                    break;
                }
            }
        }

        const processCategory = (items: typeof MAINTENANCE_ITEMS['filters']) => {
            return items.map(item => {
                const last = findLast(item.keywords, item.key);
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

        // Battery Voltage Extraction
        let detectedVoltage: string | null = null;
        for (const wo of workOrders) {
            const sd = wo.serviceDetails as any;
            if (sd?.battery?.voltage) {
                detectedVoltage = sd.battery.voltage;
                break;
            }
        }

        const resData = {
            filters: processCategory(MAINTENANCE_ITEMS.filters),
            fluids: processCategory(MAINTENANCE_ITEMS.fluids),
            services: processCategory(MAINTENANCE_ITEMS.services),
            oilCapacity: detectedLiters,
            batteryVoltage: detectedVoltage
        };

        return {
            success: true,
            data: resData
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
export async function updateVehicleProjections(vehicleId: number, currentMileage: number) { // Returns void/undefined usually, but lets match Promise<void>
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
export async function getLastServiceItems(vehicleId: number): Promise<ActionResponse> {
    try {
        const lastOrder = await prisma.workOrder.findFirst({
            where: { vehicleId, status: { in: ['COMPLETED', 'DELIVERED'] } },
            orderBy: { date: 'desc' },
            include: {
                saleItems: true
            }
        });

        if (!lastOrder) return { success: false, error: 'No service history found' };

        // 2. Extract items (from saleItems or historical serviceDetails)
        let rawItems = lastOrder.saleItems.map(i => ({
            description: i.description,
            quantity: i.quantity,
            unitPrice: i.unitPrice,
            productId: i.productId,
            type: i.type,
            category: (i as any).category // Some might have category if manually added
        }));

        if (rawItems.length === 0 && lastOrder.serviceDetails) {
            const sd = lastOrder.serviceDetails as any;

            // Extract Oil
            if (sd.oil?.type) {
                rawItems.push({
                    description: sd.oil.type,
                    quantity: Number(sd.oil.liters) || 1,
                    unitPrice: 0,
                    productId: null,
                    type: 'PRODUCT',
                    category: 'ENGINE_OIL'
                });
            }

            // Extract Filters
            if (sd.filters) {
                if (sd.filters.oil) rawItems.push({ description: sd.filters.oil, quantity: 1, unitPrice: 0, productId: null, type: 'PRODUCT', category: 'OIL_FILTER' });
                if (sd.filters.air) rawItems.push({ description: sd.filters.air, quantity: 1, unitPrice: 0, productId: null, type: 'PRODUCT', category: 'AIR_FILTER' });
                if (sd.filters.fuel) rawItems.push({ description: sd.filters.fuel, quantity: 1, unitPrice: 0, productId: null, type: 'PRODUCT', category: 'FUEL_FILTER' });
                if (sd.filters.cabin) rawItems.push({ description: sd.filters.cabin, quantity: 1, unitPrice: 0, productId: null, type: 'PRODUCT', category: 'CABIN_FILTER' });
            }
        }

        // 3. Match items with current Product table to get updated prices and stock
        const currentItems = await Promise.all(rawItems.map(async (item) => {
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

            // Fallback 2: Try mapping legacy code to current Product Code
            if (!product) {
                const mappedCode = mapLegacyProductCode(item.description, item.category);
                if (mappedCode) {
                    product = await prisma.product.findUnique({
                        where: { code: mappedCode, active: true }
                    });
                }
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
                    type: item.type,
                    code: product.code
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

export async function getRecentWorkOrders(vehicleId: number, limit: number = 5): Promise<ActionResponse> {
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
export async function saveVehicleLearnedSpecs(vehicleId: number, learnedData: any): Promise<ActionResponse> {
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
}): Promise<ActionResponse> {
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

        return { success: true, data: { workOrderId: wo.id } };

    } catch (error: any) {
        console.error("Error confirming quote FULL ERROR:", error);
        return { success: false, error: 'Failed to create work order', data: error.message }; // put detail in data or append to error
    }
}

/**
 * Generates a service estimate based on history or learned specs.
 * Applies presets (BASIC vs FULL).
 */
export async function suggestServiceEstimate(vehicleId: number, preset: 'BASIC' | 'FULL' = 'BASIC'): Promise<ActionResponse> {
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
            // FALLBACK TO GENERIC ITEMS IF NO HISTORY
            const genericItems = [];

            // Aceite Generico (Placeholder)
            genericItems.push({
                id: null,
                name: 'Aceite 10W40 (Suelto)',
                price: 0,
                stock: null,
                quantity: 4,
                type: 'PRODUCT',
                determinedCategory: 'ENGINE_OIL'
            });

            // Filtro Aceite Generico
            genericItems.push({
                id: null,
                name: 'Filtro de Aceite (A definir)',
                price: 0,
                stock: null,
                quantity: 1,
                type: 'PRODUCT',
                determinedCategory: 'OIL_FILTER'
            });

            if (preset === 'FULL') {
                genericItems.push({ id: null, name: 'Filtro de Aire (A definir)', price: 0, stock: null, quantity: 1, type: 'PRODUCT', determinedCategory: 'AIR_FILTER' });
                genericItems.push({ id: null, name: 'Filtro de Combustible (A definir)', price: 0, stock: null, quantity: 1, type: 'PRODUCT', determinedCategory: 'FUEL_FILTER' });
            }

            return {
                success: true,
                data: {
                    items: genericItems,
                    source: 'GENERIC_FALLBACK',
                    lastServiceDate: null
                }
            };
        }

        const allItems = historyRes.data.items;

        // 3. Categorize items using keywords
        const categorizedDetails = allItems.map((item: any) => {
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

        // 4. Filter based on Preset and enforce "one per category"
        const finalItemsMap = new Map<string, any>();

        const targetCategories = preset === 'BASIC'
            ? ['ENGINE_OIL', 'OIL_FILTER']
            : ['ENGINE_OIL', 'OIL_FILTER', 'AIR_FILTER', 'FUEL_FILTER', 'CABIN_FILTER'];

        for (const item of categorizedDetails) {
            if (targetCategories.includes(item.determinedCategory)) {
                // If we don't have an item for this category yet, add it
                if (!finalItemsMap.has(item.determinedCategory)) {
                    finalItemsMap.set(item.determinedCategory, item);
                }
            }
        }

        const suggestionItems = Array.from(finalItemsMap.values());

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

/**
 * Updates the service details of a work order to manually override maintenance status.
 * Used by the PreviewHealthCardModal.
 */
export async function updateWorkOrderMaintenanceDetails(workOrderId: number, items: { key: string, status: string, detail: string }[]): Promise<ActionResponse> {
    try {
        const wo = await prisma.workOrder.findUnique({
            where: { id: workOrderId }
        });

        if (!wo) return { success: false, error: 'Work Order not found' };

        const currentDetails = (wo.serviceDetails as any) || {};
        const newDetails = {
            ...currentDetails,
            filters: { ...(currentDetails.filters || {}) },
            filterDetails: { ...(currentDetails.filterDetails || {}) },
            fluids: { ...(currentDetails.fluids || {}) }
        };

        // Map items to serviceDetails structure
        for (const item of items) {
            // Check Filters
            if (['oil_filter', 'air_filter', 'fuel_filter', 'cabin_filter'].includes(item.key)) {
                const mapKey = item.key.replace('_filter', ''); // oil_filter -> oil
                if (item.status === 'OK') {
                    newDetails.filters[mapKey] = true;
                    if (item.detail) newDetails.filterDetails[mapKey] = item.detail;
                } else {
                    // If manually set to REVISAR, we effectively uncheck it? 
                    // Or we just don't force it to true. existing logic handles false as unchecked.
                    // But if it WAS true, we should set it to false.
                    newDetails.filters[mapKey] = false;
                }
            }
            // Check Fluids
            else if (['gearbox_oil', 'coolant', 'brake_fluid', 'power_steering'].includes(item.key)) { // power_steering key in maintenance-data is hydraulic?
                // keys in Maintenance Data: gearbox_oil, coolant, brake_fluid, power_steering
                // keys in serviceDetails.fluids: gearbox, coolant, brakes, hydraulic, differential

                let fluidKey = '';
                if (item.key === 'gearbox_oil') fluidKey = 'gearbox';
                else if (item.key === 'coolant') fluidKey = 'coolant';
                else if (item.key === 'brake_fluid') fluidKey = 'brakes';
                else if (item.key === 'power_steering') fluidKey = 'hydraulic';

                if (fluidKey) {
                    if (item.status === 'OK') {
                        newDetails.fluids[fluidKey] = item.detail || 'Revisado';
                    } else {
                        newDetails.fluids[fluidKey] = false; // Or just don't set it/ set false
                    }
                }
            }
            // Engine Oil
            else if (item.key === 'engine_oil') {
                // If OK, we expect oil data. If text provided, maybe put in brand?
                if (item.status === 'OK') {
                    if (item.detail && (!newDetails.oil?.brand)) {
                        newDetails.oil = { ...newDetails.oil, brand: item.detail };
                    }
                }
            }
        }

        await prisma.workOrder.update({
            where: { id: workOrderId },
            data: {
                serviceDetails: newDetails
            }
        });

        // Force revalidate everything related to portal
        revalidatePath('/portal', 'layout');
        revalidatePath('/portal/[token]', 'page');
        revalidatePath(`/admin/work-orders/${workOrderId}`, 'page');
        revalidatePath('/admin/dashboard');

        return { success: true };

    } catch (error) {
        console.error("Error updating maintenance details:", error);
        return { success: false, error: 'Failed to update details' };
    }
}
