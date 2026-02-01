import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { startOfDay, subDays } from 'date-fns';

export async function GET() {
    try {
        const today = startOfDay(new Date());

        // 1. Vehicles ready for pickup (WorkOrder COMPLETED but not yet delivered/closed)
        const readyToPickup = await prisma.workOrder.findMany({
            where: {
                status: 'COMPLETED',
                date: { gte: today }
            },
            include: {
                vehicle: {
                    include: { client: true }
                }
            },
            take: 5
        });

        // 2. Predictive Reminders (Vehicles due for service soon)
        const sevenDaysAhead = new Date();
        sevenDaysAhead.setDate(sevenDaysAhead.getDate() + 7);

        const upcomingServices = await prisma.vehicle.findMany({
            where: {
                predictedNextService: {
                    gte: subDays(new Date(), 2), // Include recently overdue
                    lte: sevenDaysAhead
                }
            },
            include: { client: true },
            take: 5
        });

        const notifications = [
            ...readyToPickup.map(wo => ({
                id: `pickup-${wo.id}`,
                type: 'READY',
                title: 'Vehículo Listo',
                message: `${wo.vehicle.model} (${wo.vehicle.plate}) está listo para retirar.`,
                clientName: wo.vehicle.client.name,
                clientPhone: wo.vehicle.client.phone,
                data: { plate: wo.vehicle.plate, model: wo.vehicle.model }
            })),
            ...upcomingServices.map(v => ({
                id: `service-${v.id}`,
                type: 'REMINDER',
                title: 'Próximo Service',
                message: `${v.model} (${v.plate}) le toca service pronto.`,
                clientName: v.client.name,
                clientPhone: v.client.phone,
                data: { plate: v.plate, model: v.model, date: v.predictedNextService }
            }))
        ];

        return NextResponse.json({ notifications });

    } catch (error: any) {
        console.error('Notification API Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
