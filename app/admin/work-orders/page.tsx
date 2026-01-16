'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function WorkOrdersList() {
    const [workOrders, setWorkOrders] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);

    const fetchOrders = async () => {
        setLoading(true);
        try {
            // Filter by date if needed, or implement range. For now daily view or all.
            // Let's load by date to keep it consistent.
            const res = await fetch(`/api/work-orders?date=${date}`);
            const data = await res.json();
            if (Array.isArray(data)) {
                setWorkOrders(data);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchOrders();
    }, [date]);

    return (
        <div className="fade-in max-w-6xl mx-auto">
            <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
                <div>
                    <h1 className="text-3xl font-extrabold text-slate-900">Historial de Servicios</h1>
                    <p className="text-slate-500">Órdenes de trabajo realizadas.</p>
                </div>
                <div className="flex gap-2">
                    <div className="flex items-center gap-2 bg-white p-2 rounded-xl shadow-sm border border-slate-200">
                        <input
                            type="date"
                            value={date}
                            onChange={(e) => setDate(e.target.value)}
                            className="p-2 font-bold text-slate-700 bg-transparent outline-none"
                        />
                    </div>
                </div>
            </header>

            {loading ? (
                <div className="text-center py-20 text-slate-400">Cargando...</div>
            ) : workOrders.length === 0 ? (
                <div className="text-center py-20 bg-slate-50 rounded-[2rem] border border-dashed border-slate-200">
                    <p className="text-slate-500 text-lg">No hay órdenes registradas para esta fecha.</p>
                </div>
            ) : (
                <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
                    <table className="w-full">
                        <thead className="bg-slate-50 border-b border-slate-100">
                            <tr>
                                <th className="text-left p-6 text-xs font-bold text-slate-400 uppercase tracking-wider">Hora</th>
                                <th className="text-left p-6 text-xs font-bold text-slate-400 uppercase tracking-wider">Cliente / Vehículo</th>
                                <th className="text-left p-6 text-xs font-bold text-slate-400 uppercase tracking-wider">Servicio</th>
                                <th className="text-right p-6 text-xs font-bold text-slate-400 uppercase tracking-wider">Monto</th>
                                <th className="p-6"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {workOrders.map((wo) => (
                                <tr key={wo.id} className="hover:bg-slate-50 transition-colors">
                                    <td className="p-6 font-bold text-slate-700">
                                        {new Date(wo.date).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}
                                    </td>
                                    <td className="p-6">
                                        <p className="font-bold text-slate-900">{wo.client.name}</p>
                                        <p className="text-xs text-slate-500 mt-1 uppercase font-bold bg-slate-100 inline-block px-2 py-0.5 rounded">{wo.vehicle.plate}</p>
                                    </td>
                                    <td className="p-6">
                                        <p className="font-medium text-slate-700">{wo.service.name}</p>
                                        {wo.mileage && <p className="text-xs text-slate-400 mt-1">{wo.mileage} km</p>}
                                    </td>
                                    <td className="p-6 text-right">
                                        <span className="font-bold text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full">
                                            ${wo.price.toLocaleString('es-AR')}
                                        </span>
                                    </td>
                                    <td className="p-6 text-right">
                                        <Link href={`/admin/work-orders/${wo.id}`} className="text-blue-600 font-bold text-sm hover:underline">
                                            Ver
                                        </Link>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}
