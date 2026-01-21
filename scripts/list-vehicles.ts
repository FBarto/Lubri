import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
    const vehicles = await prisma.vehicle.findMany({
        take: 20,
        select: { plate: true, brand: true, model: true }
    });
    console.log('VEHICLES_LIST:' + JSON.stringify(vehicles));
}

main().finally(() => prisma.$disconnect());
