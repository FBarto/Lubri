'use client';
import { useState, useEffect } from 'react';

// Helpers para fechas
const getDaysArray = () => {
    const days = [];
    for (let i = 0; i < 14; i++) {
        const d = new Date();
        d.setDate(d.getDate() + i);
        // Skip Sundays if needed, assuming Lubri works Mon-Sat
        if (d.getDay() !== 0) days.push(d);
    }
    return days;
};

const TIME_SLOTS_MORNING = ['08:30', '09:00', '09:30', '10:00', '10:30', '11:00', '11:30', '12:00', '12:30'];
const TIME_SLOTS_AFTERNOON = ['16:30', '17:00', '17:30', '18:00', '18:30', '19:00', '19:30', '20:00'];

interface StepDateProps {
    onSelect: (date: Date) => void;
    selectedDate?: Date;
    serviceDuration: number;
}

export default function StepDate({ onSelect, selectedDate, serviceDuration, selectedServiceId }: StepDateProps & { selectedServiceId?: number }) {
    const [days] = useState(getDaysArray());
    const [activeDayIdx, setActiveDayIdx] = useState(0);
    const [availableSlots, setAvailableSlots] = useState<Date[]>([]);
    const [loading, setLoading] = useState(false);

    const activeDay = days[activeDayIdx];

    useEffect(() => {
        const fetchSlots = async () => {
            setLoading(true);
            setAvailableSlots([]);
            try {
                const dateStr = activeDay.toISOString().split('T')[0];
                const serviceId = selectedServiceId || 1; // Default to 1 if missing
                const res = await fetch(`/api/public/slots?date=${dateStr}&serviceId=${serviceId}`);
                if (res.ok) {
                    const data = await res.json();
                    // API returns strings (ISO), convert to Dates
                    const slotDates = data.map((d: string) => new Date(d));
                    setAvailableSlots(slotDates);
                }
            } catch (e) {
                console.error(e);
            } finally {
                setLoading(false);
            }
        };

        fetchSlots();
    }, [activeDay, selectedServiceId]);

    const handleTimeSelect = (date: Date) => {
        onSelect(date);
    };

    const isSelected = (slotDate: Date) => {
        return selectedDate?.getTime() === slotDate.getTime();
    };

    // Group slots by Morning/Afternoon for UI
    const morningSlots = availableSlots.filter(d => d.getHours() < 13);
    const afternoonSlots = availableSlots.filter(d => d.getHours() >= 13);

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 delay-100">
            <h2 className="text-2xl font-black text-slate-800 mb-6 text-center">
                Elige Fecha y Hora
            </h2>

            {/* Date Slider */}
            <div className="flex gap-3 overflow-x-auto pb-4 -mx-4 px-4 snap-x no-scrollbar">
                {days.map((day, idx) => {
                    const isSelectedDay = idx === activeDayIdx;
                    return (
                        <button
                            key={idx}
                            onClick={() => setActiveDayIdx(idx)}
                            className={`flex-shrink-0 w-20 h-24 rounded-2xl flex flex-col items-center justify-center border-2 transition-all snap-center
                                ${isSelectedDay
                                    ? 'border-slate-900 bg-slate-900 text-white shadow-lg scale-105'
                                    : 'border-slate-200 bg-white text-slate-500 hover:border-slate-300'}
                            `}
                        >
                            <span className="text-xs font-bold uppercase tracking-wider mb-1">
                                {day.toLocaleDateString('es-AR', { weekday: 'short' }).slice(0, 3)}
                            </span>
                            <span className="text-2xl font-black">
                                {day.getDate()}
                            </span>
                            <span className="text-[0.6rem] font-bold opacity-60">
                                {day.toLocaleDateString('es-AR', { month: 'short' })}
                            </span>
                        </button>
                    );
                })}
            </div>

            {/* Time Grid - Dynamic Backend Source */}
            <div className="bg-slate-50 p-6 rounded-3xl border border-slate-200 min-h-[300px]">
                {loading ? (
                    <div className="flex items-center justify-center h-full py-20">
                        <div className="animate-spin text-3xl">⏳</div>
                    </div>
                ) : availableSlots.length === 0 ? (
                    <div className="text-center py-10 text-slate-400 font-bold">
                        <p>No hay turnos disponibles para este día.</p>
                        <p className="text-xs font-normal mt-2">Prueba seleccionar otra fecha.</p>
                    </div>
                ) : (
                    <div className="space-y-6">
                        {morningSlots.length > 0 && (
                            <div className="animate-in fade-in">
                                <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                                    <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707" /></svg>
                                    Mañana
                                </h3>
                                <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                                    {morningSlots.map((slot) => (
                                        <button
                                            key={slot.toISOString()}
                                            onClick={() => handleTimeSelect(slot)}
                                            className={`py-3 rounded-xl font-bold text-sm transition-all
                                                ${isSelected(slot)
                                                    ? 'bg-blue-600 text-white shadow-md scale-105 ring-2 ring-blue-200'
                                                    : 'bg-white text-slate-700 hover:bg-white hover:text-blue-600 hover:shadow-sm border border-slate-200'
                                                }
                                            `}
                                        >
                                            {slot.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {afternoonSlots.length > 0 && (
                            <div className="animate-in fade-in">
                                <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                                    <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" /></svg>
                                    Tarde
                                </h3>
                                <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                                    {afternoonSlots.map((slot) => (
                                        <button
                                            key={slot.toISOString()}
                                            onClick={() => handleTimeSelect(slot)}
                                            className={`py-3 rounded-xl font-bold text-sm transition-all
                                                ${isSelected(slot)
                                                    ? 'bg-blue-600 text-white shadow-md scale-105 ring-2 ring-blue-200'
                                                    : 'bg-white text-slate-700 hover:bg-white hover:text-blue-600 hover:shadow-sm border border-slate-200'
                                                }
                                            `}
                                        >
                                            {slot.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
