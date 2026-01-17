
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const count = await prisma.product.count();
    const activeCount = await prisma.product.count({ where: { active: true } });
    console.log(`Total Products: ${count}`);
    console.log(`Active Products: ${activeCount}`);

    const sample = await prisma.product.findFirst();
    console.log('Sample product:', sample);
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
