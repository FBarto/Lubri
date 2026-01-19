
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const plate = searchParams.get('plate');
        const phone = searchParams.get('phone');

        if (!plate && !phone) {
            return NextResponse.json({ error: 'Plate or Phone required' }, { status: 400 });
        }

        // Scenario 1: Lookup by Plate
        if (plate) {
            const vehicle = await prisma.vehicle.findUnique({
                where: { plate: plate.toUpperCase() },
                include: {
                    client: {
                        select: { id: true, name: true, phone: true }
                    }
                }
            });

            if (!vehicle) {
                return NextResponse.json(null); // Not found
            }

            return NextResponse.json(vehicle);
        }

        // Scenario 2: Lookup by Phone (Find client + their vehicles)
        if (phone) {
            const client = await prisma.client.findFirst({
                where: { phone: { contains: phone } }, // Flexible search
                include: {
                    vehicles: true
                }
            });

            if (!client) {
                return NextResponse.json(null);
            }

            return NextResponse.json(client);
        }

        return NextResponse.json(null);

    } catch (error) {
        console.error('Error looking up entity:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
