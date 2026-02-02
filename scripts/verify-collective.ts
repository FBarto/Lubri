
import { PrismaClient } from '@prisma/client';
import { suggestServiceItems } from '../app/actions/smart';

const prisma = new PrismaClient();

async function main() {
    console.log('🧠 Verification: Testing Collective Intelligence...');

    // 1. Create a NEW Client & Vehicle (No History)
    // But same model as our seeded "TEST-999" (Ford Focus)
    const plate = 'NEW-User-001';
    let vehicle = await prisma.vehicle.findUnique({ where: { plate } });

    if (!vehicle) {
        const client = await prisma.client.findFirst() || await prisma.client.create({ data: { name: 'New User', phone: '000' } });
        vehicle = await prisma.vehicle.create({
            data: {
                plate,
                brand: 'Ford',
                model: 'Focus', // Matches the one that has history (TEST-999)
                year: 2022,
                clientId: client.id
            }
        });
        console.log('🆕 Created Virgin Vehicle:', vehicle.plate);
    } else {
        console.log('ℹ️ Using existing virgin vehicle:', vehicle.plate);
    }

    // 2. Clear any history for this specific vehicle to be sure
    await prisma.workOrder.deleteMany({ where: { vehicleId: vehicle.id } });

    // 3. Trigger Smart Suggestion
    console.log('✨ Triggering Magic Wand on NEW vehicle...');
    const result = await suggestServiceItems(vehicle.id);

    // 4. Validate Resulst
    if (result.success && result.data) {
        console.log(`✅ SUCCESS! Method Used: ${result.data.method}`);

        if (result.data.method === 'COLLECTIVE_INTELLIGENCE') {
            console.log('🎉 CORRECT: System used collective intelligence from other Ford Focus!');
        } else {
            console.log(`⚠️ Expected COLLECTIVE_INTELLIGENCE, got ${result.data.method}`);
        }

        console.log('📋 Suggested Items:');
        result.data.items?.forEach((item: any) => {
            console.log(`   - 🔧 ${item.name} ($${item.price})`);
        });

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
