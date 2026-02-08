
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const vehicle = await prisma.vehicle.findUnique({
        where: { plate: 'GHJ456' },
        include: {
            workOrders: {
                orderBy: { date: 'desc' },
                take: 1,
                include: {
                    saleItems: true,
                    service: true
                }
            }
        }
    });

    if (!vehicle) {
        console.log('Vehicle GHJ456 not found');
        return;
    }

    console.log('Vehicle:', vehicle.brand, vehicle.model);
    if (vehicle.workOrders.length === 0) {
        console.log('No work orders found');
    } else {
        const wo = vehicle.workOrders[0];
        console.log('Work Order ID:', wo.id);
        console.log('Service Details:', JSON.stringify(wo.serviceDetails, null, 2));
        console.log('Sale Items:', JSON.stringify(wo.saleItems, null, 2));
    }
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
