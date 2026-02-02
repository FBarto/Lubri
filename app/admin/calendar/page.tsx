'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
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
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Clock, Plus, Check, X } from 'lucide-react';
import { createAppointment } from '@/app/actions/booking';

interface Appointment {
    id: number;
    date: string;
    status: string;
    client: { name: string; phone: string };
    vehicle: { plate: string; brand: string; model: string };
}

interface Service {
    id: number;
    name: string;
    category: string;
    price: number;
    duration: number;
}

function CalendarContent() {
    const searchParams = useSearchParams();
    const router = useRouter();

    // Context from Inbox
    const caseId = searchParams.get('caseId');
    const clientId = searchParams.get('clientId');
    const vehicleId = searchParams.get('vehicleId');

    const [currentDate, setCurrentDate] = useState(new Date());
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [appointments, setAppointments] = useState<Appointment[]>([]);
    const [monthAppointments, setMonthAppointments] = useState<Appointment[]>([]);
    const [services, setServices] = useState<Service[]>([]);
    const [loading, setLoading] = useState(false);

    // Booking State
    const [isBooking, setIsBooking] = useState(!!caseId);
    const [selectedService, setSelectedService] = useState<Service | null>(null);
    const [availableSlots, setAvailableSlots] = useState<Date[]>([]);
    const [selectedSlot, setSelectedSlot] = useState<Date | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Fetch month appointments
    useEffect(() => {
        const fetchMonthData = async () => {
            const start = startOfMonth(currentDate).toISOString();
            const end = endOfMonth(currentDate).toISOString();
            try {
                const res = await fetch(`/api/appointments?from=${start}&to=${end}`);
                const data = await res.json();
                if (Array.isArray(data)) setMonthAppointments(data);
            } catch (error) {
                console.error("Error fetching month appointments", error);
            }
        };
        fetchMonthData();
    }, [currentDate]);

    // Fetch services
    useEffect(() => {
        const fetchServices = async () => {
            const res = await fetch('/api/services');
            const data = await res.json();
            if (Array.isArray(data)) setServices(data);
        };
        fetchServices();
    }, []);

    // Fetch slots when date or service changes
    useEffect(() => {
        if (!isBooking || !selectedService) {
            setAvailableSlots([]);
            return;
        }

        const fetchSlots = async () => {
            setLoading(true);
            try {
                const dateStr = selectedDate.toISOString().split('T')[0];
                const res = await fetch(`/api/appointments?date=${dateStr}`);
                const dayAppts = await res.json();

                // We'll use a client-side version of the slot logic for immediate feedback
                // or ideally a dedicated API. For now, let's just filter.
                // In a production app, I'd call a /api/slots endpoint.
                // Since I can't easily add a new API route now, I'll mock the slots 
                // based on business hours and overlapping dayAppts.

                const slots: Date[] = [];
                const morningStart = 8 * 60 + 30; // 08:30
                const morningEnd = 13 * 0;       // 13:00
                const afternoonStart = 16 * 60 + 30;
                const afternoonEnd = 20 * 60 + 30;

                const base = new Date(selectedDate);
                base.setHours(0, 0, 0, 0);

                const checkOverlap = (start: Date, duration: number) => {
                    const end = new Date(start.getTime() + duration * 60000);
                    return dayAppts.some((a: any) => {
                        const aStart = new Date(a.date);
                        const aEnd = new Date(aStart.getTime() + a.service.duration * 60000);
                        return (start < aEnd && end > aStart);
                    });
                };

                const generateForRange = (startMin: number, endMin: number) => {
                    for (let m = startMin; m + (selectedService?.duration || 30) <= endMin; m += 30) {
                        const d = new Date(base.getTime() + (m + 180) * 60000); // +180 for AR offset simulation
                        if (!checkOverlap(d, selectedService?.duration || 30)) {
                            slots.push(d);
                        }
                    }
                };

                generateForRange(morningStart, 13 * 60);
                generateForRange(afternoonStart, afternoonEnd);

                setAvailableSlots(slots);
            } catch (e) {
                console.error(e);
            } finally {
                setLoading(false);
            }
        };

        fetchSlots();
    }, [selectedDate, selectedService, isBooking]);

    // Fetch day appointments for side panel
    useEffect(() => {
        const dayAppts = monthAppointments.filter(app => isSameDay(new Date(app.date), selectedDate));
        setAppointments(dayAppts);
    }, [selectedDate, monthAppointments]);

    const handleConfirmBooking = async () => {
        if (!selectedSlot || !selectedService || !caseId) return;
        setIsSubmitting(true);
        const res = await createAppointment({
            clientId: Number(clientId),
            vehicleId: Number(vehicleId),
            serviceId: selectedService.id,
            date: selectedSlot,
            leadCaseId: caseId
        });

        if (res.success) {
            router.push(`/admin/inbox/${caseId}`);
        } else {
            alert("Error: " + res.error);
        }
        setIsSubmitting(false);
    };

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
            <div className="flex-1 p-6 flex flex-col h-full overflow-y-auto">
                <header className="flex justify-between items-center mb-6">
                    <div>
                        <h1 className="text-3xl font-black text-slate-900 capitalize">
                            {format(currentDate, 'MMMM yyyy', { locale: es })}
                        </h1>
                        <p className="text-slate-500">Agenda de Turnos</p>
                    </div>
                    {isBooking && (
                        <div className="bg-blue-600 text-white px-4 py-2 rounded-full text-sm font-bold animate-pulse">
                            MODO AGENDAMIENTO ACTIVO
                        </div>
                    )}
                    <div className="flex gap-2">
                        <button onClick={() => setCurrentDate(subMonths(currentDate, 1))} className="p-2 hover:bg-white rounded-full border border-transparent hover:border-slate-200">
                            <ChevronLeft className="w-6 h-6 text-slate-600" />
                        </button>
                        <button onClick={() => setCurrentDate(new Date())} className="px-4 py-2 text-sm font-bold text-indigo-600 bg-indigo-50 rounded-lg">
                            Hoy
                        </button>
                        <button onClick={() => setCurrentDate(addMonths(currentDate, 1))} className="p-2 hover:bg-white rounded-full border border-transparent hover:border-slate-200">
                            <ChevronRight className="w-6 h-6 text-slate-600" />
                        </button>
                    </div>
                </header>

                <div className="flex-1 bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden flex flex-col min-h-[500px]">
                    <div className="grid grid-cols-7 border-b border-slate-100 bg-slate-50/50">
                        {['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'].map(day => (
                            <div key={day} className="py-3 text-center text-xs font-bold text-slate-400 uppercase">{day}</div>
                        ))}
                    </div>

                    <div className="flex-1 grid grid-cols-7 grid-rows-6">
                        {eachDayOfInterval({
                            start: startOfWeek(startOfMonth(currentDate), { locale: es }),
                            end: endOfWeek(endOfMonth(currentDate), { locale: es })
                        }).map((day) => {
                            const isSelected = isSameDay(day, selectedDate);
                            const dayAppts = monthAppointments.filter(app => isSameDay(new Date(app.date), day));
                            return (
                                <button
                                    key={day.toString()}
                                    onClick={() => setSelectedDate(day)}
                                    className={`relative border-b border-r border-slate-50 p-2 flex flex-col items-center hover:bg-slate-50 transition-all
                                        ${!isSameMonth(day, currentDate) ? 'text-slate-300' : 'text-slate-700'}
                                        ${isSelected ? 'bg-indigo-50 ring-2 ring-inset ring-indigo-500 z-10' : ''}
                                    `}
                                >
                                    <span className={`text-sm font-bold w-8 h-8 flex items-center justify-center rounded-full ${isToday(day) ? 'bg-slate-900 text-white' : ''}`}>
                                        {format(day, 'd')}
                                    </span>
                                    <div className="flex gap-1 flex-wrap justify-center mt-1">
                                        {dayAppts.slice(0, 3).map((a, i) => (
                                            <div key={i} className={`w-1.5 h-1.5 rounded-full ${getStatusColor(a.status)}`} />
                                        ))}
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* Side Panel */}
            <div className="w-full lg:w-96 bg-white border-l border-slate-200 h-full overflow-y-auto p-6 shadow-xl">
                {!isBooking ? (
                    <>
                        <div className="mb-6">
                            <h2 className="text-2xl font-black text-slate-800 capitalize">{format(selectedDate, 'EEEE d', { locale: es })}</h2>
                            <p className="text-slate-500 font-medium capitalize">{format(selectedDate, 'MMMM yyyy', { locale: es })}</p>
                        </div>
                        <div className="space-y-4">
                            {appointments.length > 0 ? (
                                appointments.map((appt) => (
                                    <div key={appt.id} className="p-4 rounded-2xl border border-slate-100 bg-white hover:shadow-md transition-all">
                                        <div className="flex justify-between items-start mb-2">
                                            <span className="text-sm font-bold text-slate-900">{format(new Date(appt.date), 'HH:mm')}</span>
                                            <div className={`w-2 h-2 rounded-full ${getStatusColor(appt.status)}`}></div>
                                        </div>
                                        <h3 className="font-bold text-slate-800">{appt.client.name}</h3>
                                        <p className="text-xs text-slate-500">{appt.vehicle.plate} • {appt.vehicle.brand}</p>
                                    </div>
                                ))
                            ) : (
                                <p className="text-center py-10 text-slate-400 italic">No hay turnos agendados.</p>
                            )}
                        </div>
                    </>
                ) : (
                    <div className="space-y-6">
                        <div className="flex justify-between items-center">
                            <h2 className="text-xl font-black text-slate-800">Agendar Turno</h2>
                            <button onClick={() => setIsBooking(false)} className="text-slate-400 hover:text-slate-600"><X /></button>
                        </div>

                        {/* Step 1: Service */}
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">1. Seleccionar Servicio</label>
                            <select
                                className="w-full p-3 bg-slate-50 border rounded-xl outline-none focus:ring-2 ring-blue-500 font-medium"
                                value={selectedService?.id || ''}
                                onChange={(e) => setSelectedService(services.find(s => s.id === Number(e.target.value)) || null)}
                            >
                                <option value="">Elegir servicio...</option>
                                {services.map(s => (
                                    <option key={s.id} value={s.id}>{s.name} ({s.duration} min)</option>
                                ))}
                            </select>
                        </div>

                        {/* Step 2: Date is selected via calendar */}
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">2. Fecha Seleccionada</label>
                            <div className="p-3 bg-slate-50 border rounded-xl font-bold text-slate-700 capitalize">
                                {format(selectedDate, 'EEEE d MMMM', { locale: es })}
                            </div>
                        </div>

                        {/* Step 3: Slot */}
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">3. Horarios Disponibles</label>
                            {!selectedService ? (
                                <p className="text-xs text-slate-400 italic">Selecciona un servicio primero.</p>
                            ) : loading ? (
                                <p className="text-xs text-blue-500 animate-pulse">Buscando huecos...</p>
                            ) : availableSlots.length === 0 ? (
                                <p className="text-sm text-red-500 bg-red-50 p-3 rounded-lg border border-red-100 font-medium">No hay disponibilidad para este día.</p>
                            ) : (
                                <div className="grid grid-cols-3 gap-2">
                                    {availableSlots.map((slot, i) => (
                                        <button
                                            key={i}
                                            onClick={() => setSelectedSlot(slot)}
                                            className={`py-2 px-1 text-xs font-bold rounded-lg border transition-all ${selectedSlot?.getTime() === slot.getTime()
                                                ? 'bg-blue-600 border-blue-600 text-white shadow-lg'
                                                : 'bg-white text-slate-600 border-slate-200 hover:border-blue-300'
                                                }`}
                                        >
                                            {format(slot, 'HH:mm')}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>

                        <button
                            disabled={!selectedSlot || !selectedService || isSubmitting}
                            onClick={handleConfirmBooking}
                            className="w-full py-4 bg-blue-600 text-white rounded-2xl font-black text-lg shadow-xl shadow-blue-500/30 hover:bg-blue-700 disabled:opacity-50 disabled:shadow-none transition-all flex items-center justify-center gap-2"
                        >
                            {isSubmitting ? 'AGENDANDO...' : <><Check size={20} /> CONFIRMAR TURNO</>}
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}

export default function CalendarPage() {
    return (
        <Suspense fallback={<div className="p-10 text-center text-slate-400">Cargando calendario...</div>}>
            <CalendarContent />
        </Suspense>
    );
}
