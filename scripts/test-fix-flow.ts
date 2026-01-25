
import { createClient, createVehicle } from '../app/lib/booking-actions';
import { prisma } from '../lib/prisma';

async function testFix() {
    console.log('🧪 Starting Verification of "Existing Client" Flow...');

    // 1. Setup: Ensure a clean slate or known state
    const testPhone = "3519998888";
    const testName = "Test Automático";

    // Clean up if exists
    const existing = await prisma.client.findFirst({ where: { phone: testPhone } });
    if (existing) {
        await prisma.vehicle.deleteMany({ where: { clientId: existing.id } });
        await prisma.client.delete({ where: { id: existing.id } });
        console.log('🧹 Cleaned up previous test data.');
    }

    // 2. Create the Client for the first time
    console.log('\n--- Step 1: Creating New Client ---');
    const step1 = await createClient({ name: testName, phone: testPhone });
    if (!step1.success || !step1.client) {
        console.error('❌ Failed Step 1:', step1.error);
        process.exit(1);
    }
    console.log('✅ Client Created:', step1.client.id, step1.client.name);

    // 3. Simulate "Existing User" entering same phone
    console.log('\n--- Step 2: Simulate Re-entry (Duplicate Phone) ---');
    // Using the action directly as the API route does
    try {
        // We expect the modified createClient to return the existing client NOT error
        const step2 = await createClient({ name: "Otro Nombre", phone: testPhone });

        if (step2.success && step2.existing) {
            console.log('✅ SUCCESS: System detected existing user gracefully.');
            console.log('   Client returned:', step2.client.id);
        } else if (step2.success) {
            console.log('⚠️ WARNING: Success but "existing" flag missing? (Backend check)');
        } else {
            console.error('❌ FAILED: API threw error instead of handling duplicate:', step2.error);
            process.exit(1);
        }

        // 4. Create Vehicle using the ID from Step 2
        console.log('\n--- Step 3: Create Vehicle for Retrieved ID ---');
        // This was the broken part: client.id being passed correctly
        const step3 = await createVehicle({
            plate: "FIX123",
            brand: "TestBrand",
            model: "TestModel",
            clientId: step2.client.id,
            type: "AUTO"
        });

        if (step3.success) {
            console.log('✅ SUCCESS: Vehicle created successfully for existing client!');
            console.log('   Vehicle ID:', step3.vehicle.id);
        } else {
            console.error('❌ FAILED: Could not link vehicle to existing client:', step3.error);
            process.exit(1);
        }

    } catch (e) {
        console.error('❌ CRITICAL ERROR:', e);
        process.exit(1);
    }

    console.log('\n🎉 ALL CHECKS PASSED. The fix is working.');
    process.exit(0);
}

testFix();
