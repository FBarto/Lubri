
const http = require('http');

async function testReportsApis() {
    // Since we cannot fetch from localhost:3000 easily without the server running,
    // we will simulate the logic by calling Prisma directly, similar to the API route logic.
    // This verifies the DB queries are valid.

    const { PrismaClient } = require('@prisma/client');
    const prisma = new PrismaClient();
    // @ts-ignore
    const { startOfMonth, endOfMonth, eachDayOfInterval, format } = require('date-fns');

    console.log('--- Verifying Sales Query ---');
    try {
        const now = new Date();
        const sales = await prisma.sale.findMany({
            where: {
                date: {
                    gte: startOfMonth(now),
                    lte: endOfMonth(now)
                }
            },
            take: 5
        });
        console.log(`Sales found (current month): ${sales.length}`);
    } catch (e) {
        console.error('Sales Query Failed:', e);
    }

    console.log('\n--- Verifying Top Items Query ---');
    try {
        const topProducts = await prisma.$queryRaw`
            SELECT p.name, SUM(si.quantity) as totalQty
            FROM SaleItem si
            JOIN Product p ON si.productId = p.id
            WHERE si.type = 'PRODUCT'
            GROUP BY p.id
            LIMIT 5
        `;
        console.log('Top Products Query Result:', topProducts);
    } catch (e) {
        // Fallback for potentially empty DB or schema mismatch issues during dev
        console.error('Top Products Query Failed:', e.message);
    }

    console.log('\n--- Verifying Payments Query ---');
    try {
        const paymentSales = await prisma.sale.findMany({
            select: { paymentMethod: true, total: true },
            take: 5
        });
        console.log('Payment Methods Sample:', paymentSales.map(s => s.paymentMethod));
    } catch (e) {
        console.error('Payments Query Failed:', e);
    }

    await prisma.$disconnect();
}

testReportsApis();
