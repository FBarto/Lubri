import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { SyncService } from '@/lib/syncService';

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const dateStr = searchParams.get('date');
        const clientIdStr = searchParams.get('clientId');

        const whereClause: any = {};

        if (dateStr) {
            const startOfDay = new Date(dateStr);
            startOfDay.setHours(0, 0, 0, 0);
            const endOfDay = new Date(dateStr);
            endOfDay.setHours(23, 59, 59, 999);
            whereClause.date = { gte: startOfDay, lte: endOfDay };
        }

        if (clientIdStr) {
            whereClause.clientId = Number(clientIdStr);
        }

        const workOrders = await prisma.workOrder.findMany({
            where: whereClause,
            include: {
                client: true,
                vehicle: true,
                service: true,
                appointment: true,
                saleItems: true,
                attachments: true
            },
            orderBy: { date: 'desc' }
        });

        return NextResponse.json(workOrders);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

import { createWorkOrder } from '../../actions/business';

export async function POST(request: Request) {
    try {
        const body = await request.json();

        // Ensure numeric fields are correctly parsed
        if (body.price) body.price = parseFloat(body.price);
        if (body.mileage) body.mileage = parseInt(body.mileage);
        if (body.clientId) body.clientId = parseInt(body.clientId);
        if (body.vehicleId) body.vehicleId = parseInt(body.vehicleId);
        if (body.serviceId) body.serviceId = parseInt(body.serviceId);
        if (body.appointmentId) body.appointmentId = parseInt(body.appointmentId);

        // Handle historical date
        if (body.date) {
            body.date = new Date(body.date);
        }

        const result = await createWorkOrder(body);

        if (!result.success) {
            return NextResponse.json({ error: result.error }, { status: 500 }); // createWorkOrder returns generic error usually
        }

        return NextResponse.json(result.data, { status: 201 });
    } catch (error: any) {
        console.error('Error creating work order:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
