export const BUSINESS_HOURS = {
    // 0 = Sunday, 1 = Monday, etc.
    // Standard Mon-Fri
    weekday: {
        morning: { start: '08:30', end: '13:00' },
        afternoon: { start: '16:00', end: '20:30' }
    },
    saturday: {
        morning: { start: '09:00', end: '14:00' },
        afternoon: null // Closed
    },
    sunday: null // Closed
};

export const TIMEZONE_OFFSET = -3; // Argentina (UTC-3)
