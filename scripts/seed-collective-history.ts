
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('🌱 Seeding Collective Intelligence History...');

    // 1. Get Products we want to "teach" the system about
    // Let's say Ford Focus owners typically use Shell Helix HX7 10W-40 and Fram PH5949
    const oil = await prisma.product.findFirst({ where: { name: { contains: 'Shell Helix HX7 10W-40 4L' } } });
    const filter = await prisma.product.findFirst({ where: { name: { contains: 'Fram PH5949' } } });

    if (!oil || !filter) {
        console.error('❌ Products not found. Run seed-products.js first.');
        return;
    }

    // 2. Create Service
    const service = await prisma.service.findFirst() || await prisma.service.create({
        data: { name: 'Service General', category: 'GENERAL', active: true, price: 0, duration: 60 }
    });

    // 3. Create "The Crowd" - 3 other Ford Focuses
    const crowdPlates = ['FOCUS-001', 'FOCUS-002', 'FOCUS-003'];

    // Ensure we have a generic client
    let client = await prisma.client.findFirst({ where: { name: 'Crowd User' } });
    if (!client) {
        client = await prisma.client.create({ data: { name: 'Crowd User', phone: '000000' } });
    }

    for (const plate of crowdPlates) {
        // Create/Find Vehicle
        let vehicle = await prisma.vehicle.findUnique({ where: { plate } });
        if (!vehicle) {
            vehicle = await prisma.vehicle.create({
                data: {
                    plate,
                    brand: 'Ford',
                    model: 'Focus', // Crucial: Same model
                    year: 2018,
                    clientId: client.id
                }
            });
        }

        // Create Work Order (History)
        const sale = await prisma.sale.create({
            data: { total: oil.price + filter.price, paymentMethod: 'CASH', date: new Date() }
        });

        const wo = await prisma.workOrder.create({
            data: {
                // Removed paymentId
                // Checking schema from previous knowledge: WorkOrder has saleId
                saleId: sale.id,
                vehicleId: vehicle.id,
                clientId: client.id,
                serviceId: service.id,
                status: 'COMPLETED', // MUST be completed to count
                price: oil.price + filter.price,
                mileage: 50000,
                date: new Date()
            }
        });

        // Add Items
        await prisma.saleItem.create({
            data: {
                saleId: sale.id,
                workOrderId: wo.id,
                type: 'PRODUCT',
                description: oil.name,
                productId: oil.id,
                quantity: 1,
                unitPrice: oil.price,
                subtotal: oil.price
            }
        });

        await prisma.saleItem.create({
            data: {
                saleId: sale.id,
                workOrderId: wo.id,
                type: 'PRODUCT',
                description: filter.name,
                productId: filter.id,
                quantity: 1,
                unitPrice: filter.price,
                subtotal: filter.price
            }
        });

        console.log(`✅ Seeded history for ${plate}: Used ${oil.name}`);
    }
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
