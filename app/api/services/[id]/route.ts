import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        const service = await prisma.service.findUnique({
            where: { id: Number(id) },
        });
        if (!service) return NextResponse.json({ error: 'Service not found' }, { status: 404 });
        return NextResponse.json(service);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        const { name, category, duration, price, active } = await request.json();

        const updated = await prisma.service.update({
            where: { id: Number(id) },
            data: {
                name,
                category,
                duration: duration ? parseInt(duration) : undefined,
                price: price ? parseFloat(price) : undefined,
                active,
            },
        });

        return NextResponse.json(updated);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        await prisma.service.delete({
            where: { id: Number(id) },
        });
        return NextResponse.json({ success: true });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
