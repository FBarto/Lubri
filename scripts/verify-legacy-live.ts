
import { PrismaClient } from '@prisma/client';
import { createLegacyWorkOrder } from '../app/actions/business';

const prisma = new PrismaClient();

async function main() {
    console.log('--- STARTING LIVE VERIFICATION: LEGACY SERVICE LOADER ---');

    // 1. Setup Test Data (Client & Vehicle)
    console.log('1. Setting up Test Data...');
    const client = await prisma.client.upsert({
        where: { phone: '999999999' },
        update: {},
        create: { name: 'Test Legacy Client', phone: '999999999' }
    });

    const vehicle = await prisma.vehicle.upsert({
        where: { plate: 'LEGACY01' },
        update: { lastServiceDate: null, lastServiceMileage: 0 }, // Reset for test
        create: {
            plate: 'LEGACY01',
            brand: 'TestBrand',
            model: 'TestModel',
            clientId: client.id,
            mileage: 10000
        }
    });

    console.log(`   Vehicle ready: ${vehicle.plate} (ID: ${vehicle.id})`);

    // 2. Define Legacy Input
    const legacyDate = '2025-12-01'; // A date in the past relative to 2026-01-31 but "new" for the vehicle
    const legacyMileage = 50000;
    const input = {
        vehicleId: vehicle.id,
        clientId: client.id,
        date: legacyDate,
        mileage: legacyMileage,
        serviceDetails: {
            filters: { air: true, oil: true, fuel: false, cabin: true },
            oil: { type: 'SINTETICO', liters: 4, brand: 'Shell Helix' },
            notes: 'Verified via Script'
        }
    };

    // 3. Execute Action
    console.log('2. Executing createLegacyWorkOrder...');
    const result = await createLegacyWorkOrder(input);

    if (!result.success || !result.workOrder) {
        console.error('❌ Action Failed:', result.error);
        process.exit(1);
    }
    console.log('   Action returned success.');

    // 4. Verify Database State
    console.log('3. Verifying Database Sate...');

    // Check Work Order
    const wo = await prisma.workOrder.findUnique({
        where: { id: result.data?.workOrder?.id },
        include: { service: true }
    });

    if (!wo) throw new Error('WorkOrder not found in DB');

    console.log(`   [WorkOrder] ID: ${wo.id}`);
    console.log(`   [WorkOrder] Service Name: "${wo.service.name}"`);
    console.log(`   [WorkOrder] Status: ${wo.status}`);
    console.log(`   [WorkOrder] Price: ${wo.price}`);
    console.log(`   [WorkOrder] Details:`, JSON.stringify(wo.serviceDetails));

    if (wo.service.name !== 'Service Histórico Importado') console.error('   ❌ Wrong Service Name');
    else console.log('   ✅ Service Name Correct');

    if (wo.status !== 'COMPLETED') console.error('   ❌ Wrong Status');
    else console.log('   ✅ Status COMPLETED');

    if (wo.price !== 0) console.error('   ❌ Price is not 0');
    else console.log('   ✅ Price is 0 (No cash impact)');

    // Check Vehicle Update
    const updatedVehicle = await prisma.vehicle.findUnique({ where: { id: vehicle.id } });
    console.log(`   [Vehicle] Last Service Date: ${updatedVehicle?.lastServiceDate?.toISOString().split('T')[0]}`);
    console.log(`   [Vehicle] Last Service Mileage: ${updatedVehicle?.lastServiceMileage}`);

    const expectedDate = new Date(legacyDate).toISOString().split('T')[0];
    const actualDate = updatedVehicle?.lastServiceDate?.toISOString().split('T')[0];

    if (actualDate === expectedDate && updatedVehicle?.lastServiceMileage === legacyMileage) {
        console.log('   ✅ Vehicle Stats Updated Correctly');
    } else {
        console.error(`   ❌ Vehicle Stats Mismatch. Expected ${expectedDate}/${legacyMileage}, got ${actualDate}/${updatedVehicle?.lastServiceMileage}`);
    }

    // Check Audit Log
    const log = await prisma.auditLog.findFirst({
        where: {
            action: 'CREATE_LEGACY_WO',
            entityId: wo.id.toString()
        }
    });

    if (log) console.log('   ✅ Audit Log Record Found');
    else console.error('   ❌ Audit Log Record MISSING');

    console.log('--- VERIFICATION COMPLETE ---');
}

main()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
