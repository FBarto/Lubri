
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    try {
        console.log('Testing Kanban Query...');
        const workOrders = await prisma.workOrder.findMany({
            where: {
                status: {
                    in: ['PENDING', 'IN_PROGRESS', 'COMPLETED']
                }
            },
            include: {
                client: true,
                vehicle: true,
                service: true,
                user: true
            },
            orderBy: {
                date: 'asc'
            }
        });
        console.log('Success:', workOrders.length, 'work orders found');
    } catch (e) {
        console.error('Error:', e);
    } finally {
        await prisma.$disconnect();
    }
}

main();
