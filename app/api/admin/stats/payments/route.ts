
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
    try {
        const sales = await prisma.sale.findMany({
            select: {
                paymentMethod: true,
                total: true
            }
        });

        const stats: Record<string, number> = {};

        sales.forEach(sale => {
            // Payment method might be complex string "CARD (3 Cuotas)" or joined "CASH | CARD"
            // For simple stats, we might want to regex or split.
            // Let's assume simplest case: primary method detection

            let method = 'Otro';
            const pm = sale.paymentMethod?.toUpperCase() || '';

            if (pm.includes('CASH') || pm.includes('EFECTIVO')) method = 'Efectivo';
            else if (pm.includes('CARD') || pm.includes('TARJETA')) method = 'Tarjeta';
            else if (pm.includes('TRANSFER') || pm.includes('TRANSF')) method = 'Transferencia';

            stats[method] = (stats[method] || 0) + sale.total;
        });

        const data = Object.entries(stats).map(([name, value]) => ({ name, value }));

        return NextResponse.json(data);

    } catch (error: any) {
        console.error('Payment Stats Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
