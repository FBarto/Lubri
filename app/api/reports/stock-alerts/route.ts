
import { NextResponse } from 'next/server';
import { prisma } from '../../../../lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        // Fetch all active products and filter in memory to find low stock.
        // This is safer for SQLite/Prisma compatibility regarding column comparisons.
        const allProducts = await prisma.product.findMany({
            where: { active: true },
            select: { id: true, name: true, stock: true, minStock: true, code: true }
        });

        const alerts = allProducts.filter(p => p.stock <= (p.minStock || 0));

        return NextResponse.json(alerts);
    } catch (error) {
        console.error('Error fetching stock alerts:', error);
        return NextResponse.json({ error: 'Failed to fetch alerts' }, { status: 500 });
    }
}
