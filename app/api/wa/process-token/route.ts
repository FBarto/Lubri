import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { logActivity } from '@/app/lib/logger';

export async function POST(request: Request) {
    try {
        const { token, action } = await request.json();

        // Using Raw SQL because prisma generate may be blocked
        const tokens: any[] = await prisma.$queryRaw`
            SELECT t.*, a.clientId 
            FROM WhatsAppToken t
            JOIN Appointment a ON t.appointmentId = a.id
            WHERE t.token = ${token}
            LIMIT 1
        `;

        const dbToken = tokens[0];

        if (!dbToken) {
            return NextResponse.json({ error: 'Token inválido.' }, { status: 404 });
        }

        const expiresAt = new Date(dbToken.expiresAt);
        if (expiresAt < new Date()) {
            return NextResponse.json({ error: 'Token expirado.' }, { status: 400 });
        }

        if (dbToken.usedAt) {
            return NextResponse.json({ error: 'Este link ya fue utilizado.' }, { status: 400 });
        }

        // Update Appointment
        const newStatus = action === 'CONFIRM' ? 'CONFIRMED' : 'CANCELLED';

        await prisma.$transaction([
            prisma.$executeRaw`
                UPDATE Appointment SET status = ${newStatus} WHERE id = ${dbToken.appointmentId}
            `,
            prisma.$executeRaw`
                UPDATE WhatsAppToken SET usedAt = ${newDate()} WHERE id = ${dbToken.id}
            `
        ]);

        // Log the change (using System ID 1)
        await logActivity(
            1,
            'UPDATE',
            'APPOINTMENT',
            dbToken.appointmentId,
            `Turno ${newStatus} vía WhatsApp (Token)`
        );

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error('Token processing error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

function newDate() {
    return new Date();
}
