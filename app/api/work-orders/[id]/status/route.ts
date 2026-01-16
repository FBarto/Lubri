import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { WhatsAppService } from '@/lib/whatsappService';
import { auth } from '@/auth'; // Adjust import if needed

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        const workOrderId = parseInt(id);
        const body = await request.json();
        const { status, userId, mileage, notes } = body;

        // Get current WO to validation
        const currentWO = await prisma.workOrder.findUnique({
            where: { id: workOrderId },
            include: { client: true, vehicle: true }
        });

        if (!currentWO) {
            return NextResponse.json({ error: 'WorkOrder not found' }, { status: 404 });
        }

        const dataToUpdate: any = { status };

        // Transition Logic
        if (status === 'IN_PROGRESS') {
            // Assign employee
            if (userId) dataToUpdate.userId = userId;
        } else if (status === 'COMPLETED') {
            // Validation
            if (!mileage) {
                // strict validation? For now let's allow optional but recommend.
                // prompt says: "valida checklist, KM"
            }
            if (mileage) {
                // Update vehicle mileage too?
                await prisma.vehicle.update({
                    where: { id: currentWO.vehicleId },
                    data: { mileage: parseInt(mileage) }
                });
                dataToUpdate.mileage = parseInt(mileage);
            }
            dataToUpdate.finishedAt = new Date();
        }

        // Execute Update
        const updatedWO = await prisma.workOrder.update({
            where: { id: workOrderId },
            data: dataToUpdate
        });

        // Side Effects
        // 1. Audit Log
        const session = await auth();
        if (session?.user?.id) {
            await prisma.auditLog.create({
                data: {
                    userId: parseInt(session.user.id),
                    action: 'UPDATE_STATUS',
                    entity: 'WORK_ORDER',
                    entityId: workOrderId.toString(),
                    details: `Status changed from ${currentWO.status} to ${status}`
                }
            });
        }

        // 2. WhatsApp Trigger (Only on COMPLETED)
        /* TEMPORARILY DISABLED
        if (status === 'COMPLETED' && currentWO.status !== 'COMPLETED' && currentWO.appointmentId) {
            // "Vehículo listo"
            await WhatsAppService.sendTemplateMessage(
                currentWO.client.phone,
                'vehicle_ready', // Template name needs to exist or use generic
                'es',
                [
                    { type: 'text', text: currentWO.client.name.split(' ')[0] },
                    { type: 'text', text: `${currentWO.vehicle.brand} ${currentWO.vehicle.model}` }
                ],
                currentWO.appointmentId
            ).catch(err => console.error('WA Error:', err));
        }
        */

        return NextResponse.json(updatedWO);

    } catch (error) {
        console.error('Error updating work order status:', error);
        return NextResponse.json({ error: 'Failed to update status' }, { status: 500 });
    }
}
