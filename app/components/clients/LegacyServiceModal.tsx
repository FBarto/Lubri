'use client';

import { useEffect, useState } from 'react';
import { createLegacyWorkOrder } from '../../actions/business';
import { getLastServiceItems } from '../../actions/maintenance';
import { History, X, Calendar, Gauge, CheckSquare, Droplets, Save, Search, Sparkles } from 'lucide-react';

export default function LegacyServiceModal({ vehicleId, clientId, onClose, onSuccess }: {
    vehicleId: number;
    clientId: number;
    onClose: () => void;
    onSuccess: () => void;
}) {
    const [loading, setLoading] = useState(false);
    const [suggesting, setSuggesting] = useState(false);

    // Default to today, generic 15k mileage if unknown
    const [form, setForm] = useState({
        date: new Date().toISOString().split('T')[0],
        mileage: '',
        filters: {
            air: false, airCode: '',
            oil: false, oilCode: '',
            fuel: false, fuelCode: '',
            cabin: false, cabinCode: ''
        },
        oil: {
            type: 'SINTETICO', // SEMI, SINTETICO, MINERAL
            liters: '4',
            brand: ''
        },
        fluids: {
            gearbox: false,
            differential: false,
            hydraulic: false,
            brakes: false,
            coolant: false
        },
        notes: ''
    });

    const [nextServiceMileage, setNextServiceMileage] = useState('');
    const [sendWhatsApp, setSendWhatsApp] = useState(false);
    const [wasSuggested, setWasSuggested] = useState(false);

    useEffect(() => {
        async function fetchSuggestions() {
            setSuggesting(true);
            try {
                const res = await getLastServiceItems(vehicleId);
                if (res.success && res.data) {
                    const history = res.data;
                    const newForm = { ...form };

                    history.items.forEach((item: any) => {
                        const lowName = item.name.toLowerCase();
                        if (item.category === 'ENGINE_OIL' || lowName.includes('aceite')) {
                            newForm.oil.brand = item.name;
                            newForm.oil.liters = item.quantity.toString();
                        }
                        if (item.category === 'OIL_FILTER' || lowName.includes('filtro aceite') || lowName.includes('wo')) {
                            newForm.filters.oil = true;
                            newForm.filters.oilCode = item.code || item.name;
                        }
                        if (item.category === 'AIR_FILTER' || lowName.includes('filtro aire') || lowName.includes('wa')) {
                            newForm.filters.air = true;
                            newForm.filters.airCode = item.code || item.name;
                        }
                        if (item.category === 'FUEL_FILTER' || lowName.includes('filtro comb') || lowName.includes('wg')) {
                            newForm.filters.fuel = true;
                            newForm.filters.fuelCode = item.code || item.name;
                        }
                        if (item.category === 'CABIN_FILTER' || lowName.includes('filtro habit') || lowName.includes('akx')) {
                            newForm.filters.cabin = true;
                            newForm.filters.cabinCode = item.code || item.name;
                        }
                    });

                    setForm(newForm);
                    setWasSuggested(true);
                }
            } catch (error) {
                console.error("Error fetching suggestions:", error);
            } finally {
                setSuggesting(false);
            }
        }
        fetchSuggestions();
    }, [vehicleId]);

    const updateFilter = (key: string, val: boolean) => {
        setForm(prev => ({ ...prev, filters: { ...prev.filters, [key]: val } }));
    };
    const updateFilterCode = (key: string, val: string) => {
        setForm(prev => ({ ...prev, filters: { ...prev.filters, [key]: val } }));
    };

    const handleSave = async () => {
        if (!form.mileage) {
            alert('El kilometraje es obligatorio');
            return;
        }

        setLoading(true);
        try {
            const res = await createLegacyWorkOrder({
                vehicleId,
                clientId,
                date: form.date,
                mileage: Number(form.mileage),
                serviceDetails: form,
                // New params
                nextServiceMileage: nextServiceMileage ? Number(nextServiceMileage) : undefined,
                sendWhatsApp
            });

            if (res.success) {
                if (sendWhatsApp) alert('¡Ficha guardada y WhatsApp enviado!');
                else alert('Ficha guardada correctamente');

                onSuccess();
                onClose();
            } else {
                alert('Error al guardar: ' + res.error);
            }
        } catch (error) {
            console.error(error);
            alert('Error inesperado');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
            <div className="bg-white w-full max-w-4xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">

                {/* Header */}
                <div className="bg-slate-900 text-white px-6 py-4 flex justify-between items-center shrink-0">
                    <div>
                        <h2 className="text-lg font-bold flex items-center gap-2">
                            <History /> Carga Histórica de Servicio
                            {wasSuggested && (
                                <span className="flex items-center gap-1.5 px-2 py-0.5 bg-blue-500/20 text-blue-300 rounded-full text-[10px] animate-pulse">
                                    <Sparkles size={10} /> Sugerencias Aplicadas
                                </span>
                            )}
                        </h2>
                        <p className="text-xs text-slate-400">Importar datos de fichas anteriores (Legacy)</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-slate-700 rounded-full transition-colors">
                        <X size={20} />
                    </button>
                </div>

                {suggesting && (
                    <div className="bg-blue-600/10 text-blue-600 px-6 py-1 text-[10px] font-bold text-center animate-pulse">
                        Buscando datos del último service...
                    </div>
                )}

                {/* Body - Dense Grid */}
                <div className="p-6 overflow-y-auto grid grid-cols-1 md:grid-cols-12 gap-6 bg-slate-50">

                    {/* COL 1: Basic Info & Oil */}
                    <div className="md:col-span-4 space-y-4">
                        <SectionTitle title="Datos Básicos" icon={<Calendar size={16} />} />
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="label">Fecha Real</label>
                                <input
                                    type="date"
                                    className="input-field"
                                    value={form.date}
                                    onChange={e => setForm({ ...form, date: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="label">Kilometraje</label>
                                <div className="relative">
                                    <input
                                        type="number"
                                        className="input-field pl-8"
                                        placeholder="0"
                                        value={form.mileage}
                                        onChange={e => {
                                            const val = e.target.value;
                                            setForm({ ...form, mileage: val });
                                            // Auto-suggest next service (+10k)
                                            if (val && !nextServiceMileage) {
                                                setNextServiceMileage((Number(val) + 10000).toString());
                                            }
                                        }}
                                    />
                                    <Gauge size={14} className="absolute left-2.5 top-3 text-slate-400" />
                                </div>
                            </div>
                        </div>

                        {/* Next Service Field */}
                        <div className="bg-amber-50 p-3 rounded-xl border border-amber-200">
                            <label className="label text-amber-900">Próximo Cambio (Sticker)</label>
                            <div className="relative">
                                <input
                                    type="number"
                                    className="input-field pl-8 border-amber-300 focus:border-amber-500"
                                    placeholder="Ej: 60000"
                                    value={nextServiceMileage}
                                    onChange={e => setNextServiceMileage(e.target.value)}
                                />
                                <span className="absolute left-2.5 top-3 text-amber-400 text-xs font-bold">KM</span>
                            </div>
                        </div>

                        <SectionTitle title="Lubricantes" icon={<Droplets size={16} />} />
                        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-3">
                            <div>
                                <label className="label">Tipo de Aceite</label>
                                <div className="flex gap-2">
                                    {['MINERAL', 'SEMI', 'SINTETICO'].map(type => (
                                        <button
                                            key={type}
                                            onClick={() => setForm(p => ({ ...p, oil: { ...p.oil, type } }))}
                                            className={`flex-1 py-1.5 text-xs font-bold rounded border transition-all ${form.oil.type === type
                                                ? 'bg-blue-600 text-white border-blue-600'
                                                : 'bg-slate-50 text-slate-500 border-slate-200 hover:border-slate-300'
                                                }`}
                                        >
                                            {type.substring(0, 4)}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <div className="grid grid-cols-3 gap-2">
                                <div className="col-span-1">
                                    <label className="label">Litros</label>
                                    <input
                                        type="number" step="0.5"
                                        className="input-field"
                                        value={form.oil.liters}
                                        onChange={e => setForm(p => ({ ...p, oil: { ...p.oil, liters: e.target.value } }))}
                                    />
                                </div>
                                <div className="col-span-2">
                                    <label className="label">Marca / Viscosidad</label>
                                    <input
                                        type="text"
                                        placeholder="Ej: Elaion 10W40"
                                        className="input-field"
                                        value={form.oil.brand}
                                        onChange={e => setForm(p => ({ ...p, oil: { ...p.oil, brand: e.target.value } }))}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* COL 2: Filters */}
                    <div className="md:col-span-5 space-y-4">
                        <SectionTitle title="Filtros Reemplazados" icon={<CheckSquare size={16} />} />
                        <div className="bg-white p-1 rounded-xl border border-slate-200 shadow-sm divide-y divide-slate-100">
                            <FilterRow
                                label="Filtro de Aire"
                                checked={form.filters.air}
                                onCheck={v => updateFilter('air', v)}
                                code={form.filters.airCode}
                                onCode={v => updateFilterCode('airCode', v)}
                            />
                            <FilterRow
                                label="Filtro de Aceite"
                                checked={form.filters.oil}
                                onCheck={v => updateFilter('oil', v)}
                                code={form.filters.oilCode}
                                onCode={v => updateFilterCode('oilCode', v)}
                            />
                            <FilterRow
                                label="Filtro Combustible"
                                checked={form.filters.fuel}
                                onCheck={v => updateFilter('fuel', v)}
                                code={form.filters.fuelCode}
                                onCode={v => updateFilterCode('fuelCode', v)}
                            />
                            <FilterRow
                                label="Filtro Habitáculo"
                                checked={form.filters.cabin}
                                onCheck={v => updateFilter('cabin', v)}
                                code={form.filters.cabinCode}
                                onCode={v => updateFilterCode('cabinCode', v)}
                            />
                        </div>

                        <SectionTitle title="Observaciones" icon={<CheckSquare size={16} />} />
                        <textarea
                            className="input-field w-full h-24 resize-none"
                            placeholder="Anotaciones extra..."
                            value={form.notes}
                            onChange={e => setForm({ ...form, notes: e.target.value })}
                        />
                    </div>

                    {/* COL 3: Fluids & Checks */}
                    <div className="md:col-span-3 space-y-4">
                        <SectionTitle title="Fluidos y Controles" icon={<Droplets size={16} />} />
                        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-3">
                            <CheckRow
                                label="Rev. Caja Veloc."
                                checked={form.fluids.gearbox}
                                onChange={v => setForm(p => ({ ...p, fluids: { ...p.fluids, gearbox: v } }))}
                            />
                            <CheckRow
                                label="Rev. Diferencial"
                                checked={form.fluids.differential}
                                onChange={v => setForm(p => ({ ...p, fluids: { ...p.fluids, differential: v } }))}
                            />
                            <CheckRow
                                label="Liq. Hidráulico"
                                checked={form.fluids.hydraulic}
                                onChange={v => setForm(p => ({ ...p, fluids: { ...p.fluids, hydraulic: v } }))}
                            />
                            <CheckRow
                                label="Liq. Frenos"
                                checked={form.fluids.brakes}
                                onChange={v => setForm(p => ({ ...p, fluids: { ...p.fluids, brakes: v } }))}
                            />
                            <CheckRow
                                label="Refrigerante"
                                checked={form.fluids.coolant}
                                onChange={v => setForm(p => ({ ...p, fluids: { ...p.fluids, coolant: v } }))}
                            />
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="bg-white border-t border-slate-200 px-6 py-4 flex justify-between items-center shrink-0 gap-3">
                    <label className="flex items-center gap-2 cursor-pointer p-2 hover:bg-slate-50 rounded-lg transition-colors">
                        <input
                            type="checkbox"
                            className="w-5 h-5 rounded text-emerald-600 focus:ring-emerald-500"
                            checked={sendWhatsApp}
                            onChange={e => setSendWhatsApp(e.target.checked)}
                        />
                        <span className="text-sm font-bold text-slate-700 flex items-center gap-1">
                            <span className="text-emerald-500">📱</span> Enviar Reporte WhatsApp
                        </span>
                    </label>

                    <div className="flex gap-3">
                        <button onClick={onClose} className="px-5 py-2.5 font-bold text-slate-500 hover:bg-slate-100 rounded-xl transition-colors">
                            Cancelar
                        </button>
                        <button
                            onClick={handleSave}
                            disabled={loading}
                            className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-lg shadow-blue-200 flex items-center gap-2 transition-all disabled:opacity-50 disabled:shadow-none"
                        >
                            {loading ? 'Guardando...' : <><Save size={18} /> Guardar Ficha</>}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

// Subcomponents for cleaner code
function SectionTitle({ title, icon }: { title: string, icon: any }) {
    return (
        <h3 className="text-xs font-black text-slate-400 uppercase tracking-wider flex items-center gap-2 mb-1">
            {icon} {title}
        </h3>
    );
}

interface FilterRowProps {
    label: string;
    checked: boolean;
    onCheck: (val: boolean) => void;
    code: string;
    onCode: (val: string) => void;
}

function FilterRow({ label, checked, onCheck, code, onCode }: FilterRowProps) {
    return (
        <div className="flex items-center gap-3 p-3 hover:bg-slate-50 transition-colors">
            <input
                type="checkbox"
                className="w-5 h-5 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                checked={checked}
                onChange={e => onCheck(e.target.checked)}
            />
            <span className={`text-sm font-bold flex-1 ${checked ? 'text-slate-800' : 'text-slate-400'}`}>{label}</span>
            <input
                type="text"
                placeholder="Código"
                className="w-24 text-xs p-1.5 border border-slate-200 rounded text-slate-600 focus:border-blue-500 outline-none uppercase"
                value={code}
                onChange={e => onCode(e.target.value)}
                disabled={!checked}
            />
        </div>
    );
}

interface CheckRowProps {
    label: string;
    checked: boolean;
    onChange: (val: boolean) => void;
}

function CheckRow({ label, checked, onChange }: CheckRowProps) {
    return (
        <label className="flex items-center gap-3 cursor-pointer group">
            <input
                type="checkbox"
                className="w-5 h-5 rounded border-slate-300 text-emerald-500 focus:ring-emerald-500"
                checked={checked}
                onChange={e => onChange(e.target.checked)}
            />
            <span className={`text-sm font-medium transition-colors ${checked ? 'text-slate-900' : 'text-slate-500 group-hover:text-slate-700'}`}>
                {label}
            </span>
        </label>
    );
}

function HistoryIcon() {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 3v5h5" /><path d="M3.05 13A9 9 0 1 0 6 5.3L3 8" /></svg>
    )
}
