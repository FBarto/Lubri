'use client';

import { useState, useEffect } from 'react';
import { CheckCircle, Wrench, Clock, Activity } from 'lucide-react';

interface PublicOrder {
    id: number;
    status: 'IN_PROGRESS' | 'COMPLETED';
    vehicle: {
        brand: string;
        model: string;
        plate: string;
    };
    service: {
        name: string;
    };
    date: string;
}

export default function TvPublicPage() {
    const [orders, setOrders] = useState<PublicOrder[]>([]);
    const [loading, setLoading] = useState(true);
    const [time, setTime] = useState(new Date());

    const fetchOrders = async () => {
        try {
            const res = await fetch('/api/public/kanban');
            if (res.ok) {
                const data = await res.json();
                setOrders(data);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchOrders();
        // Update clock every second
        const clockInterval = setInterval(() => setTime(new Date()), 1000);
        // Update data every 10 seconds
        const dataInterval = setInterval(fetchOrders, 10000);

        return () => {
            clearInterval(clockInterval);
            clearInterval(dataInterval);
        };
    }, []);

    const inProgress = orders.filter(o => o.status === 'IN_PROGRESS');
    const completed = orders.filter(o => o.status === 'COMPLETED');

    if (loading) return <div className="h-screen bg-slate-900 flex items-center justify-center text-white font-bold text-2xl">Cargando...</div>;

    return (
        <div className="h-screen bg-slate-900 text-white flex flex-col overflow-hidden font-sans">
            {/* Header / StatusBar */}
            <div className="bg-slate-800 p-6 flex justify-between items-center shadow-lg shrink-0 border-b border-slate-700">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center shadow-lg shadow-blue-500/50">
                        <Activity size={32} />
                    </div>
                    <div>
                        <h1 className="text-3xl font-black tracking-tight text-white uppercase">Estado del Taller</h1>
                        <p className="text-slate-400 font-medium">Actualización en tiempo real</p>
                    </div>
                </div>
                <div className="text-right">
                    <div className="text-4xl font-black font-mono tracking-widest text-blue-400">
                        {time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                    <div className="text-slate-500 font-bold uppercase tracking-wider text-sm">
                        {time.toLocaleDateString([], { weekday: 'long', day: 'numeric', month: 'long' })}
                    </div>
                </div>
            </div>

            {/* Content Columns */}
            <div className="flex-1 flex p-6 gap-6 overflow-hidden">
                {/* IN PROGRESS */}
                <div className="flex-1 flex flex-col bg-slate-800/50 rounded-3xl border border-slate-700 overflow-hidden backdrop-blur-sm">
                    <div className="p-6 bg-blue-600/10 border-b border-blue-600/20 flex items-center gap-3">
                        <div className="p-2 bg-blue-600 rounded-lg animate-pulse">
                            <Wrench size={24} className="text-white" />
                        </div>
                        <h2 className="text-2xl font-black text-blue-100 uppercase tracking-widest flex-1">En Servicio</h2>
                        <span className="bg-blue-900 text-blue-200 px-3 py-1 rounded-full text-lg font-bold border border-blue-700">{inProgress.length}</span>
                    </div>

                    <div className="flex-1 p-4 space-y-4 overflow-y-auto custom-scrollbar">
                        {inProgress.map(order => (
                            <div key={order.id} className="bg-slate-800 p-6 rounded-2xl border border-slate-700 shadow-xl flex justify-between items-center group relative overflow-hidden">
                                <div className="absolute left-0 top-0 bottom-0 w-2 bg-blue-500" />
                                <div>
                                    <h3 className="text-4xl font-black tracking-tight text-white mb-2">{order.vehicle.plate}</h3>
                                    <p className="text-xl text-slate-400 font-medium">{order.vehicle.brand} {order.vehicle.model}</p>
                                    <div className="flex items-center gap-2 mt-2 text-blue-400">
                                        <Wrench size={16} />
                                        <span className="text-sm font-bold uppercase">{order.service.name}</span>
                                    </div>
                                </div>
                                <div className="text-right opacity-50">
                                    <Clock size={40} className="text-slate-600" />
                                </div>
                            </div>
                        ))}
                        {inProgress.length === 0 && (
                            <div className="h-full flex flex-col items-center justify-center text-slate-600 opacity-50">
                                <Wrench size={64} className="mb-4" />
                                <p className="text-2xl font-bold uppercase">Sin vehículos</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* COMPLETED */}
                <div className="flex-1 flex flex-col bg-slate-800/50 rounded-3xl border border-slate-700 overflow-hidden backdrop-blur-sm">
                    <div className="p-6 bg-emerald-600/10 border-b border-emerald-600/20 flex items-center gap-3">
                        <div className="p-2 bg-emerald-600 rounded-lg">
                            <CheckCircle size={24} className="text-white" />
                        </div>
                        <h2 className="text-2xl font-black text-emerald-100 uppercase tracking-widest flex-1">Listos para Retirar</h2>
                        <span className="bg-emerald-900 text-emerald-200 px-3 py-1 rounded-full text-lg font-bold border border-emerald-700">{completed.length}</span>
                    </div>

                    <div className="flex-1 p-4 space-y-4 overflow-y-auto custom-scrollbar">
                        {completed.map(order => (
                            <div key={order.id} className="bg-slate-800 p-6 rounded-2xl border border-slate-700 shadow-xl flex justify-between items-center group relative overflow-hidden animate-in slide-in-from-right-5 duration-500">
                                <div className="absolute left-0 top-0 bottom-0 w-2 bg-emerald-500" />
                                <div>
                                    <h3 className="text-4xl font-black tracking-tight text-white mb-2">{order.vehicle.plate}</h3>
                                    <p className="text-xl text-slate-400 font-medium">{order.vehicle.brand} {order.vehicle.model}</p>
                                    <div className="flex items-center gap-2 mt-2 text-emerald-400">
                                        <CheckCircle size={16} />
                                        <span className="text-sm font-bold uppercase">¡Listo!</span>
                                    </div>
                                </div>
                                <div className="bg-emerald-500/20 p-3 rounded-full text-emerald-500">
                                    <CheckCircle size={40} />
                                </div>
                            </div>
                        ))}
                        {completed.length === 0 && (
                            <div className="h-full flex flex-col items-center justify-center text-slate-600 opacity-50">
                                <CheckCircle size={64} className="mb-4" />
                                <p className="text-2xl font-bold uppercase">Sin vehículos listos</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <style jsx global>{`
                .custom-scrollbar::-webkit-scrollbar {
                    width: 8px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: rgba(255, 255, 255, 0.05); 
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: rgba(255, 255, 255, 0.1); 
                    border-radius: 4px;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                    background: rgba(255, 255, 255, 0.2); 
                }
            `}</style>
        </div>
    );
}
