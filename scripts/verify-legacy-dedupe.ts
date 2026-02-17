
import { createLegacyWorkOrder } from '../app/actions/business';
import { prisma } from '../lib/prisma';

async function verifyLegacyDedupe() {
    console.log('🧪 Starting Legacy Dedupe Verification...');

    // 1. Setup: Create a dummy client and vehicle
    const client = await prisma.client.create({
        data: {
            name: 'Test Legacy Client',
            phone: '9999999999'
        }
    });

    const vehicle = await prisma.vehicle.create({
        data: {
            plate: 'TEST-LEGACY-' + Date.now(),
            model: 'Test Model',
            clientId: client.id
        }
    });

    console.log(`✅ Setup complete: Vehicle ID ${vehicle.id}, Client ID ${client.id}`);

    // 2. First Import (Should Success)
    const date = '2023-01-01';
    console.log(`\n🔹 Attempting 1st Import for date ${date}...`);

    const res1 = await createLegacyWorkOrder({
        vehicleId: vehicle.id,
        clientId: client.id,
        date: date,
        mileage: 50000,
        serviceDetails: { notes: 'First import' }
    });

    if (res1.success && !res1.skipped && res1.data) {
        console.log(`✅ 1st Import Successful. WO ID: ${res1.data.id}`);
    } else {
        console.error('❌ 1st Import Failed!', res1);
        process.exit(1);
    }

    // 3. Second Import (Should Skip)
    console.log(`\n🔹 Attempting 2nd Import (Duplicate) for date ${date}...`);

    const res2 = await createLegacyWorkOrder({
        vehicleId: vehicle.id,
        clientId: client.id,
        date: date,
        mileage: 50000,
        serviceDetails: { notes: 'Duplicate attempt' }
    });

    if (res2.success && res2.skipped && res2.data) {
        console.log(`✅ 2nd Import correctly SKIPPED. Returned existing WO ID: ${res2.data.id}`);

        if (res2.data.id === res1.data.id) {
            console.log('✅ IDs match.');
        } else {
            console.error('❌ IDs do not match (Logic error?)');
        }

    } else {
        console.error('❌ 2nd Import Failed to detect duplicate!', res2);
    }

    // 4. Third Import (Different Date - Should Success)
    const date2 = '2023-02-01';
    console.log(`\n🔹 Attempting 3rd Import (Different Date) for date ${date2}...`);

    const res3 = await createLegacyWorkOrder({
        vehicleId: vehicle.id,
        clientId: client.id,
        date: date2,
        mileage: 51000,
        serviceDetails: { notes: 'New import' }
    });

    if (res3.success && !res3.skipped) {
        console.log(`✅ 3rd Import Successful (New Date). WO ID: ${res3.data.id}`);
    } else {
        console.error('❌ 3rd Import Failed!', res3);
    }

    // Cleanup
    console.log('\n🧹 Cleaning up test data...');
    await prisma.workOrder.deleteMany({ where: { vehicleId: vehicle.id } });
    await prisma.vehicle.delete({ where: { id: vehicle.id } });
    await prisma.client.delete({ where: { id: client.id } });
    console.log('✅ Cleanup complete.');
}

verifyLegacyDedupe()
    .catch(e => console.error(e))
    .finally(() => prisma.$disconnect());
