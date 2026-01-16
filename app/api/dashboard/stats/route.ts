
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
    try {
        const now = new Date();
        const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);

        // 1. Sales Today
        const sales = await prisma.sale.findMany({
            where: {
                date: {
                    gte: startOfDay,
                    lt: endOfDay
                }
            }
        });

        const salesTotal = sales.reduce((sum, sale) => sum + sale.total, 0);

        // 2. Bookings (Turnos) Today
        // Include CONFIRMED or COMPLETED, but maybe filter out CANCELLED
        const bookingsCount = await prisma.appointment.count({
            where: {
                date: {
                    gte: startOfDay,
                    lt: endOfDay
                },
                status: {
                    not: 'CANCELLED'
                }
            }
        });

        // 3. Cars in Service (Active WorkOrders)
        // finishedAt is null
        const inServiceCount = await prisma.workOrder.count({
            where: {
                finishedAt: null
            }
        });

        // 4. Stock Alerts
        // Products with stock <= 5 (arbitrary threshold for now)
        const stockAlertCount = await prisma.product.count({
            where: {
                stock: {
                    lte: 5
                },
                active: true
            }
        });

        return NextResponse.json({
            salesToday: salesTotal,
            bookingsToday: bookingsCount,
            inService: inServiceCount,
            stockAlerts: stockAlertCount
        });

    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
