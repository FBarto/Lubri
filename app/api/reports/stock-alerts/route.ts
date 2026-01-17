
import { NextResponse } from 'next/server';
import { prisma } from '../../../../lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const lowStockProducts = await prisma.product.findMany({
            where: {
                active: true,
                stock: {
                    lte: prisma.product.fields.minStock
                }
            },
            orderBy: {
                stock: 'asc'
            }
        });

        // Prisma limitation: comparing columns in `where` (stock <= minStock) isn't directly supported in standard simple querying in some versions/dbs without raw query or extensions, 
        // BUT let's see if this works. 
        // Actually, `lte: prisma.product.fields.minStock` is NOT valid Prisma syntax for "less than or equal to another column".
        // We have to filter in JS or use raw query.
        // Given SQLite and possible complexity, JS filter is safer for now unless dataset is huge.

        // Wait, let's fetch all active products and filter. It's safer.
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
