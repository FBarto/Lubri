import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
    const categories = await prisma.service.groupBy({
        by: ['category'],
    });
    console.log('Existing Service Categories:', categories);
}

main().catch(console.error).finally(() => prisma.$disconnect());
