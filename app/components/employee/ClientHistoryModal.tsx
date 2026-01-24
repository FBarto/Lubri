'use client';

import { useState, useEffect } from 'react';
import { X, Calendar, Wrench, ChevronRight, FileText } from 'lucide-react';

interface ClientHistoryModalProps {
    isOpen: boolean;
    onClose: () => void;
    client: any;
}

export default function ClientHistoryModal({ isOpen, onClose, client }: ClientHistoryModalProps) {
    const [history, setHistory] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (isOpen && client) {
            fetchHistory();
        }
    }, [isOpen, client]);

    const fetchHistory = async () => {
        setLoading(true);
        // We'll use the existing work-orders API filtering by clientId
        try {
            const res = await fetch(`/api/work-orders?clientId=${client.id}`);
            const data = await res.json();
            if (Array.isArray(data)) {
                setHistory(data);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen || !client) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-300">
            <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">

                {/* Header */}
                <div className="p-6 bg-slate-900 text-white flex justify-between items-center shrink-0">
                    <div>
                        <h2 className="text-xl font-black">Historial de Servicios</h2>
                        <p className="text-slate-400 text-sm">{client.name}</p>
                    </div>
                    <button onClick={onClose} className="p-2 bg-slate-800 hover:bg-slate-700 rounded-xl transition-colors">
                        <X size={20} />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6 bg-slate-50">
                    {loading ? (
                        <div className="space-y-4">
                            {[1, 2, 3].map(i => (
                                <div key={i} className="h-24 bg-white rounded-2xl animate-pulse shadow-sm" />
                            ))}
                        </div>
                    ) : history.length === 0 ? (
                        <div className="text-center py-12 text-slate-400">
                            <div className="w-16 h-16 bg-slate-200 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-400">
                                <FileText size={32} />
                            </div>
                            <p className="font-bold">Sin historial registrado</p>
                            <p className="text-sm">Este cliente no tiene servicios previos.</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {history.map((wo) => (
                                <div key={wo.id} className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 hover:border-blue-200 transition-all group">
                                    <div className="flex justify-between items-start mb-3">
                                        <div className="flex items-center gap-3">
                                            <div className="bg-blue-50 text-blue-600 p-2 rounded-lg">
                                                <Calendar size={18} />
                                            </div>
                                            <div>
                                                <div className="font-bold text-slate-800 text-lg">
                                                    {new Date(wo.date).toLocaleDateString()}
                                                </div>
                                                <div className="text-xs text-slate-500 font-bold uppercase tracking-wide">
                                                    {wo.vehicle?.brand} {wo.vehicle?.model} • {wo.vehicle?.plate}
                                                </div>
                                            </div>
                                        </div>
                                        <div className={`px-3 py-1 rounded-lg text-xs font-black uppercase ${wo.status === 'COMPLETED' || wo.status === 'DELIVERED'
                                                ? 'bg-emerald-100 text-emerald-700'
                                                : 'bg-amber-100 text-amber-700'
                                            }`}>
                                            {wo.status}
                                        </div>
                                    </div>

                                    <div className="pl-[3.25rem]">
                                        <div className="text-sm text-slate-700 font-medium mb-2">
                                            <span className="text-blue-600 font-bold">{wo.service?.name}</span>
                                        </div>

                                        {/* Items Preview */}
                                        {(wo.saleItems && wo.saleItems.length > 0) && (
                                            <div className="bg-slate-50 rounded-xl p-3 text-xs space-y-1">
                                                {wo.saleItems.map((item: any, idx: number) => (
                                                    <div key={idx} className="flex justify-between text-slate-500">
                                                        <span>{item.description}</span>
                                                        <span className="font-mono">x{item.quantity}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        )}

                                        <div className="mt-3 pt-3 border-t border-slate-50 flex justify-between items-center">
                                            <span className="text-xs text-slate-400 font-bold">
                                                {wo.mileage ? `${wo.mileage.toLocaleString()} KM` : 'KM No registrado'}
                                            </span>
                                            <div className="font-black text-slate-900">
                                                ${wo.price.toLocaleString()}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
