'use client';

import { AlertTriangle, Plus, X } from 'lucide-react';

interface StockAlertModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    itemName: string;
    availableStock: number;
}

export default function StockAlertModal({ isOpen, onClose, onConfirm, itemName, availableStock }: StockAlertModalProps) {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-[100] animate-in fade-in duration-200">
            <div className="bg-white rounded-[2.5rem] w-full max-w-sm p-8 shadow-2xl scale-in group border-2 border-red-50">
                <div className="flex flex-col items-center text-center">
                    <div className="w-20 h-20 bg-red-50 text-red-500 rounded-full flex items-center justify-center mb-6 animate-pulse">
                        <AlertTriangle size={40} />
                    </div>

                    <h2 className="text-2xl font-black text-slate-800 mb-2">¡Stock Insuficiente!</h2>
                    <p className="text-slate-500 mb-6 leading-relaxed">
                        Solo quedan <span className="font-black text-red-600 underline">u{availableStock}</span> de
                        <span className="font-bold text-slate-700 block mt-1">"{itemName}"</span>
                        ¿Deseas agregarlo igual y permitir stock negativo?
                    </p>

                    <div className="grid grid-cols-1 w-full gap-3">
                        <button
                            onClick={onConfirm}
                            className="bg-red-500 text-white py-4 rounded-2xl font-bold hover:bg-red-600 shadow-lg shadow-red-200 transition-all active:scale-95 flex items-center justify-center gap-2"
                        >
                            <Plus size={20} /> AGREGAR IGUAL
                        </button>
                        <button
                            onClick={onClose}
                            className="bg-slate-100 text-slate-600 py-4 rounded-2xl font-bold hover:bg-slate-200 transition-all flex items-center justify-center gap-2"
                        >
                            <X size={20} /> CANCELAR
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
