import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
    console.log('SEARCHING_FOR_VIEJA...');

    // Try find vehicle by plate
    let vehicle = await prisma.vehicle.findFirst({
        where: { plate: { contains: 'Vieja', mode: 'insensitive' } },
        include: { client: { include: { appointments: true } } }
    });

    // If not found, try find client by name
    if (!vehicle) {
        const client = await prisma.client.findFirst({
            where: { name: { contains: 'Vieja', mode: 'insensitive' } },
            include: { vehicles: true, appointments: true }
        });
        if (client && client.vehicles.length > 0) {
            vehicle = { ...client.vehicles[0], client } as any;
        }
    }

    if (!vehicle) {
        // Fallback: Just take ANY client and vehicle to not leave the user empty handed
        vehicle = await prisma.vehicle.findFirst({
            include: { client: { include: { appointments: true } } }
        }) as any;
        console.log('VIEJA_NOT_FOUND_USING_FALLBACK');
    }

    if (!vehicle) {
        console.log('TOTAL_DATA_MISSING');
        return;
    }

    const client = (vehicle as any).client;
    let appointmentId = client.appointments[0]?.id;

    if (!appointmentId) {
        const service = await prisma.service.findFirst();
        if (service) {
            const appo = await prisma.appointment.create({
                data: {
                    clientId: client.id,
                    vehicleId: vehicle.id,
                    serviceId: (service as any).id,
                    date: new Date(),
                    status: 'CONFIRMED'
                }
            });
            appointmentId = (appo as any).id;
        }
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
    console.log('FOR_PLATE:' + vehicle.plate);
}

main().finally(() => prisma.$disconnect());
