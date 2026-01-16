import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { WhatsAppService } from '@/app/lib/whatsapp/service';

export async function GET() {
    try {
        // We use Raw SQL as a fallback because 'prisma generate' might be blocked by 
        // the running dev server, preventing the new models from appearing in the client.
        const messages: any = await prisma.$queryRaw`
            SELECT 
                m.id, m.phone, m.template, m.status, m.scheduledAt, m.sentAt, m.error,
                c.name as clientName,
                a.date as appointmentDate
            FROM WhatsAppMessage m
            JOIN Appointment a ON m.appointmentId = a.id
            JOIN Client c ON a.clientId = c.id
            ORDER BY m.scheduledAt DESC
            LIMIT 100
        `;

        // Format raw result to match the expected frontend interface
        const formatted = messages.map((m: any) => ({
            id: m.id,
            phone: m.phone,
            template: m.template,
            status: m.status,
            scheduledAt: m.scheduledAt,
            sentAt: m.sentAt,
            error: m.error,
            appointment: {
                client: { name: m.clientName },
                date: m.appointmentDate
            }
        }));

        return NextResponse.json(formatted);
    } catch (error: any) {
        console.error('WhatsApp API Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function POST() {
    try {
        await WhatsAppService.processPendingMessages();
        return NextResponse.json({ success: true });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
