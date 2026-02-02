
import { PrismaClient } from '@prisma/client';
import { processSale } from '../app/actions/business';

const prisma = new PrismaClient();

async function main() {
    console.log("--- Simulating Card Payment with Surcharge ---");

    // 1. Find the "1 Cuota (Lista)" plan
    const plan = await prisma.paymentPlan.findFirst({
        where: { name: { contains: "1 Cuota" } } // adjusting match logic
    });

    if (!plan) {
        console.error("❌ Plan not found. Cannot test.");
        return;
    }
    console.log(`Plan found: ${plan.name} (${plan.interestRate}%)`);

    // 2. Prepare Sale Data
    // Base Amount: $1000
    // Expected Total: $1120 (if 12%)

    const baseAmount = 1000;
    const factor = 1 + (plan.interestRate / 100);
    const surchargeAmount = baseAmount * factor - baseAmount;

    console.log(`Base: ${baseAmount}, Factor: ${factor}, Exp Surcharge: ${surchargeAmount}`);

    const saleItems = [
        {
            type: 'PRODUCT' as const,
            description: "Test Item",
            quantity: 1,
            unitPrice: baseAmount // In the modal, items keep their price, surcharges are added as extra lines OR total is updated?
            // RestrictedPOS.tsx line 183: "Extract surcharges from payments and create virtual items for them"
            // So we mimic RestrictedPOS behavior here.
        },
        {
            type: 'SERVICE' as const,
            description: `Recargo Financiación (${plan.name})`,
            quantity: 1,
            unitPrice: surchargeAmount,
            // Virtual item for surcharge
        }
    ];

    // RestrictedPOS logic:
    // It creates items for base products.
    // AND it creates items for surcharges.
    // Total = Sum of all items.

    // So if I pass these items to processSale, the total should be correct.

    const result = await processSale({
        userId: 1,
        paymentMethod: `CARD (${plan.name})`,
        items: saleItems
    });

    if (result.success) {
        console.log(`Sale ID: ${result.data?.sale?.id}, Total: ${result.data?.sale?.total}`);
        if (Math.abs((result.data?.sale?.total || 0) - (baseAmount + surchargeAmount)) < 0.1) {
            console.log("✅ SUCCESS: Surcharge applied correctly in total.");
        } else {
            console.error(`❌ FAILURE: Expected ${baseAmount + surchargeAmount}, got ${result.data?.sale?.total}`);
        }
    } else {
        console.error("Sale failed", result.error);
    }
}

main()
    .catch(e => console.error(e))
    .finally(async () => {
        await prisma.$disconnect();
    });
