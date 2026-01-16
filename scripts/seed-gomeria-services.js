const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const gomeriaServices = [
    { name: 'Parche Auto', price: 10000 },
    { name: 'Parche MOTO', price: 8000 },
    { name: 'Parche Enduro', price: 9500 },
    { name: 'Parche Camioneta', price: 11000 },
    { name: 'Parche Rueda moto', price: 6500 },
    { name: 'Parche Rueda Enduro', price: 8500 },
    { name: 'Arme o desarme moto', price: 3500 },
    { name: 'Arme o desarme auto', price: 4000 },
    { name: 'Balanceo Auto', price: 10000 },
    { name: 'Pico auto', price: 10000 },
    { name: 'Balanceo Camioneta', price: 11000 },
    { name: 'Arme o desarme Camioneta', price: 5000 },
    { name: 'Utilitario + 2,5 Ton', price: 14000 },
    { name: 'Parche Tela', price: 3500 },
    { name: 'Revicion MOTO', price: 6000 },
    { name: 'Revicion Auto S/Camara', price: 4000 },
    { name: 'Revicion Auto C/Camara', price: 6000 },
    { name: 'Rotacion Auto', price: 8000 },
    { name: 'Rotacion Camioneta', price: 10000 },
];

async function main() {
    console.log('Seeding Gomeria services...');

    for (const service of gomeriaServices) {
        const created = await prisma.service.create({
            data: {
                name: service.name,
                category: 'GOMERIA',
                duration: 30, // Default duration
                price: service.price,
                active: true,
            },
        });
        console.log(`Created service: ${created.name} - $${created.price}`);
    }

    console.log('Done!');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
