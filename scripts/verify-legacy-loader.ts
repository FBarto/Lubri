
import { createLegacyWorkOrder } from '../app/lib/business-actions';
import { prisma } from '../lib/prisma';

// Mock console.error to ignore cache errors in script context
const originalError = console.error;
console.error = (...args) => {
    if (args[0]?.toString().includes('Cache') || args[0]?.toString().includes('store missing')) return;
    originalError(...args);
};

async function main() {
    console.log('🧪 VERIFYING LEGACY LOADER...');

    // 1. Get a Client/Vehicle
    const client = await prisma.client.findFirst({
        where: { vehicles: { some: {} } }, // Find client with vehicles
        include: { vehicles: true }
    });

    if (!client || !client.vehicles[0]) {
        console.log('⚠️ Skipping test: No client/vehicle found.');
        return;
    }

    const vehicle = client.vehicles[0];
    console.log(`Target: ${client.name} | Vehicle: ${vehicle.plate}`);

    // 2. Execute Action
    const testDate = '2023-06-15T12:00:00.000Z';
    const testMileage = 88000;

    console.log('Running createLegacyWorkOrder...');

    const result = await createLegacyWorkOrder({
        clientId: client.id,
        vehicleId: vehicle.id,
        date: testDate,
        mileage: testMileage,
        serviceDetails: {
            filters: { air: true, oil: true },
            notes: 'Test Automation Legacy'
        }
    });

    if (result.success) {
        console.log('✅ Action Success');
        if (!result.workOrder) return;
        const wo = await prisma.workOrder.findUnique({ where: { id: result.workOrder.id } });

        if (wo) {
            console.log(`   WO ID: ${wo.id}`);
            console.log(`   Status: ${wo.status} ${wo.status === 'COMPLETED' ? '✅' : '❌'}`);
            console.log(`   Price: ${wo.price} ${Number(wo.price) === 0 ? '✅' : '❌'}`);
            // Check if serviceDetails is stored nicely
            console.log(`   ServiceDetails stored: ${JSON.stringify(wo.serviceDetails).length > 2 ? '✅' : '❌'}`);
        } else {
            console.error('❌ WO not found in DB');
        }
    } else {
        console.error('❌ Action Failed:', result.error);
    }
}

main().finally(() => prisma.$disconnect());
