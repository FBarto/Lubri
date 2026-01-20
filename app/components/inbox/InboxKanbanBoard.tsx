'use client';

import { useState, useEffect } from 'react';
import { getInboxKanbanBoard, updateCaseStatus } from '../../lib/inbox-actions';
import { useRouter } from 'next/navigation';
import { Loader2, AlertCircle, Clock, CheckCircle2, ArrowRight } from 'lucide-react';
import Link from 'next/link';

type CaseStatus = 'NEW' | 'IN_PROGRESS' | 'WAITING_CUSTOMER' | 'READY_TO_SCHEDULE' | 'SCHEDULED';

export default function InboxKanbanBoard() {
    const [cases, setCases] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    const fetchBoard = async () => {
        const res = await getInboxKanbanBoard();
        if (res.success && res.data) {
            setCases(res.data);
        }
        setLoading(false);
    };

    useEffect(() => {
        fetchBoard();
        const interval = setInterval(fetchBoard, 30000); // 30s poll
        return () => clearInterval(interval);
    }, []);

    const handleMove = async (id: string, newStatus: CaseStatus) => {
        // Optimistic
        const oldCases = [...cases];
        setCases(prev => prev.map(c => c.id === id ? { ...c, status: newStatus } : c));

        const res = await updateCaseStatus(id, newStatus);
        if (!res.success) {
            alert('Error al mover caso');
            setCases(oldCases); // Revert
        }
    };

    const columns: { id: CaseStatus; title: string; color: string }[] = [
        { id: 'NEW', title: 'NUEVOS', color: 'bg-indigo-50 border-indigo-200' },
        { id: 'IN_PROGRESS', title: 'EN GESTIÓN', color: 'bg-blue-50 border-blue-200' },
        { id: 'WAITING_CUSTOMER', title: 'ESPERANDO CLIENTE', color: 'bg-amber-50 border-amber-200' },
        { id: 'READY_TO_SCHEDULE', title: 'LISTO PARA AGENDAR', color: 'bg-emerald-50 border-emerald-200' }
    ];

    if (loading) return <div className="p-12 flex justify-center text-slate-400"><Loader2 className="animate-spin" /></div>;

    return (
        <div className="h-full flex flex-col">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold text-slate-800">Tablero Inbox</h1>
                <button onClick={fetchBoard} className="text-sm px-3 py-1 bg-white border rounded shadow-sm hover:bg-slate-50">
                    ↻ Actualizar
                </button>
            </div>

            <div className="flex-1 overflow-x-auto pb-4">
                <div className="flex gap-4 h-full min-w-[1200px]">
                    {columns.map(col => {
                        const colCases = cases.filter(c => c.status === col.id);
                        return (
                            <div key={col.id} className={`flex-1 flex flex-col rounded-xl border-t-4 ${col.color} bg-white shadow-sm h-full`}>
                                <div className="p-3 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
                                    <h3 className="font-bold text-slate-700 text-sm tracking-wide">{col.title}</h3>
                                    <span className="text-xs font-bold bg-white px-2 py-0.5 rounded-full shadow-sm">{colCases.length}</span>
                                </div>

                                <div className="flex-1 overflow-y-auto p-3 space-y-3 bg-slate-50/30">
                                    {colCases.map(c => (
                                        <div key={c.id} className="bg-white p-3 rounded-lg border border-slate-200 shadow-sm hover:shadow-md transition-all group relative">
                                            {/* SLA Badge */}
                                            {new Date(c.slaDueAt) < new Date() && (
                                                <div className="absolute top-2 right-2 text-red-500 font-bold text-[10px] flex items-center gap-1 bg-red-50 px-1.5 py-0.5 rounded">
                                                    <AlertCircle className="w-3 h-3" /> SLA
                                                </div>
                                            )}

                                            <div className="mb-2 pr-8">
                                                <div className="font-bold text-slate-800 text-sm truncate">
                                                    {c.client?.name || 'Cliente Nuevo'}
                                                </div>
                                                <div className="text-xs text-slate-500 truncate">
                                                    {c.vehicle ? `${c.vehicle.brand} ${c.vehicle.model}` : 'Vehículo no asignado'}
                                                </div>
                                            </div>

                                            <p className="text-xs text-slate-600 line-clamp-2 mb-3 bg-slate-50 p-1.5 rounded border border-slate-100">
                                                {c.summary}
                                            </p>

                                            <div className="flex justify-between items-center pt-2 border-t border-slate-50">
                                                <Link href={`/admin/inbox/${c.id}`} className="text-xs font-bold text-blue-600 hover:underline">
                                                    Ver Detalle
                                                </Link>

                                                {/* Quick Actions */}
                                                <div className="flex gap-1">
                                                    {col.id === 'NEW' && (
                                                        <button onClick={() => handleMove(c.id, 'IN_PROGRESS')} className="p-1 hover:bg-blue-100 rounded text-blue-600" title="Pasar a Gestión">
                                                            <ArrowRight className="w-4 h-4" />
                                                        </button>
                                                    )}
                                                    {col.id === 'IN_PROGRESS' && (
                                                        <>
                                                            <button onClick={() => handleMove(c.id, 'WAITING_CUSTOMER')} className="p-1 hover:bg-amber-100 rounded text-amber-600" title="Esperando Cliente">
                                                                <Clock className="w-4 h-4" />
                                                            </button>
                                                            <button onClick={() => handleMove(c.id, 'READY_TO_SCHEDULE')} className="p-1 hover:bg-emerald-100 rounded text-emerald-600" title="Listo para Agendar">
                                                                <CheckCircle2 className="w-4 h-4" />
                                                            </button>
                                                        </>
                                                    )}
                                                    {col.id === 'WAITING_CUSTOMER' && (
                                                        <button onClick={() => handleMove(c.id, 'IN_PROGRESS')} className="p-1 hover:bg-blue-100 rounded text-blue-600" title="Volver a Gestión">
                                                            <ArrowRight className="w-4 h-4" />
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
