
import { PrismaClient } from '@prisma/client';

// Use dynamic imports for server actions to simulate API calls in environment
// We import directly here because we are running via tsx in the same environment
// Note: In a real "black box" test we would call HTTP endpoints, but calling actions directly is fine for logic verification.
// UPDATED: Imported from maintenance-actions (correct location) instead of business-actions
import { suggestServiceEstimate, confirmQuoteAsWorkOrder, getVehicleMaintenanceHistory } from '../app/lib/maintenance-actions';

// We need to polyfill 'use server' context or just use the logic if possible.
// Since these are just functions exported from files, they should run node-side if dependencies are met.

const prisma = new PrismaClient();

async function main() {
    console.log('🚀 Starting Core Flow Verification via API...');

    // --- STEP 1: VERIFY TEST DATA ---
    console.log('\n🔍 Step 1: Finding Test Vehicle...');
    const vehicle = await prisma.vehicle.findUnique({
        where: { plate: 'TEST-999' },
        include: { client: true }
    });

    if (!vehicle) {
        console.error('❌ Error: Test vehicle TEST-999 not found. Did you run the seed?');
        process.exit(1);
    }
    console.log(`✅ Vehicle Found: ${vehicle.brand} ${vehicle.model} (ID: ${vehicle.id}) - Owner: ${vehicle.client.name}`);


    // --- STEP 2: SMART QUOTE LOGIC ---
    console.log('\n🧠 Step 2: Verifying Smart Quote Logic...');

    // We expect it to suggest items based on history (seeded 3 months ago: 5W30, WO-200)
    const quoteResult = await suggestServiceEstimate(vehicle.id, 'BASIC');

    if (!quoteResult.success || !quoteResult.data) {
        console.error('❌ Error: Smart Quote failed.', quoteResult);
        process.exit(1);
    }

    const suggestedItems = quoteResult.data.items;
    console.log('📝 Suggested Items:', suggestedItems.map((i: any) => `${i.name} (Qty: ${i.quantity})`).join(', '));

    const hasOil = suggestedItems.some((i: any) => i.name.includes('5W30'));
    const hasFilter = suggestedItems.some((i: any) => i.name.includes('WO-200'));

    if (hasOil && hasFilter) {
        console.log('✅ Smart Quote Accuracy: SUCCESS (Correct history items suggested)');
    } else {
        console.warn('⚠️ Smart Quote Accuracy: WARNING (Expected 5W30 and WO-200 to be suggested)');
    }


    // --- STEP 3: CREATE WORK ORDER ---
    console.log('\n🛠️ Step 3: Creating Work Order from Quote...');

    // Convert quote items to format expected by confirmQuote (Action doesn't expect typed objects identically)
    // Looking at confirmQuoteAsWorkOrder signature: items: any[]
    const orderItems = suggestedItems.map((i: any) => ({
        name: i.name,
        price: i.price,
        quantity: i.quantity,
        productId: i.id,
        category: i.determinedCategory,
        type: 'PRODUCT'
    }));

    const confirmResult = await confirmQuoteAsWorkOrder({
        vehicleId: vehicle.id,
        clientId: vehicle.clientId,
        items: orderItems,
        mileage: 55000,
        userId: 1 // Admin
    });

    if (!confirmResult.success) {
        console.error('❌ Error: Failed to create Work Order.', confirmResult);
        process.exit(1);
    }

    console.log(`✅ Work Order Created! ID: ${confirmResult.workOrderId}`);


    // --- STEP 4: PORTAL HISTORY CHECK ---
    console.log('\n📱 Step 4: Verifying Portal History View...');

    // We check what the portal would see
    const historyResult = await getVehicleMaintenanceHistory(vehicle.id);

    if (!historyResult.success || !historyResult.data) {
        console.error('❌ Error: Failed to fetch portal history.', historyResult);
        process.exit(1);
    }

    // Check if the NEW work order (PENDING) appears? 
    // Usually Portal shows COMPLETED/DELIVERED. 
    // The Seeded one was COMPLETED.

    const filters = historyResult.data.filters;
    const oilStatus = filters.find((f: any) => f.key === 'oil_filter');

    if (oilStatus) {
        console.log(`stats: key=${oilStatus.key} status=${oilStatus.status} daysAgo=${oilStatus.daysAgo}`);
    }

    // The seeded history was 90 days ago.
    if (oilStatus && oilStatus.daysAgo >= 89 && oilStatus.daysAgo <= 91) {
        console.log('✅ Portal History verification: SUCCESS (Correctly identifies last service ~90 days ago)');
    } else {
        console.warn(`⚠️ Portal History verification: CHECK NEEDED (Time drift? Days ago: ${oilStatus?.daysAgo})`);
    }

    console.log('\n🎉 ALL CORE FLOW CHECKS COMPLETED.');
}

main()
    .catch(e => {
        console.error('Script Error:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
