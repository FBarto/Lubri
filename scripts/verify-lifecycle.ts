
import { prisma } from '../lib/prisma';
import { createClient, createVehicle, createAppointment } from '../app/actions/booking';
import { createWorkOrder, processSale } from '../app/actions/business';

async function main() {
    console.log('--- STARTING FULL LIFECYCLE VERIFICATION ---');
    console.log('Goals: Public Booking -> Admin WO -> Employee Sale -> Dashboard Updates');

    // Setup
    const PHONE = '999888777'; // Unique for this test
    const PLATE = 'LIFE-999';

    // Cleanup previous runs
    const existingClient = await prisma.client.findUnique({ where: { phone: PHONE } });
    if (existingClient) {
        console.log('Cleaning up previous test data...');
        const v = await prisma.vehicle.findUnique({ where: { plate: PLATE } });
        if (v) {
            // Delete related WorkOrders and Appointments
            await prisma.saleItem.deleteMany({ where: { workOrder: { vehicleId: v.id } } });
            await prisma.workOrder.deleteMany({ where: { vehicleId: v.id } });
            await prisma.appointment.deleteMany({ where: { vehicleId: v.id } });
            await prisma.vehicle.delete({ where: { id: v.id } });
        }
        // Also cleanup sales for this client?
        await prisma.sale.deleteMany({ where: { clientId: existingClient.id } });
        await prisma.client.delete({ where: { id: existingClient.id } });
    }

    try {
        // 1. PUBLIC BOOKING: Create Client
        console.log('\n[1] Booking: Creating Client...');
        const clientRes = await createClient({ name: 'Lifecycle User', phone: PHONE });
        if (!clientRes.success) throw new Error(clientRes.error);
        const clientId = clientRes.data!.client!.id;

        // 2. PUBLIC BOOKING: Create Vehicle
        console.log('[2] Booking: Creating Vehicle...');
        const vehicleRes = await createVehicle({ clientId, plate: PLATE, model: 'Ford Test', type: 'AUTO' });
        if (!vehicleRes.success) throw new Error(vehicleRes.error);
        const vehicleId = vehicleRes.data!.id; // createVehicle returns Vehicle directly in data

        // 3. PUBLIC BOOKING: Create Appointment
        console.log('[3] Booking: Creating Appointment...');
        const service = await prisma.service.findFirst({ where: { active: true } });
        if (!service) throw new Error('No service found');

        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        tomorrow.setHours(10, 0, 0, 0);

        const apptRes = await createAppointment({
            clientId,
            vehicleId,
            serviceId: service.id,
            date: tomorrow,
            notes: 'Lifecycle Test Appt'
        });
        if (!apptRes.success) throw new Error(apptRes.error);
        const apptId = apptRes.data!.appointment!.id;
        console.log(`✅ Appointment Created: ${apptId}`);

        // 4. ADMIN: Start Work Order (Convert Appt)
        console.log('\n[4] Admin: Starting Work Order...');
        const woRes = await createWorkOrder({
            clientId,
            vehicleId,
            serviceId: service.id, // Usually passed from appt
            price: service.price,
            appointmentId: apptId,
            userId: 1, // Admin
            notes: 'Started from script',
            mileage: 10000
        });

        if (!woRes.success) throw new Error(woRes.error);
        const woId = woRes.data!.workOrder!.id;
        console.log(`✅ Work Order Created: ${woId}`);

        // Verify Appointment is COMPLETED
        const updatedAppt = await prisma.appointment.findUnique({ where: { id: apptId } });
        if (updatedAppt?.status !== 'DONE') throw new Error('Appointment status not updated to DONE');
        console.log('✅ Appointment Status: DONE');

        // 5. EMPLOYEE: Process Sale (Pay WO)
        console.log('\n[5] Employee: Processing Sale...');
        // Note: processSale expects items with workOrderId to link properly
        const saleRes = await processSale({
            userId: 1,
            clientId,
            paymentMethod: 'CASH',
            items: [{
                type: 'SERVICE',
                description: service.name,
                quantity: 1,
                unitPrice: service.price,
                workOrderId: woId // Link!
            }]
        });

        if (!saleRes.success) throw new Error(saleRes.error);
        const saleId = saleRes.data!.sale!.id;
        console.log(`✅ Sale Processed: ${saleId}`);

        // Verify WO Linked
        const updatedWO = await prisma.workOrder.findUnique({ where: { id: woId } });
        if (updatedWO?.saleId !== saleId) throw new Error('WorkOrder not linked to Sale');
        console.log('✅ WorkOrder Linked to Sale');

        // 6. DASHBOARD: Verify Stats (Manual calculation vs DB)
        // We can't query the API mainly because we are in a script, but we can verify the DB state which feeds the API.
        // Check "Sales Today" (if we created it today)
        console.log('\n[6] Verifying Data...');
        const todaySale = await prisma.sale.findUnique({ where: { id: saleId } });
        // Just verify it exists and total is correct
        if (todaySale?.total !== service.price) throw new Error('Sale total mismatch');

        console.log('✅ All Lifecycle Steps Verified Successfully!');

    } catch (e: any) {
        console.error('\n❌ TEST FAILED:', e.message);
        process.exit(1);
    } finally {
        // Cleanup if needed, or leave it for inspection
        await prisma.$disconnect();
    }
}

main();
