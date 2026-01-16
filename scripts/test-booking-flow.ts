
import { prisma } from '../lib/prisma';
import { createClient, createVehicle, createAppointment } from '../app/lib/booking-actions';
// Need to mock safeRevalidate? No, it catches errors.

async function main() {
    console.log('--- STARTING PUBLIC BOOKING FLOW TEST ---');

    // 1. Setup Data
    const PHONE = '999123456';
    const PLATE = 'TEST999';
    const DATE_STR = new Date().toISOString().split('T')[0]; // Today
    const DATE = new Date(DATE_STR + 'T10:00:00'); // 10:00 AM Today

    // Ensure cleanup
    await prisma.appointment.deleteMany({ where: { vehicle: { plate: PLATE } } });
    await prisma.vehicle.deleteMany({ where: { plate: PLATE } });
    await prisma.client.deleteMany({ where: { phone: PHONE } });

    try {
        // 2. Create Client
        console.log('\n2. Creating Client...');
        const clientRes = await createClient({
            name: 'Test Booking User',
            phone: PHONE
        });

        if (!clientRes.success || !clientRes.client) throw new Error('Failed to create client: ' + clientRes.error);
        const CLIENT_ID = clientRes.client.id;
        console.log('✅ Client Created:', CLIENT_ID);

        // 3. Create Vehicle
        console.log('\n3. Creating Vehicle...');
        const vehicleRes = await createVehicle({
            plate: PLATE,
            brand: 'TestBrand',
            model: 'TestModel',
            clientId: CLIENT_ID,
            type: 'AUTO'
        });

        if (!vehicleRes.success || !vehicleRes.vehicle) throw new Error('Failed to create vehicle: ' + vehicleRes.error);
        const VEHICLE_ID = vehicleRes.vehicle.id;
        console.log('✅ Vehicle Created:', VEHICLE_ID);

        // 4. Fetch Service (Assume ID 1 exists, or fetch first)
        const service = await prisma.service.findFirst({ where: { active: true } });
        if (!service) throw new Error('No active services found');
        console.log('\n4. Selected Service:', service.name, service.id);

        // 5. Create Appointment
        console.log('\n5. Creating Appointment...');
        const apptRes = await createAppointment({
            clientId: CLIENT_ID,
            vehicleId: VEHICLE_ID,
            serviceId: service.id,
            date: DATE,
            notes: 'Test Booking Script'
        });

        if (!apptRes.success || !apptRes.appointment) throw new Error('Failed to create appointment: ' + apptRes.error);
        console.log('✅ Appointment Created:', apptRes.appointment.id, apptRes.appointment.date);

        // 6. Verify in DB
        const check = await prisma.appointment.findUnique({
            where: { id: apptRes.appointment.id },
            include: { client: true, vehicle: true }
        });

        if (!check) throw new Error('Appointment not found in DB verification');
        if (check.clientId !== CLIENT_ID) throw new Error('Client mismatch');
        if (check.vehicleId !== VEHICLE_ID) throw new Error('Vehicle mismatch');

        console.log('\n✅ VERIFICATION SUCCESSFUL');

    } catch (e: any) {
        console.error('\n❌ TEST FAILED:', e.message);
        process.exit(1);
    } finally {
        // Cleanup
        console.log('\nCleaning up...');
        await prisma.appointment.deleteMany({ where: { vehicle: { plate: PLATE } } });
        await prisma.vehicle.deleteMany({ where: { plate: PLATE } });
        await prisma.client.deleteMany({ where: { phone: PHONE } });
        await prisma.$disconnect();
    }
}

main();
