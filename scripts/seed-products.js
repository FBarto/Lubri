
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const products = [
        { name: 'Aceite Elaion F50 10W40 1L', category: 'Aceite', price: 12500, stock: 50 },
        { name: 'Aceite Elaion F50 10W40 4L', category: 'Aceite', price: 45000, stock: 20 },
        { name: 'Filtro Aceite Fram PH5949', category: 'Filtro', price: 8500, stock: 15 },
        { name: 'Filtro Aire Fram CA9999', category: 'Filtro', price: 9200, stock: 10 },
        { name: 'Aditivo Liqui Moly Ceratec', category: 'Aditivo', price: 25000, stock: 5 },
        { name: 'Lámpara H7 Osram', category: 'Accesorios', price: 4500, stock: 30 },
        { name: 'Agua Destilada 5L', category: 'Varios', price: 3000, stock: 100 },
    ];

    console.log('Seeding products...');
    for (const p of products) {
        await prisma.product.create({
            data: p
        });
    }
    console.log('Products created.');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
