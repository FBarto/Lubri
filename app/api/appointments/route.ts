import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createAppointment } from '@/app/lib/booking-actions';

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const dateStr = searchParams.get('date');
        const fromStr = searchParams.get('from');
        const toStr = searchParams.get('to');
        const statusParam = searchParams.get('status');

        const whereClause: any = {};

        // Status filter
        if (statusParam) {
            const statuses = statusParam.split(',');
            whereClause.status = { in: statuses };
        } else {
            // Default: show all (Kanban view handles filtering by column)
            // If specific logic is needed like "not cancelled", client should request it.
        }

        // Date filter
        if (dateStr) {
            const startOfDay = new Date(dateStr);
            startOfDay.setHours(0, 0, 0, 0);

            const endOfDay = new Date(dateStr);
            endOfDay.setHours(23, 59, 59, 999);

            whereClause.date = {
                gte: startOfDay,
                lte: endOfDay,
            };
        } else if (fromStr && toStr) {
            const fromDate = new Date(fromStr);
            fromDate.setHours(0, 0, 0, 0);

            const toDate = new Date(toStr);
            toDate.setHours(23, 59, 59, 999);

            whereClause.date = {
                gte: fromDate,
                lte: toDate,
            };
        }

        const appointments = await prisma.appointment.findMany({
            where: whereClause,
            include: {
                client: true,
                vehicle: true,
                service: true,
            },
            orderBy: {
                date: 'asc',
            },
        });

        return NextResponse.json(appointments);
    } catch (error: any) {
        console.error('Error fetching appointments:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// GET method remains the same ...

export async function POST(request: Request) {
    try {
        const data = await request.json();

        // Use shared action
        const result = await createAppointment(data);

        if (!result.success) {
            // Determine status code based on error message (simplified)
            const status = result.error?.includes('Conflicto') ? 409 : 400;
            return NextResponse.json({ error: result.error }, { status });
        }

        return NextResponse.json(result.appointment, { status: 201 });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
