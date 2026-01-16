
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { startOfMonth, endOfMonth, eachDayOfInterval, format } from 'date-fns';
import { es } from 'date-fns/locale';

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const now = new Date();
        const year = parseInt(searchParams.get('year') || now.getFullYear().toString());
        const month = parseInt(searchParams.get('month') || (now.getMonth() + 1).toString());

        const startDate = new Date(year, month - 1, 1);
        const endDate = endOfMonth(startDate);

        // Fetch sales within the range
        const sales = await prisma.sale.findMany({
            where: {
                date: {
                    gte: startDate,
                    lte: endDate
                }
            },
            select: {
                date: true,
                total: true
            }
        });

        // Group by day to fill gaps with 0
        const days = eachDayOfInterval({ start: startDate, end: endDate });
        const chartData = days.map((day: Date) => {
            const dayStr = format(day, 'yyyy-MM-dd');
            const daySales = sales.filter(s => format(s.date, 'yyyy-MM-dd') === dayStr);
            const total = daySales.reduce((sum, s) => sum + s.total, 0);

            return {
                date: format(day, 'd MMM', { locale: es }),
                fullDate: dayStr,
                total: total
            };
        });

        const totalRevenue = sales.reduce((sum, s) => sum + s.total, 0);
        const totalSales = sales.length;

        return NextResponse.json({
            chartData,
            summary: {
                totalRevenue,
                totalSales
            }
        });

    } catch (error: any) {
        console.error('Stats Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
