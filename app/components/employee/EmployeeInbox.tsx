'use client';

import { useEffect, useState } from 'react';
import { getInboxCases } from '../../lib/inbox-actions';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { Plus } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function EmployeeInbox() {
    const [cases, setCases] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        loadCases();
    }, []);

    const loadCases = async () => {
        setLoading(true);
        const res = await getInboxCases();
        if (res.success && res.data) {
            setCases(res.data);
        }
        setLoading(false);
    };

    return (
        <div className="h-full flex flex-col bg-slate-50">
            <div className="p-4 bg-white border-b border-slate-200 flex justify-between items-center shadow-sm">
                <div>
                    <h2 className="text-xl font-black text-slate-800 tracking-tight">Inbox - Operativo</h2>
                    <p className="text-xs text-slate-500">Gestión de Turnos y Presupuestos</p>
                </div>
                <button
                    onClick={() => router.push('/employee/inbox/new')}
                    className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg shadow-md transition-all active:scale-95 flex items-center gap-2 text-sm"
                >
                    <Plus size={18} />
                    Nuevo
                </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4">
                {loading ? (
                    <div className="text-center py-10 text-slate-400 animate-pulse">Cargando casos...</div>
                ) : cases.length === 0 ? (
                    <div className="text-center py-10 text-slate-400">
                        <p className="text-lg font-bold">Todo limpio ✨</p>
                        <p className="text-sm">No hay casos activos pendientes.</p>
                    </div>
                ) : (
                    <div className="grid gap-3">
                        {cases.map(c => {
                            const isOverdue = new Date() > new Date(c.slaDueAt);
                            return (
                                <div
                                    key={c.id}
                                    onClick={() => router.push(`/employee/inbox/${c.id}`)}
                                    className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-all cursor-pointer group relative overflow-hidden"
                                >
                                    <div className={`absolute left-0 top-0 bottom-0 w-1 ${c.priority === 'HIGH' ? 'bg-red-500' : c.priority === 'MEDIUM' ? 'bg-amber-500' : 'bg-blue-500'}`}></div>

                                    <div className="flex justify-between items-start mb-1 pl-2">
                                        <div className="flex items-center gap-2">
                                            <span className="text-xs font-bold bg-slate-100 text-slate-600 px-2 py-0.5 rounded uppercase">{c.serviceCategory}</span>
                                            <span className={`text-[10px] font-bold uppercase tracking-wider ${isOverdue ? 'text-red-500' : 'text-slate-400'}`}>
                                                {formatDistanceToNow(new Date(c.slaDueAt), { addSuffix: true, locale: es })}
                                            </span>
                                        </div>
                                        <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${c.status === 'NEW' ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-600'}`}>
                                            {c.status.replace(/_/g, ' ')}
                                        </span>
                                    </div>

                                    <div className="pl-2">
                                        <h3 className="font-bold text-slate-800 text-base">{c.summary}</h3>
                                        <div className="flex justify-between items-end mt-2">
                                            <p className="text-xs text-slate-500">
                                                {c.client ? c.client.name : 'Sin cliente'} • {c.vehicle ? c.vehicle.model : 'Sin vehículo'}
                                            </p>

                                            {c.assignedToUser && (
                                                <div className="flex items-center gap-1.5 opacity-60">
                                                    <div className="w-5 h-5 rounded-full bg-slate-200 flex items-center justify-center text-[10px] font-bold text-slate-600 border border-slate-300">
                                                        {c.assignedToUser.username[0].toUpperCase()}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}
