import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
    try {
        const topProducts = await prisma.product.findMany({
            where: { active: true },
            orderBy: { stock: 'desc' },
            take: 10
        });

        return NextResponse.json(topProducts);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
