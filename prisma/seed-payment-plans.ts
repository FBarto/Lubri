
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    const plans = [
        { name: '1 Cuota', installments: 1, interestRate: 12.0 },
        { name: '3 Cuotas', installments: 3, interestRate: 22.0 },
        { name: '6 Cuotas', installments: 6, interestRate: 34.0 },
    ];

    console.log('Seeding payment plans...');

    for (const plan of plans) {
        const existing = await prisma.paymentPlan.findFirst({
            where: { installments: plan.installments }
        });

        if (!existing) {
            await prisma.paymentPlan.create({
                data: plan
            });
            console.log(`Created plan: ${plan.name}`);
        } else {
            console.log(`Plan exists: ${plan.name}`);
        }
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
