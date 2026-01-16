'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';

export const dynamic = 'force-dynamic';

// Types
type Appointment = {
    id: number;
    date: string;
    status: string;
    client: { name: string; phone: string };
    vehicle: { plate: string; brand: string; model: string };
    service: { name: string; price: number; duration: number };
};

// Main Content Component
function AdminAppointmentsContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    // Default to today
    const initialDate = searchParams.get('date') || new Date().toISOString().split('T')[0];

    // -- State for Day View --
    const [date, setDate] = useState(initialDate);
    const [appointments, setAppointments] = useState<Appointment[]>([]);
    const [loadingDay, setLoadingDay] = useState(false);

    // -- State for Week View --
    const [weekAppointments, setWeekAppointments] = useState<Appointment[]>([]);
    const [loadingWeek, setLoadingWeek] = useState(false);

    // Fetch Day Appointments
    const fetchAppointments = async () => {
        setLoadingDay(true);
        try {
            const res = await fetch(`/api/appointments?date=${date}`);
            const data = await res.json();
            if (Array.isArray(data)) {
                setAppointments(data);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoadingDay(false);
        }
    };

    // Fetch Week Appointments (Today -> Today + 7)
    const fetchWeekAppointments = async () => {
        setLoadingWeek(true);
        try {
            const today = new Date();
            const nextWeek = new Date(today);
            nextWeek.setDate(today.getDate() + 7);

            const from = today.toISOString().split('T')[0];
            const to = nextWeek.toISOString().split('T')[0];

            const res = await fetch(`/api/appointments?from=${from}&to=${to}`);
            const data = await res.json();
            if (Array.isArray(data)) {
                setWeekAppointments(data);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoadingWeek(false);
        }
    };

    useEffect(() => {
        fetchAppointments();
    }, [date]);

    useEffect(() => {
        fetchWeekAppointments();
    }, []); // Only fetch once on mount

    const updateStatus = async (id: number, status: string) => {
        if (!confirm(`¿Cambiar estado a ${status}?`)) return;
        try {
            const res = await fetch(`/api/appointments/${id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status })
            });
            if (res.ok) {
                fetchAppointments();
                fetchWeekAppointments(); // Update week list too
            }
        } catch (e) {
            alert('Error updating status');
        }
    };

    const StatusBadge = ({ status }: { status: string }) => {
        const colors: any = {
            'RESERVED': 'bg-yellow-100 text-yellow-800',
            'CONFIRMED': 'bg-blue-100 text-blue-700',
            'DONE': 'bg-green-100 text-green-700',
            'CANCELLED': 'bg-slate-100 text-slate-500',
            'NO_SHOW': 'bg-red-100 text-red-700',
        };
        return (
            <span className={`px-3 py-1 rounded-full text-xs font-bold ${colors[status] || 'bg-gray-100'}`}>
                {status}
            </span>
        );
    }

    const AppointmentCard = ({ appt, compact = false }: { appt: Appointment, compact?: boolean }) => {
        const time = new Date(appt.date).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' });
        const isCancelled = appt.status === 'CANCELLED';

        return (
            <div className={`bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col lg:flex-row gap-6 items-start lg:items-center transition-all ${isCancelled ? 'opacity-60 grayscale' : ''}`}>
                <div className="flex items-center gap-4 shrink-0">
                    <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center font-black text-xl text-slate-700">
                        {time}
                    </div>
                </div>

                <div className="flex-1 space-y-2">
                    <div className="flex justify-between items-start">
                        <div>
                            <h3 className="font-bold text-lg text-slate-900">{appt.client.name}</h3>
                            {compact && (
                                <p className="text-xs text-slate-500">
                                    {new Date(appt.date).toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'short' })}
                                </p>
                            )}
                        </div>
                        <StatusBadge status={appt.status} />
                    </div>
                    <div className="text-sm text-slate-500 space-y-1">
                        <div className="flex items-center gap-2">
                            <span>📱 {appt.client.phone}</span>
                            <span>•</span>
                            <span>🚗 <span className="font-bold">{appt.vehicle.plate}</span></span>
                        </div>
                        <div className="font-medium text-slate-700">
                            🔧 {appt.service.name}
                        </div>
                    </div>
                </div>

                {!compact && (
                    <div className="flex flex-wrap gap-2 w-full lg:w-auto mt-2 lg:mt-0 justify-end">
                        {appt.status === 'RESERVED' && (
                            <>
                                <button onClick={() => updateStatus(appt.id, 'CONFIRMED')} className="px-3 py-1 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700 text-xs shadow-md shadow-blue-500/20">Confirmar</button>
                                <button onClick={() => updateStatus(appt.id, 'CANCELLED')} className="px-3 py-1 bg-slate-100 text-slate-600 rounded-lg font-bold hover:bg-slate-200 text-xs">X</button>
                            </>
                        )}
                        {appt.status === 'CONFIRMED' && (
                            <>
                                <Link href={`/admin/work-orders/new?appointmentId=${appt.id}`} className="px-3 py-1 bg-emerald-600 text-white rounded-lg font-bold hover:bg-emerald-700 text-xs flex items-center gap-2 shadow-md shadow-emerald-500/20">
                                    🚀 Iniciar
                                </Link>
                                <button onClick={() => updateStatus(appt.id, 'NO_SHOW')} className="px-3 py-1 bg-red-100 text-red-600 rounded-lg font-bold hover:bg-red-200 text-xs">Ausente</button>
                            </>
                        )}
                        {appt.status === 'DONE' && (
                            <Link href={`/admin/work-orders`} className="text-emerald-600 font-bold text-sm hover:underline">
                                Ver Orden
                            </Link>
                        )}
                    </div>
                )}
            </div>
        );
    };

    return (
        <div className="fade-in max-w-6xl mx-auto space-y-12">

            {/* --- SECTION 1: DAY VIEW --- */}
            <section>
                <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
                    <div>
                        <h1 className="text-3xl font-extrabold text-slate-900">Agenda del Día</h1>
                        <p className="text-slate-500">Gestioná las reservas del día seleccionado.</p>
                    </div>
                    <div className="flex items-center gap-2 bg-white p-2 rounded-xl shadow-sm border border-slate-200">
                        <input
                            type="date"
                            value={date}
                            onChange={(e) => setDate(e.target.value)}
                            className="p-2 font-bold text-slate-700 bg-transparent outline-none"
                        />
                    </div>
                </header>

                {loadingDay ? (
                    <div className="text-center py-20 text-slate-400">Cargando agenda...</div>
                ) : appointments.length === 0 ? (
                    <div className="text-center py-12 bg-slate-50 rounded-[2rem] border border-dashed border-slate-200 mb-8">
                        <p className="text-slate-400">No hay turnos para esta fecha.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 gap-4">
                        {appointments.map((appt) => (
                            <AppointmentCard key={appt.id} appt={appt} />
                        ))}
                    </div>
                )}
            </section>

            {/* --- SECTION 2: COMING UP (WEEKLY) --- */}
            <section className="pt-8 border-t border-slate-200">
                <header className="mb-8">
                    <h2 className="text-2xl font-bold text-slate-900 mb-2">Próximos 7 Días 📅</h2>
                    <p className="text-slate-500">Vista rápida de la carga de trabajo semanal.</p>
                </header>

                {loadingWeek ? (
                    <div className="text-center py-10 text-slate-400">Cargando semana...</div>
                ) : weekAppointments.length === 0 ? (
                    <div className="text-center py-10 bg-white rounded-2xl border border-slate-100">
                        <p className="text-slate-400">No hay futuros turnos esta semana.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {weekAppointments.map((appt) => (
                            <AppointmentCard key={`week-${appt.id}`} appt={appt} compact={true} />
                        ))}
                    </div>
                )}
            </section>

        </div>
    );
}

// Exported Page Component
import { Suspense } from 'react';

export default function AdminAppointments() {
    return (
        <Suspense fallback={<div className="p-10 text-center text-slate-400">Cargando módulo de turnos...</div>}>
            <AdminAppointmentsContent />
        </Suspense>
    );
}
