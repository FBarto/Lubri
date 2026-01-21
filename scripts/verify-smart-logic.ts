
import { PrismaClient } from '@prisma/client';
import { suggestServiceItems } from '../app/lib/smart-actions';

const prisma = new PrismaClient();

async function main() {
    console.log('🧠 Verification: Running Smart Budget Logic...');

    // 1. Find our Test Vehicle
    const vehicle = await prisma.vehicle.findUnique({ where: { plate: 'TEST-999' } });

    if (!vehicle) {
        console.error('❌ Test Vehicle not found. Run seed script first.');
        return;
    }

    console.log(`🚗 Analyzing Vehicle: ${vehicle.brand} ${vehicle.model} (${vehicle.plate})`);

    // 2. Ask the "Brain" for suggestions
    console.log('✨ Triggering Magic Wand...');
    const result = await suggestServiceItems(vehicle.id);

    // 3. Output Result
    if (result.success) {
        console.log(`✅ SUCCESS! Method Used: ${result.method}`);
        console.log('📋 Suggested Items:');
        result.items?.forEach((item: any) => {
            console.log(`   - 🔧 ${item.name} ($${item.price}) x${item.quantity}`);
        });

        if (result.items && result.items.length > 0) {
            console.log('\n🎉 Verification PASSED: The system correctly recalled the history.');
        } else {
            console.error('❌ Verification FAILED: No items returned.');
        }

    } else {
        console.error('❌ Verification FAILED:', result.error);
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
