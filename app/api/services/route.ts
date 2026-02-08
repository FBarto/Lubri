import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
    try {
        const services = await prisma.service.findMany({
            where: { active: true },
            orderBy: { name: 'asc' }
        });
        return NextResponse.json(services);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
