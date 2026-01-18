
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    const plans = await prisma.paymentPlan.findMany();
    console.log("Payment Plans Found:", plans.length);
    plans.forEach(p => {
        console.log(`- ${p.name}: ${p.installments} cuotas, ${p.interestRate}% interés (Activo: ${p.active})`);
    });

    if (plans.length === 0) {
        console.log("No payment plans found. You should seed them.");
    }
}

main()
    .catch(e => console.error(e))
    .finally(async () => {
        await prisma.$disconnect();
    });
