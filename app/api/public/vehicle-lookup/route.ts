import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const plate = searchParams.get('plate');

        if (!plate) {
            return NextResponse.json({ error: 'Missing plate' }, { status: 400 });
        }

        // Search in local database
        const vehicle = await prisma.vehicle.findFirst({
            where: {
                plate: {
                    equals: plate.replace(/\s+/g, ''),
                    mode: 'insensitive'
                }
            },
            select: {
                id: true,
                brand: true,
                model: true,
                client: {
                    select: { name: true, phone: true } // Need this for auto-fill context if allowed
                },
                specifications: true
            }
        });

        if (vehicle) {
            return NextResponse.json({
                found: true,
                id: vehicle.id,
                brand: vehicle.brand,
                model: vehicle.model,
                engine: (vehicle.specifications as any)?.engine || '',
                fuelType: (vehicle.specifications as any)?.fuelType || 'Nafta',
                // We return client info only if necessary for linking, but careful with privacy.
                // For the "Returning User" flow, we need to know if it has a client.
                client: vehicle.client
            });
        }

        return NextResponse.json({ found: false });

    } catch (error: any) {
        console.error('Vehicle lookup error:', error);
        return NextResponse.json({ error: 'Lookup failed' }, { status: 500 });
    }
}
