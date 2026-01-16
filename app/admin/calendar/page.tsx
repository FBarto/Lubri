'use client';

import { useState, useEffect } from 'react';
import {
    format,
    startOfMonth,
    endOfMonth,
    startOfWeek,
    endOfWeek,
    eachDayOfInterval,
    isSameMonth,
    isSameDay,
    isToday,
    addMonths,
    subMonths
} from 'date-fns';
import { es } from 'date-fns/locale';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Clock } from 'lucide-react';

interface Appointment {
    id: number;
    date: string;
    status: string;
    client: { name: string; phone: string };
    vehicle: { plate: string; brand: string; model: string };
}

export default function CalendarPage() {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [appointments, setAppointments] = useState<Appointment[]>([]);
    const [monthAppointments, setMonthAppointments] = useState<Appointment[]>([]);
    const [loading, setLoading] = useState(false);

    // Fetch appointments for the whole month to show dots/indicators
    useEffect(() => {
        const fetchMonthData = async () => {
            const start = startOfMonth(currentDate).toISOString();
            const end = endOfMonth(currentDate).toISOString();

            try {
                // Using existing API that likely supports from/to
                const res = await fetch(`/api/appointments?from=${start}&to=${end}`);
                const data = await res.json();
                if (Array.isArray(data)) {
                    setMonthAppointments(data);
                }
            } catch (error) {
                console.error("Error fetching month appointments", error);
            }
        };
        fetchMonthData();
    }, [currentDate]);

    // Fetch detailed appointments for selected date
    useEffect(() => {
        const fetchDayData = async () => {
            setLoading(true);
            try {
                // In a real app we might just filter from monthAppointments to save a request,
                // but fetching fresh ensures specific day data is up to date if we edit functionality later.
                // For now, let's filter from the monthly batch to be snappy.
                const dayAppts = monthAppointments.filter(app =>
                    isSameDay(new Date(app.date), selectedDate)
                );
                setAppointments(dayAppts);
            } finally {
                setLoading(false);
            }
        };
        fetchDayData();
    }, [selectedDate, monthAppointments]);


    const nextMonth = () => setCurrentDate(addMonths(currentDate, 1));
    const prevMonth = () => setCurrentDate(subMonths(currentDate, 1));

    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(monthStart);
    const startDate = startOfWeek(monthStart, { locale: es });
    const endDate = endOfWeek(monthEnd, { locale: es });

    const calendarDays = eachDayOfInterval({ start: startDate, end: endDate });

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'CONFIRMED': return 'bg-blue-500';
            case 'REQUESTED': return 'bg-yellow-500';
            case 'DONE': return 'bg-green-500';
            case 'CANCELLED': return 'bg-red-500';
            default: return 'bg-slate-400';
        }
    };

    return (
        <div className="flex flex-col lg:flex-row h-screen overflow-hidden bg-slate-50">
            {/* Calendar Main Area */}
            <div className="flex-1 p-6 flex flex-col h-full">
                <header className="flex justify-between items-center mb-6">
                    <div>
                        <h1 className="text-3xl font-black text-slate-900 capitalize">
                            {format(currentDate, 'MMMM yyyy', { locale: es })}
                        </h1>
                        <p className="text-slate-500">Agenda de Turnos</p>
                    </div>
                    <div className="flex gap-2">
                        <button onClick={prevMonth} className="p-2 hover:bg-white rounded-full transition-colors border border-transparent hover:border-slate-200 hover:shadow-sm">
                            <ChevronLeft className="w-6 h-6 text-slate-600" />
                        </button>
                        <button onClick={() => setCurrentDate(new Date())} className="px-4 py-2 text-sm font-bold text-indigo-600 bg-indigo-50 rounded-lg hover:bg-indigo-100 transition-colors">
                            Hoy
                        </button>
                        <button onClick={nextMonth} className="p-2 hover:bg-white rounded-full transition-colors border border-transparent hover:border-slate-200 hover:shadow-sm">
                            <ChevronRight className="w-6 h-6 text-slate-600" />
                        </button>
                    </div>
                </header>

                <div className="flex-1 bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden flex flex-col">
                    {/* Weekday Headers */}
                    <div className="grid grid-cols-7 border-b border-slate-100 bg-slate-50/50">
                        {['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'].map(day => (
                            <div key={day} className="py-3 text-center text-xs font-bold text-slate-400 uppercase tracking-wider">
                                {day}
                            </div>
                        ))}
                    </div>

                    {/* Days Grid */}
                    <div className="flex-1 grid grid-cols-7 grid-rows-6">
                        {calendarDays.map((day, dayIdx) => {
                            const dayAppts = monthAppointments.filter(app => isSameDay(new Date(app.date), day));
                            const isSelected = isSameDay(day, selectedDate);

                            return (
                                <button
                                    key={day.toString()}
                                    onClick={() => setSelectedDate(day)}
                                    className={`
                                        relative border-b border-r border-slate-50 p-2 flex flex-col items-center justify-start transition-all hover:bg-slate-50
                                        ${!isSameMonth(day, monthStart) ? 'bg-slate-50/30 text-slate-300' : 'bg-white text-slate-700'}
                                        ${isSelected ? 'bg-indigo-50/50 ring-2 ring-inset ring-indigo-500 z-10' : ''}
                                    `}
                                >
                                    <span className={`
                                        text-sm font-bold w-8 h-8 flex items-center justify-center rounded-full mb-1
                                        ${isToday(day) ? 'bg-slate-900 text-white shadow-md' : ''}
                                        ${isSelected && !isToday(day) ? 'text-indigo-600' : ''}
                                    `}>
                                        {format(day, 'd')}
                                    </span>

                                    {/* Appointment Dots */}
                                    <div className="flex gap-1 flex-wrap justify-center w-full px-2">
                                        {dayAppts.slice(0, 5).map((apt, i) => (
                                            <div
                                                key={i}
                                                className={`w-1.5 h-1.5 rounded-full ${getStatusColor(apt.status)}`}
                                                title={`${apt.status} - ${apt.client.name}`}
                                            />
                                        ))}
                                        {dayAppts.length > 5 && (
                                            <span className="text-[10px] text-slate-400 leading-none">+</span>
                                        )}
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* Side Panel (Selected Day) */}
            <div className="w-full lg:w-96 bg-white border-l border-slate-200 h-full overflow-y-auto p-6 shadow-xl lg:shadow-none z-20">
                <div className="mb-6">
                    <h2 className="text-2xl font-black text-slate-800 capitalize">
                        {format(selectedDate, 'EEEE d', { locale: es })}
                    </h2>
                    <p className="text-slate-500 font-medium capitalize">
                        {format(selectedDate, 'MMMM yyyy', { locale: es })}
                    </p>
                </div>

                <div className="space-y-4">
                    {appointments.length > 0 ? (
                        appointments
                            .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
                            .map((appt) => (
                                <div key={appt.id} className="group flex gap-4 p-4 rounded-2xl border border-slate-100 bg-white hover:border-indigo-100 hover:shadow-md transition-all">
                                    <div className="flex flex-col items-center pt-1 min-w-[3rem]">
                                        <span className="text-sm font-bold text-slate-900">{format(new Date(appt.date), 'HH:mm')}</span>
                                        <div className={`mt-2 w-1 h-8 rounded-full ${getStatusColor(appt.status)} opacity-50`}></div>
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h3 className="font-bold text-slate-800 truncate">{appt.client.name}</h3>
                                        <p className="text-sm text-slate-500 mb-1 truncate">{appt.vehicle.brand} {appt.vehicle.model}</p>
                                        <span className={`inline-flex px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wide
                                        ${appt.status === 'REQUESTED' ? 'bg-yellow-100 text-yellow-700' :
                                                appt.status === 'CONFIRMED' ? 'bg-blue-100 text-blue-700' :
                                                    appt.status === 'CANCELLED' ? 'bg-red-50 text-red-500' : 'bg-slate-100 text-slate-600'}
                                    `}>
                                            {appt.status}
                                        </span>
                                    </div>
                                </div>
                            ))
                    ) : (
                        <div className="text-center py-10 opacity-50">
                            <CalendarIcon className="w-12 h-12 mx-auto text-slate-300 mb-3" />
                            <p className="text-slate-400 font-medium">No hay turnos para este día</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
