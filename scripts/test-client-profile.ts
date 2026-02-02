
import { getClientProfile } from '../app/actions/client';
import { prisma } from '../lib/prisma';

async function testProfile() {
    console.log('🧪 Testing getClientProfile...');

    // 1. Get a real client ID from DB
    const client = await prisma.client.findFirst();
    if (!client) {
        console.error('❌ No clients in DB to test with.');
        process.exit(1);
    }
    console.log(`Found client: ${client.name} (ID: ${client.id})`);

    // 2. Call the action
    console.log(`Calling getClientProfile(${client.id})...`);
    const result = await getClientProfile(client.id);

    if (result.success && result.data) {
        console.log('✅ Success!');
        console.log('Name:', result.data.name);
        console.log('Vehicles:', result.data.vehicles.length);
        console.log('History Items:', result.data.history.length);
    } else {
        console.error('❌ Failed:', result.error);
    }

    process.exit(0);
}

testProfile();
