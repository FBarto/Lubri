import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('--- Database Counts ---');
    console.log('Clients:', await prisma.client.count());
    console.log('Vehicles:', await prisma.vehicle.count());
    console.log('Products:', await prisma.product.count());
    console.log('WorkOrders:', await prisma.workOrder.count());
    console.log('-----------------------');
}

main()
    .catch(e => console.error(e))
    .finally(() => prisma.$disconnect());
