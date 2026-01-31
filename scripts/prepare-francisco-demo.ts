
import { prisma } from '../lib/prisma';
import crypto from 'crypto';

async function main() {
    const plate = 'KNF368'; // Francisco's vehicle
    console.log(`Preparing test for ${plate}...`);

    const vehicle = await prisma.vehicle.findUnique({
        where: { plate },
        include: { client: true }
    });

    if (!vehicle) {
        console.error('Vehicle not found!');
        return;
    }

    // 1. Ensure he has a recent history (Fake it if needed for the demo)
    const recentWO = await prisma.workOrder.findFirst({
        where: { vehicleId: vehicle.id, status: 'COMPLETED' }
    });

    if (!recentWO) {
        console.log('Seeding fake history for demo...');
        // Products
        const oil = await prisma.product.findFirst({ where: { category: { contains: 'ACEITE' } } });
        const filter = await prisma.product.findFirst({ where: { category: { contains: 'FILTRO' } } });
        const service = await prisma.service.findFirst({ where: { active: true } });

        if (service && oil) {
            const sale = await prisma.sale.create({
                data: {
                    clientId: vehicle.clientId,
                    status: 'COMPLETED',
                    total: 45000,
                    paymentMethod: 'CASH',
                    date: new Date('2025-11-20'),
                    items: {
                        create: [
                            { type: 'PRODUCT', description: oil.name, productId: oil.id, quantity: 4, unitPrice: oil.price, subtotal: oil.price * 4 },
                            { type: 'PRODUCT', description: filter?.name || 'Filtro', productId: filter?.id, quantity: 1, unitPrice: filter?.price || 5000, subtotal: filter?.price || 5000 }
                        ]
                    }
                }
            });

            const wo = await prisma.workOrder.create({
                data: {
                    clientId: vehicle.clientId,
                    vehicleId: vehicle.id,
                    serviceId: service.id,
                    date: new Date('2025-11-20'),
                    finishedAt: new Date('2025-11-20'),
                    status: 'COMPLETED',
                    mileage: (vehicle.mileage || 100000) - 3000,
                    price: 45000,
                    saleId: sale.id,
                    notes: 'Service de rutina - Demo Francisco'
                }
            });

            // Link items
            await prisma.saleItem.updateMany({
                where: { saleId: sale.id },
                data: { workOrderId: wo.id }
            });
            console.log('History seeded.');
        }
    } else {
        console.log('Vehicle already has history.');
    }

    // 2. Generate Token
    // Check existing valid token
    const existingToken = await prisma.whatsAppToken.findFirst({
        where: {
            appointment: { vehicleId: vehicle.id },
            expiresAt: { gt: new Date() }
        },
        orderBy: { createdAt: 'desc' }
    });

    if (existingToken) {
        console.log(`URL: http://localhost:3002/portal/${existingToken.token}/book`);
        return;
    }

    console.log('Creating new appointment and token...');
    // Need an appointment to attach token
    let appointment = await prisma.appointment.findFirst({
        where: { vehicleId: vehicle.id },
        orderBy: { date: 'desc' }
    });

    if (!appointment) {
        const service = await prisma.service.findFirst();
        appointment = await prisma.appointment.create({
            data: {
                clientId: vehicle.clientId,
                vehicleId: vehicle.id,
                serviceId: service!.id,
                date: new Date(),
                status: 'CONFIRMED'
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

    console.log(`URL: http://localhost:3002/portal/${token}/book`);
}

main()
    .catch(console.error)
    .finally(async () => await prisma.$disconnect());
