
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    try {
        console.log('Starting verification...');

        // 1. Get real data
        const client = await prisma.client.findFirst();
        const service = await prisma.service.findFirst();

        if (!client || !service) {
            throw new Error('No client or service found to test with.');
        }

        const vehicle = await prisma.vehicle.findFirst({ where: { clientId: client.id } });

        console.log(`Testing with Client: ${client.name}, Service: ${service.name}`);

        // 2. Mock Request
        const payload = {
            clientId: client.id,
            paymentMethod: 'TEST_SCRIPT',
            total: service.price,
            items: [{
                type: 'SERVICE',
                id: service.id, // ID of the service
                name: service.name,
                price: service.price,
                quantity: 1,
                clientId: client.id,
                vehicleId: vehicle ? vehicle.id : undefined
            }]
        };

        // 3. Send Request
        const res = await fetch('http://localhost:3000/api/sales', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        const json = await res.json();

        if (res.status === 201 && json.id) {
            // 4. Verify WorkOrder
            const wo = await prisma.workOrder.findFirst({
                where: { saleId: json.id }
            });

            if (wo) {
                console.log('SUCCESS: WorkOrder created!', wo);
            } else {
                console.error('FAILURE: Sale created but NO WorkOrder found.');
            }
        } else {
            console.error('FAILURE: API did not return success.', json);
        }

    } catch (e) {
        console.error(e);
    } finally {
        await prisma.$disconnect();
    }
}

main();
