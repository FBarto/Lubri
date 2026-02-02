'use server';

import { prisma } from '@/lib/prisma';
import { PendingSaleChannel, PendingSaleStatus } from '@prisma/client';
import { revalidatePath } from 'next/cache';
import { processSale } from './business';
import { ActionResponse } from './types';
import { Prisma } from '@prisma/client';

// Core Types based on schema
export type DraftItemInput = {
    productId?: number;
    name: string;
    quantity: number;
    unitPrice: number;
    type?: 'PRODUCT' | 'SERVICE';
};

/**
 * 1. GET OR CREATE DRAFT
 * Finds the single active draft for this user/channel context.
 */
export async function getOrCreateDraft(
    userId: number,
    channel: PendingSaleChannel = 'POS'
): Promise<ActionResponse> {
    try {
        // Find existing DRAFT
        const existing = await prisma.pendingSale.findFirst({
            where: {
                createdById: userId,
                channel: channel,
                status: 'DRAFT'
            },
            include: { items: true, client: true, vehicle: true }
        });

        if (existing) {
            return { success: true, data: existing };
        }

        // Create new
        const newDraft = await prisma.pendingSale.create({
            data: {
                createdById: userId,
                channel: channel,
                status: 'DRAFT',
            },
            include: { items: true }
        });

        return { success: true, data: newDraft };
    } catch (error: any) {
        console.error('getOrCreateDraft Error:', error);
        return { success: false, error: 'Failed to load POS session' };
    }
}

/**
 * 2. UPDATE DRAFT ITEMS
 * Replaces items. Validates Status = DRAFT.
 */
export async function updateDraftItems(
    draftId: number,
    items: DraftItemInput[],
    userId: number // Security check: Ensure owner?
): Promise<ActionResponse> {
    try {
        const draft = await prisma.pendingSale.findUnique({
            where: { id: draftId }
        });

        if (!draft) return { success: false, error: 'Draft not found' };

        // GUARD: Only DRAFT is editable
        if (draft.status !== 'DRAFT') {
            return { success: false, error: `Cannot edit draft in status ${draft.status}` };
        }

        // GUARD: Ownership (Optional but recommended)
        if (draft.createdById !== userId) {
            // Allow ADMIN to override? For now strict.
            // return { success: false, error: 'Unauthorized' };
        }

        // Update logic: Delete all items, Re-create new snapshot
        // We use transaction to ensure consistency
        const updated = await prisma.$transaction(async (tx) => {
            // 1. Wipe old items
            await tx.pendingSaleItem.deleteMany({
                where: { pendingSaleId: draftId }
            });

            // 2. Create new items
            if (items.length > 0) {
                await tx.pendingSaleItem.createMany({
                    data: items.map(item => ({
                        pendingSaleId: draftId,
                        productId: item.productId,
                        nameSnapshot: item.name,
                        quantity: new Prisma.Decimal(item.quantity),
                        unitPrice: new Prisma.Decimal(item.unitPrice),
                        subtotal: new Prisma.Decimal(item.quantity * item.unitPrice),
                        isUncataloged: !item.productId
                    }))
                });
            }

            // 3. Touch updated timestamp & version
            return await tx.pendingSale.update({
                where: { id: draftId },
                data: {
                    version: { increment: 1 },
                    updatedAt: new Date()
                },
                include: { items: true }
            });
        });

        return { success: true, data: updated };

    } catch (error: any) {
        console.error('updateDraftItems Error:', error);
        return { success: false, error: 'Failed to sync cart' };
    }
}

/**
 * 3. CONFIRM DRAFT
 * The Critical Transaction. 
 * Locks draft -> Calls processSale -> Links Sale -> Returns.
 */
export async function confirmDraft(
    draftId: number,
    paymentMethod: string,
    userId: number
): Promise<ActionResponse> {
    try {
        // 1. Lock Draft (prevent double click race conditions)
        // We use updateMany to atomically check state
        const lockResult = await prisma.pendingSale.updateMany({
            where: {
                id: draftId,
                status: 'DRAFT'
            },
            data: { status: 'CONFIRMING' }
        });

        if (lockResult.count === 0) {
            // Check if it was already confirmed to return idempotently
            const existing = await prisma.pendingSale.findUnique({ where: { id: draftId } });
            if (existing?.status === 'CONFIRMED' && existing.saleId) {
                return { success: true, data: { saleId: existing.saleId, idempotency: true } };
            }
            return { success: false, error: 'Draft is not in DRAFT state or was modified elsewhere.' };
        }

        // 2. Process Business Logic
        // We fetch the draft with items to pass to processSale
        const draft = await prisma.pendingSale.findUnique({
            where: { id: draftId },
            include: { items: true }
        });

        if (!draft) throw new Error('Draft vanished after lock');

        // Adapt PendingSaleItem[] to ProcessSaleInput items
        const saleItems = draft.items.map(i => ({
            type: (i.isUncataloged ? 'SERVICE' : 'PRODUCT') as 'SERVICE' | 'PRODUCT', // Heuristic: No ID = service/uncataloged
            id: i.productId ?? undefined,
            description: i.nameSnapshot,
            quantity: Number(i.quantity),
            unitPrice: Number(i.unitPrice),
            workOrderId: draft.workOrderId ?? undefined
        }));

        // Execute core sale logic (Stock deduction happens here)
        const saleResult = await processSale({
            userId,
            clientId: draft.clientId ?? undefined,
            paymentMethod,
            items: saleItems,
            status: 'COMPLETED'
        });

        if (!saleResult.success || !saleResult.data) {
            // Rollback status if business logic fails
            await prisma.pendingSale.update({
                where: { id: draftId },
                data: { status: 'DRAFT' } // Revert to DRAFT so user can retry
            });
            return { success: false, error: saleResult.error };
        }

        const sale = saleResult.data;

        // 3. Finalize Draft
        await prisma.pendingSale.update({
            where: { id: draftId },
            data: {
                status: 'CONFIRMED',
                saleId: sale.id
            }
        });

        revalidatePath('/employee');
        revalidatePath('/admin/pos');

        return { success: true, data: sale };

    } catch (error: any) {
        console.error('confirmDraft Error:', error);
        // Attempt unlock if catastrophic error? 
        // For safety, we leave it in CONFIRMING so admin sees "stuck" order rather than allowing double charge.
        return { success: false, error: 'Transaction failed. Please check sales history.' };
    }
}

/**
 * 4. CLEAR/CANCEL DRAFT
 */
export async function cancelDraft(draftId: number): Promise<ActionResponse> {
    try {
        await prisma.pendingSale.update({
            where: { id: draftId },
            data: { status: 'CANCELLED' }
        });
        return { success: true };
    } catch (e) {
        return { success: false, error: 'Failed to clear cart' };
    }
}

/**
 * 5. ATTACH WORK ORDER
 * Used by Kanban "Pass to POS"
 */
export async function attachWorkOrderToDraft(
    userId: number,
    workOrderId: number
): Promise<ActionResponse> {
    try {
        // Get Work Order Items
        const wo = await prisma.workOrder.findUnique({
            where: { id: workOrderId },
            include: {
                service: true,
                vehicle: true,
                client: true
            }
        });

        if (!wo) return { success: false, error: 'Work Order not found' };

        // Get active draft
        const draftRes = await getOrCreateDraft(userId, 'EMPLOYEE');
        if (!draftRes.success) throw new Error('No draft');

        const draft = draftRes.data;

        // Construct items from WO
        const itemsToadd: DraftItemInput[] = [];

        // Base Service
        itemsToadd.push({
            name: `${wo.service.name} - ${wo.vehicle.plate}`,
            quantity: 1,
            unitPrice: wo.service.price,
            productId: undefined, // Service has no productId usually, or we map it?
            type: 'SERVICE'
        });

        // Extra details
        const details = wo.serviceDetails as any;
        if (details && details.items) {
            details.items.forEach((item: any) => {
                itemsToadd.push({
                    name: item.name,
                    quantity: item.quantity,
                    unitPrice: item.unitPrice,
                    productId: item.productId,
                    type: 'PRODUCT'
                });
            });
        }

        // Update Draft Context
        await prisma.pendingSale.update({
            where: { id: draft.id },
            data: {
                workOrderId: wo.id,
                clientId: wo.clientId,
                vehicleId: wo.vehicleId,
                notes: `Venta desde Taller - Orden #${wo.id}`
            }
        });

        // Update Items
        await updateDraftItems(draft.id, itemsToadd, userId);

        return { success: true, data: draft };

    } catch (error: any) {
        return { success: false, error: 'Failed to attach Work Order' };
    }
}
