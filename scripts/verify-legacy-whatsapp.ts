
import { PrismaClient } from '@prisma/client';
import { createLegacyWorkOrder } from '../app/lib/business-actions';

const prisma = new PrismaClient();

async function main() {
    console.log('--- STARTING LIVE VERIFICATION: LEGACY + WHATSAPP ---');

    // 1. Setup Test Vehicle (Pepe 123 case)
    const client = await prisma.client.upsert({
        where: { phone: '123456789' },
        update: {},
        create: { name: 'Pepe 123', phone: '123456789' }
    });

    const vehicle = await prisma.vehicle.upsert({
        where: { plate: '123ERT' },
        update: {},
        create: {
            plate: '123ERT',
            brand: 'Chevrolet',
            model: 'Corsa',
            clientId: client.id,
            mileage: 80000
        }
    });

    console.log(`   Client/Vehicle ready: ${client.name} / ${vehicle.plate}`);

    // 2. Define Input capturing the user's detailed example
    const input = {
        vehicleId: vehicle.id,
        clientId: client.id,
        date: '2025-11-15', // Some date in the past
        mileage: 80158,
        nextServiceMileage: 90158, // Manual Sticker Overwrite
        sendWhatsApp: true,
        serviceDetails: {
            filters: { air: true, oil: true, fuel: false, cabin: false },
            oil: { type: '15w40', brand: 'Elaion F10', liters: 4.5 },
            fluids: { gearbox: true, hydraulic: true, coolant: true, brakes: true },
            notes: 'Tapon falseado. Pago 1 Cuota.'
        }
    };

    // 3. Execute
    console.log('2. Executing createLegacyWorkOrder with WhatsApp report...');
    const result = await createLegacyWorkOrder(input);

    if (!result.success) {
        console.error('❌ Action Failed:', result.error);
        process.exit(1);
    }

    console.log('   ✅ Action Success.');

    // 4. Verify DB
    const wo = await prisma.workOrder.findUnique({
        where: { id: result.workOrder!.id },
        include: { service: true }
    });

    console.log(`   [WO] Next Mileage stored in JSON: ${(wo?.serviceDetails as any).nextServiceMileage}`);

    if ((wo?.serviceDetails as any).nextServiceMileage === 90158) {
        console.log('   ✅ Next Service Mileage preserved correctly.');
    } else {
        console.error('   ❌ Mismatch in Next Service Mileage.');
    }

    // Verify Audit
    const audit = await prisma.auditLog.findFirst({
        where: { action: 'CREATE_LEGACY_WO', entityId: wo!.id.toString() }
    });

    if (audit?.details?.includes('+ WA')) {
        console.log('   ✅ Audit Log includes WhatsApp flag.');
    }

    console.log('--- VERIFICATION COMPLETE ---');
    console.log('Note: The WhatsApp was "Sent" via MetaClient (logged in console if credentials missing).');
}

main()
    .catch(e => { console.error(e); process.exit(1); })
    .finally(async () => { await prisma.$disconnect(); });
