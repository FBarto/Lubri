import { prisma } from '@/lib/prisma';
import { WhatsAppService } from '@/app/lib/whatsapp/service';
import { NextResponse } from 'next/server';

export async function GET(request: Request, context: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await context.params;
        const appointment = await prisma.appointment.findUnique({
            where: { id: Number(id) },
            include: {
                client: true,
                vehicle: true,
                service: true,
            }
        });

        if (!appointment) {
            return NextResponse.json({ error: 'Appointment not found' }, { status: 404 });
        }

        return NextResponse.json(appointment);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await context.params;
        const body = await request.json();
        const { status, notes } = body;

        const appointmentId = Number(id);
        const oldAppointment = await prisma.appointment.findUnique({ where: { id: appointmentId } });

        const appointment = await prisma.appointment.update({
            where: { id: appointmentId },
            data: {
                status: status || undefined,
                notes: notes || undefined,
            }
        });

        // If status changed to CONFIRMED, schedule notifications
        if (status === 'CONFIRMED' && oldAppointment?.status !== 'CONFIRMED') {
            await WhatsAppService.scheduleAppointmentNotifications(appointmentId);
        }

        return NextResponse.json(appointment);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
