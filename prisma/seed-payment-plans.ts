
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    const plans = [
        { name: '1 Cuota (Lista)', installments: 1, interestRate: 12.0 },
        { name: 'Cuota Simple 3', installments: 3, interestRate: 11.5 },
        { name: 'Cuota Simple 6', installments: 6, interestRate: 23.0 },
        { name: 'Cuota Simple 12', installments: 12, interestRate: 45.0 },
    ];

    console.log('Seeding payment plans...');

    for (const plan of plans) {
        const existing = await prisma.paymentPlan.findFirst({
            where: { installments: plan.installments }
        });

        if (existing) {
            await prisma.paymentPlan.update({
                where: { id: existing.id },
                data: {
                    name: plan.name,
                    interestRate: plan.interestRate
                }
            });
            console.log(`Updated plan: ${plan.name} (${plan.interestRate}%)`);
        } else {
            await prisma.paymentPlan.create({
                data: plan
            });
            console.log(`Created plan: ${plan.name}`);
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
