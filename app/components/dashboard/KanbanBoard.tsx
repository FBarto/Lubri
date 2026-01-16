'use client';

import { useState, useEffect, useCallback } from 'react';

// --- Types ---
export type AppointmentStatus = 'REQUESTED' | 'CONFIRMED' | 'TODAY_QUEUE' | 'IN_PROGRESS' | 'DONE' | 'CANCELLED' | 'NO_SHOW';

interface Client {
    id: number;
    name: string;
    phone: string;
}

interface Vehicle {
    id: number;
    plate: string;
    brand: string;
    model: string;
}

interface Service {
    id: number;
    name: string;
    duration: number;
}

interface Appointment {
    id: number;
    date: string;
    status: AppointmentStatus;
    client: Client;
    vehicle: Vehicle;
    service: Service;
    notes?: string;
}

// --- Columns Configuration ---
const COLUMNS: { id: AppointmentStatus; title: string; color: string }[] = [
    { id: 'REQUESTED', title: 'Solicitado', color: 'bg-yellow-50 border-yellow-200' },
    { id: 'CONFIRMED', title: 'Confirmado', color: 'bg-blue-50 border-blue-200' },
    { id: 'TODAY_QUEUE', title: 'En Cola (Hoy)', color: 'bg-orange-50 border-orange-200' },
    { id: 'IN_PROGRESS', title: 'En Servicio', color: 'bg-indigo-50 border-indigo-200' },
    { id: 'DONE', title: 'Finalizado', color: 'bg-green-50 border-green-200' },
    { id: 'CANCELLED', title: 'Cancelado', color: 'bg-red-50 border-red-200' },
];

// --- Stats Interface ---
interface DashboardStats {
    appointments: {
        today: number;
        pending: number;
        occupancy: number;
    };
    sales: {
        today: number;
    };
}

interface KanbanBoardProps {
    showHeader?: boolean;
    title?: string;
}

export default function KanbanBoard({ showHeader = true, title = 'Tablero de Control' }: KanbanBoardProps) {
    const [appointments, setAppointments] = useState<Appointment[]>([]);
    const [stats, setStats] = useState<DashboardStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [draggedAppt, setDraggedAppt] = useState<Appointment | null>(null);

    const fetchAppointments = useCallback(async () => {
        setLoading(true);
        try {
            const [apptRes, statsRes] = await Promise.all([
                fetch('/api/appointments'),
                fetch('/api/stats/dashboard')
            ]);

            const data = await apptRes.json();
            const statsData = await statsRes.json();

            if (Array.isArray(data)) setAppointments(data);
            if (statsData.appointments) setStats(statsData);

        } catch (error) {
            console.error('Error fetching dashboard data:', error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchAppointments();
    }, [fetchAppointments]);

    const updateStatus = async (id: number, newStatus: AppointmentStatus) => {
        setAppointments(prev => prev.map(a => a.id === id ? { ...a, status: newStatus } : a));

        try {
            const res = await fetch(`/api/appointments/${id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: newStatus })
            });
            if (!res.ok) throw new Error('Failed to update');
        } catch (error) {
            console.error(error);
            fetchAppointments();
            alert('Error updating status');
        }
    };

    const handleDragStart = (e: React.DragEvent, appt: Appointment) => {
        setDraggedAppt(appt);
        e.dataTransfer.effectAllowed = 'move';
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
    };

    const handleDrop = (e: React.DragEvent, status: AppointmentStatus) => {
        e.preventDefault();
        if (draggedAppt && draggedAppt.status !== status) {
            updateStatus(draggedAppt.id, status);
        }
        setDraggedAppt(null);
    };

    const handleWhatsApp = (phone: string, status: string) => {
        const msg = status === 'REQUESTED'
            ? 'Hola! Recibimos tu solicitud de turno en FB Lubricentro.'
            : 'Hola! Te contactamos de FB Lubricentro.';
        window.open(`https://wa.me/${phone}?text=${encodeURIComponent(msg)}`, '_blank');
    };

    if (loading && appointments.length === 0) {
        return <div className="h-full flex items-center justify-center text-slate-400 font-bold animate-pulse">Cargando tablero...</div>;
    }

    return (
        <div className="flex flex-col h-full bg-slate-50/50 p-4 rounded-xl">
            {showHeader && (
                <header className="mb-6 flex flex-col md:flex-row justify-between items-start md:items-center shrink-0 gap-4">
                    <div>
                        <h2 className="text-2xl font-black text-slate-900 tracking-tight">{title}</h2>
                        <p className="text-slate-500 font-medium text-sm">Vista en tiempo real</p>
                    </div>

                    {stats && (
                        <div className="flex gap-3 overflow-x-auto pb-2 w-full md:w-auto">
                            <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-sm min-w-[140px] flex flex-col justify-center">
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Ventas Hoy</span>
                                <span className="text-xl font-black text-slate-800">${stats.sales.today.toLocaleString()}</span>
                            </div>
                            <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-sm min-w-[140px] flex flex-col justify-center">
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Turnos Hoy</span>
                                <span className="text-xl font-black text-slate-800">{stats.appointments.today} <span className="text-xs font-normal text-slate-400">/ 20</span></span>
                            </div>
                            <div className={`p-3 rounded-xl border shadow-sm min-w-[140px] flex flex-col justify-center ${stats.appointments.pending > 0 ? 'bg-yellow-50 border-yellow-200' : 'bg-white border-slate-200'}`}>
                                <span className={`text-[10px] font-bold uppercase tracking-wider ${stats.appointments.pending > 0 ? 'text-yellow-600' : 'text-slate-400'}`}>Pendientes</span>
                                <span className={`text-xl font-black ${stats.appointments.pending > 0 ? 'text-yellow-700' : 'text-slate-800'}`}>{stats.appointments.pending}</span>
                            </div>
                        </div>
                    )}

                    <button
                        onClick={fetchAppointments}
                        className="bg-white px-4 py-2 rounded-xl text-slate-600 font-bold border border-slate-200 hover:bg-slate-50 transition-all shadow-sm active:scale-95 text-sm"
                    >
                        ↻
                    </button>
                </header>
            )}

            <div className="flex-1 overflow-x-auto overflow-y-hidden pb-4">
                <div className="flex gap-4 h-full min-w-max">
                    {COLUMNS.map(col => {
                        const colAppts = appointments.filter(a => a.status === col.id);
                        return (
                            <div
                                key={col.id}
                                className={`w-80 flex-shrink-0 flex flex-col rounded-2xl border-2 ${col.color} transition-colors`}
                                onDragOver={handleDragOver}
                                onDrop={(e) => handleDrop(e, col.id)}
                            >
                                <div className="p-4 border-b border-black/5 flex justify-between items-center bg-white/40 sticky top-0 rounded-t-2xl backdrop-blur-sm">
                                    <h3 className="font-black text-slate-700 uppercase tracking-wide text-sm">
                                        {col.title}
                                    </h3>
                                    <span className="bg-slate-900 text-white text-xs font-bold px-2 py-1 rounded-full">
                                        {colAppts.length}
                                    </span>
                                </div>

                                <div className="flex-1 overflow-y-auto p-3 space-y-3 custom-scrollbar">
                                    {colAppts.map(appt => (
                                        <div
                                            key={appt.id}
                                            draggable
                                            onDragStart={(e) => handleDragStart(e, appt)}
                                            className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 hover:shadow-md hover:-translate-y-1 transition-all cursor-grab active:cursor-grabbing group relative"
                                        >
                                            <div className="flex justify-between items-start mb-2">
                                                <span className="font-mono text-xs font-bold text-slate-400 bg-slate-50 px-2 py-1 rounded-md border border-slate-100">
                                                    {new Date(appt.date).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })} hs
                                                </span>
                                                <div className="flex gap-1">
                                                    <button
                                                        onClick={() => handleWhatsApp(appt.client.phone, appt.status)}
                                                        className="text-green-500 hover:bg-green-50 p-1.5 rounded-lg transition-colors"
                                                        title="Enviar WhatsApp"
                                                    >
                                                        📱
                                                    </button>
                                                </div>
                                            </div>

                                            <h4 className="font-bold text-slate-800 text-lg leading-tight mb-1">
                                                {appt.vehicle.plate}
                                            </h4>

                                            <div className="text-sm text-slate-600 mb-2 truncate">
                                                {appt.vehicle.brand} {appt.vehicle.model}
                                            </div>

                                            <div className="flex items-center gap-2 mb-3">
                                                <div className="h-6 w-6 rounded-full bg-slate-100 flex items-center justify-center text-[10px] font-black text-slate-500">
                                                    {appt.client.name.charAt(0)}
                                                </div>
                                                <span className="text-xs font-bold text-slate-500 truncate">{appt.client.name}</span>
                                            </div>

                                            <div className="bg-slate-50 p-2 rounded-lg border border-slate-100 text-xs font-medium text-slate-600">
                                                🛠️ {appt.service.name}
                                            </div>
                                        </div>
                                    ))}
                                    {colAppts.length === 0 && (
                                        <div className="h-24 border-2 border-dashed border-slate-300/50 rounded-xl flex items-center justify-center text-slate-400 text-sm font-medium">
                                            Vacío
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}

