
import { performance } from 'perf_hooks';
import { getClientDataByToken } from '../app/actions/portal';
import { prisma } from '../lib/prisma';

async function main() {
    console.log('BENCHMARK: Portal Data Load');

    // 1. Get a valid token
    const tokenObj = await prisma.whatsAppToken.findFirst({
        where: { action: 'ACCESS' }
    });

    if (!tokenObj) {
        console.log('No token found');
        return;
    }

    const start = performance.now();
    const result = await getClientDataByToken(tokenObj.token);
    const end = performance.now();

    if (result.success) {
        console.log(`✅ Success!`);
        console.log(`Time to load data (Server Side): ${(end - start).toFixed(2)} ms`);
        console.log(`Data size: ${JSON.stringify(result).length} bytes`);
    } else {
        console.error('Failed');
    }
}

main()
    .finally(() => prisma.$disconnect());
