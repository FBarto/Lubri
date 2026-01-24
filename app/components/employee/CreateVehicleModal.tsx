'use client';

import { useState } from 'react';
import { X, Car, CheckCircle2, Loader2, Gauge } from 'lucide-react';

interface CreateVehicleModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: (vehicle: any) => void;
    clientId: number | null;
    clientName?: string;
}

export default function CreateVehicleModal({ isOpen, onClose, onSuccess, clientId, clientName }: CreateVehicleModalProps) {
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        plate: '',
        brand: '',
        model: '',
        mileage: ''
    });

    if (!isOpen || !clientId) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        const payload = {
            ...formData,
            clientId: clientId,
            type: 'Auto/Camioneta' // Default
        };

        try {
            const res = await fetch('/api/vehicles', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            const data = await res.json();

            if (res.ok) {
                onSuccess(data);
                setFormData({ plate: '', brand: '', model: '', mileage: '' });
            } else {
                alert(data.error || 'Error al guardar vehículo');
            }
        } catch (error) {
            console.error(error);
            alert('Error de conexión');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-[2px] p-4 animate-in fade-in duration-200">
            <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden scale-in zoom-in-95 duration-200">

                {/* Header with Client Context */}
                <div className="bg-slate-900 p-6 flex justify-between items-start">
                    <div>
                        <h2 className="text-xl font-black text-white flex items-center gap-2">
                            <Car className="text-indigo-400" />
                            Agregar Vehículo
                        </h2>
                        <p className="text-slate-400 text-sm font-medium mt-1">
                            Vinculando a <span className="text-white font-bold">{clientName}</span>
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-8 space-y-6">

                    <div className="grid grid-cols-2 gap-6">
                        <div className="col-span-2 sm:col-span-1 space-y-1">
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Patente</label>
                            <input
                                autoFocus
                                required
                                type="text"
                                placeholder="AA 123 BB"
                                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none font-mono font-bold text-lg uppercase transition-all"
                                value={formData.plate}
                                onChange={e => setFormData({ ...formData, plate: e.target.value.toUpperCase() })}
                            />
                        </div>
                        <div className="col-span-2 sm:col-span-1 space-y-1">
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Kilometraje</label>
                            <div className="relative">
                                <Gauge className="absolute left-3 top-3.5 text-slate-400 w-4 h-4" />
                                <input
                                    type="number"
                                    placeholder="0"
                                    className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none font-medium transition-all"
                                    value={formData.mileage}
                                    onChange={e => setFormData({ ...formData, mileage: e.target.value })}
                                />
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-6">
                        <div className="space-y-1">
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Marca</label>
                            <input
                                type="text"
                                placeholder="Toyota"
                                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none font-medium transition-all"
                                value={formData.brand}
                                onChange={e => setFormData({ ...formData, brand: e.target.value })}
                            />
                        </div>
                        <div className="space-y-1">
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Modelo</label>
                            <input
                                type="text"
                                placeholder="Hilux"
                                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none font-medium transition-all"
                                value={formData.model}
                                onChange={e => setFormData({ ...formData, model: e.target.value })}
                            />
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={loading || !formData.plate}
                        className="w-full bg-slate-900 text-white py-4 rounded-xl font-bold hover:bg-black disabled:opacity-50 disabled:cursor-not-allowed shadow-xl hover:shadow-2xl hover:-translate-y-1 transition-all flex items-center justify-center gap-2 group"
                    >
                        {loading ? (
                            <Loader2 className="w-5 h-5 animate-spin" />
                        ) : (
                            <>
                                <CheckCircle2 className="w-5 h-5 text-emerald-400 group-hover:text-emerald-300" />
                                Guardar Vehículo
                            </>
                        )}
                    </button>

                </form>
            </div>
        </div>
    );
}
