'use client';

import { useState, useEffect } from 'react';
import { X, Calendar, Wrench, ChevronRight, FileText, ChevronDown, CheckCircle, AlertCircle, Clock } from 'lucide-react';
import Plate from '../ui/Plate';

interface ClientHistoryModalProps {
    isOpen: boolean;
    onClose: () => void;
    client: any;
}

export default function ClientHistoryModal({ isOpen, onClose, client }: ClientHistoryModalProps) {
    const [history, setHistory] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [expandedId, setExpandedId] = useState<number | null>(null);

    useEffect(() => {
        if (isOpen && client) {
            fetchHistory();
        }
    }, [isOpen, client]);

    const fetchHistory = async () => {
        setLoading(true);
        try {
            const res = await fetch(`/api/work-orders?clientId=${client.id}`);
            const data = await res.json();
            if (Array.isArray(data)) {
                // Sort by date descending
                setHistory(data.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const toggleExpand = (id: number) => {
        setExpandedId(expandedId === id ? null : id);
    };

    if (!isOpen || !client) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-300">
            <div className="bg-white w-full max-w-3xl rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">

                {/* Header */}
                <div className="p-8 bg-slate-900 text-white flex justify-between items-center shrink-0 relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-12 bg-indigo-500/20 blur-3xl rounded-full translate-x-1/2 -translate-y-1/2" />

                    <div className="relative z-10">
                        <h2 className="text-2xl font-black tracking-tight mb-1">Historia del Vehículo</h2>
                        <div className="flex items-center gap-2 text-slate-400 font-medium">
                            <span>{client.name}</span>
                            <span>•</span>
                            <span>{history.length} servicios registrados</span>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="relative z-10 p-3 bg-white/10 hover:bg-white/20 rounded-2xl transition-all backdrop-blur-md"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-8 bg-slate-50">
                    {loading ? (
                        <div className="space-y-8 pl-4 border-l-2 border-slate-200 ml-4">
                            {[1, 2, 3].map(i => (
                                <div key={i} className="pl-8 relative">
                                    <div className="absolute -left-[9px] top-6 w-4 h-4 rounded-full bg-slate-200 border-4 border-slate-50" />
                                    <div className="h-32 bg-white rounded-3xl animate-pulse shadow-sm" />
                                </div>
                            ))}
                        </div>
                    ) : history.length === 0 ? (
                        <div className="text-center py-20">
                            <div className="w-24 h-24 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-6 text-slate-300">
                                <Clock size={48} strokeWidth={1.5} />
                            </div>
                            <h3 className="text-xl font-black text-slate-800 mb-2">Sin historial disponible</h3>
                            <p className="text-slate-500">Este cliente aún no tiene servicios realizados.</p>
                        </div>
                    ) : (
                        <div className="relative">
                            {/* Timeline Line */}
                            <div className="absolute left-4 top-4 bottom-4 w-0.5 bg-slate-200" />

                            <div className="space-y-6">
                                {history.map((wo, index) => {
                                    const isExpanded = expandedId === wo.id;
                                    const isLatest = index === 0;

                                    return (
                                        <div key={wo.id} className="relative pl-12 group">
                                            {/* Timeline Node */}
                                            <div className={`
                                                absolute left-[11px] top-6 w-3 h-3 rounded-full border-2 z-10 transition-all
                                                ${isLatest ? 'bg-indigo-600 border-indigo-200 scale-125' : 'bg-slate-400 border-slate-100'}
                                                ${isExpanded ? 'ring-4 ring-indigo-100' : ''}
                                            `} />

                                            {/* Card */}
                                            <div
                                                onClick={() => toggleExpand(wo.id)}
                                                className={`
                                                    bg-white rounded-3xl border transition-all cursor-pointer overflow-hidden
                                                    ${isExpanded ? 'shadow-lg border-indigo-200 ring-1 ring-indigo-100' : 'shadow-sm border-slate-100 hover:shadow-md hover:border-slate-200'}
                                                `}
                                            >
                                                {/* Card Header */}
                                                <div className="p-5 flex items-start gap-4">
                                                    {/* Date Box */}
                                                    <div className="flex flex-col items-center justify-center bg-slate-50 rounded-2xl p-3 min-w-[70px] border border-slate-100">
                                                        <span className="text-xs font-bold text-slate-400 uppercase">
                                                            {new Date(wo.date).toLocaleDateString('es-AR', { month: 'short' })}
                                                        </span>
                                                        <span className="text-xl font-black text-slate-800">
                                                            {new Date(wo.date).getDate()}
                                                        </span>
                                                        <span className="text-[10px] text-slate-400">
                                                            {new Date(wo.date).getFullYear()}
                                                        </span>
                                                    </div>

                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex justify-between items-start mb-2">
                                                            <div>
                                                                <h4 className="font-bold text-slate-800 text-lg leading-tight truncate">
                                                                    {wo.service?.name}
                                                                </h4>
                                                                <div className="flex items-center gap-2 mt-1">
                                                                    <Plate plate={wo.vehicle?.plate || '???'} size="sm" />
                                                                    <span className="text-xs font-medium text-slate-500 truncate">
                                                                        {wo.vehicle?.brand} {wo.vehicle?.model}
                                                                    </span>
                                                                </div>
                                                            </div>
                                                            <div className={`
                                                                px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider
                                                                ${wo.status === 'COMPLETED' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}
                                                            `}>
                                                                {wo.status}
                                                            </div>
                                                        </div>

                                                        {/* Preview Info */}
                                                        <div className="flex items-center gap-4 text-xs text-slate-500 font-medium">
                                                            <div className="flex items-center gap-1.5">
                                                                <Wrench size={14} className="text-slate-400" />
                                                                <span>{wo.mileage ? `${wo.mileage.toLocaleString()} km` : 'Sin KM'}</span>
                                                            </div>
                                                            {!isExpanded && (
                                                                <span className="text-indigo-600 font-bold flex items-center gap-1">
                                                                    Ver detalles <ChevronDown size={12} />
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Expanded Details */}
                                                {isExpanded && (
                                                    <div className="border-t border-slate-100 bg-slate-50/50 p-5 animate-in slide-in-from-top-2 duration-200">

                                                        {/* Items Used */}
                                                        <div className="mb-4">
                                                            <h5 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                                                                <FileText size={12} />
                                                                Insumos Utilizados
                                                            </h5>
                                                            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                                                                {wo.saleItems?.map((item: any, idx: number) => (
                                                                    <div key={idx} className="flex justify-between items-center p-3 border-b border-slate-100 last:border-0 hover:bg-slate-50 transition-colors">
                                                                        <div className="flex items-center gap-3">
                                                                            <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-xs">
                                                                                x{item.quantity}
                                                                            </div>
                                                                            <span className="font-medium text-slate-700 text-sm">{item.description}</span>
                                                                        </div>
                                                                        <span className="font-mono text-xs font-bold text-slate-400">
                                                                            ${item.unitPrice?.toLocaleString()}
                                                                        </span>
                                                                    </div>
                                                                ))}
                                                                {(!wo.saleItems || wo.saleItems.length === 0) && (
                                                                    <div className="p-4 text-center text-xs text-slate-400 italic">
                                                                        No se registraron items específicos en esta orden.
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>

                                                        {/* Notes if any */}
                                                        {wo.notes && (
                                                            <div className="bg-yellow-50 border border-yellow-100 p-3 rounded-xl text-xs text-yellow-800">
                                                                <span className="font-bold block mb-1">Notas del Mecánico:</span>
                                                                {wo.notes}
                                                            </div>
                                                        )}

                                                        <div className="mt-4 flex justify-end">
                                                            <div className="text-right">
                                                                <span className="block text-[10px] uppercase font-bold text-slate-400">Total Servicio</span>
                                                                <span className="block text-2xl font-black text-slate-900">${wo.price?.toLocaleString()}</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
