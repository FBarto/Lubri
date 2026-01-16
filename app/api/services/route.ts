import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
    try {
        const services = await prisma.service.findMany({
            orderBy: { category: 'asc' },
        });
        return NextResponse.json(services);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const { name, category, duration, price } = await request.json();

        if (!name || !category || !price) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        const service = await prisma.service.create({
            data: {
                name,
                category,
                duration: duration ? parseInt(duration) : 30,
                price: parseFloat(price),
                active: true,
            },
        });

        return NextResponse.json(service, { status: 201 });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
