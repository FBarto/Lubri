import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { startOfDay, endOfDay, subDays, format } from 'date-fns';

export async function GET() {
    try {
        const todayStart = startOfDay(new Date());
        const todayEnd = endOfDay(new Date());
        const sevenDaysAgo = subDays(new Date(), 7);

        // 1. KPI: Total Sales Today
        const salesToday = await prisma.sale.aggregate({
            _sum: { total: true },
            where: {
                date: {
                    gte: todayStart,
                    lte: todayEnd
                }
            }
        });

        // 2. KPI: Active Work Orders (Pending or In Progress)
        const pendingWOs = await prisma.workOrder.count({
            where: {
                status: { in: ['PENDING', 'IN_PROGRESS'] }
            }
        });

        // 2b. KPI: Inbox Active Cases
        const pendingInbox = await prisma.leadCase.count({
            where: {
                status: { in: ['NEW', 'IN_PROGRESS', 'WAITING_CUSTOMER', 'READY_TO_SCHEDULE'] }
            }
        });

        // 3. KPI: Low Stock Items

        // 3. KPI: Low Stock Items
        // Prisma doesn't support comparing two columns directly in `where` easily in all DBs, 
        // but for SQLite/Postgres we usually use raw query or fetch and filter if dataset is small.
        // For performance on large datasets, raw query is better. 
        // Let's try to fetch all active products and filter in memory for now (safe for < 5000 products), 
        // or use count if we can find a way. 
        // Given we just fixed the pos to load 1000, let's stick to fetch active.
        const allProducts = await prisma.product.findMany({
            where: { active: true },
            select: { stock: true, minStock: true }
        });
        const lowStockCount = allProducts.filter(p => p.stock <= p.minStock).length;

        // 4. Chart: Last 7 Days Sales
        const salesLast7Days = await prisma.sale.groupBy({
            by: ['date'],
            where: {
                date: {
                    gte: sevenDaysAgo
                }
            },
            _sum: {
                total: true
            }
        });

        // Group by day manually because groupBy returns DateTime objects
        const salesMap = new Map<string, number>();
        // Initialize last 7 days with 0
        for (let i = 0; i < 7; i++) {
            const d = subDays(new Date(), i);
            salesMap.set(format(d, 'yyyy-MM-dd'), 0);
        }

        salesLast7Days.forEach(s => {
            const dayKey = format(new Date(s.date), 'yyyy-MM-dd');
            // If entry exists (it might be outside 7 days if logic is slighty off, or TZ issues, but generally ok)
            // Actually, we want to sum up by day.
            const current = salesMap.get(dayKey) || 0;
            salesMap.set(dayKey, current + (s._sum.total || 0));
        });

        const chartData = Array.from(salesMap.entries())
            .map(([date, total]) => ({ date, total }))
            .sort((a, b) => a.date.localeCompare(b.date));


        // 5. Top Products (Quantity) - All time or last 30 days? Let's do Last 30 Days
        const thirtyDaysAgo = subDays(new Date(), 30);
        const topItems = await prisma.saleItem.groupBy({
            by: ['description'],
            where: {
                sale: {
                    date: { gte: thirtyDaysAgo }
                },
                type: 'PRODUCT'
            },
            _sum: {
                quantity: true,
                subtotal: true
            },
            orderBy: {
                _sum: { quantity: 'desc' }
            },
            take: 5
        });

        const topProducts = topItems.map((item, index) => ({
            id: index,
            name: item.description,
            quantity: item._sum.quantity || 0,
            revenue: item._sum.subtotal || 0
        }));

        return NextResponse.json({
            kpi: {
                salesToday: salesToday._sum.total || 0,
                pendingOrders: pendingWOs,
                pendingInbox: pendingInbox,
                lowStock: lowStockCount
            },
            chart: chartData,
            topProducts: topProducts
        });

    } catch (error: any) {
        console.error('Dashboard Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
