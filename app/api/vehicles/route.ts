import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const plate = searchParams.get('plate');
    const search = searchParams.get('search');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const skip = (page - 1) * limit;

    const where: any = {};

    if (search) {
        where.OR = [
            { plate: { contains: search, mode: 'insensitive' } },
            { brand: { contains: search, mode: 'insensitive' } },
            { model: { contains: search, mode: 'insensitive' } },
            { client: { name: { contains: search, mode: 'insensitive' } } }
        ];
    } else if (plate) {
        where.plate = { contains: plate };
    }

    const [total, vehicles] = await Promise.all([
        prisma.vehicle.count({ where }),
        prisma.vehicle.findMany({
            where,
            take: limit,
            skip: skip,
            include: { client: true },
            orderBy: { plate: 'asc' }
        })
    ]);

    return NextResponse.json({
        data: vehicles,
        meta: {
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit)
        }
    });
}

import { createVehicle } from '@/app/lib/booking-actions';

export async function POST(request: Request) {
    try {
        const data = await request.json();

        // Parse numbers if sent as strings (typical in form data/JSON from simpler clients)
        const parsedData = {
            ...data,
            mileage: data.mileage ? parseInt(data.mileage) : undefined,
            clientId: data.clientId ? parseInt(data.clientId) : undefined
        };

        const result = await createVehicle(parsedData);

        if (!result.success) {
            const status = result.error?.includes('exists') ? 400 : 500;
            return NextResponse.json({ error: result.error }, { status });
        }

        return NextResponse.json(result.vehicle, { status: 201 });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
