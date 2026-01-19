
import { PrismaClient } from '@prisma/client';
import { subDays } from 'date-fns';

const prisma = new PrismaClient();

async function main() {
    console.log('🌱 Seeding History for Prediction Test...');

    // 1. Create a Client & Vehicle
    const client = await prisma.client.create({
        data: { name: 'Juan Predictivo', phone: '54911000999' }
    });

    const car = await prisma.vehicle.create({
        data: {
            plate: `PRED${Math.floor(Math.random() * 999)}`,
            clientId: client.id,
            brand: 'Toyota',
            model: 'Corolla',
            mileage: 50000
        }
    });

    // 2. Create 3 Past Services (Clear pattern: ~100 km/day)
    // 30 days ago: 47,000 km
    // 60 days ago: 44,000 km
    // 90 days ago: 41,000 km
    // Rate: 3000km / 30days = 100 km/day

    const service = await prisma.service.create({
        data: { name: 'Cambio Aceite', category: 'LUBRICENTRO', price: 100, duration: 30 }
    });

    const history = [
        { daysAgo: 90, mileage: 41000 },
        { daysAgo: 60, mileage: 44000 },
        { daysAgo: 30, mileage: 47000 },
        { daysAgo: 0, mileage: 50000 } // Today
    ];

    for (const h of history) {
        await prisma.workOrder.create({
            data: {
                clientId: client.id,
                vehicleId: car.id,
                serviceId: service.id,
                status: 'COMPLETED',
                date: subDays(new Date(), h.daysAgo),
                finishedAt: subDays(new Date(), h.daysAgo),
                mileage: h.mileage,
                price: 100
            }
        });
    }

    console.log(`✅ Created Vehicle ${car.plate} with 4 service records.`);
    console.log(`   Expected Usage: ~100 km/day`);
    console.log(`   Current Mileage: 50,000 km`);
    console.log(`   Next Service (60,000 km) should be in ~100 days.`);
}

main()
    .catch(console.error)
    .finally(async () => await prisma.$disconnect());
