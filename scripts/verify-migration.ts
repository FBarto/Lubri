
import { PrismaClient, Prisma } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('🔍 VERIFYING DATA INTEGRITY...');

    // Check WorkOrders with details
    const wo = await prisma.workOrder.findFirst({
        where: { NOT: { notes: '' } }, // Find one we hopefully imported
        orderBy: { id: 'desc' }
    });

    console.log('Last WorkOrder:', wo);
    console.log('Has serviceDetails?', (wo as any)?.serviceDetails ? 'YES' : 'NO');
    if ((wo as any)?.serviceDetails) {
        console.log('Details:', JSON.stringify((wo as any).serviceDetails, null, 2));
    }

    // Check Vehicle Specs
    const vehicleWithSpecs = await prisma.vehicle.findFirst({
        where: { NOT: { specifications: { equals: Prisma.DbNull } } }
    });

    if (vehicleWithSpecs) {
        console.log(`Checking Vehicle ${vehicleWithSpecs.plate}...`);
        console.log('Has specifications?', 'YES');
        console.log('Specs:', JSON.stringify((vehicleWithSpecs as any).specifications, null, 2));
    } else {
        console.log('No vehicle found with specifications.');
    }

    await prisma.$disconnect();
}

main();
