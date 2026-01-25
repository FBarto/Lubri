'use client';

import { useState } from 'react';
import { X, Car, CheckCircle2, Loader2, Gauge, AlertCircle } from 'lucide-react';

interface CreateVehicleModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: (vehicle: any) => void;
    clientId: number | null;
    clientName?: string;
}

export default function CreateVehicleModal({ isOpen, onClose, onSuccess, clientId, clientName }: CreateVehicleModalProps) {
    const [loading, setLoading] = useState(false);
    const [activeField, setActiveField] = useState<'brand' | 'model' | null>(null); // Autocomplete State
    const [plateError, setPlateError] = useState<string | null>(null);
    const [formData, setFormData] = useState({
        plate: '',
        brand: '',
        model: '',
        mileage: '',
        fuelType: 'Nafta', // Default
        engine: ''
    });

    const validatePlate = (plate: string) => {
        // Regex Patterns
        const mercosur = /^[A-Z]{2}\s*\d{3}\s*[A-Z]{2}$/; // AA 123 BB
        const old = /^[A-Z]{3}\s*\d{3}$/;                // AAA 123
        const moto = /^\d{3}\s*[A-Z]{3}$/;               // 123 AAA
        const motoNew = /^[A-Z]{1}\s*\d{3}\s*[A-Z]{3}$/; // A 123 AAA

        if (!plate) return null;

        if (mercosur.test(plate) || old.test(plate) || moto.test(plate) || motoNew.test(plate)) {
            return null;
        }
        return "Formato inválido (Ej: AA 123 BB o AAA 123)";
    };

    const VEHICLE_DATA: Record<string, string[]> = {
        'Toyota': ['Hilux', 'Corolla', 'Etios', 'Yaris', 'SW4', 'Rav4', 'Corolla Cross'],
        'Volkswagen': ['Amarok', 'Gol Trend', 'Polo', 'Virtus', 'Vento', 'T-Cross', 'Taos', 'Nivus', 'Suran', 'Saveiro'],
        'Ford': ['Ranger', 'EcoSport', 'Fiesta', 'Focus', 'Ka', 'Territory', 'Bronco', 'Maverick'],
        'Renault': ['Kangoo', 'Sandero', 'Logan', 'Duster', 'Oroch', 'Alaskan', 'Clio', 'Captur', 'Kwid'],
        'Chevrolet': ['Cruze', 'Onix', 'Tracker', 'S10', 'Spin', 'Prisma', 'Aveo'],
        'Fiat': ['Cronos', 'Toro', 'Strada', 'Pulse', 'Argo', 'Mobi', 'Fiorino', 'Siena', 'Palio'],
        'Peugeot': ['208', '2008', '3008', 'Partner', '408', '206', '207'],
        'Citroen': ['C3', 'C4 Cactus', 'Berlingo', 'C4'],
        'Honda': ['HR-V', 'CR-V', 'Civic', 'Fit', 'City'],
        'Nissan': ['Frontier', 'Kicks', 'Versa', 'Sentra', 'Note', 'March'],
        'Jeep': ['Renegade', 'Compass', 'Commander'],
        'Mercedes-Benz': ['Sprinter', 'Clase A', 'Clase C', 'Vito'],
        'BMW': ['Serie 1', 'Serie 3', 'X1', 'X3'],
        'Audi': ['A1', 'A3', 'A4', 'Q3', 'Q5'],
    };

    const normalizeBrand = (input: string) => {
        // Simple helper to find matching key case-insensitive
        const key = Object.keys(VEHICLE_DATA).find(k => k.toLowerCase() === input.toLowerCase());
        return key || input;
    };

    const availableModels = VEHICLE_DATA[normalizeBrand(formData.brand)] || [];

    if (!isOpen || !clientId) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        const payload = {
            ...formData,
            clientId: clientId,
            type: 'Auto/Camioneta', // Default
            mileage: formData.mileage ? parseInt(formData.mileage) : undefined
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
                setFormData({ plate: '', brand: '', model: '', mileage: '', fuelType: 'Nafta', engine: '' });
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

                <form onSubmit={handleSubmit} className="p-8 space-y-5">

                    <div className="grid grid-cols-2 gap-4">
                        <div className="col-span-2 sm:col-span-1 space-y-1">
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Patente</label>
                            <input
                                autoFocus
                                required
                                type="text"
                                placeholder="AA 123 BB"
                                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none font-mono font-bold text-lg uppercase transition-all"
                                value={formData.plate}
                                onChange={e => {
                                    const val = e.target.value.toUpperCase();
                                    setFormData({ ...formData, plate: val });
                                    if (plateError) setPlateError(validatePlate(val));
                                }}
                                onBlur={() => setPlateError(validatePlate(formData.plate))}
                            />
                            {plateError && (
                                <p className="text-[10px] font-bold text-red-500 mt-1 flex items-center gap-1 animate-in slide-in-from-top-1">
                                    <AlertCircle size={10} /> {plateError}
                                </p>
                            )}
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

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1 relative group">
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Marca</label>
                            <input
                                type="text"
                                placeholder="Toyota"
                                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none font-medium transition-all"
                                value={formData.brand}
                                onChange={e => {
                                    setFormData({ ...formData, brand: e.target.value });
                                    setActiveField('brand');
                                }}
                                onFocus={() => setActiveField('brand')}
                                onBlur={() => setTimeout(() => setActiveField(null), 200)} // Delay to allow click
                            />
                            {/* Brand Suggestions */}
                            {activeField === 'brand' && formData.brand.length > 0 && (
                                <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-100 shadow-xl rounded-xl max-h-48 overflow-y-auto z-50">
                                    {Object.keys(VEHICLE_DATA)
                                        .filter(b => b.toLowerCase().includes(formData.brand.toLowerCase()))
                                        .map(b => (
                                            <button
                                                key={b}
                                                type="button"
                                                onClick={() => {
                                                    setFormData({ ...formData, brand: b });
                                                    setActiveField(null);
                                                }}
                                                className="w-full text-left px-4 py-2 hover:bg-slate-50 text-sm font-medium text-slate-700 block"
                                            >
                                                {b}
                                            </button>
                                        ))
                                    }
                                </div>
                            )}
                        </div>
                        <div className="space-y-1 relative group">
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Modelo</label>
                            <input
                                type="text"
                                placeholder="Hilux"
                                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none font-medium transition-all"
                                value={formData.model}
                                onChange={e => {
                                    setFormData({ ...formData, model: e.target.value });
                                    setActiveField('model');
                                }}
                                onFocus={() => setActiveField('model')}
                                onBlur={() => setTimeout(() => setActiveField(null), 200)}
                            />
                            {/* Model Suggestions */}
                            {activeField === 'model' && availableModels.length > 0 && (
                                <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-100 shadow-xl rounded-xl max-h-48 overflow-y-auto z-50">
                                    {availableModels
                                        .filter(m => m.toLowerCase().includes(formData.model.toLowerCase()))
                                        .map(m => (
                                            <button
                                                key={m}
                                                type="button"
                                                onClick={() => {
                                                    setFormData({ ...formData, model: m });
                                                    setActiveField(null);
                                                }}
                                                className="w-full text-left px-4 py-2 hover:bg-slate-50 text-sm font-medium text-slate-700 block"
                                            >
                                                {m}
                                            </button>
                                        ))
                                    }
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Combustible</label>
                            <select
                                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none font-medium transition-all appearance-none"
                                value={formData.fuelType}
                                onChange={e => setFormData({ ...formData, fuelType: e.target.value })}
                            >
                                <option value="Nafta">Nafta</option>
                                <option value="Diesel">Diesel</option>
                                <option value="GNC">GNC</option>
                                <option value="Híbrido">Híbrido</option>
                                <option value="Eléctrico">Eléctrico</option>
                            </select>
                        </div>
                        <div className="space-y-1">
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Motor / Detalle</label>
                            <input
                                type="text"
                                placeholder="Ej: 1.6 16V"
                                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none font-medium transition-all"
                                value={formData.engine}
                                onChange={e => setFormData({ ...formData, engine: e.target.value })}
                            />
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={loading || !formData.plate || !!plateError}
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
