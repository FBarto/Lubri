
import { PrismaClient } from '@prisma/client';
import { suggestServiceEstimate } from '../app/lib/maintenance-actions';

// Mock server-only context if needed (usually fine in scripts if no headers/cookies used)
const prisma = new PrismaClient();

async function main() {
    console.log('🧠 Testing Smart Quote Logic...');

    // 1. Find a migrated vehicle with WorkOrders
    const vehicle = await prisma.vehicle.findFirst({
        where: {
            workOrders: { some: {} }
        },
        include: {
            workOrders: {
                orderBy: { date: 'desc' },
                take: 1
            }
        }
    });

    if (!vehicle) {
        console.error('❌ No vehicle with history found!');
        return;
    }

    console.log(`🚗 Found Vehicle: ${vehicle.plate} (${vehicle.brand} ${vehicle.model})`);
    console.log(`   Last Service Date: ${vehicle.workOrders[0]?.date}`);

    // 2. Call the Logic
    console.log('\n🔮 Asking AI/Logic for suggestion...');
    const result = await suggestServiceEstimate(vehicle.id, 'FULL');

    if (result.success && result.data) {
        console.log('✅ Suggestion Successful!');
        console.log('   Source:', result.data.source);
        console.log('   Items Suggested:');
        result.data.items.forEach((item: any) => {
            console.log(`   - [${item.determinedCategory}] ${item.name} (Qty: ${item.quantity}) ${item.estimate ? '(Estimate)' : ''}`);
        });
    } else {
        console.error('❌ Suggestion Failed:', result.error);
    }
}

main()
    .catch(console.error)
    .finally(async () => await prisma.$disconnect());
