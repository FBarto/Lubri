import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const client = await prisma.client.findUnique({
        where: { id: Number(id) },
        include: { vehicles: true },
    });
    if (!client) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json(client);
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const { name, phone } = await request.json();
    if (!name || !phone) {
        return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
    }
    const updated = await prisma.client.update({
        where: { id: Number(id) },
        data: { name, phone },
    });
    return NextResponse.json(updated);
}

export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    await prisma.client.delete({ where: { id: Number(id) } });
    return NextResponse.json({ success: true });
}
