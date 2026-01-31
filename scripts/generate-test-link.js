
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    try {
        const vehicle = await prisma.vehicle.findFirst({
            include: { client: true }
        });

        if (!vehicle) {
            console.log('No vehicles found. seeding one...');
            // Create a dummy vehicle/client if needed, but usually there's one
            const client = await prisma.client.create({
                data: {
                    name: "Test Driver",
                    phone: "5551234567"
                }
            });
            await prisma.vehicle.create({
                data: {
                    plate: "TEST-999",
                    brand: "Audi",
                    model: "R8 V10",
                    year: 2024,
                    mileage: 15000,
                    clientId: client.id,
                    lastServiceMileage: 10000,
                    lastServiceDate: new Date(),
                    averageDailyKm: 45
                }
            });
        }

        // Now generate link logic (inline for script simplicity or import if possible, 
        // but imports in scripts can be tricky with ts-node if not configured, 
        // so I will replicate the simple logic or try to use the library)

        // Attempting to use the library function might trigger import issues with 'use server' directives in simple scripts
        // So I will just create the token manually in this script for robust testing

        const v = await prisma.vehicle.findFirst({ include: { client: true } });

        // Ensure appointment exists
        let appointment = await prisma.appointment.findFirst({ where: { vehicleId: v.id } });
        if (!appointment) {
            const service = await prisma.service.findFirst() || await prisma.service.create({
                data: { name: "Service General", category: "General", price: 1000, duration: 60 }
            });

            appointment = await prisma.appointment.create({
                data: {
                    date: new Date(),
                    status: 'CONFIRMED',
                    clientId: v.clientId,
                    vehicleId: v.id,
                    serviceId: service.id
                }
            });
        }

        const token = "TEST-TOKEN-" + Math.floor(Math.random() * 10000);

        await prisma.whatsAppToken.create({
            data: {
                token: token,
                action: 'ACCESS',
                expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24),
                appointmentId: appointment.id
            }
        });

        console.log(`PORTAL_URL: http://localhost:3000/portal/${token}`);

    } catch (e) {
        console.error(e);
    } finally {
        await prisma.$disconnect();
    }
}

main();
