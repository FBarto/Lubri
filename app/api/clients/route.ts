import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const phone = searchParams.get('phone');
    const search = searchParams.get('search');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const skip = (page - 1) * limit;

    const where: any = {};

    if (search) {
        where.OR = [
            { name: { contains: search, mode: 'insensitive' } },
            { phone: { contains: search } },
            { vehicles: { some: { plate: { contains: search, mode: 'insensitive' } } } }
        ];
    } else if (phone) {
        where.phone = { contains: phone };
    }

    const [total, clients] = await Promise.all([
        prisma.client.count({ where }),
        prisma.client.findMany({
            where,
            take: limit,
            skip: skip,
            include: { vehicles: true },
            orderBy: { name: 'asc' }
        })
    ]);

    return NextResponse.json({
        data: clients,
        meta: {
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit)
        }
    });
}

import { createClient } from '@/app/actions/booking';

export async function POST(request: Request) {
    try {
        const data = await request.json();
        const result = await createClient(data);

        if (!result.success) {
            return NextResponse.json({ error: result.error }, { status: 400 });
        }

        // Return client data + existing flag if present
        const { client, existing } = result.data || {};
        return NextResponse.json({ ...client, existing }, { status: 201 });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
