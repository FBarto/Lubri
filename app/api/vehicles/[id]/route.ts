import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const vehicle = await prisma.vehicle.findUnique({
        where: { id: Number(id) },
        include: { client: true },
    });
    if (!vehicle) return NextResponse.json({ error: 'Vehicle not found' }, { status: 404 });
    return NextResponse.json(vehicle);
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        const { plate, brand, model, type, notes, mileage, clientId } = await request.json();

        const updated = await prisma.vehicle.update({
            where: { id: Number(id) },
            data: {
                plate,
                brand,
                model,
                type,
                notes,
                mileage: mileage ? parseInt(mileage) : null,
                clientId: clientId ? parseInt(clientId) : undefined,
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
        await prisma.vehicle.delete({
            where: { id: Number(id) }
        });
        return NextResponse.json({ success: true });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
