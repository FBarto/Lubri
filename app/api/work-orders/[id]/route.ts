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
