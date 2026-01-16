import { Appointment, Service } from '@prisma/client';

export const BUSINESS_HOURS = {
    morning: { start: '08:30', end: '13:00' },
    afternoon: { start: '16:30', end: '20:30' }
};

const INTERVAL_MINUTES = 30;

function parseTime(timeStr: string): number {
    const [hours, minutes] = timeStr.split(':').map(Number);
    return hours * 60 + minutes;
}

type AppointmentWithService = Appointment & { service: Service };

export function getAvailableSlots(date: Date, serviceDuration: number, appointments: AppointmentWithService[]): Date[] {
    const slots: Date[] = [];

    // Normalize date to 00:00
    const baseDate = new Date(date);
    baseDate.setHours(0, 0, 0, 0);

    const morningStart = parseTime(BUSINESS_HOURS.morning.start);
    const morningEnd = parseTime(BUSINESS_HOURS.morning.end);
    const afternoonStart = parseTime(BUSINESS_HOURS.afternoon.start);
    const afternoonEnd = parseTime(BUSINESS_HOURS.afternoon.end);

    const ranges = [
        { start: morningStart, end: morningEnd },
        { start: afternoonStart, end: afternoonEnd }
    ];

    for (const range of ranges) {
        let currentTime = range.start;

        // Loop until the service can no longer fit in the remaining time
        while (currentTime + serviceDuration <= range.end) {
            const slotStart = new Date(baseDate.getTime() + currentTime * 60000);
            const slotEnd = new Date(slotStart.getTime() + serviceDuration * 60000);

            // Check overlap
            const isOverlapping = appointments.some(appt => {
                if (appt.status === 'CANCELLED') return false;

                const apptStart = new Date(appt.date);
                // We rely on the service duration from the included relation
                const existingDuration = appt.service.duration;

                const apptEnd = new Date(apptStart.getTime() + existingDuration * 60000);

                // Standard overlap check: (StartA < EndB) and (EndA > StartB)
                return (slotStart < apptEnd && slotEnd > apptStart);
            });

            if (!isOverlapping) {
                slots.push(slotStart);
            }

            currentTime += INTERVAL_MINUTES;
        }
    }

    return slots;
}
