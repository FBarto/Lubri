
import { PrismaClient } from '@prisma/client';
import crypto from 'crypto';

const prisma = new PrismaClient();

async function main() {
    // 1. Find a vehicle (OIL873 or TEST-999)
    const vehicle = await prisma.vehicle.findFirst({
        where: {
            OR: [{ plate: 'TEST-999' }, { plate: { startsWith: 'OIL' } }]
        },
        include: { client: true }
    });

    if (!vehicle) {
        console.error('❌ No suitable vehicle found.');
        return;
    }

    // 2. We need a Service and Appointment to create a WhatsAppToken
    const service = await prisma.service.findFirst({ where: { active: true } });

    // Create Dummy Appointment
    const appointment = await prisma.appointment.create({
        data: {
            clientId: vehicle.clientId,
            vehicleId: vehicle.id,
            serviceId: service?.id || 1,
            date: new Date(),
            status: 'CONFIRMED'
        }
    });

    // 3. Create Token
    const token = crypto.randomBytes(32).toString('hex');
    await prisma.whatsAppToken.create({
        data: {
            token: token,
            action: 'CONFIRM',
            expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
            appointmentId: appointment.id
        }
    });

    console.log(`\n🚗 Vehicle: ${vehicle.plate} (${vehicle.brand} ${vehicle.model})`);
    console.log(`👤 Client: ${vehicle.client.name}`);
    console.log(`\n🔗 PORTAL URL (Click to Open):`);
    console.log(`\n👉 http://localhost:3000/portal/${token}\n`);
}

main()
    .catch(console.error)
    .finally(async () => await prisma.$disconnect());
