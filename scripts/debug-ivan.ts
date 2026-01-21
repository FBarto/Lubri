import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
    const wos = await prisma.workOrder.findMany({
        where: { client: { name: { contains: 'Ivan', mode: 'insensitive' } } },
        include: { service: true, saleItems: true }
    });
    console.log('--- DEBUG IVAN ---');
    console.log(JSON.stringify(wos, null, 2));
}

main().finally(() => prisma.$disconnect());
