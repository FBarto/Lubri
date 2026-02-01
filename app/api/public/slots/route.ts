import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAvailableSlots } from '@/lib/slots';

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const dateStr = searchParams.get('date');
        const serviceIdStr = searchParams.get('serviceId');

        if (!dateStr || !serviceIdStr) {
            return NextResponse.json({ error: 'Missing date or serviceId' }, { status: 400 });
        }

        const date = new Date(dateStr);
        if (isNaN(date.getTime())) {
            return NextResponse.json({ error: 'Invalid date format' }, { status: 400 });
        }

        const serviceId = parseInt(serviceIdStr);
        if (isNaN(serviceId)) {
            return NextResponse.json({ error: 'Invalid serviceId' }, { status: 400 });
        }

        let duration = 30;
        let serviceName = 'Servicio';

        if (serviceId === -1) {
            // Smart Quote Fallback
            duration = 45;
            serviceName = 'Smart Quote';
            console.log(`[Slots API] Handling Smart Quote (ID -1), using default duration: ${duration}`);
        } else {
            const service = await prisma.service.findUnique({
                where: { id: serviceId }
            });

            if (!service) {
                console.error(`[Slots API] Service not found for ID: ${serviceId}`);
                return NextResponse.json({ error: 'Service not found' }, { status: 404 });
            }
            duration = service.duration || 30;
            serviceName = service.name;
        }

        console.log(`[Slots API] Request for ${serviceName}, Date: ${dateStr}, serviceId: ${serviceId}`);

        // Fetch appointments for the selected day
        // Parse date strictly as UTC midnight (YYYY-MM-DD -> UTC 00:00)
        const startOfDay = new Date(date);
        startOfDay.setUTCHours(0, 0, 0, 0);

        const endOfDay = new Date(date);
        endOfDay.setUTCHours(23, 59, 59, 999);

        const appointments = await prisma.appointment.findMany({
            where: {
                status: { not: 'CANCELLED' },
                date: {
                    gte: startOfDay,
                    lte: endOfDay
                }
            },
            include: {
                service: true
            }
        });

        const slots = getAvailableSlots(date, duration, appointments);
        console.log(`[Slots API] Generated ${slots.length} slots`);

        return NextResponse.json(slots);
    } catch (error: any) {
        console.error('Error fetching slots:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
