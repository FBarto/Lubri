import { prisma } from '../lib/prisma';
import crypto from 'crypto';

async function main() {
    console.log('Finding a vehicle...');
    const vehicle = await prisma.vehicle.findFirst({
        include: { client: true }
    });

    if (!vehicle) {
        console.error('No vehicles found in database.');
        return;
    }

    console.log(`Found vehicle: ${vehicle.plate} (ID: ${vehicle.id})`);

    // Logic from generatePortalLinkForVehicle
    const existingToken = await prisma.whatsAppToken.findFirst({
        where: {
            appointment: { vehicleId: vehicle.id },
            expiresAt: { gt: new Date() }
        },
        orderBy: { createdAt: 'desc' }
    });

    if (existingToken) {
        console.log(`Existing token found: ${existingToken.token}`);
        console.log(`URL: http://localhost:3000/portal/${existingToken.token}/book`);
        return;
    }

    console.log('Creating new token...');
    let appointment = await prisma.appointment.findFirst({
        where: { vehicleId: vehicle.id },
        orderBy: { date: 'desc' }
    });

    if (!appointment) {
        const service = await prisma.service.findFirst({ where: { active: true } });
        // Ensure we have a service ID, if not found, assume 1 or handle error
        const serviceId = service?.id;
        if (!serviceId) {
            console.error("No service found to create appointment");
            return;
        }

        appointment = await prisma.appointment.create({
            data: {
                clientId: vehicle.clientId,
                vehicleId: vehicle.id,
                serviceId: serviceId,
                date: new Date(),
                status: 'CONFIRMED',
                notes: 'System generated for Portal Access'
            }
        });
    }

    const token = crypto.randomBytes(32).toString('hex');

    await prisma.whatsAppToken.create({
        data: {
            token: token,
            action: 'ACCESS',
            expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
            appointmentId: appointment.id
        }
    });

    console.log(`New token created: ${token}`);
    console.log(`URL: http://localhost:3000/portal/${token}/book`);
}

main()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
