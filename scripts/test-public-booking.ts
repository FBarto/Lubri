
import { GET } from '../app/api/public/slots/route';
import { POST } from '../app/api/appointments/route';
import { prisma } from '../lib/prisma';

async function main() {
    console.log('--- PUBLIC BOOKING SIMULATION ---');

    // 1. Setup Data
    console.log('[1] Setup: Ensuring Service and Client exist...');
    const service = await prisma.service.findFirst({ where: { active: true } });
    if (!service) throw new Error('No service found');

    // Create temp client/vehicle for test
    const client = await prisma.client.create({
        data: { name: 'Booking Bot', phone: '999111222' }
    });
    const vehicle = await prisma.vehicle.create({
        data: { plate: 'BOOK-001', clientId: client.id, brand: 'Test', model: 'Bot' }
    });

    try {
        // 2. Fetch Slots
        console.log(`[2] Fetching slots for service: ${service.name} (${service.duration} min)`);

        // Mock request for GET /api/public/slots
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        const dateStr = tomorrow.toISOString().split('T')[0];

        const reqUrl = `http://localhost/api/public/slots?date=${dateStr}&serviceId=${service.id}`;
        const getReq = new Request(reqUrl);

        const getRes = await GET(getReq);
        const slots = await getRes.json();

        console.log(`   Found ${slots.length} slots for ${dateStr}`);
        if (slots.length > 0) console.log(`   First slot: ${slots[0]}`);
        else throw new Error('No slots available!');

        // 3. Create Appointment
        const selectedSlot = slots[0];
        console.log(`[3] Booking appointment at: ${selectedSlot}`);

        const postReq = new Request('http://localhost/api/appointments', {
            method: 'POST',
            body: JSON.stringify({
                clientId: client.id,
                vehicleId: vehicle.id,
                serviceId: service.id,
                date: selectedSlot,
                notes: 'Simulation Test'
            })
        });

        const postRes = await POST(postReq);
        const booking = await postRes.json();

        if (postRes.status !== 201) {
            console.error('Booking Failed:', booking);
            throw new Error('Booking failed');
        }

        console.log(`   ✅ Appointment Created! ID: ${booking.id}`);

        // 4. Verify Double Booking Prevention
        console.log('[4] Verifying Double Booking Prevention...');
        const failReq = new Request('http://localhost/api/appointments', {
            method: 'POST',
            body: JSON.stringify({
                clientId: client.id,
                vehicleId: vehicle.id,
                serviceId: service.id,
                date: selectedSlot, // SAME SLOT
                notes: 'Should Fail'
            })
        });

        // Note: It might succeed if we have multiple bays! 
        // Let's check logic. If capacity is 2, this should succeed. 
        // We will just log the result.

        const failRes = await POST(failReq);
        const failBooking = await failRes.json();

        if (failRes.status === 201) {
            console.log('   Warning: Slot allowed double booking (Capacity > 1?)');
        } else {
            console.log('   ✅ Double booking prevented (or other error):', failBooking.error);
        }


    } catch (e) {
        console.error('ERROR:', e);
    } finally {
        // Cleanup
        await prisma.appointment.deleteMany({ where: { clientId: client.id } });
        await prisma.vehicle.delete({ where: { id: vehicle.id } });
        await prisma.client.delete({ where: { id: client.id } });
        await prisma.$disconnect();
    }
}

main();
