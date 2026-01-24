'use client';

import { useState, useEffect } from 'react';
import {
    ShoppingCart,
    Wrench,
    FilePlus,
    Inbox,
    AlertTriangle,
    Calendar,
    Clock,
    TrendingUp,
    Car,
    CheckCircle,
    ArrowRight
} from 'lucide-react';
import StatCard from '../dashboard/StatCard';

interface DashboardData {
    stats: {
        pending: number;
        inProgress: number;
        completed: number;
        salesTotal: number;
    };
    lowStock: any[];
    appointments: any[];
}

interface EmployeeDashboardProps {
    onNavigate: (tab: any) => void;
}

export default function EmployeeDashboard({ onNavigate }: EmployeeDashboardProps) {
    const [data, setData] = useState<DashboardData | null>(null);
    const [loading, setLoading] = useState(true);

    const fetchData = async () => {
        try {
            const res = await fetch('/api/employee/dashboard');
            if (res.ok) {
                const json = await res.json();
                setData(json);
            }
        } catch (error) {
            console.error('Error fetching dashboard data:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
        const interval = setInterval(fetchData, 60000); // Poll every minute
        return () => clearInterval(interval);
    }, []);

    if (loading) return (
        <div className="flex-1 flex items-center justify-center p-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-slate-900"></div>
        </div>
    );

    const quickActions = [
        { label: 'Nueva Venta', icon: <ShoppingCart />, color: 'bg-emerald-600', tab: 'VENDER', desc: 'Abrir el punto de venta' },
        { label: 'Cotizar', icon: <FilePlus />, color: 'bg-orange-600', tab: 'COTIZAR', desc: 'Crear presupuesto Smart' },
        { label: 'Taller', icon: <Wrench />, color: 'bg-red-600', tab: 'TALLER', desc: 'Gestionar vehículos activos' },
        { label: 'Inbox', icon: <Inbox />, color: 'bg-sky-600', tab: 'INBOX', desc: 'Ver mensajes de clientes' },
    ];

    return (
        <div className="flex-1 overflow-y-auto p-6 bg-slate-50/50">
            <div className="max-w-7xl mx-auto space-y-8">

                {/* Header Section */}
                <div>
                    <h1 className="text-3xl font-black text-slate-900 tracking-tight">¡Hola de nuevo! 👋</h1>
                    <p className="text-slate-500 font-medium">Esto es lo que está pasando hoy en el lubricentro.</p>
                </div>

                {/* Main Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <StatCard
                        title="En Espera"
                        value={data?.stats.pending || 0}
                        icon={<Clock className="text-amber-500" />}
                    />
                    <StatCard
                        title="En Servicio"
                        value={data?.stats.inProgress || 0}
                        icon={<Wrench className="text-blue-500" />}
                    />
                    <StatCard
                        title="Listos"
                        value={data?.stats.completed || 0}
                        icon={<CheckCircle className="text-emerald-500" />}
                    />
                    <StatCard
                        title="Ventas Hoy"
                        value={`$${(data?.stats.salesTotal || 0).toLocaleString()}`}
                        icon={<TrendingUp className="text-indigo-500" />}
                    />
                </div>

                {/* Quick Actions Grid */}
                <div>
                    <h2 className="text-sm font-black text-slate-400 uppercase tracking-widest mb-4">Acciones Rápidas</h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        {quickActions.map((action) => (
                            <button
                                key={action.tab}
                                onClick={() => onNavigate(action.tab)}
                                className="group flex flex-col p-5 bg-white border border-slate-100 rounded-2xl shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all text-left"
                            >
                                <div className={`${action.color} text-white p-3 rounded-xl w-fit mb-4 group-hover:scale-110 transition-transform shadow-lg`}>
                                    {action.icon}
                                </div>
                                <span className="font-black text-slate-800 text-lg leading-tight">{action.label}</span>
                                <span className="text-xs text-slate-400 font-medium mt-1">{action.desc}</span>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Bottom Widgets Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

                    {/* Appointments Widget */}
                    <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
                        <div className="p-6 border-b border-slate-50 flex justify-between items-center">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-purple-100 text-purple-600 rounded-lg">
                                    <Calendar size={20} />
                                </div>
                                <h3 className="font-black text-slate-800">Próximos Turnos</h3>
                            </div>
                            <button
                                onClick={() => onNavigate('TURNOS')}
                                className="text-xs font-bold text-indigo-600 hover:text-indigo-700 flex items-center gap-1 group"
                            >
                                Ver todos <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                            </button>
                        </div>
                        <div className="p-2">
                            {data?.appointments.length === 0 ? (
                                <div className="p-8 text-center text-slate-400 italic">No hay turnos para hoy.</div>
                            ) : (
                                data?.appointments.map((apt: any) => (
                                    <div key={apt.id} className="flex items-center justify-between p-4 hover:bg-slate-50 rounded-2xl transition-colors">
                                        <div className="flex items-center gap-4">
                                            <div className="text-center min-w-[50px]">
                                                <span className="block font-black text-slate-800">{apt.time}</span>
                                            </div>
                                            <div className="h-8 w-[1px] bg-slate-100"></div>
                                            <div>
                                                <span className="block font-bold text-slate-700">{apt.clientName}</span>
                                                <span className="text-xs text-slate-400 font-medium uppercase">{apt.vehicle} • {apt.plate}</span>
                                            </div>
                                        </div>
                                        <div className="p-2 bg-slate-100 rounded-full text-slate-400">
                                            <Car size={16} />
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>

                    {/* Stock Alerts Widget */}
                    <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
                        <div className="p-6 border-b border-slate-50 flex justify-between items-center bg-amber-50/30">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-amber-100 text-amber-600 rounded-lg">
                                    <AlertTriangle size={20} />
                                </div>
                                <h3 className="font-black text-slate-800">Alertas de Stock</h3>
                            </div>
                            <button
                                onClick={() => onNavigate('STOCK')}
                                className="text-xs font-bold text-amber-600 hover:text-amber-700 flex items-center gap-1 group"
                            >
                                Ver Inventario <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                            </button>
                        </div>
                        <div className="p-4">
                            {data?.lowStock.length === 0 ? (
                                <div className="p-8 text-center text-slate-400 italic">Todo en orden con el stock.</div>
                            ) : (
                                <div className="space-y-3">
                                    {data?.lowStock.map((item: any) => (
                                        <div key={item.id} className="flex items-center justify-between p-4 bg-white border border-slate-100 rounded-2xl shadow-sm">
                                            <div>
                                                <span className="block font-bold text-slate-700">{item.name}</span>
                                                <span className="text-xs font-medium text-red-500">Quedan {item.stock} unidades</span>
                                            </div>
                                            <div className="bg-red-50 text-red-600 text-[10px] font-black px-2 py-1 rounded-full uppercase tracking-tighter">
                                                Crítico
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
}
