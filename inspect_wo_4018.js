
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const wo = await prisma.workOrder.findUnique({
        where: { id: 4018 },
        include: {
            saleItems: true,
            service: true
        }
    });

    if (!wo) {
        console.log('Work Order #4018 not found');
        return;
    }

    console.log('Work Order ID:', wo.id);
    console.log('Service Details:', JSON.stringify(wo.serviceDetails, null, 2));
    console.log('Sale Items:', JSON.stringify(wo.saleItems, null, 2));
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
