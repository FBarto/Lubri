
import { PrismaClient } from '@prisma/client';
import { processSale } from '../app/actions/business';

const prisma = new PrismaClient();

async function debug() {
    console.log('--- Starting Sale Debug (Frontend Payload Simulation) ---');

    // 1. Get a valid product
    const product = await prisma.product.findFirst({ where: { active: true } });
    if (!product) {
        console.error('Missing prerequisites: product not found');
        return;
    }

    console.log(`Using Product: ${product.name} (ID: ${product.id})`);

    // 2. Mock a sale payload simulating the Frontend (No clientId at root)
    // The route.ts injects userId: 1, and passes clientId: body.clientId (which is undefined)
    const frontendPayload = {
        userId: 1, // Injected by route.ts
        clientId: undefined, // Simulating undefined client
        paymentMethod: 'CASH: 3000',
        items: [
            {
                type: 'PRODUCT' as const,
                id: product.id,
                description: product.name,
                quantity: 1,
                unitPrice: product.price
            },
            {
                type: 'SERVICE' as const,
                id: 999, // Some ID
                description: 'Service Test',
                quantity: 1,
                unitPrice: 1500
            }
        ]
    };

    console.log('Attempting to process sale with Product + Service...');
    try {
        const result = await processSale(frontendPayload);
        if (result.success) {
            console.log('Sale successful! ID:', result.data?.sale?.id);
        } else {
            console.error('Sale failed with error:', result.error);
        }
    } catch (e) {
        console.error('CRITICAL ERROR:', e);
    }
}

debug()
    .catch(e => console.error(e))
    .finally(async () => {
        await prisma.$disconnect();
    });
