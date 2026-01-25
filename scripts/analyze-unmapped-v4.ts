
import { mapLegacyProductCode } from '../app/lib/product-mapper';
import { prisma } from '../lib/prisma';
import { Prisma } from '@prisma/client';

async function analyzeUnmappedFinal() {
    console.log('🔍 Analyzing remaining unmapped items for 85% goal...\n');

    const workOrders = await prisma.workOrder.findMany({
        where: { serviceDetails: { not: Prisma.DbNull } },
        select: { serviceDetails: true }
    });

    const products = await prisma.product.findMany({ select: { code: true } });
    const validCodes = new Set(products.map(p => p.code).filter(Boolean));

    const totalItemsByCat: Record<string, Map<string, number>> = {
        OIL: new Map<string, number>(),
        OIL_FILTER: new Map<string, number>(),
        AIR_FILTER: new Map<string, number>(),
        FUEL_FILTER: new Map<string, number>(),
        CABIN_FILTER: new Map<string, number>()
    };

    for (const wo of workOrders) {
        const sd = wo.serviceDetails as any;
        if (!sd) continue;

        // Process Oil
        if (sd.oil?.type) {
            const desc = sd.oil.type.trim().toUpperCase();
            const mapped = mapLegacyProductCode(desc, 'ENGINE_OIL');
            if (!mapped || !validCodes.has(mapped)) {
                totalItemsByCat.OIL.set(desc, (totalItemsByCat.OIL.get(desc) || 0) + 1);
            }
        }

        // Process Filters
        if (sd.filters) {
            for (const [key, val] of Object.entries(sd.filters)) {
                if (!val) continue;
                const desc = (val as string).trim().toUpperCase();
                const cat = key === 'oil' ? 'OIL_FILTER' : key === 'air' ? 'AIR_FILTER' : key === 'fuel' ? 'FUEL_FILTER' : 'CABIN_FILTER';
                const mapped = mapLegacyProductCode(desc, cat);
                if (!mapped || !validCodes.has(mapped)) {
                    const catMap = totalItemsByCat[cat];
                    if (catMap) catMap.set(desc, (catMap.get(desc) || 0) + 1);
                }
            }
        }
    }

    const printTop = (title: string, map: Map<string, number>) => {
        console.log(`\n--- TOP REMAINING: ${title} ---`);
        const sorted = Array.from(map.entries()).sort((a, b) => b[1] - a[1]);
        sorted.slice(0, 20).forEach(([desc, count]) => {
            console.log(`${count.toString().padEnd(5)} | ${desc}`);
        });
    };

    printTop('Lubricants', totalItemsByCat.OIL);
    printTop('Oil Filters', totalItemsByCat.OIL_FILTER);
    printTop('Air Filters', totalItemsByCat.AIR_FILTER);
    printTop('Fuel Filters', totalItemsByCat.FUEL_FILTER);
    printTop('Cabin Filters', totalItemsByCat.CABIN_FILTER);
}

analyzeUnmappedFinal()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
