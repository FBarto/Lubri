'use server';

import { prisma } from '../../lib/prisma';
import { logActivity } from './logger';
import { revalidatePath } from 'next/cache';
import { SyncService } from '../../lib/syncService';
import { safeRevalidate } from './server-utils';
import { generatePortalLinkForVehicle } from './portal-actions';

// --- Types ---

interface WorkOrderInput {
    clientId: number;
    vehicleId: number;
    serviceId: number; // The main service performed
    userId?: number;
    mileage?: number;
    notes?: string;
    appointmentId?: number;
    price: number;
    attachments?: { url: string; type: string; description?: string }[];
    serviceDetails?: any;
}

interface SaleItemInput {
    type: 'PRODUCT' | 'SERVICE';
    id?: number; // productId if type is PRODUCT
    description: string;
    quantity: number;
    unitPrice: number;
    workOrderId?: number; // If this item pays for a WO
}

interface ProcessSaleInput {
    userId: number; // Who performed the sale
    clientId?: number;
    paymentMethod?: string;
    items: SaleItemInput[];
    status?: 'PENDING' | 'COMPLETED';
}

// --- Actions ---

/**
 * Creates a new Work Order.
 * Usually called from the Technician Wizard or when converting an Appointment.
 */
export async function createWorkOrder(data: WorkOrderInput) {
    try {
        const wo = await prisma.workOrder.create({
            data: {
                clientId: Number(data.clientId),
                vehicleId: Number(data.vehicleId),
                serviceId: Number(data.serviceId),
                userId: data.userId ? Number(data.userId) : undefined,
                mileage: data.mileage ? Number(data.mileage) : undefined,
                notes: data.notes,
                appointmentId: data.appointmentId ? Number(data.appointmentId) : undefined,
                price: Number(data.price),
                serviceDetails: data.serviceDetails,
                attachments: data.attachments ? {
                    create: data.attachments.map(a => ({
                        url: a.url,
                        type: a.type,
                        description: a.description
                    }))
                } : undefined
            },
        });

        // If mileage provided, update vehicle mileage
        if (data.mileage) {
            await prisma.vehicle.update({
                where: { id: Number(data.vehicleId) },
                data: { mileage: Number(data.mileage) }, // Ensure number
            });
        }

        // If linked to appointment, update appointment status
        if (data.appointmentId) {
            await prisma.appointment.update({
                where: { id: data.appointmentId },
                data: { status: 'DONE' },
            });
        }

        if (data.userId) {
            await logActivity(
                data.userId,
                'CREATE',
                'WORK_ORDER',
                wo.id,
                `Created Work Order for Vehicle ID ${data.vehicleId}`
            );
        }

        // Sync to Firestore
        SyncService.syncWorkOrder(wo);

        safeRevalidate('/admin/dashboard');
        // Also revalidate employee views?
        safeRevalidate('/employee');

        return { success: true, workOrder: wo };
    } catch (error) {
        console.error('Error creating Work Order:', error);
        return { success: false, error: 'Failed to create Work Order' };
    }
}

/**
 * Processes a Sale (POS Checkout).
 * Handles: Sale creation, SaleItem creation, Stock deduction (only if COMPLETED), WorkOrder linking.
 */
export async function processSale(data: ProcessSaleInput) {
    const { userId, clientId, paymentMethod, items, status = 'COMPLETED' } = data;

    // Calculate total
    const total = items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);

    try {
        // Use transaction to ensure data integrity
        const sale = await prisma.$transaction(async (tx) => {
            // 1. Create Sale
            const newSale = await tx.sale.create({
                data: {
                    userId,
                    clientId,
                    paymentMethod: paymentMethod || 'PENDING_PAYMENT',
                    total,
                    date: new Date(),
                    status,
                },
            });

            // 2. Process Items
            for (const item of items) {
                // Create SaleItem
                await tx.saleItem.create({
                    data: {
                        saleId: newSale.id,
                        type: item.type,
                        description: item.description,
                        quantity: item.quantity,
                        unitPrice: item.unitPrice,
                        subtotal: item.quantity * item.unitPrice,
                        productId: item.type === 'PRODUCT' ? item.id : undefined,
                        workOrderId: item.workOrderId,
                    },
                });

                // Update Stock if Product AND Sale is COMPLETED
                if (status === 'COMPLETED' && item.type === 'PRODUCT' && item.id) {
                    await tx.product.update({
                        where: { id: item.id },
                        data: {
                            stock: {
                                decrement: item.quantity,
                            },
                        },
                    });
                }

                // Link WorkOrder if present
                if (item.workOrderId) {
                    await tx.workOrder.update({
                        where: { id: item.workOrderId },
                        data: {
                            saleId: newSale.id,
                            ...(status === 'COMPLETED' ? { finishedAt: new Date() } : {}),
                        },
                    });
                }
            }

            return newSale;
        });

        // 3. Log Activity
        await logActivity(
            userId,
            status === 'PENDING' ? 'CREATE_PENDING' : 'CHECKOUT',
            'SALE',
            sale.id,
            { total, itemsCount: items.length, paymentMethod }
        );

        safeRevalidate('/employee');
        safeRevalidate('/admin/dashboard');
        safeRevalidate('/admin/pos');

        return { success: true, sale };
    } catch (error) {
        console.error('Error processing sale:', error);
        return { success: false, error: 'Transaction failed' };
    }
}

/**
 * Finalizes a pending sale in Caja.
 * Deducts stock and updates status.
 */
export async function finalizePendingSale(saleId: number, paymentMethod: string, userId: number) {
    try {
        const result = await prisma.$transaction(async (tx) => {
            const sale = await tx.sale.findUnique({
                where: { id: saleId },
                include: { items: true }
            });

            if (!sale) throw new Error('Sale not found');
            if (sale.status !== 'PENDING') throw new Error('Sale is already finalized');

            // 1. Update Sale
            const updatedSale = await tx.sale.update({
                where: { id: saleId },
                data: {
                    status: 'COMPLETED',
                    paymentMethod,
                    userId, // Admin who finalized it
                    date: new Date(), // Set final completion date
                }
            });

            // 2. Adjust Stock for Products
            for (const item of sale.items) {
                if (item.type === 'PRODUCT' && item.productId) {
                    await tx.product.update({
                        where: { id: item.productId },
                        data: {
                            stock: { decrement: item.quantity }
                        }
                    });
                }

                // Close linked Work Orders
                if (item.workOrderId) {
                    await tx.workOrder.update({
                        where: { id: item.workOrderId },
                        data: { finishedAt: new Date() }
                    });
                }
            }

            return updatedSale;
        });

        await logActivity(userId, 'FINALIZE_PENDING', 'SALE', saleId, { paymentMethod });

        safeRevalidate('/admin/pos');
        safeRevalidate('/admin/dashboard');
        safeRevalidate('/employee');

        return { success: true, sale: result };
    } catch (error: any) {
        console.error('Finalize Sale Error:', error);
        return { success: false, error: error.message };
    }
}

export async function getPendingSales() {
    try {
        const sales = await prisma.sale.findMany({
            where: { status: 'PENDING' },
            include: {
                items: true,
                client: true,
                user: true // Who created it
            },
            orderBy: { date: 'desc' }
        });
        return { success: true, data: sales };
    } catch (error) {
        return { success: false, error: 'Failed to fetch pending sales' };
    }
}

/**
 * Updates the minimum stock level for a product.
 * Used by the Employee Stock Viewer.
 */
export async function updateProductMinStock(productId: number, minStock: number) {
    try {
        await prisma.product.update({
            where: { id: productId },
            data: { minStock },
        });

        safeRevalidate('/employee');

        return { success: true };
    } catch (error) {
        console.error('Error updating min stock:', error);
        return { success: false, error: 'Failed to update min stock' };
    }
}

export async function getStockStats() {
    try {
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        // Group sales by product for last 30 days
        const salesStats = await prisma.saleItem.groupBy({
            by: ['productId'],
            where: {
                type: 'PRODUCT',
                sale: {
                    date: { gte: thirtyDaysAgo }
                }
            },
            _sum: {
                quantity: true
            }
        });

        // Convert to map
        const stats: Record<number, { weeklyRate: number }> = {};

        salesStats.forEach(stat => {
            if (stat.productId && stat._sum.quantity) {
                const totalSold = stat._sum.quantity;
                const dailyRate = totalSold / 30;
                const weeklyRate = dailyRate * 7;

                stats[stat.productId] = {
                    weeklyRate: Number(weeklyRate.toFixed(1))
                };
            }
        });

        return { success: true, data: stats };

    } catch (error) {
        console.error('Stats Calc Error:', error);
        return { success: false, error: 'Failed' };
    }
}

import { WhatsAppService } from './whatsapp/service';

/**
 * Creates a Legacy Work Order for historical data.
 * DOES NOT affect stock or generate a Sale.
 * Stores details in JSON `serviceDetails`.
 */
export async function createLegacyWorkOrder(input: {
    vehicleId: string | number;
    clientId: string | number;
    date: string; // ISO Date
    mileage: number;
    serviceDetails: any;
    // New parameters
    nextServiceMileage?: number;
    sendWhatsApp?: boolean;
}) {
    try {
        const vehicleId = Number(input.vehicleId);
        const clientId = Number(input.clientId);

        // Find or Create a dedicated "Legacy Service" so it appears correctly in reports
        let service = await prisma.service.findFirst({
            where: { name: 'Service Histórico Importado' }
        });

        if (!service) {
            service = await prisma.service.create({
                data: {
                    name: 'Service Histórico Importado',
                    category: 'General',
                    price: 0,
                    duration: 0,
                    active: true
                }
            });
        }

        const performedDate = new Date(input.date);

        // Enrich serviceDetails with manual next service mileage if provided
        const enrichedDetails = {
            ...input.serviceDetails,
            nextServiceMileage: input.nextServiceMileage
        };

        const wo = await prisma.workOrder.create({
            data: {
                vehicleId,
                clientId,
                serviceId: service.id,
                status: 'COMPLETED',
                // Legacy data does not affect current cash flow
                price: 0,
                // We map the historical date to `date` (start) and `finishedAt` (end)
                date: performedDate,
                finishedAt: performedDate,
                mileage: input.mileage,
                serviceDetails: enrichedDetails,
                notes: input.serviceDetails.notes ? `[LEGACY] ${input.serviceDetails.notes}` : '[LEGACY] Carga Histórica'
            }
        });

        // Update Vehicle metrics if this is the newest record
        const vehicle = await prisma.vehicle.findUnique({
            where: { id: vehicleId },
            include: { client: true }
        });

        if (vehicle) {
            const isNewer = !vehicle.lastServiceDate || performedDate > vehicle.lastServiceDate;
            if (isNewer) {
                await prisma.vehicle.update({
                    where: { id: vehicleId },
                    data: {
                        lastServiceDate: performedDate,
                        lastServiceMileage: input.mileage
                    }
                });
            }

            // Send WhatsApp if requested
            if (input.sendWhatsApp && vehicle.client.phone) {
                const filters = input.serviceDetails.filters || {};
                const fluids = input.serviceDetails.fluids || {};
                const oil = input.serviceDetails.oil || {};

                // Construct Message
                let message = `Hola ${vehicle.client.name},
🚗 Queremos informarle que hemos completado el service de su vehículo ${vehicle.brand || ''} ${vehicle.model || ''} con patente ${vehicle.plate}. A continuación, le detallamos las tareas realizadas:
🛢️ Cambio de aceite ${oil.brand || ''} ${oil.type || ''} ${oil.liters ? `(${oil.liters}L)` : ''}
🌬️ Cambio del filtro de aire ${filters.air ? 'SI' : 'NO'}
🛢️ Cambio del filtro de aceite ${filters.oil ? 'SI' : 'NO'}
⛽ Cambio del filtro de combustible ${filters.fuel ? 'SI' : 'NO'}
🏠 Cambio del filtro de habitáculo ${filters.cabin ? 'SI' : 'NO'}
🔧 Revisión de lubricante de caja ${fluids.gearbox ? 'SI' : 'NO'}
⚙️ Revisión lubricante de diferencial ${fluids.differential ? 'SI' : 'NO'}
💧 Revisión de fluido hidráulico ${fluids.hydraulic ? 'SI' : 'NO'}
❄️ Control y reposición de líquido refrigerante ${fluids.coolant ? 'SI' : 'NO'}
🛑 Control y reposición de líquido de frenos ${fluids.brakes ? 'SI' : 'NO'}
📍 Kilometraje actual: ${input.mileage}
🔄 Próximo cambio de aceite: ${input.nextServiceMileage || (input.mileage + 10000)}

Si tiene alguna duda o necesita más información, no dude en contactarnos.
¡Gracias por confiar en nosotros! 🙌
📍 Asunción 505 Villa Carlos Paz Córdoba
📞 Tel: 03516 75 6248
Atentamente,
Lubricantes FB

📱 Síguenos en nuestras redes sociales:
👉 Instagram https://www.instagram.com/fblubricantes/
👉 Facebook https://www.facebook.com/profile.php?id=100054567395088
⭐ Nos encantaría conocer tu opinión. ¡Déjanos una reseña en Google Maps!
👉 Dejar calificación https://www.google.com/maps/place/FB+Lubricentro+y+Bater%C3%ADas/@-31.419292,-64.5148519,17z`;

                // Generate Portal Link
                const portalRes = await generatePortalLinkForVehicle(vehicleId);
                if (portalRes.success && portalRes.url) {
                    const fullUrl = `https://lubricentro-fb.com${portalRes.url}`;
                    message += `\n\n📚 *Libreta de Salud Digital:*\nAcceda al historial completo de su vehículo aquí:\n${fullUrl}`;
                }

                await WhatsAppService.sendServiceReport(vehicle.client.phone, message);
            }
        }

        // Audit Log
        await prisma.auditLog.create({
            data: {
                userId: 1, // System or Admin
                action: 'CREATE_LEGACY_WO',
                entity: 'WORK_ORDER',
                entityId: wo.id.toString(),
                details: `Carga histórica ${input.sendWhatsApp ? '+ WA' : ''} para Vehículo #${vehicleId}`
            }
        });

        safeRevalidate(`/admin/clients/${clientId}`);
        return { success: true, workOrder: wo };
    } catch (error) {
        console.error('Error creating Legacy Work Order:', error);
        return { success: false, error: 'Failed to create legacy record' };
    }
}

/**
 * Checks for duplicate vehicle plates (normalized).
 */
export async function getDuplicatePlates() {
    try {
        const vehicles = await prisma.vehicle.findMany({
            select: { id: true, plate: true, brand: true, model: true }
        });

        const counts: Record<string, { plate: string, ids: number[], details: string[] }> = {};

        vehicles.forEach(v => {
            const normalized = (v.plate || '').replace(/\s+/g, '').toUpperCase();
            if (!counts[normalized]) {
                counts[normalized] = { plate: v.plate, ids: [], details: [] };
            }
            counts[normalized].ids.push(v.id);
            counts[normalized].details.push(`${v.brand || ''} ${v.model || ''}`.trim());
        });

        const duplicates = Object.values(counts).filter(item => item.ids.length > 1);

        return { success: true, data: duplicates };
    } catch (error) {
        console.error('Error checking duplicate plates:', error);
        return { success: false, error: 'Failed to check duplicates' };
    }
}
