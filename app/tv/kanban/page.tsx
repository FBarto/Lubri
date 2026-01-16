'use client';

import { useState, useEffect } from 'react';

export default function TvKanbanPage() {
    const [orders, setOrders] = useState<any[]>([]);

    useEffect(() => {
        const fetchOrders = async () => {
            try {
                const res = await fetch('/api/work-orders/kanban');
                if (res.ok) {
                    const data = await res.json();
                    setOrders(data);
                }
            } catch (error) {
                console.error(error);
            }
        };

        fetchOrders();
        const interval = setInterval(fetchOrders, 10000); // Fast poll for TV
        return () => clearInterval(interval);
    }, []);

    const columns = [
        { id: 'PENDING', title: 'EN ESPERA', color: 'bg-yellow-400', textColor: 'text-yellow-900', border: 'border-yellow-500' },
        { id: 'IN_PROGRESS', title: 'EN SERVICIO', color: 'bg-blue-600', textColor: 'text-white', border: 'border-blue-700' }, // High contrast for active
        { id: 'COMPLETED', title: 'LISTO PARA RETIRAR', color: 'bg-green-500', textColor: 'text-white', border: 'border-green-600' }
    ];

    return (
        <div className="h-screen bg-slate-900 p-4 font-sans overflow-hidden">
            <div className="flex gap-4 h-full">
                {columns.map(col => {
                    const colOrders = orders.filter(o => o.status === col.id);
                    return (
                        <div key={col.id} className={`flex-1 flex flex-col rounded-3xl ${col.id === 'IN_PROGRESS' || col.id === 'COMPLETED' ? 'bg-slate-800' : 'bg-slate-800/50'} border-t-[16px] ${col.border}`}>
                            <div className={`p-6 text-center ${col.color}`}>
                                <h1 className={`text-4xl font-black uppercase tracking-widest ${col.textColor}`}>
                                    {col.title}
                                </h1>
                                <div className="text-xl font-bold mt-2 opacity-80">{colOrders.length} Vehículos</div>
                            </div>

                            <div className="flex-1 p-4 space-y-4 overflow-hidden relative">
                                {/* Marquee effect implementation is complex, just list relevant ones */}
                                {colOrders.slice(0, 5).map(order => ( // Show top 5 to avoid overflow
                                    <div key={order.id} className="bg-white p-6 rounded-2xl shadow-lg border-l-8 border-slate-300 flex justify-between items-center transform transition-all">
                                        <div>
                                            <div className="text-5xl font-black text-slate-900 tracking-tighter mb-2">
                                                {order.vehicle.plate}
                                            </div>
                                            <div className="text-2xl text-slate-500 font-medium">
                                                {order.vehicle.brand} {order.vehicle.model}
                                            </div>
                                        </div>
                                        {col.id === 'IN_PROGRESS' && (
                                            <div className="animate-pulse bg-blue-100 text-blue-800 px-4 py-2 rounded-xl text-xl font-bold">
                                                🔧 Trabajando
                                            </div>
                                        )}
                                        {col.id === 'COMPLETED' && (
                                            <div className="bg-green-100 text-green-800 px-4 py-2 rounded-xl text-xl font-bold">
                                                ✅ OK
                                            </div>
                                        )}
                                    </div>
                                ))}
                                {colOrders.length > 5 && (
                                    <div className="text-center text-slate-500 text-2xl font-bold mt-4 animate-bounce">
                                        + {colOrders.length - 5} más...
                                    </div>
                                )}
                                {colOrders.length === 0 && (
                                    <div className="h-full flex items-center justify-center text-slate-600 text-3xl font-light italic">
                                        -- Vacío --
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
