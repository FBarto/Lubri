
import { PrismaClient } from '@prisma/client';
import { processSale } from '../app/lib/business-actions';

const prisma = new PrismaClient();

async function debug() {
    console.log('--- Starting Sale Debug ---');

    // 1. Get a valid product and client
    const product = await prisma.product.findFirst({ where: { active: true } });
    const client = await prisma.client.findFirst();
    const user = await prisma.user.findFirst({ where: { id: 1 } });

    if (!product || !client || !user) {
        console.error('Missing prerequisites: product, client or user (id 1) not found');
        return;
    }

    console.log(`Using Product: ${product.name} (ID: ${product.id})`);
    console.log(`Using Client: ${client.name} (ID: ${client.id})`);
    console.log(`Using User: ${user.username} (ID: ${user.id})`);

    // 2. Mock a sale payload
    const data = {
        userId: 1,
        clientId: client.id,
        paymentMethod: 'CASH: 1000 | CARD: 500 (Visa) | TRANSFER: 200',
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
                description: 'Servicio de Prueba',
                quantity: 1,
                unitPrice: 1500
            }
        ]
    };

    console.log('Attempting to process sale...');
    try {
        const result = await processSale(data);
        if (result.success) {
            console.log('Sale successful! ID:', result.sale?.id);
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
