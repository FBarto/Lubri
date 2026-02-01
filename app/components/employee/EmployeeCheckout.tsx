'use client';

import { useState, useEffect } from 'react';
import { getPendingSales, finalizePendingSale } from '@/app/lib/business-actions';
import { ShoppingBag, ChevronRight, CheckCircle2, User, Clock, Package, CreditCard, Banknote, Landmark } from 'lucide-react';
import { useSession } from 'next-auth/react';

export default function EmployeeCheckout() {
    const { data: session } = useSession();
    const [pendingSales, setPendingSales] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [finishingId, setFinishingId] = useState<number | null>(null);

    const fetchPending = async () => {
        setLoading(true);
        try {
            const res = await getPendingSales();
            if (res.success && res.data) {
                setPendingSales(res.data);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPending();
        // Optional: Poll every 10 seconds to auto-refresh list
        const interval = setInterval(fetchPending, 10000);
        return () => clearInterval(interval);
    }, []);

    const handleFinalize = async (saleId: number, paymentMethod: string) => {
        if (!confirm(`¿Confirmar cobro de Venta #${saleId} por ${paymentMethod}?`)) return;

        setFinishingId(saleId);
        try {
            const res = await finalizePendingSale(saleId, paymentMethod, session?.user?.id ? Number(session.user.id) : 1);

            if (res.success) {
                // Determine logic for receipt? 
                // For now just refresh
                await fetchPending();
                alert('Venta cobrada correctamente!');
            } else {
                alert("Error: " + res.error);
            }
        } catch (e) {
            console.error(e);
            alert('Error de conexión');
        } finally {
            setFinishingId(null);
        }
    };

    return (
        <div className="flex flex-col h-full bg-slate-50">
            {/* Header */}
            <div className="bg-white px-6 py-6 border-b border-slate-200 shadow-sm flex-none">
                <div className="flex items-center gap-4">
                    <div className="p-3 bg-emerald-100 text-emerald-600 rounded-xl">
                        <Banknote size={28} />
                    </div>
                    <div>
                        <h1 className="text-2xl font-black text-slate-800 tracking-tight">Caja Central</h1>
                        <p className="text-slate-500 font-medium text-sm">Gestionar cobros de ventas finalizadas</p>
                    </div>
                </div>
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto p-6">
                {loading && pendingSales.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center space-y-4">
                        <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
                        <p className="text-slate-400 font-bold">Buscando cobros pendientes...</p>
                    </div>
                ) : pendingSales.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-slate-400 space-y-4 opacity-50">
                        <div className="p-6 bg-slate-100 rounded-full">
                            <CheckCircle2 size={64} strokeWidth={1.5} className="text-slate-400" />
                        </div>
                        <div className="text-center">
                            <p className="text-xl font-bold text-slate-600">Todo al día</p>
                            <p className="font-medium text-sm">No hay ventas pendientes de cobro.</p>
                        </div>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {pendingSales.map((sale) => (
                            <div key={sale.id} className="bg-white rounded-[2rem] border border-slate-200 shadow-sm overflow-hidden flex flex-col hover:shadow-md transition-all">
                                {/* Card Header */}
                                <div className="p-5 border-b border-slate-100 bg-slate-50/50 flex justify-between items-start">
                                    <div>
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className="bg-amber-100 text-amber-700 text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider">
                                                Pendiente
                                            </span>
                                            <span className="text-[10px] text-slate-400 font-bold">#{sale.id}</span>
                                        </div>
                                        <div className="text-3xl font-black text-slate-800 tracking-tighter">
                                            ${sale.total.toLocaleString()}
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1 flex items-center justify-end gap-1">
                                            <Clock size={10} /> Hora
                                        </div>
                                        <div className="text-sm font-bold text-slate-700">
                                            {new Date(sale.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </div>
                                    </div>
                                </div>

                                {/* Items */}
                                <div className="p-5 flex-1 space-y-3">
                                    <div className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">
                                        <User size={12} />
                                        {sale.client?.name || 'Consumidor Final'}
                                    </div>

                                    <div className="space-y-2 max-h-[150px] overflow-y-auto pr-2 custom-scrollbar">
                                        {sale.items.map((item: any, idx: number) => (
                                            <div key={idx} className="flex justify-between items-center text-sm group">
                                                <div className="flex items-center gap-2 overflow-hidden">
                                                    <span className="font-bold text-slate-700 shrink-0">{item.quantity}x</span>
                                                    <span className="text-slate-600 truncate text-xs">{item.description}</span>
                                                </div>
                                                <span className="font-bold text-slate-900 ml-2">${item.subtotal.toLocaleString()}</span>
                                            </div>
                                        ))}
                                    </div>

                                    {sale.notes && (
                                        <div className="bg-yellow-50 p-2 rounded-lg text-xs text-yellow-800 italic mt-2">
                                            "{sale.notes}"
                                        </div>
                                    )}
                                </div>

                                {/* Actions */}
                                <div className="p-5 pt-0 mt-auto space-y-2">
                                    <p className="text-[10px] text-center font-bold text-slate-400 uppercase tracking-widest mb-2">Seleccionar Método de Cobro</p>
                                    <div className="grid grid-cols-3 gap-2">
                                        <button
                                            onClick={() => handleFinalize(sale.id, 'Efectivo')}
                                            disabled={finishingId === sale.id}
                                            className="flex flex-col items-center justify-center p-3 rounded-xl bg-emerald-50 text-emerald-700 hover:bg-emerald-100 hover:scale-105 active:scale-95 transition-all gap-1 border border-emerald-100"
                                        >
                                            <Banknote size={20} />
                                            <span className="text-[10px] font-bold uppercase">Efectivo</span>
                                        </button>
                                        <button
                                            onClick={() => handleFinalize(sale.id, 'Tarjeta')}
                                            disabled={finishingId === sale.id}
                                            className="flex flex-col items-center justify-center p-3 rounded-xl bg-blue-50 text-blue-700 hover:bg-blue-100 hover:scale-105 active:scale-95 transition-all gap-1 border border-blue-100"
                                        >
                                            <CreditCard size={20} />
                                            <span className="text-[10px] font-bold uppercase">Tarjeta</span>
                                        </button>
                                        <button
                                            onClick={() => handleFinalize(sale.id, 'Transferencia')}
                                            disabled={finishingId === sale.id}
                                            className="flex flex-col items-center justify-center p-3 rounded-xl bg-purple-50 text-purple-700 hover:bg-purple-100 hover:scale-105 active:scale-95 transition-all gap-1 border border-purple-100"
                                        >
                                            <Landmark size={20} />
                                            <span className="text-[10px] font-bold uppercase">Transf.</span>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
