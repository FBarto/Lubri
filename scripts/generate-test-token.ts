import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
    const client = await prisma.client.findFirst({
        include: { appointments: true }
    });

    if (!client) {
        console.log('NO_CLIENT_FOUND');
        return;
    }

    let appointmentId = client.appointments[0]?.id;

    if (!appointmentId) {
        // Create a dummy appointment if none exists
        const vehicle = await prisma.vehicle.findFirst({ where: { clientId: client.id } });
        const service = await prisma.service.findFirst();
        if (vehicle && service) {
            const appo = await prisma.appointment.create({
                data: {
                    clientId: client.id,
                    vehicleId: vehicle.id,
                    serviceId: service.id,
                    date: new Date(),
                    status: 'CONFIRMED'
                }
            });
            appointmentId = appo.id;
        }
    }

    if (!appointmentId) {
        console.log('NO_APPOINTMENT_FOUND');
        return;
    }

    const testToken = 'test-token-' + Math.random().toString(36).substr(2, 9);
    await prisma.whatsAppToken.create({
        data: {
            token: testToken,
            action: 'CONFIRM',
            appointmentId: appointmentId as number,
            expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000)
        }
    });

    console.log('GENERATED_TOKEN:' + testToken);
}

main().finally(() => prisma.$disconnect());
