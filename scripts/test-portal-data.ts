
import { PrismaClient } from '@prisma/client';
import { getClientDataByToken } from '../app/actions/portal';

const prisma = new PrismaClient();

async function main() {
    console.log('--- Testing Portal Data Fetching ---');

    // 1. Create Mock Data
    const mockToken = 'PORTAL_TEST_' + Date.now();
    const phone = '555' + Date.now(); // Unique phone

    console.log('Creating mock data with token:', mockToken);

    try {
        const client = await prisma.client.create({
            data: {
                name: 'Portal User Test',
                phone: phone,
                vehicles: {
                    create: {
                        plate: 'TST-' + Math.floor(Math.random() * 1000),
                        brand: 'Toyota',
                        model: 'Corolla',
                        year: 2020,
                        mileage: 15000
                    }
                }
            },
            include: { vehicles: true }
        });

        const vehicle = client.vehicles[0];

        const service = await prisma.service.create({
            data: {
                name: 'Cambio de Aceite Test',
                category: 'LUBRICENTRO',
                duration: 30,
                price: 50000
            }
        });

        const appointment = await prisma.appointment.create({
            data: {
                date: new Date(),
                clientId: client.id,
                vehicleId: vehicle.id,
                serviceId: service.id,
                status: 'CONFIRMED'
            }
        });

        const token = await prisma.whatsAppToken.create({
            data: {
                token: mockToken,
                action: 'CONFIRM',
                expiresAt: new Date(Date.now() + 86400000), // 24h
                appointmentId: appointment.id
            }
        });

        // Create a past work order
        await prisma.workOrder.create({
            data: {
                clientId: client.id,
                vehicleId: vehicle.id,
                serviceId: service.id,
                price: 50000,
                status: 'COMPLETED',
                mileage: 14000,
                notes: 'Service anterior',
                date: new Date(Date.now() - 100000000), // In the past
                attachments: {
                    create: {
                        url: 'https://placehold.co/600x400',
                        type: 'IMAGE',
                        description: 'Filtro sucio'
                    }
                }
            }
        });

        // 2. Test Function
        console.log('Fetching data...');
        const result = await getClientDataByToken(mockToken);

        if (result.success && result.data?.client) {
            console.log('✅ Success!');
            console.log('Client Name:', result.data.client.name);
            console.log('Vehicles:', result.data.client.vehicles.length);
            console.log('Work Orders:', result.data.client.workOrders.length);
            console.log('First WO Service:', result.data.client.workOrders[0]?.serviceName);
            console.log('First WO Attachments:', result.data.client.workOrders[0]?.attachments.length);
        } else {
            console.error('❌ Failed:', result.error);
        }

        // Cleanup (Optional, mostly for local dev hygiene)
        // await prisma.whatsAppToken.delete({ where: { id: token.id } });
        // await prisma.appointment.delete({ where: { id: appointment.id } });
        // ... cleanup cascade is tricky without raw SQL or deeper logic. Leaving for manual cleanup or dev DB reset.

    } catch (e) {
        console.error('Test Error:', e);
    }
}

main()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
