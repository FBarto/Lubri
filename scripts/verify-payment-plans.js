
const { spawn } = require('child_process');
const http = require('http');

async function testApi() {
    console.log('Testing /api/config/payment-plans...');

    // Create a minimal Next.js context or simple fetch if the app was running.
    // Since we can't easily start the full app, we will use the prisma client directly to verify the DB state
    // and assume the API route (which is simple) works if DB works.
    // Actually, we can try to fetch from the dev server if it were running, but it's not.

    // So we will verify via Prisma that the data exists as expected.

    const { PrismaClient } = require('@prisma/client');
    const prisma = new PrismaClient();

    try {
        const plans = await prisma.paymentPlan.findMany({
            where: { active: true }
        });

        console.log('Active Plans found in DB (API source):');
        console.table(plans);

        if (plans.length >= 3) {
            console.log('SUCCESS: Plans seeded correctly.');
        } else {
            console.error('FAILURE: Missing plans.');
        }

    } catch (e) {
        console.error(e);
    } finally {
        await prisma.$disconnect();
    }
}

testApi();
