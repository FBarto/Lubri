
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const count = await prisma.product.count();
    console.log(`Current Product Count: ${count}`);

    const sample = await prisma.product.findFirst({
        where: { code: 'AMP 203' }
    });
    if (sample) {
        console.log('Sample AMP 203:', sample);
    }
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
