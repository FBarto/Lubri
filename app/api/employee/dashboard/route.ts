import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const today = new Date();
        const startOfDay = new Date(today.setHours(0, 0, 0, 0));
        const endOfDay = new Date(today.setHours(23, 59, 59, 999));

        // 1. Work Orders Status Count
        const workOrders = await prisma.workOrder.findMany({
            where: {
                status: {
                    in: ['PENDING', 'IN_PROGRESS', 'COMPLETED']
                }
            },
            select: {
                status: true
            }
        });

        const statusCounts = workOrders.reduce((acc: any, curr) => {
            acc[curr.status] = (acc[curr.status] || 0) + 1;
            return acc;
        }, { PENDING: 0, IN_PROGRESS: 0, COMPLETED: 0 });

        // 2. Sales Today
        const salesToday = await prisma.sale.aggregate({
            _sum: {
                total: true
            },
            where: {
                date: {
                    gte: startOfDay,
                    lte: endOfDay
                }
            }
        });

        // 3. Low Stock Alertas
        const lowStock = await prisma.product.findMany({
            where: {
                stock: {
                    lte: prisma.product.fields.minStock
                }
            },
            take: 5,
            orderBy: {
                stock: 'asc'
            }
        });

        // 4. Upcoming Appointments Today
        const tomorrow = new Date(startOfDay);
        tomorrow.setDate(tomorrow.getDate() + 1);

        const appointments = await prisma.appointment.findMany({
            where: {
                date: {
                    gte: startOfDay,
                    lt: tomorrow
                },
                status: 'REQUESTED'
            },
            include: {
                client: true,
                vehicle: true
            },
            orderBy: {
                date: 'asc'
            },
            take: 5
        });

        return NextResponse.json({
            stats: {
                pending: statusCounts.PENDING,
                inProgress: statusCounts.IN_PROGRESS,
                completed: statusCounts.COMPLETED,
                salesTotal: salesToday._sum.total || 0
            },
            lowStock: lowStock.map(p => ({
                id: p.id,
                name: p.name,
                stock: p.stock,
                minStock: p.minStock
            })),
            appointments: appointments.map(a => ({
                id: a.id,
                clientName: a.client?.name || 'Cliente Desconocido',
                vehicle: a.vehicle ? `${a.vehicle.brand} ${a.vehicle.model}` : 'Vehículo no especificado',
                plate: a.vehicle?.plate || '-',
                time: a.date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            }))
        });

    } catch (error: any) {
        console.error('Dashboard API Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
