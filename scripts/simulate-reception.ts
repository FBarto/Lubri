
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log("--- Simulating Reception Flow ---");

    // 1. Create a Test Client
    const testClientData = {
        name: "Test Client Duplicate",
        phone: "999999999"
    };

    console.log("1. Creating initial client...");
    const client1 = await prisma.client.create({
        data: testClientData
    });
    console.log("   Client Created:", client1.id, client1.name);

    // 2. Attempt to create Duplicate (Same Phone)
    // The UI should verify existence first, but let's test DB constraints or logic if we were to hit the API.
    // Actually, the UI usually calls `findFirst` based on phone.

    console.log("2. Searching for client by phone '999999999'...");
    const foundClient = await prisma.client.findFirst({
        where: { phone: "999999999" }
    });

    if (foundClient) {
        console.log("   ✅ Client Found:", foundClient.id);
        if (foundClient.id === client1.id) {
            console.log("   ✅ Identity Match: It is the same client.");
        } else {
            console.error("   ❌ Found DIFFERENT client with same phone?");
        }
    } else {
        console.error("   ❌ Client NOT found by phone.");
    }

    // cleanup
    await prisma.client.delete({ where: { id: client1.id } });
}

main()
    .catch(e => console.error(e))
    .finally(async () => {
        await prisma.$disconnect();
    });
