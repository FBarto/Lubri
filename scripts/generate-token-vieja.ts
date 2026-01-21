import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
    const plate = 'Vieja';
    const vehicle = await prisma.vehicle.findUnique({
        where: { plate },
        include: {
            client: {
                include: { appointments: { orderBy: { date: 'desc' } } }
            }
        }
    });

    if (!vehicle) {
        console.log('VEHICLE_NOT_FOUND');
        return;
    }

    const client = vehicle.client;
    let appointmentId = client.appointments[0]?.id;

    if (!appointmentId) {
        // Create a dummy appointment if none exists for this client/vehicle
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
        console.log('COULD_NOT_CREATE_APPOINTMENT');
        return;
    }

    const testToken = 'token-vieja-' + Math.random().toString(36).substr(2, 5);
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
