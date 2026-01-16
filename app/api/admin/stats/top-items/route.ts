
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
    try {
        // Top Products by Quantity
        const topProductsRaw: any[] = await prisma.$queryRaw`
            SELECT p.name, SUM(si.quantity) as totalQty, SUM(si.subtotal) as totalRevenue
            FROM SaleItem si
            JOIN Product p ON si.productId = p.id
            WHERE si.type = 'PRODUCT'
            GROUP BY p.id
            ORDER BY totalQty DESC
            LIMIT 5
        `;

        // Top Services by Quantity
        // Services might be linked directly via serviceId or just by description if ad-hoc
        // Assuming we rely on SaleItem description for simplicity or link if available
        // Ideally we should link to Service model, but SaleItem stores description. 
        // Let's group by description for services.
        const topServicesRaw: any[] = await prisma.$queryRaw`
            SELECT si.description as name, COUNT(*) as totalQty, SUM(si.subtotal) as totalRevenue
            FROM SaleItem si
            WHERE si.type = 'SERVICE'
            GROUP BY si.description
            ORDER BY totalQty DESC
            LIMIT 5
        `;

        const formatStats = (rows: any[]) => rows.map((r: any) => ({
            name: r.name,
            value: Number(r.totalQty), // Ensure BigInt is handled if any
            revenue: Number(r.totalRevenue)
        }));

        return NextResponse.json({
            products: formatStats(topProductsRaw),
            services: formatStats(topServicesRaw)
        });

    } catch (error: any) {
        console.error('Top Items Stats Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
