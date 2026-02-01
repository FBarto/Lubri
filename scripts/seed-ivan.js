const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    console.log('Seeding Ivan Duri...');

    // 1. Create/Find Client
    const client = await prisma.client.upsert({
        where: { phone: '5493511234567' },
        update: {},
        create: {
            name: 'Ivan Duri',
            phone: '5493511234567',
        }
    });

    console.log('Client:', client.name);

    // 2. Create/Find Vehicle
    const vehicle = await prisma.vehicle.upsert({
        where: { plate: 'ID-TEST-01' },
        update: { clientId: client.id },
        create: {
            plate: 'ID-TEST-01',
            brand: 'VW',
            model: 'Amarok V6',
            year: 2023,
            clientId: client.id,
            mileage: 45000,
            averageDailyKm: 55,
            predictedNextService: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000) // 3 months
        }
    });

    console.log('Vehicle:', vehicle.plate);

    // 3. Create Service Data (Simulating Legacy Load)
    // We'll just insert a WorkOrder directly
    const service = await prisma.service.findFirst();

    // Service Details JSON
    const details = {
        oil: { type: 'SINTETICO', brand: 'Shell Helix Ultra', liters: '8' },
        filters: { air: true, oil: true, fuel: true, cabin: false },
        fluids: { brakes: true, coolant: true },
        notes: 'Cliente muy exigente. Usar solo repuestos originales.'
    };

    const wo = await prisma.workOrder.create({
        data: {
            clientId: client.id,
            vehicleId: vehicle.id,
            serviceId: service.id,
            status: 'COMPLETED',
            date: new Date(),
            finishedAt: new Date(),
            mileage: 45000,
            price: 150000,
            serviceDetails: details
        }
    });

    console.log('Work Order Created:', wo.id);

    // 4. Generate Token directly (to avoid import issues)
    const crypto = require('crypto');
    const token = crypto.randomBytes(32).toString('hex');

    // Create dummy appointment for token
    const appt = await prisma.appointment.create({
        data: {
            clientId: client.id,
            vehicleId: vehicle.id,
            serviceId: service.id,
            date: new Date(),
            status: 'CONFIRMED',
            notes: 'System Access Token'
        }
    });

    await prisma.whatsAppToken.create({
        data: {
            token: token,
            action: 'ACCESS',
            expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
            appointmentId: appt.id
        }
    });

    console.log('✅ TOKEN GENERATED:', token);
    console.log('URL:', `http://localhost:3000/portal/${token}`);
}

main()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
