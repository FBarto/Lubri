
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log("Seeding Smart Quote Test Data...");

    // 1. Create Products
    const oil = await prisma.product.upsert({
        where: { code: 'ELAION-F50' },
        update: { stock: 100, price: 15000 },
        create: {
            name: 'Aceite Elaion F50 5W30 (Envase)',
            code: 'ELAION-F50',
            category: 'Lubricantes',
            price: 15000,
            stock: 100,
            active: true
        }
    });

    const filterOil = await prisma.product.upsert({
        where: { code: 'AMPI-1257' },
        update: { stock: 50, price: 8500 },
        create: {
            name: 'Filtro Aceite AMPI 1257',
            code: 'AMPI-1257',
            category: 'Filtros',
            price: 8500,
            stock: 50,
            active: true
        }
    });

    // Item without stock for testing alerts
    const filterAir = await prisma.product.upsert({
        where: { code: 'AMPI-842' },
        update: { stock: 0 }, // NO STOCK
        create: {
            name: 'Filtro Aire AMPI 842',
            code: 'AMPI-842',
            category: 'Filtros',
            price: 6200,
            stock: 0,
            active: true
        }
    });

    // 2. Create Client & Vehicle
    const client = await prisma.client.upsert({
        where: { phone: '111222333' },
        update: {},
        create: {
            name: 'Tester SmartQuote',
            phone: '111222333'
        }
    });

    const vehicle = await prisma.vehicle.upsert({
        where: { plate: 'TEST999' },
        update: { clientId: client.id },
        create: {
            plate: 'TEST999',
            brand: 'Ford',
            model: 'Focus III',
            clientId: client.id,
            type: 'CAR'
        }
    });

    // 3. Create Past History (WorkOrder)
    const existingWO = await prisma.workOrder.findFirst({
        where: { vehicleId: vehicle.id, status: 'COMPLETED' }
    });

    if (!existingWO) {
        // Create Sale first (since SaleItem needs it)
        const sale = await prisma.sale.create({
            data: {
                total: 60000,
                paymentMethod: 'CASH',
                clientId: client.id,
                date: new Date(Date.now() - 1000 * 60 * 60 * 24 * 180),
            }
        });

        // Create WorkOrder linked to Sale
        const wo = await prisma.workOrder.create({
            data: {
                vehicleId: vehicle.id,
                clientId: client.id,
                status: 'COMPLETED',
                date: new Date(Date.now() - 1000 * 60 * 60 * 24 * 180), // 6 months ago
                mileage: 50000,
                price: 60000,
                serviceId: 1,
                saleId: sale.id, // Linked Sale
                serviceDetails: {
                    oil: { type: '5W30 Synthetic' }
                }
            }
        });

        // Create SaleItems linked to both Sale and WorkOrder
        await prisma.saleItem.createMany({
            data: [
                {
                    saleId: sale.id,
                    workOrderId: wo.id,
                    description: 'Aceite Elaion F50 5W30 (Envase)',
                    quantity: 4,
                    unitPrice: 12000,
                    subtotal: 48000,
                    type: 'PRODUCT',
                    productId: oil.id
                },
                {
                    saleId: sale.id,
                    workOrderId: wo.id,
                    description: 'Filtro Aceite AMPI 1257',
                    quantity: 1,
                    unitPrice: 7000,
                    subtotal: 7000,
                    type: 'PRODUCT',
                    productId: filterOil.id
                },
                {
                    saleId: sale.id,
                    workOrderId: wo.id,
                    description: 'Filtro Aire AMPI 842',
                    quantity: 1,
                    unitPrice: 5000,
                    subtotal: 5000,
                    type: 'PRODUCT',
                    productId: filterAir.id
                }
            ]
        });

        console.log("Created History WorkOrder ID:", wo.id);
    }

    console.log("Test Data Ready. Vehicle Plate: TEST999");
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
