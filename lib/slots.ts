import { Appointment, Service } from '@prisma/client';
import { BUSINESS_HOURS, TIMEZONE_OFFSET } from '../app/config/business-hours';


const INTERVAL_MINUTES = 30;

function parseTime(timeStr: string): number {
    const [hours, minutes] = timeStr.split(':').map(Number);
    return hours * 60 + minutes;
}

type AppointmentWithService = Appointment & { service: Service };

export function getAvailableSlots(date: Date, serviceDuration: number, appointments: AppointmentWithService[]): Date[] {
    const slots: Date[] = [];

    // Normalize date to 00:00 UTC for calculation base
    const baseDate = new Date(date);
    baseDate.setUTCHours(0, 0, 0, 0);

    // Detech Day of Week (0-6)
    // IMPORTANT: 'date' comes from client picker, usually local.
    // We assume 'date' object represents the correct day.
    const dayOfWeek = baseDate.getDay(); // 0 is Sunday

    let schedule = BUSINESS_HOURS.weekday;
    if (dayOfWeek === 0) schedule = BUSINESS_HOURS.sunday as any;
    if (dayOfWeek === 6) schedule = BUSINESS_HOURS.saturday as any;

    if (!schedule) return []; // Closed

    const ranges = [];
    if (schedule.morning) ranges.push(schedule.morning);
    if (schedule.afternoon) ranges.push(schedule.afternoon);

    for (const range of ranges) {
        if (!range) continue;

        const startMins = parseTime(range.start);
        const endMins = parseTime(range.end);

        let currentTime = startMins;

        // Loop until the service can no longer fit in the remaining time
        while (currentTime + serviceDuration <= endMins) {

            // Construct Slot Date
            // We want the result to be a Date object that, when printed in ISO, represents the correct UTC time 
            // corresponding to the Argentina Local Time.

            // Example: We want 08:30 AR. AR is UTC-3. So we want 11:30 UTC.
            // TIMEZONE_OFFSET is -3.
            // Formula: LocalHour = UTCHour + Offset
            // UTCHour = LocalHour - Offset
            // UTCHour = 8.5 - (-3) = 11.5

            const utcHourMins = currentTime - (TIMEZONE_OFFSET * 60);

            const slotStart = new Date(baseDate.getTime() + utcHourMins * 60000);
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
