import { getAvailableSlots, BUSINESS_HOURS } from '../lib/slots';
import { Appointment, Service } from '@prisma/client';

console.log('Running Slot Logic Tests...');

const mockService: Service = {
    id: 1,
    name: 'Test Service',
    category: 'Test',
    duration: 30,
    price: 100,
    active: true
};

const mockDuration = 30; // 30 minutes
const testDate = new Date('2023-10-27T10:00:00Z'); // A specific date

// Helper to create appointments
function createAppointment(start: string, duration: number = 30): Appointment & { service: Service } {
    const [hours, minutes] = start.split(':').map(Number);
    const date = new Date(testDate);
    date.setHours(hours, minutes, 0, 0);

    return {
        id: Math.floor(Math.random() * 1000),

        date: date,
        serviceId: 1,
        vehicleId: 1,
        clientId: 1,
        status: 'CONFIRMED',
        notes: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        calendarEventId: null,
        reminderAt: null,
        reminderSentAt: null,

        service: {
            ...mockService,
            duration
        }
    };
}

// Test 1: No appointments (Should return all slots)
console.log('\nTest 1: No appointments');
const slots1 = getAvailableSlots(testDate, mockDuration, []);
console.log(`Slots found: ${slots1.length}`);
// Expected slots:
// Morning: 08:30 to 13:00. 13:00 - 08:30 = 4.5 hours = 270 mins. 270 / 30 = 9 slots.
// Afternoon: 16:30 to 20:30. 20:30 - 16:30 = 4 hours = 240 mins. 240 / 30 = 8 slots.
// Total: 17 slots.
if (slots1.length !== 17) {
    console.error(`FAILED: Expected 17 slots, got ${slots1.length}`);
} else {
    console.log('PASSED');
}


// Test 2: Full overlap (Appointment at 08:30 for 30 mins)
console.log('\nTest 2: Appointment at 08:30 (30m)');
const appts2 = [createAppointment('08:30', 30)];
const slots2 = getAvailableSlots(testDate, mockDuration, appts2);
// Should miss the 08:30 slot. 17 - 1 = 16.
const has830 = slots2.some(d => d.getHours() === 8 && d.getMinutes() === 30);
if (!has830 && slots2.length === 16) {
    console.log('PASSED');
} else {
    console.error(`FAILED: Expected 16 slots and no 08:30. Got ${slots2.length}, has830=${has830}`);
}

// Test 3: Long duration service (60m)
console.log('\nTest 3: Service duration 60m');
const slots3 = getAvailableSlots(testDate, 60, []);
// Morning: 4.5h. 08:30, 09:00, 09:30, 10:00, 10:30, 11:00, 11:30, 12:00. (12:30 is invalid because 12:30+60 = 13:30 > 13:00) -> 8 slots.
// Afternoon: 4h. 16:30, 17:00, 17:30, 18:00, 18:30, 19:00, 19:30. (20:00 invalid bc 21:00 > 20:30) -> 7 slots.
// Total: 15 slots.
if (slots3.length === 15) {
    console.log('PASSED');
} else {
    console.log(slots3.map(s => s.getHours() + ':' + s.getMinutes()))
    console.error(`FAILED: Expected 15 slots, got ${slots3.length}`);
}

// Test 4: Overlap with closing time
// Check if 12:30 slot is valid for 30m service? Yes. 12:30+30 = 13:00.
// Check if 12:31 slot (hypothetically) would be valid? No.
console.log('\nTest 4: Boundary check');
const closingSlot = slots1.find(d => d.getHours() === 12 && d.getMinutes() === 30);
if (closingSlot) {
    console.log('PASSED: 12:30 slot exists for 30m service');
} else {
    console.error('FAILED: 12:30 slot missing');
}
