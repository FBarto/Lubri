
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const range = searchParams.get('range') || '7'; // Default 7 days
        const days = parseInt(range);

        const endDate = new Date();
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - days);

        const sales = await prisma.sale.findMany({
            where: {
                date: {
                    gte: startDate,
                    lte: endDate
                }
            },
            orderBy: {
                date: 'asc'
            }
        });

        // Group by date (YYYY-MM-DD)
        const groupedMap = new Map<string, number>();

        // Initialize map with 0 for all days in range to allow continuous charts
        for (let i = 0; i < days; i++) {
            const d = new Date();
            d.setDate(d.getDate() - (days - 1 - i));
            const key = d.toISOString().split('T')[0];
            groupedMap.set(key, 0);
        }

        sales.forEach(sale => {
            const dateKey = new Date(sale.date).toISOString().split('T')[0];
            const current = groupedMap.get(dateKey) || 0;
            groupedMap.set(dateKey, current + sale.total);
        });

        const data = Array.from(groupedMap.entries()).map(([date, total]) => ({
            date,
            total
        }));

        return NextResponse.json(data);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
