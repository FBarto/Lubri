'use client';

import { useState, useEffect } from 'react';
import { getPendingSales, finalizePendingSale } from '../../actions/business';
import { ShoppingBag, ChevronRight, CheckCircle2, User, Clock, Package } from 'lucide-react';
import { useSession } from 'next-auth/react';

interface PendingSalesSliderProps {
    onFinalized: () => void;
    isOpen: boolean;
    onClose: () => void;
}

export default function PendingSalesSlider({ onFinalized, isOpen, onClose }: PendingSalesSliderProps) {
    const { data: session } = useSession();
    const [pendingSales, setPendingSales] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [finishingId, setFinishingId] = useState<number | null>(null);

    const fetchPending = async () => {
        setLoading(true);
        const res = await getPendingSales();
        if (res.success && res.data) {
            setPendingSales(res.data);
        }
        setLoading(false);
    };

    useEffect(() => {
        if (isOpen) {
            fetchPending();
        }
    }, [isOpen]);

    const handleFinalize = async (saleId: number) => {
        // For simplicity in this v1, we'll prompt for payment method 
        // In a real scenario, this would trigger the actual CheckoutModal
        const method = window.prompt("Método de Pago (Efectivo, Tarjeta, Transferencia):", "Efectivo");
        if (!method) return;

        setFinishingId(saleId);
        const res = await finalizePendingSale(saleId, method, session?.user?.id ? Number(session.user.id) : 1);

        if (res.success) {
            await fetchPending();
            onFinalized();
        } else {
            alert("Error: " + res.error);
        }
        setFinishingId(null);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-y-0 right-0 w-full md:w-[450px] bg-white shadow-2xl z-[100] border-l border-slate-200 flex flex-col transform transition-transform animate-in slide-in-from-right duration-300">
            {/* Header */}
            <div className="p-6 bg-slate-900 text-white flex justify-between items-center shadow-lg">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-emerald-500 rounded-lg">
                        <ShoppingBag size={24} />
                    </div>
                    <div>
                        <h2 className="text-xl font-black italic tracking-tight uppercase">Cobros Pendientes</h2>
                        <p className="text-[10px] text-emerald-300 font-bold uppercase tracking-widest">Caja Central</p>
                    </div>
                </div>
                <button
                    onClick={onClose}
                    className="p-2 hover:bg-white/10 rounded-full transition-colors"
                >
                    <ChevronRight size={24} />
                </button>
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto p-4 bg-slate-50 space-y-4">
                {loading ? (
                    <div className="h-full flex items-center justify-center text-slate-400 font-bold animate-pulse">Cargando pendientes...</div>
                ) : pendingSales.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-slate-400 space-y-4 opacity-50">
                        <CheckCircle2 size={64} strokeWidth={1} />
                        <p className="font-bold text-center">¡No hay cobros pendientes!<br /><span className="text-xs font-normal">Todo al día.</span></p>
                    </div>
                ) : (
                    pendingSales.map((sale) => (
                        <div key={sale.id} className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden hover:border-emerald-500/50 transition-all group">
                            <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                                <div>
                                    <h3 className="font-black text-slate-800 uppercase italic">Venta #{sale.id}</h3>
                                    <div className="flex items-center gap-2 text-[10px] text-slate-500 font-bold">
                                        <Clock size={10} />
                                        {new Date(sale.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        <span className="mx-1">•</span>
                                        <User size={10} />
                                        Gastón o {sale.user?.name || 'Empleado'}
                                    </div>
                                </div>
                                <div className="text-right">
                                    <span className="text-2xl font-black text-slate-900 tracking-tighter">${sale.total.toLocaleString()}</span>
                                </div>
                            </div>

                            <div className="p-4 space-y-2">
                                <p className="text-[10px] uppercase font-bold text-slate-400 tracking-widest flex items-center gap-1">
                                    <Package size={10} /> Items ({sale.items.length})
                                </p>
                                <div className="space-y-1">
                                    {sale.items.map((item: any, idx: number) => (
                                        <div key={idx} className="flex justify-between text-xs">
                                            <span className="text-slate-600 truncate mr-2">{item.quantity}x {item.description}</span>
                                            <span className="font-bold text-slate-800">${item.subtotal.toLocaleString()}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="p-4 bg-slate-50 border-t border-slate-100">
                                <button
                                    onClick={() => handleFinalize(sale.id)}
                                    disabled={finishingId === sale.id}
                                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-black py-3 rounded-xl shadow-lg shadow-emerald-600/20 active:scale-[0.98] transition-all flex items-center justify-center gap-2 group-hover:scale-[1.02]"
                                >
                                    {finishingId === sale.id ? 'PROCESANDO...' : 'COBRAR AHORA'}
                                    <ChevronRight size={18} />
                                </button>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Footer Tip */}
            <div className="p-4 bg-white border-t border-slate-200 text-center">
                <p className="text-[10px] text-slate-400 font-medium">Las ventas pendientes no descuentan stock hasta ser cobradas.</p>
            </div>
        </div>
    );
}
