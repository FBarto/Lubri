import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);

        // Fetch active work orders (not DELIVERED, unless specified?)
        // The prompt says: "Mostrar WorkOrders activas en columnas por estado (INGRESÓ, EN SERVICIO, LISTO)"
        // So we filter out 'DELIVERED'.

        const workOrders = await prisma.workOrder.findMany({
            where: {
                OR: [
                    { status: { in: ['PENDING', 'IN_PROGRESS'] } },
                    {
                        status: 'COMPLETED',
                        date: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } // Only last 24h
                    }
                ]
            },
            include: {
                client: true,
                vehicle: true,
                service: true,
                user: true // Assigned employee
            },
            orderBy: {
                date: 'asc' // Oldest first
            }
        });

        return NextResponse.json(workOrders);
    } catch (error) {
        console.error('Error fetching kanban work orders:', error);
        return NextResponse.json({ error: 'Failed to fetch work orders' }, { status: 500 });
    }
}
