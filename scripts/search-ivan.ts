import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
    const clientName = 'Ivan Duri';
    console.log(`Buscando cliente: ${clientName}...`);

    let client = await prisma.client.findFirst({
        where: { name: { contains: clientName, mode: 'insensitive' } },
        include: {
            vehicles: true,
            appointments: { orderBy: { date: 'desc' } }
        }
    });

    if (!client) {
        console.log('CLIENTE_NO_ENCONTRADO');
        return;
    }

    if (client.vehicles.length === 0) {
        console.log('CLIENTE_SIN_VEHICULOS');
        return;
    }

    const vehicle = client.vehicles[0];
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
        console.log('ERROR_AL_VINCULAR_TURNO');
        return;
    }

    const testToken = 'token-ivan-' + Math.random().toString(36).substr(2, 5);
    await prisma.whatsAppToken.create({
        data: {
            token: testToken,
            action: 'CONFIRM',
            appointmentId: appointmentId as number,
            expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000)
        }
    });

    console.log('GENERATED_TOKEN:' + testToken);
    console.log('VEHICULO:' + vehicle.brand + ' ' + vehicle.model + ' (' + vehicle.plate + ')');
}

main().finally(() => prisma.$disconnect());
