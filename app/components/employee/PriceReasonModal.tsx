'use client';

import { useState, useEffect } from 'react';

interface PriceReasonModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (newPrice: number, reason: string) => void;
    currentPrice: number;
}

export default function PriceReasonModal({ isOpen, onClose, onConfirm, currentPrice }: PriceReasonModalProps) {
    const [price, setPrice] = useState(currentPrice);
    const [reason, setReason] = useState('');

    useEffect(() => {
        if (isOpen) {
            setPrice(currentPrice);
            setReason('');
        }
    }, [isOpen, currentPrice]);

    if (!isOpen) return null;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (reason.trim().length < 3) return; // Simple validation
        onConfirm(price, reason);
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-xl max-w-sm w-full p-6 animate-in fade-in zoom-in-95 duration-200">
                <h3 className="text-lg font-bold text-slate-900 mb-4">Modificar Precio</h3>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
                            Nuevo Precio
                        </label>
                        <div className="relative">
                            <span className="absolute left-3 top-2.5 text-slate-400 font-bold">$</span>
                            <input
                                type="number"
                                className="w-full pl-7 pr-4 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-slate-900 focus:border-slate-900 outline-none font-bold text-lg"
                                value={price}
                                onChange={(e) => setPrice(Number(e.target.value))}
                                autoFocus
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
                            Motivo (Obligatorio)
                        </label>
                        <textarea
                            className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-slate-900 focus:border-slate-900 outline-none text-sm min-h-[80px]"
                            placeholder="Ej: Descuento autorizado por G.Beca..."
                            value={reason}
                            onChange={(e) => setReason(e.target.value)}
                            required
                        />
                    </div>

                    <div className="flex gap-3 pt-2">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 py-2.5 rounded-lg border border-slate-300 text-slate-700 font-bold hover:bg-slate-50 transition-colors"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            disabled={reason.trim().length < 3}
                            className="flex-1 py-2.5 rounded-lg bg-slate-900 text-white font-bold hover:bg-slate-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            Aplicar
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
