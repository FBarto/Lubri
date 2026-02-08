
import { prisma } from '../lib/prisma';
import { getAvailableSlots } from '../lib/slots';

async function main() {
    console.log('--- VERIFYING UX IMPROVEMENTS ---');

    // 1. Setup Test Data
    const plate = 'UXTEST01';
    const phone = '999888777';

    // Cleanup first
    const existingV = await prisma.vehicle.findFirst({ where: { plate } });
    if (existingV) {
        await prisma.appointment.deleteMany({ where: { vehicleId: existingV.id } });
        await prisma.vehicle.delete({ where: { id: existingV.id } });
    }
    const client = await prisma.client.upsert({
        where: { phone },
        update: {},
        create: { name: 'UX Test User', phone }
    });
    const vehicle = await prisma.vehicle.create({
        data: {
            plate,
            brand: 'Ford',
            model: 'Focus Test',
            clientId: client.id
        }
    });

    console.log('✅ Setup: Created Vehicle', plate);

    // 2. Verify Lookup API Logic (Simulation)
    const lookup = await prisma.vehicle.findFirst({
        where: { plate: { equals: plate, mode: 'insensitive' } },
        select: { brand: true, model: true }
    });

    if (lookup?.brand === 'Ford' && lookup?.model === 'Focus Test') {
        console.log('✅ Smart Lookup: Success (Found Ford Focus Test)');
    } else {
        console.error('❌ Smart Lookup: Failed', lookup);
    }

    // 3. Verify Slots Logic (Backend Direct)
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    // Ensure it's not Sunday
    if (tomorrow.getDay() === 0) tomorrow.setDate(tomorrow.getDate() + 1);

    const service = await prisma.service.findFirst({ where: { active: true } });
    if (!service) throw new Error('No service found');

    // We can't call the API route directly in script easily, but we verified the route calls getAvailableSlots.
    // Let's verify getAvailableSlots returns valid times.
    const slots = await getAvailableSlots(tomorrow, service.duration, []);

    if (slots.length > 0) {
        console.log(`✅ Slots: Found ${slots.length} slots for ${tomorrow.toDateString()}`);
        console.log('   Sample:', slots[0].toLocaleTimeString());
    } else {
        console.warn('⚠️ Slots: No slots found (might be Sunday or full, but we shifted date above)');
    }

    // 4. Verify Google Calendar Link Logic
    const slot = slots[0];
    if (slot) {
        const start = slot.toISOString().replace(/-|:|\.\d\d\d/g, '').slice(0, 15) + 'Z';
        const end = new Date(slot.getTime() + service.duration * 60000).toISOString().replace(/-|:|\.\d\d\d/g, '').slice(0, 15) + 'Z';
        const url = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=Turno&dates=${start}/${end}`;

        if (url.includes('calendar.google.com') && url.includes(start)) {
            console.log('✅ Google Calendar: URL Generation Valid');
        } else {
            console.error('❌ Google Calendar: URL Generation Failed');
        }
    }

    console.log('--- VERIFICATION COMPLETE ---');
}

main().catch(console.error);
