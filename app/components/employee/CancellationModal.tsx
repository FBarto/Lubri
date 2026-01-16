'use client';
import { useState } from 'react';

interface CancellationModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (reason: string) => void;
}

export default function CancellationModal({ isOpen, onClose, onConfirm }: CancellationModalProps) {
    const [reason, setReason] = useState('');

    if (!isOpen) return null;

    const handleSubmit = () => {
        if (!reason.trim()) return;
        onConfirm(reason);
        setReason('');
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
                <div className="bg-red-600 p-4 text-white">
                    <h2 className="text-lg font-black uppercase tracking-wide">Cancelar Venta</h2>
                    <p className="text-red-100 text-sm">Esta acción requiere auditoría</p>
                </div>

                <div className="p-6">
                    <label className="block text-sm font-bold text-slate-700 mb-2">
                        Motivo de Cancelación (Obligatorio)
                    </label>
                    <textarea
                        autoFocus
                        value={reason}
                        onChange={e => setReason(e.target.value)}
                        className="w-full border-2 border-slate-200 rounded-lg p-3 text-slate-800 focus:border-red-500 focus:outline-none transition-colors font-medium"
                        rows={3}
                        placeholder="Ej: Cliente no quiso esperar..."
                    />

                    <div className="flex gap-3 mt-6 justify-end">
                        <button
                            onClick={onClose}
                            className="px-4 py-2 text-slate-500 font-bold hover:bg-slate-100 rounded-lg transition-colors"
                        >
                            Volver
                        </button>
                        <button
                            onClick={handleSubmit}
                            disabled={!reason.trim()}
                            className="bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white px-6 py-2 rounded-lg font-black transition-colors"
                        >
                            CONFIRMAR CANCELACIÓN
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
