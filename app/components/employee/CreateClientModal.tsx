'use client';

import { useState } from 'react';
import { X, User, Phone, Loader2 } from 'lucide-react';

interface CreateClientModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: (client: any) => void;
}

export default function CreateClientModal({ isOpen, onClose, onSuccess }: CreateClientModalProps) {
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        phone: ''
    });

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const res = await fetch('/api/clients', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });

            const data = await res.json();

            if (res.ok) {
                onSuccess(data);
                setFormData({ name: '', phone: '' }); // Reset
            } else {
                alert(data.error || 'Error al crear cliente');
            }
        } catch (error) {
            console.error(error);
            alert('Error de conexión');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-[2px] p-4 animate-in fade-in duration-200">
            <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden scale-in zoom-in-95 duration-200">
                <div className="bg-slate-50 p-6 border-b border-slate-100 flex justify-between items-center">
                    <div>
                        <h2 className="text-xl font-black text-slate-900">Nuevo Cliente</h2>
                        <p className="text-sm text-slate-500 font-medium">Ingresa los datos básicos</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-slate-200 rounded-full text-slate-400 hover:text-slate-600 transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div className="space-y-1">
                        <label className="text-sm font-bold text-slate-700 ml-1">Nombre Completo</label>
                        <div className="relative">
                            <User className="absolute left-4 top-3.5 text-slate-400 w-5 h-5" />
                            <input
                                autoFocus
                                required
                                type="text"
                                placeholder="Ej: Juan Pérez"
                                className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none font-medium transition-all"
                                value={formData.name}
                                onChange={e => setFormData({ ...formData, name: e.target.value })}
                            />
                        </div>
                    </div>

                    <div className="space-y-1">
                        <label className="text-sm font-bold text-slate-700 ml-1">Teléfono / WhatsApp</label>
                        <div className="relative">
                            <Phone className="absolute left-4 top-3.5 text-slate-400 w-5 h-5" />
                            <input
                                required
                                type="tel"
                                placeholder="Ej: 351..."
                                className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none font-medium transition-all"
                                value={formData.phone}
                                onChange={e => setFormData({ ...formData, phone: e.target.value })}
                            />
                        </div>
                    </div>

                    <div className="pt-4 flex gap-3">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 py-3 text-slate-600 font-bold hover:bg-slate-50 rounded-xl transition-colors"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            disabled={loading || !formData.name || !formData.phone}
                            className="flex-1 bg-indigo-600 text-white py-3 rounded-xl font-bold hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-indigo-200 transition-all flex items-center justify-center gap-2"
                        >
                            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Guardar Cliente'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
