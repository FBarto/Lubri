
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('🧪 Starting Smart Booking Verification...\n');

    // 1. Setup Test Data
    const testPlate = 'TEST999';
    try {
        // Clean up previous run
        await prisma.vehicle.deleteMany({ where: { plate: testPlate } });
        await prisma.service.deleteMany({ where: { name: { in: ['Service Moto Test', 'Service Auto Test'] } } });

        // Create Client
        const client = await prisma.client.upsert({
            where: { phone: '+5491122334455' },
            update: {},
            create: { name: 'Test User', phone: '+5491122334455' }
        });

        // Create Vehicle (MOTO)
        const moto = await prisma.vehicle.create({
            data: {
                plate: testPlate,
                brand: 'Honda',
                model: 'Wave',
                type: 'MOTO',
                clientId: client.id
            }
        });
        console.log(`✅ Created Test Vehicle: ${moto.brand} ${moto.model} (${moto.type}) - Plate: ${moto.plate}`);

        // Create Services
        await prisma.service.create({
            data: { name: 'Service Moto Test', category: 'MOTO', price: 5000, duration: 30 }
        });
        await prisma.service.create({
            data: { name: 'Service Auto Test', category: 'AUTO', price: 10000, duration: 60 }
        });
        console.log('✅ Created Test Services (Moto vs Auto)');

        // 2. Simulate API Lookup (GET /api/vehicles/lookup?plate=TEST999)
        console.log('\n🔍 Simulating Plate Lookup...');
        const foundVehicle = await prisma.vehicle.findUnique({
            where: { plate: testPlate },
            include: { client: true }
        });

        if (foundVehicle && foundVehicle.model === 'Wave') {
            console.log(`✅ Lookup Success! Found: ${foundVehicle.brand} ${foundVehicle.model}`);
            console.log(`   Owner: ${foundVehicle.client.name}, Phone: ${foundVehicle.client.phone}`);
        } else {
            console.error('❌ Lookup Failed.');
        }

        // 3. Simulate Service Filtering Logic
        console.log('\n🛡️  Testing Filtering Logic...');
        const allServices = await prisma.service.findMany({
            where: { name: { in: ['Service Moto Test', 'Service Auto Test'] } }
        });

        const vType = foundVehicle?.type?.toUpperCase() || '';

        console.log(`   Vehicle Type: ${vType}`);

        const filtered = allServices.filter(s => {
            const sCat = s.category.toUpperCase();
            if (vType === 'AUTO' && sCat === 'MOTO') return false;
            if (vType === 'MOTO' && sCat === 'AUTO') return false;
            return true;
        });

        console.log('   Available Services:');
        filtered.forEach(s => console.log(`   - ${s.name} (${s.category})`));

        if (filtered.length === 1 && filtered[0].category === 'MOTO') {
            console.log('\n✨ SUCCESS: Auto-Service Filter worked correclty (Auto services hidden for Moto).');
        } else {
            console.error('\n❌ FAILURE: Filtering logic incorrect.');
        }

    } catch (e) {
        console.error(e);
    } finally {
        await prisma.$disconnect();
    }
}

main();
