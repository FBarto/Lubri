import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { SyncService } from '@/lib/syncService';

export async function GET(request: Request, context: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await context.params;
        const workOrder = await prisma.workOrder.findUnique({
            where: { id: Number(id) },
            include: {
                client: true,
                vehicle: true,
                service: true,
                appointment: true
            }
        });

        if (!workOrder) {
            return NextResponse.json({ error: 'Work Order not found' }, { status: 404 });
        }

        return NextResponse.json(workOrder);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function PUT(request: Request, context: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await context.params;
        const body = await request.json();
        const { price, notes, mileage, finishedAt, serviceDetails } = body;

        const workOrder = await prisma.workOrder.update({
            where: { id: Number(id) },

            data: {
                price: price !== undefined ? Number(price) : undefined,
                notes: notes,
                mileage: mileage !== undefined ? Number(mileage) : undefined,
                finishedAt: finishedAt ? new Date(finishedAt) : undefined,
                serviceDetails: serviceDetails ?? undefined // Update if provided
            }
        });

        // FIX: Sync extra items to the linked Sale so they appear in POS
        if (serviceDetails && Array.isArray(serviceDetails.items) && workOrder.saleId) {
            const items = serviceDetails.items;
            console.log(`Syncing ${items.length} items to Sale #${workOrder.saleId} from WO #${workOrder.id}`);

            // 1. Remove previous PRODUCT items linked to this WO in the Sale
            // We assume SERVICE items (Base Service) are managed separately or are part of the base price
            await prisma.saleItem.deleteMany({
                where: {
                    saleId: workOrder.saleId,
                    workOrderId: workOrder.id,
                    type: 'PRODUCT'
                }
            });

            // 2. Add new items
            if (items.length > 0) {
                await prisma.saleItem.createMany({
                    data: items.map((item: any) => ({
                        saleId: workOrder.saleId!,
                        workOrderId: workOrder.id,
                        type: 'PRODUCT',
                        description: item.name,
                        quantity: Number(item.quantity),
                        unitPrice: Number(item.unitPrice),
                        subtotal: Number(item.quantity) * Number(item.unitPrice),
                        productId: item.productId || null
                    }))
                });
            }

            // 3. Update Sale Total
            // Re-fetch all items to calculate true total
            const allItems = await prisma.saleItem.findMany({
                where: { saleId: workOrder.saleId }
            });
            const newTotal = allItems.reduce((sum, i) => sum + i.subtotal, 0);

            await prisma.sale.update({
                where: { id: workOrder.saleId },
                data: { total: newTotal, status: 'PENDING' } // Ensure it's PENDING so it shows in POS
            });
        }

        // Sync to Firestore (non-blocking)
        SyncService.syncWorkOrder(workOrder);

        return NextResponse.json(workOrder);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function DELETE(request: Request, context: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await context.params;
        await prisma.workOrder.delete({
            where: { id: Number(id) }
        });

        return NextResponse.json({ success: true });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
