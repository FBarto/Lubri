import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('Seeding Kanban Test Data...');

    // 1. Ensure dependencies
    const client = await prisma.client.upsert({
        where: { phone: '1122334455' },
        update: {},
        create: { name: 'Test User Kanban', phone: '1122334455' }
    });

    const vehicle = await prisma.vehicle.upsert({
        where: { plate: 'TEST-999' },
        update: {},
        create: { plate: 'TEST-999', brand: 'Ford', model: 'Fiesta', year: 2020, clientId: client.id }
    });

    const vehicle2 = await prisma.vehicle.upsert({
        where: { plate: 'LIVE-123' },
        update: {},
        create: { plate: 'LIVE-123', brand: 'Toyota', model: 'Corolla', year: 2022, clientId: client.id }
    });

    const vehicle3 = await prisma.vehicle.upsert({
        where: { plate: 'DONE-777' },
        update: {},
        create: { plate: 'DONE-777', brand: 'Volkswagen', model: 'Gol', year: 2018, clientId: client.id }
    });

    const service = await prisma.service.findFirst() || await prisma.service.create({
        data: { name: 'Cambio de Aceite 10W40', category: 'Aceite', duration: 30, price: 50000 }
    });

    // 2. Create WorkOrders
    // PENDING
    await prisma.workOrder.create({
        data: {
            clientId: client.id,
            vehicleId: vehicle.id,
            serviceId: service.id,
            price: service.price,
            status: 'PENDING',
            date: new Date()
        }
    });

    // IN_PROGRESS
    await prisma.workOrder.create({
        data: {
            clientId: client.id,
            vehicleId: vehicle2.id,
            serviceId: service.id,
            price: service.price,
            status: 'IN_PROGRESS',
            date: new Date(Date.now() - 1000 * 60 * 30), // 30 mins ago
            // userId needs a valid user, omit for now or fetch
        }
    });

    // COMPLETED
    await prisma.workOrder.create({
        data: {
            clientId: client.id,
            vehicleId: vehicle3.id,
            serviceId: service.id,
            price: service.price,
            status: 'COMPLETED',
            date: new Date(Date.now() - 1000 * 60 * 60), // 1 hour ago
            finishedAt: new Date(),
            mileage: 65000
        }
    });

    console.log('✅ Kanban populated with 3 orders (PENDING, IN_PROGRESS, COMPLETED)');
}

main()
    .catch(e => console.error(e))
    .finally(() => prisma.$disconnect());
