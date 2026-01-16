import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const today = new Date();
        const startOfDay = new Date(today.setHours(0, 0, 0, 0));
        const endOfDay = new Date(today.setHours(23, 59, 59, 999));

        // 1. Appointments Today
        const appointmentsToday = await prisma.appointment.count({
            where: {
                date: {
                    gte: startOfDay,
                    lte: endOfDay
                },
                status: { not: 'CANCELLED' }
            }
        });

        const pendingAppointments = await prisma.appointment.count({
            where: {
                status: 'REQUESTED'
            }
        });

        // 2. Sales Today (Assuming Sales table has date)
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

        // 3. Occupancy (Simple estimate based on standard slots)
        // Assume 8 hours * 2 bays = 16 hours capacity? 
        // For now, let's just return raw appointments count vs capacity placeholder.
        const capacity = 20; // Hardcoded daily capacity for now

        return NextResponse.json({
            appointments: {
                today: appointmentsToday,
                pending: pendingAppointments,
                capacity: capacity,
                occupancy: Math.round((appointmentsToday / capacity) * 100)
            },
            sales: {
                today: salesToday._sum.total || 0
            }
        });

    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
