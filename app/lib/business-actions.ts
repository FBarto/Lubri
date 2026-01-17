'use server';

import { prisma } from '../../lib/prisma';
import { logActivity } from './logger';
import { revalidatePath } from 'next/cache';
import { SyncService } from '../../lib/syncService';
import { safeRevalidate } from './server-utils';

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
    paymentMethod: string;
    items: SaleItemInput[];
}

// --- Actions ---

/**
 * Creates a new Work Order.
 * Usually called from the Technician Wizard or when converting an Appointment.
 */
export async function createWorkOrder(data: WorkOrderInput) {
    try {
        const wo = await prisma.workOrder.create({
            // ... (same data)
            data: {
                clientId: data.clientId,
                vehicleId: data.vehicleId,
                serviceId: data.serviceId,
                userId: data.userId,
                mileage: data.mileage,
                notes: data.notes,
                appointmentId: data.appointmentId,
                price: data.price,
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
                where: { id: data.vehicleId },
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
 * Handles: Sale creation, SaleItem creation, Stock deduction, WorkOrder linking.
 */
export async function processSale(data: ProcessSaleInput) {
    const { userId, clientId, paymentMethod, items } = data;

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
                    paymentMethod,
                    total,
                    date: new Date(),
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

                // Update Stock if Product
                if (item.type === 'PRODUCT' && item.id) {
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
                            finishedAt: new Date(),
                        },
                    });
                }
            }

            return newSale;
        });

        // 3. Log Activity
        await logActivity(
            userId,
            'CHECKOUT',
            'SALE',
            sale.id,
            { total, itemsCount: items.length, paymentMethod }
        );

        safeRevalidate('/employee');
        safeRevalidate('/admin/dashboard');

        return { success: true, sale };
    } catch (error) {
        console.error('Error processing sale:', error);
        return { success: false, error: 'Transaction failed' };
    }
}
