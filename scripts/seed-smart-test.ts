
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('🌱 Seeding Smart Budget Test Data...');

    // 1. Create a Product (Oil)
    let oil = await prisma.product.findFirst({ where: { name: 'Aceite Sintético 5W30' } });
    if (!oil) {
        oil = await prisma.product.create({
            data: {
                name: 'Aceite Sintético 5W30',
                category: 'ENGINE_OIL',
                price: 15000,
                stock: 100,
                active: true
            }
        });
        console.log('Created Oil:', oil.name);
    }

    // 2. Create a Product (Filter)
    let filter = await prisma.product.findFirst({ where: { name: 'Filtro Aceite WO-200' } });
    if (!filter) {
        filter = await prisma.product.create({
            data: {
                name: 'Filtro Aceite WO-200',
                category: 'OIL_FILTER',
                price: 8500,
                stock: 50,
                active: true
            }
        });
        console.log('Created Filter:', filter.name);
    }

    // 3. Create Client & Vehicle
    let client = await prisma.client.findUnique({ where: { phone: '5491112345678' } });
    if (!client) {
        client = await prisma.client.create({
            data: {
                name: 'Tester AI',
                phone: '5491112345678',
            }
        });
    }

    const plate = 'TEST-999';
    let vehicle = await prisma.vehicle.findUnique({ where: { plate } });
    if (!vehicle) {
        vehicle = await prisma.vehicle.create({
            data: {
                plate,
                brand: 'Ford',
                model: 'Focus',
                year: 2020,
                clientId: client.id
            }
        });
        console.log('Created Vehicle:', vehicle.plate);
    } else {
        console.log('Vehicle exists:', vehicle.plate);
    }

    // 4. Create History (A past Work Order)
    // We need a service first
    const service = await prisma.service.findFirst({ where: { active: true } }) || await prisma.service.create({
        data: { name: 'Cambio de Aceite', category: 'OIL', duration: 30, price: 5000 }
    });

    // Create a COMPLETED work order from 3 months ago
    const sale = await prisma.sale.create({
        data: { total: 23500, paymentMethod: 'CASH', date: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000) }
    });

    const wo = await prisma.workOrder.create({
        data: {
            clientId: client.id,
            vehicleId: vehicle.id,
            serviceId: service.id,
            status: 'COMPLETED',
            price: 23500,
            mileage: 50000,
            saleId: sale.id,
            date: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000) // 3 months ago
        }
    });

    // Create items for that Work Order
    // IMPORTANT: The Smart Budget logic looks at SaleItems linked to the WorkOrder.
    await prisma.saleItem.create({
        data: {
            saleId: sale.id,
            workOrderId: wo.id,
            type: 'PRODUCT',
            description: oil!.name,
            quantity: 4,
            unitPrice: oil!.price,
            subtotal: oil!.price * 4,
            productId: oil!.id
        }
    });

    await prisma.saleItem.create({
        data: {
            saleId: sale.id,
            workOrderId: wo.id,
            type: 'PRODUCT',
            description: filter!.name,
            quantity: 1,
            unitPrice: filter!.price,
            subtotal: filter!.price,
            productId: filter!.id
        }
    });

    console.log('✅ History Seeded: WorkOrder', wo.id, 'with Oil & Filter');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
