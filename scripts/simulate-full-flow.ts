
import { PrismaClient } from '@prisma/client';
import { processSale } from '../app/actions/business';

const prisma = new PrismaClient();

async function main() {
    console.log("--- Simulating Full Business Flow ---");

    // 1. Setup: Create Product, Client, Service
    const rndProd = Math.floor(Math.random() * 10000);
    const product = await prisma.product.create({
        data: { name: `Full Flow Oil ${rndProd}`, price: 2000, stock: 10, category: "OIL", code: `FF-OIL-${rndProd}` }
    });
    const rnd = Math.floor(Math.random() * 10000);
    const client = await prisma.client.create({
        data: { name: `Full Flow Client ${rnd}`, phone: `111222${rnd}` }
    });
    const vehicle = await prisma.vehicle.create({
        data: { plate: `FLOW${rnd}`, brand: "Test", model: "Car", clientId: client.id }
    });
    const service = await prisma.service.create({
        data: { name: "Full Service", category: "LUBRICENTRO", duration: 30, price: 5000, active: true }
    });

    console.log("1. Setup Done. Product Stock:", product.stock);

    // 2. Create Work Order (Reception)
    const workOrder = await prisma.workOrder.create({
        data: {
            clientId: client.id,
            vehicleId: vehicle.id,
            serviceId: service.id,
            price: service.price,
            status: 'PENDING'
        }
    });
    console.log("2. Work Order Created:", workOrder.id);

    // 3. Edit Service (Add Item) - Simulating EditWorkOrderModal
    // We update serviceDetails in DB
    const serviceDetails = {
        items: [
            { productId: product.id, name: product.name, quantity: 2, unitPrice: product.price }
        ]
    };

    await prisma.workOrder.update({
        where: { id: workOrder.id },
        data: { serviceDetails }
    });
    console.log("3. Service Details Updated (Added 2 units of Oil)");

    // 4. Pass to Checkout & Pay (Simulating RestrictedPOS -> processSale)
    // We construct the payload that RestrictedPOS would send
    const saleItems = [
        {
            type: 'SERVICE' as const,
            description: service.name,
            quantity: 1,
            unitPrice: service.price,
            workOrderId: workOrder.id
        },
        {
            type: 'PRODUCT' as const,
            id: product.id,
            description: product.name,
            quantity: 2,
            unitPrice: product.price,
            workOrderId: workOrder.id
        }
    ];

    const saleResult = await processSale({
        userId: 1, // System/Admin
        clientId: client.id,
        paymentMethod: 'CASH',
        items: saleItems
    });

    if (saleResult.success) {
        console.log("4. Sale Processed Successfully:", saleResult.data?.sale?.id);

        // 5. Verify Stock Deduction
        const updatedProduct = await prisma.product.findUnique({ where: { id: product.id } });
        console.log(`5. Final Stock: ${updatedProduct?.stock} (Expected 8)`);

        if (updatedProduct?.stock === 8) {
            console.log("✅ SUCCESS: Stock deducted correctly from POS transaction.");
        } else {
            console.error("❌ FAILURE: Stock not deducted correctly.");
        }
    } else {
        console.error("❌ Sale Failed:", saleResult.error);
    }

    // Cleanup
    // ... cleanup logic omitted for brevity, using test DB usually cleans itself or we leave junk in dev
    await prisma.product.delete({ where: { id: product.id } }); // Minimal cleanup
    await prisma.client.delete({ where: { id: client.id } });
}

main()
    .catch(e => console.error(e))
    .finally(async () => {
        await prisma.$disconnect();
    });
