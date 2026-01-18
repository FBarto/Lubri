
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    // Find all COMPLETED work orders older than 24 hours
    const oldOrders = await prisma.workOrder.findMany({
        where: {
            status: 'COMPLETED',
            date: { lt: new Date(Date.now() - 24 * 60 * 60 * 1000) }
        }
    });

    console.log(`Found ${oldOrders.length} old COMPLETED orders.`);

    if (oldOrders.length > 0) {
        // Update them to DELIVERED (effectively "Passed to Checkout / Closed")
        // Or we could introduce an 'ARCHIVED' status if we want to differentiate.
        // For now, DELIVERED seems to be the "Exit" state of the Kanban.
        const { count } = await prisma.workOrder.updateMany({
            where: {
                status: 'COMPLETED',
                date: { lt: new Date(Date.now() - 24 * 60 * 60 * 1000) }
            },
            data: {
                status: 'DELIVERED'
            }
        });
        console.log(`Updated ${count} orders to DELIVERED.`);
    }
}

main()
    .catch(e => console.error(e))
    .finally(async () => {
        await prisma.$disconnect();
    });
