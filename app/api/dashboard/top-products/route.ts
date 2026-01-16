
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const limit = parseInt(searchParams.get('limit') || '5');

        // We need to aggregate SaleItem by productId
        // Since Prisma doesn't support complex groupBy with relations easily in all versions,
        // we might do a raw query or fetch all active sale items.
        // For scalability, raw query is better, but let's stick to Prisma simple API if possible.
        // Or aggregate in memory if data volume isn't huge yet. 
        // Let's use groupBy if supported well, otherwise finding all items is safer.

        const items = await prisma.saleItem.groupBy({
            by: ['productId', 'description'],
            _sum: {
                quantity: true,
                subtotal: true
            },
            orderBy: {
                _sum: {
                    quantity: 'desc'
                }
            },
            take: limit
        });

        // Map to cleaner format
        const data = items.map(item => ({
            id: item.productId,
            name: item.description, // Fallback if regular product name lookup is needed
            quantity: item._sum.quantity || 0,
            revenue: item._sum.subtotal || 0
        }));

        return NextResponse.json(data);

    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
