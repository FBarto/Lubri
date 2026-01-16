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

export default function StepDate({ onSelect, selectedDate, serviceDuration }: StepDateProps) {
    const [days] = useState(getDaysArray());
    const [activeDayIdx, setActiveDayIdx] = useState(0);
    const [occupiedSlots, setOccupiedSlots] = useState<string[]>([]);
    const [loading, setLoading] = useState(false);

    const activeDay = days[activeDayIdx];

    useEffect(() => {
        // Fetch appointments for the selected day
        const fetchAvailability = async () => {
            setLoading(true);
            try {
                const dateStr = activeDay.toISOString().split('T')[0];
                const res = await fetch(`/api/appointments?date=${dateStr}`);
                const appointments = await res.json();

                // Simple logic: extract times that are busy
                // This is a naive implementation. For real collision detection we'd use the backend.
                // For UI feedback, we'll mark exact start times as busy.
                const busy = appointments.map((appt: any) => {
                    const d = new Date(appt.date);
                    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                });
                setOccupiedSlots(busy);
            } catch (e) {
                console.error(e);
            } finally {
                setLoading(false);
            }
        };

        fetchAvailability();
    }, [activeDay]);

    const handleTimeSelect = (timeStr: string) => {
        const [hours, minutes] = timeStr.split(':').map(Number);
        const newDate = new Date(activeDay);
        newDate.setHours(hours, minutes, 0, 0);
        onSelect(newDate);
    };

    const isSelected = (timeStr: string) => {
        if (!selectedDate) return false;
        const selTime = selectedDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        return selectedDate.getDate() === activeDay.getDate() && selTime === timeStr;
    };

    const isBusy = (timeStr: string) => occupiedSlots.includes(timeStr);

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 delay-100">
            <h2 className="text-2xl font-black text-slate-800 mb-6 text-center">
                Elige Fecha y Hora
            </h2>

            {/* Date Slider */}
            <div className="flex gap-3 overflow-x-auto pb-4 -mx-4 px-4 snap-x">
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

            {/* Time Grid */}
            <div className="bg-slate-50 p-6 rounded-3xl border border-slate-200">
                {loading ? (
                    <div className="text-center py-10 text-slate-400 font-bold animate-pulse">Buscando horarios...</div>
                ) : (
                    <div className="space-y-6">
                        <div>
                            <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest mb-3">Mañana</h3>
                            <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                                {TIME_SLOTS_MORNING.map(time => (
                                    <button
                                        key={time}
                                        disabled={isBusy(time)}
                                        onClick={() => handleTimeSelect(time)}
                                        className={`py-3 rounded-xl font-bold text-sm transition-all
                                            ${isSelected(time)
                                                ? 'bg-blue-600 text-white shadow-md scale-105 ring-2 ring-blue-200'
                                                : isBusy(time)
                                                    ? 'bg-slate-100 text-slate-300 cursor-not-allowed line-through'
                                                    : 'bg-white text-slate-700 hover:bg-white hover:text-blue-600 hover:shadow-sm border border-slate-200'
                                            }
                                        `}
                                    >
                                        {time}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div>
                            <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest mb-3">Tarde</h3>
                            <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                                {TIME_SLOTS_AFTERNOON.map(time => (
                                    <button
                                        key={time}
                                        disabled={isBusy(time)}
                                        onClick={() => handleTimeSelect(time)}
                                        className={`py-3 rounded-xl font-bold text-sm transition-all
                                            ${isSelected(time)
                                                ? 'bg-blue-600 text-white shadow-md scale-105 ring-2 ring-blue-200'
                                                : isBusy(time)
                                                    ? 'bg-slate-100 text-slate-300 cursor-not-allowed line-through'
                                                    : 'bg-white text-slate-700 hover:bg-white hover:text-blue-600 hover:shadow-sm border border-slate-200'
                                            }
                                        `}
                                    >
                                        {time}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
