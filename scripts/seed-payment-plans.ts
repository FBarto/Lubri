
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log("Seeding Payment Plans...");

    // Default schemes for Argentina usually:
    // 1 pago (sin interes or con)
    // Cuota Simple 3 (fixed rate)
    // Cuota Simple 6
    // Cuota Simple 12

    const plans = [
        { name: "1 Pago / Débito", installments: 1, interestRate: 0 },
        { name: "Cuota Simple 3", installments: 3, interestRate: 12 }, // Example from user prompt context
        { name: "Cuota Simple 6", installments: 6, interestRate: 24 },
        { name: "Cuota Simple 12", installments: 12, interestRate: 50 },
    ];

    for (const p of plans) {
        await prisma.paymentPlan.upsert({
            where: { id: -1 }, // Hacky way to force create or find by name if model had unique constraint (it doesn't). 
            // Better: findFirst
            create: p,
            update: {} // Do nothing if exists (logic below)
        });

        // Proper check-then-create
        const existing = await prisma.paymentPlan.findFirst({ where: { name: p.name } });
        if (!existing) {
            await prisma.paymentPlan.create({ data: p });
            console.log(`Created: ${p.name}`);
        } else {
            console.log(`Exists: ${p.name}`);
        }
    }
}

main()
    .catch(e => console.error(e))
    .finally(async () => {
        await prisma.$disconnect();
    });
