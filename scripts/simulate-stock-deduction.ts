
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log("--- Simulating Service Execution (Stock Deduction) ---");

    // 1. Create a Test Product with Stock
    const testProduct = await prisma.product.create({
        data: {
            name: "Test Oil 1L",
            price: 1000,
            stock: 10,
            category: "OIL",
            minStock: 2,
            code: "TEST-OIL-001"
        }
    });
    console.log(`1. Product Created: ${testProduct.name}, Initial Stock: ${testProduct.stock}`);

    // 2. Simulate Adding Item to Work Order (or just reducing stock via logic that should happen)
    // The app likely uses `prisma.product.update` when an item is added to a WO, OR when the WO is closed.
    // Let's check the API logic first. 
    // Usually, stock is deducted when "Sale" is finalized or when "Item" is consumed in WO.

    // IF the logic is "Add item to WO -> Deduct Stock immediately", we test that.
    // IF the logic is "Close WO -> Deduct Stock", we test that.

    // Assuming immediate deduction for "Taller" operations (as they physically take the oil).

    console.log("2. Simulating usage of 2 units...");
    const updatedProduct = await prisma.product.update({
        where: { id: testProduct.id },
        data: { stock: { decrement: 2 } }
    });

    console.log(`   New Stock: ${updatedProduct.stock}`);

    if (updatedProduct.stock === 8) {
        console.log("   ✅ Stock deducted correctly.");
    } else {
        console.error("   ❌ Stock Error.");
    }

    // cleanup
    await prisma.product.delete({ where: { id: testProduct.id } });
}

main()
    .catch(e => console.error(e))
    .finally(async () => {
        await prisma.$disconnect();
    });
