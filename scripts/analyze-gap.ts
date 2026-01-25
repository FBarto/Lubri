
import { mapLegacyProductCode } from '../app/lib/product-mapper';
import { prisma } from '../lib/prisma';
import { Prisma } from '@prisma/client';

async function analyzeRemainingGap() {
    console.log('🔍 Analyzing REMAINING 0.52% Gap...\n');

    const workOrders = await prisma.workOrder.findMany({
        where: { serviceDetails: { not: Prisma.DbNull } },
        select: { serviceDetails: true }
    });

    const products = await prisma.product.findMany({ select: { code: true } });
    const validCodes = new Set(products.map(p => p.code).filter(Boolean));

    const unmappedByCategory: Record<string, Map<string, number>> = {
        OIL: new Map(),
        OIL_FILTER: new Map(),
        AIR_FILTER: new Map(),
        FUEL_FILTER: new Map(),
        CABIN_FILTER: new Map()
    };

    for (const wo of workOrders) {
        const sd = wo.serviceDetails as any;
        if (!sd) continue;

        if (sd.oil?.type) {
            const desc = sd.oil.type.trim().toUpperCase();
            const mapped = mapLegacyProductCode(desc, 'ENGINE_OIL');
            if (!mapped || !validCodes.has(mapped)) {
                unmappedByCategory.OIL.set(desc, (unmappedByCategory.OIL.get(desc) || 0) + 1);
            }
        }

        if (sd.filters) {
            for (const [key, val] of Object.entries(sd.filters)) {
                if (!val) continue;
                const desc = (val as string).trim().toUpperCase();
                const cat = key === 'oil' ? 'OIL_FILTER' : key === 'air' ? 'AIR_FILTER' : key === 'fuel' ? 'FUEL_FILTER' : 'CABIN_FILTER';
                const mapped = mapLegacyProductCode(desc, cat);
                if (!mapped || !validCodes.has(mapped)) {
                    unmappedByCategory[cat].set(desc, (unmappedByCategory[cat].get(desc) || 0) + 1);
                }
            }
        }
    }

    console.log('--- TOP 5 REMAINING UNMAPPED BY CATEGORY ---\n');
    for (const [category, map] of Object.entries(unmappedByCategory)) {
        console.log(`${category}:`);
        const sorted = Array.from(map.entries()).sort((a, b) => b[1] - a[1]);
        sorted.slice(0, 5).forEach(([desc, count]) => {
            console.log(`  ${count.toString().padStart(3)} x ${desc}`);
        });
        console.log('');
    }
}

analyzeRemainingGap()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
