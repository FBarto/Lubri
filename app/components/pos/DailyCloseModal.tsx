
'use client';

import { useState, useEffect } from 'react';
import { X, RefreshCcw, Printer } from 'lucide-react';

interface DailyCloseModalProps {
    isOpen: boolean;
    onClose: () => void;
}

interface SummaryData {
    totalSales: number;
    count: number;
    byMethod: {
        CASH: number;
        CARD: number;
        TRANSFER: number;
        OTHER: number;
    };
    details: Array<{
        id: number;
        time: string;
        total: number;
        method: string;
        user: string;
    }>;
}

export default function DailyCloseModal({ isOpen, onClose }: DailyCloseModalProps) {
    const [data, setData] = useState<SummaryData | null>(null);
    const [loading, setLoading] = useState(false);

    const fetchSummary = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/sales/daily-summary');
            if (res.ok) {
                setData(await res.json());
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (isOpen) {
            fetchSummary();
        }
    }, [isOpen]);

    if (!isOpen) return null;

    const today = new Date().toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long' });

    return (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in">
            <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">

                {/* Header */}
                <div className="bg-slate-900 text-white p-6 flex justify-between items-start">
                    <div>
                        <h2 className="text-2xl font-black uppercase tracking-tight">Cierre de Caja</h2>
                        <p className="text-slate-400 font-medium capitalize">{today}</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-lg transition-colors">
                        <X className="w-6 h-6" />
                    </button>
                </div>

                {/* Body */}
                <div className="flex-1 overflow-y-auto p-6 bg-slate-50">
                    {loading ? (
                        <div className="h-40 flex items-center justify-center text-slate-400 font-bold gap-2">
                            <RefreshCcw className="animate-spin" /> Calculando...
                        </div>
                    ) : data ? (
                        <div className="space-y-8">

                            {/* Big Totals */}
                            <div className="grid grid-cols-2 gap-4">
                                <div className="bg-emerald-600 text-white p-6 rounded-2xl shadow-lg shadow-emerald-600/20">
                                    <span className="text-emerald-100 font-bold text-xs uppercase tracking-widest block mb-1">Total Recaudado</span>
                                    <span className="text-4xl font-black font-mono tracking-tighter">${data.totalSales.toLocaleString()}</span>
                                    <div className="mt-2 text-emerald-200 text-sm font-medium">{data.count} Ventas</div>
                                </div>
                                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-center gap-2">
                                    <div className="flex justify-between items-center border-b border-dashed border-slate-200 pb-2">
                                        <span className="font-bold text-slate-500 uppercase text-xs">Efectivo (Caja)</span>
                                        <span className="font-black text-slate-800 text-xl">${data.byMethod.CASH.toLocaleString()}</span>
                                    </div>
                                    <div className="flex justify-between items-center border-b border-dashed border-slate-200 pb-2">
                                        <span className="font-bold text-slate-500 uppercase text-xs">Tarjetas</span>
                                        <span className="font-black text-slate-800 text-xl">${data.byMethod.CARD.toLocaleString()}</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="font-bold text-slate-500 uppercase text-xs">Transferencias</span>
                                        <span className="font-black text-slate-800 text-xl">${data.byMethod.TRANSFER.toLocaleString()}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Detailed List */}
                            <div>
                                <h3 className="font-black text-slate-800 uppercase text-sm tracking-wider mb-4 flex items-center gap-2">
                                    <span>Movimientos del Día</span>
                                    <div className="h-px bg-slate-200 flex-1"></div>
                                </h3>
                                <div className="bg-white rounded-xl border border-slate-200 overflow-hidden text-sm">
                                    <table className="w-full text-left">
                                        <thead className="bg-slate-50 text-slate-500 font-bold uppercase text-xs border-b border-slate-200">
                                            <tr>
                                                <th className="p-3">Hora</th>
                                                <th className="p-3">Detalle / Método</th>
                                                <th className="p-3">Usuario</th>
                                                <th className="p-3 text-right">Monto</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100">
                                            {data.details.map(sale => (
                                                <tr key={sale.id} className="hover:bg-slate-50 transition-colors">
                                                    <td className="p-3 font-mono text-slate-500">{sale.time}</td>
                                                    <td className="p-3 font-medium text-slate-700 truncate max-w-[200px]" title={sale.method}>{sale.method}</td>
                                                    <td className="p-3 text-slate-400">{sale.user}</td>
                                                    <td className="p-3 text-right font-black text-slate-800">${sale.total.toLocaleString()}</td>
                                                </tr>
                                            ))}
                                            {data.details.length === 0 && (
                                                <tr>
                                                    <td colSpan={4} className="p-8 text-center text-slate-400 italic">No hay movimientos hoy</td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>

                        </div>
                    ) : (
                        <div className="text-center text-red-500 font-bold">Error al cargar datos</div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-slate-100 bg-white flex justify-end gap-2">
                    <button
                        onClick={() => window.print()}
                        className="px-4 py-3 text-slate-600 font-bold hover:bg-slate-100 rounded-xl transition-colors flex items-center gap-2"
                    >
                        <Printer size={18} /> Imprimir
                    </button>
                    <button
                        onClick={fetchSummary}
                        className="px-6 py-3 bg-slate-900 text-white font-bold rounded-xl hover:bg-black transition-colors flex items-center gap-2 shadow-lg active:scale-95"
                    >
                        <RefreshCcw size={18} /> Actualizar
                    </button>
                </div>
            </div>
        </div>
    );
}
