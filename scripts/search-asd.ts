import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
    const plate = 'ASD123';
    console.log(`SEARCHING_FOR_PLATE: ${plate}...`);

    let vehicle = await prisma.vehicle.findUnique({
        where: { plate },
        include: { client: { include: { appointments: true } } }
    });

    if (!vehicle) {
        console.log('PLATE_NOT_FOUND_IN_DB');
        // Let's see what plates ARE there to help the user
        const others = await prisma.vehicle.findMany({ take: 5, select: { plate: true } });
        console.log('AVAILABLE_PLATES: ' + others.map(o => o.plate).join(', '));
        return;
    }

    const client = vehicle.client;
    let appointmentId = client.appointments[0]?.id;

    if (!appointmentId) {
        const service = await prisma.service.findFirst();
        if (service) {
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
        console.log('COULD_NOT_LINK_APPOINTMENT');
        return;
    }

    const testToken = 'token-asd-' + Math.random().toString(36).substr(2, 5);
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
