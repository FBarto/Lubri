
import { prisma } from '../lib/prisma';

async function main() {
    const plate = 'ZXC123';
    console.log(`Seeding history for ${plate}...`);

    const vehicle = await prisma.vehicle.findFirst({
        where: { plate },
        include: { client: true }
    });

    if (!vehicle) {
        console.error('Vehicle not found!');
        return;
    }

    // 1. Create a Work Order from 3 months ago
    const service = await prisma.service.findFirst({ where: { active: true } });

    // Find some products
    const oil = await prisma.product.findFirst({ where: { category: { contains: 'ACEITE' } } });
    const filter = await prisma.product.findFirst({ where: { category: { contains: 'FILTRO' } } });

    if (!service || !oil) {
        console.log('Missing products/service');
        return;
    }

    console.log('Creating past service record...');

    // Create Sale first
    const sale = await prisma.sale.create({
        data: {
            clientId: vehicle.clientId,
            status: 'COMPLETED',
            total: 50000,
            paymentMethod: 'CASH',
            date: new Date('2025-10-15'), // Past date
            items: {
                create: [
                    {
                        type: 'PRODUCT',
                        description: oil.name,
                        productId: oil.id,
                        quantity: 4,
                        unitPrice: oil.price,
                        subtotal: oil.price * 4
                    },
                    {
                        type: 'PRODUCT',
                        description: filter ? filter.name : 'Filtro Aceite',
                        productId: filter ? filter.id : undefined,
                        quantity: 1,
                        unitPrice: filter ? filter.price : 10000,
                        subtotal: filter ? filter.price : 10000
                    }
                ]
            }
        }
    });

    // Create WorkOrder linked to Sale
    await prisma.workOrder.create({
        data: {
            clientId: vehicle.clientId,
            vehicleId: vehicle.id,
            serviceId: service.id,
            date: new Date('2025-10-15'),
            finishedAt: new Date('2025-10-15'),
            status: 'COMPLETED',
            mileage: (vehicle.mileage || 0) - 5000, // History mileage
            price: 50000,
            saleId: sale.id,
            notes: 'Service Completo realizado en Octubre'
        }
    });

    // Link items to WO correctly for the view
    await prisma.saleItem.updateMany({
        where: { saleId: sale.id },
        data: { workOrderId: undefined } // Just to be safe, logic usually needs manual link if not auto
    });
    // Actually the script I ran before `verify-full-system` showed we might need to manually link
    // let's do it properly:
    const wo = await prisma.workOrder.findFirst({ where: { saleId: sale.id } });
    if (wo) {
        await prisma.saleItem.updateMany({
            where: { saleId: sale.id },
            data: { workOrderId: wo.id }
        });
    }

    console.log('✅ History seeded successfully!');
}

main()
    .catch(console.error)
    .finally(async () => await prisma.$disconnect());
