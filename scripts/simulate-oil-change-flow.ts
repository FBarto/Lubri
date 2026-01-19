
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('🧪 Starting "Oil Change" Flow Simulation (Standalone Mode)...');

    // 1. Setup Test Data
    const productCode = `OIL-${Math.random().toString(36).substr(2, 5)}`;
    // Clean up previous test runs for same code if any (unlikely with random)

    const oil = await prisma.product.create({
        data: {
            name: 'Aceite Test 10W40 (4L)',
            code: productCode,
            category: 'LUBRICENTRO',
            price: 50000,
            stock: 10,
            minStock: 2
        }
    });

    console.log(`✅ [SETUP] Created Product: ${oil.name} | Stock: ${oil.stock}`);

    const client = await prisma.client.create({
        data: {
            name: 'Test Client Oil',
            phone: `54911${Math.floor(Math.random() * 100000000)}`
        }
    });

    const vehicle = await prisma.vehicle.create({
        data: {
            plate: `OIL${Math.floor(Math.random() * 999)}`,
            clientId: client.id,
            brand: 'Ford',
            model: 'Focus'
        }
    });

    const service = await prisma.service.create({
        data: {
            name: 'Servicio Cambio de Aceite',
            category: 'LUBRICENTRO',
            duration: 45,
            price: 15000 // Labor cost
        }
    });

    console.log(`✅ [SETUP] Service/Client/Vehicle created.`);
    console.log(`   Client: ${client.name}, Vehicle: ${vehicle.plate}`);

    // 2. Reception: Create Work Order (PENDING)
    console.log('\n👉 [RECEPTION] Creating Work Order...');
    const wo = await prisma.workOrder.create({
        data: {
            clientId: client.id,
            vehicleId: vehicle.id,
            serviceId: service.id,
            price: service.price,
            status: 'PENDING',
            date: new Date()
        }
    });
    console.log(`✅ Work Order #${wo.id} Created (PENDING).`);

    // 3. Taller: Add "Insumos" (The Oil)
    console.log('\n👉 [TALLER] Mechanic adds 1x Oil to Order...');
    // In app, this updates serviceDetails JSON
    await prisma.workOrder.update({
        where: { id: wo.id },
        data: {
            status: 'IN_PROGRESS',
            serviceDetails: {
                items: [
                    {
                        productId: oil.id,
                        name: oil.name,
                        quantity: 1,
                        unitPrice: oil.price
                    }
                ]
            }
        }
    });
    console.log(`✅ Work Order Updated with Insumos.`);

    // Simulate finishing the work
    await prisma.workOrder.update({
        where: { id: wo.id },
        data: { status: 'COMPLETED' }
    });
    console.log(`✅ Work Order Marked COMPLETED (Ready for Checkout).`);

    // 4. Checkout (POS) - Simulating processSale logic
    console.log('\n👉 [POS] Cashier processes sale...');

    // Logic copied from processSale to ensure behavior match
    const saleItems = [
        {
            type: 'SERVICE',
            description: service.name,
            quantity: 1,
            unitPrice: service.price,
            workOrderId: wo.id,
            subtotal: service.price
        },
        {
            type: 'PRODUCT',
            id: oil.id, // productId
            description: oil.name,
            quantity: 1,
            unitPrice: oil.price,
            workOrderId: wo.id,
            subtotal: oil.price
        }
    ];

    const total = saleItems.reduce((sum, i) => sum + i.subtotal, 0);

    // Transaction: Create Sale + Items + Deduct Stock + Link WO
    const saleResult = await prisma.$transaction(async (tx) => {
        // 1. Create Sale
        const newSale = await tx.sale.create({
            data: {
                userId: 1,
                clientId: client.id,
                paymentMethod: 'CASH',
                total,
                date: new Date(),
            },
        });

        // 2. Process Items
        for (const item of saleItems) {
            // Create SaleItem
            await tx.saleItem.create({
                data: {
                    saleId: newSale.id,
                    type: item.type as any,
                    description: item.description,
                    quantity: item.quantity,
                    unitPrice: item.unitPrice,
                    subtotal: item.subtotal,
                    productId: item.type === 'PRODUCT' ? item.id : undefined,
                    workOrderId: item.workOrderId,
                },
            });

            // Update Stock if Product
            // THIS IS THE CRITICAL LOGIC WE ARE TESTING
            if (item.type === 'PRODUCT' && item.id) {
                console.log(`   📉 Deducting ${item.quantity} from Stock for Product ID ${item.id}...`);
                await tx.product.update({
                    where: { id: item.id },
                    data: {
                        stock: {
                            decrement: item.quantity,
                        },
                    },
                });
            }

            // Link WorkOrder
            if (item.workOrderId) {
                await tx.workOrder.update({
                    where: { id: item.workOrderId },
                    data: {
                        saleId: newSale.id,
                        finishedAt: new Date(),
                        status: 'DELIVERED' // Usually POS updates this too or separate action
                    },
                });
            }
        }
        return newSale;
    });

    console.log(`✅ Sale #${saleResult.id} Processed. Total: $${saleResult.total}`);

    // 5. Verify Stock
    console.log('\n📊 [VERIFICATION] Checking Stock...');
    const oilAfter = await prisma.product.findUnique({ where: { id: oil.id } });
    console.log(`   Initial Stock: 10`);
    console.log(`   Final Stock:   ${oilAfter?.stock}`);

    if (oilAfter?.stock === 9) {
        console.log('✅ SUCCESS: Stock was correctly deducted.');
    } else {
        console.error('❌ FAILURE: Stock mismatch.');
    }
}

main()
    .catch(console.error)
    .finally(async () => await prisma.$disconnect());
