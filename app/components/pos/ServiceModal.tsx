'use client';

import { useState, useEffect } from 'react';
import UploadComponent from '../dvi/UploadComponent';
import { createQuickClient, getConsumidorFinal } from '@/app/actions/business';

// Interfaces simplificadas para manejo local
interface Client { id: number; name: string; phone: string; vehicles?: Vehicle[] }
interface Vehicle { id: number; plate: string; model: string; clientId: number; client?: Client }

interface ServiceModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (data: any) => void;
    service: any;
    initialClient?: Client | null;
}

export default function ServiceModal({ isOpen, onClose, onConfirm, service, initialClient }: ServiceModalProps) {
    // Removed early return to comply with Rules of Hooks

    const [phoneSearch, setPhoneSearch] = useState('');
    const [plateSearch, setPlateSearch] = useState('');

    // Selection State
    const [selectedClient, setSelectedClient] = useState<Client | null>(null);
    const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
    const [mileage, setMileage] = useState('');
    const [notes, setNotes] = useState('');
    const [attachments, setAttachments] = useState<any[]>([]);

    // Technical Details State
    const [serviceDetails, setServiceDetails] = useState({
        oil: { brand: '', liters: '', type: 'SINTETICO' },
        filters: { air: false, oil: false, fuel: false, cabin: false },
        filterDetails: { air: '', oil: '', fuel: '', cabin: '' },
        fluids: { brakes: false, coolant: false, hydraulic: false }
    });

    // Search Results
    const [clientResults, setClientResults] = useState<Client[]>([]);
    const [vehicleResults, setVehicleResults] = useState<Vehicle[]>([]);
    const [productResults, setProductResults] = useState<any[]>([]);

    // Quick Registration State
    const [isRegistering, setIsRegistering] = useState(false);
    const [newName, setNewName] = useState('');
    const [newPhone, setNewPhone] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);

    useEffect(() => {
        // Reset when opening new service
        if (initialClient) {
            setSelectedClient(initialClient);
            setPhoneSearch(`${initialClient.name} (${initialClient.phone})`);
        } else {
            setSelectedClient(null);
            setPhoneSearch('');
        }

        setSelectedVehicle(null);
        setPlateSearch('');
        setMileage('');
        setNotes('');
        setAttachments([]);
        setClientResults([]);
        setVehicleResults([]);

        // Auto-populate vehicle options if client is selected
        if (initialClient?.vehicles) {
            setVehicleResults(initialClient.vehicles as Vehicle[]);
        } else if (selectedClient?.vehicles) {
            setVehicleResults(selectedClient.vehicles as Vehicle[]);
        }

        // Smart Pack Logic
        if (service) {
            const name = service.name.toLowerCase();
            const isPack = name.includes('pack') || name.includes('full');
            const isOil = name.includes('aceite') || name.includes('cambio');

            if (isPack || isOil) {
                setServiceDetails(prev => ({
                    ...prev,
                    filters: {
                        oil: true, // Always change oil filter with oil
                        air: isPack, // Full pack includes air
                        fuel: isPack && name.includes('diesel'), // Diesel packs usually include fuel
                        cabin: isPack // Full pack usually includes cabin
                    },
                    oil: {
                        ...prev.oil,
                        type: name.includes('sintetico') ? 'SINTETICO' : name.includes('semi') ? 'SEMI' : 'MINERAL',
                        liters: isPack ? '4.0' : prev.oil.liters
                    }
                }));
            }
        }
    }, [service, isOpen, initialClient, selectedClient]);

    // Search Functions
    const searchClient = async (val: string) => {
        setPhoneSearch(val);
        // Clear selection if user edits text
        if (selectedClient && val !== `${selectedClient.name} (${selectedClient.phone})`) {
            setSelectedClient(null);
        }

        if (val.length > 2) {
            try {
                const res = await fetch(`/api/clients?search=${val}`);
                const data = await res.json();
                const results = Array.isArray(data.data) ? data.data : (Array.isArray(data) ? data : []);
                setClientResults(results);
            } catch (e) {
                console.error("Error searching client", e);
                setClientResults([]);
            }
        } else {
            setClientResults([]);
        }
    };

    const searchVehicle = async (val: string) => {
        setPlateSearch(val);
        // Clear selection if user edits text
        if (selectedVehicle && val !== `${selectedVehicle.plate} - ${selectedVehicle.model || ''}`) {
            setSelectedVehicle(null);
        }

        if (val.length > 2) {
            try {
                const res = await fetch(`/api/vehicles?search=${val}`);
                const data = await res.json();
                const results = Array.isArray(data.data) ? data.data : (Array.isArray(data) ? data : []);
                setVehicleResults(results);
            } catch (e) {
                console.error("Error searching vehicle", e);
                setVehicleResults([]);
            }
        } else {
            setVehicleResults([]);
        }
    };

    const searchProduct = async (val: string) => {
        if (val.length > 2) {
            try {
                const res = await fetch(`/api/products?search=${val}&category=ACEITE`);
                const data = await res.json();
                setProductResults(Array.isArray(data.data) ? data.data : (Array.isArray(data) ? data : []));
            } catch (e) {
                console.error("Error searching product", e);
                setProductResults([]);
            }
        } else {
            setProductResults([]);
        }
    };

    // Selection Handlers
    const selectClient = (c: Client) => {
        setSelectedClient(c);
        setPhoneSearch(`${c.name} (${c.phone})`);
        setClientResults([]);

        // Auto-select vehicle if only one exists
        if (c.vehicles && c.vehicles.length === 1) {
            // Need to cast or ensure structure matches
            const v = c.vehicles[0];
            // The vehicles in client include usually don't have deep client info, but we have the ID.
            // We can just set it.
            setSelectedVehicle(v as Vehicle);
            setPlateSearch(`${v.plate} - ${v.model || ''}`);
        }
    }

    const selectVehicle = (v: Vehicle) => {
        setSelectedVehicle(v);
        setPlateSearch(`${v.plate} - ${v.model || ''}`);
        setVehicleResults([]);

        // Auto-select client if linked and included in response
        if (v.client && !selectedClient) {
            selectClient(v.client);
        }
    }

    // Confirm Handler
    const handleConfirm = async () => {
        setIsProcessing(true);
        let currentClient = selectedClient;
        let currentVehicle = selectedVehicle;

        // 1. Handle Quick Registration if active
        if (isRegistering && newName && newPhone) {
            const res = await createQuickClient({
                name: newName,
                phone: newPhone,
                plate: plateSearch,
                brand: '',
                model: ''
            });
            if (res.success && res.data) {
                currentClient = res.data.client as Client;
                currentVehicle = res.data.vehicle as Vehicle;
            } else {
                alert("Error al registrar cliente: " + res.error);
                setIsProcessing(false);
                return;
            }
        }

        // 2. Handle "Consumidor Final" if no client selected and not registering
        const noClientFound = !currentClient && !isRegistering && (phoneSearch === "Consumidor Final" || !phoneSearch);
        if (noClientFound) {
            const res = await getConsumidorFinal();
            if (res.success && res.data) {
                currentClient = res.data as Client;
            }
        }

        if (!plateSearch && !currentVehicle) {
            alert('Por favor ingrese una patente o seleccione un vehículo');
            setIsProcessing(false);
            return;
        }

        onConfirm({
            clientId: currentClient?.id || 0,
            vehicleId: currentVehicle?.id || 0,
            plate: plateSearch,
            mileage,
            notes,
            attachments,
            serviceDetails,
            clientName: currentClient?.name,
            vehiclePlate: currentVehicle?.plate || plateSearch
        });
        setIsProcessing(false);
        onClose();
    };

    if (!isOpen || !service) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-neutral-900/80 backdrop-blur-md p-4 animate-in fade-in duration-300">
            <div className="bg-slate-100 w-full max-w-2xl rounded-[3rem] shadow-[0_32px_64px_-12px_rgba(0,0,0,0.5)] overflow-hidden flex flex-col max-h-[90vh] border border-white/20">
                {/* Header - Dark & Aggressive */}
                <div className="bg-neutral-900 p-8 text-white flex justify-between items-center shrink-0 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-red-600/10 blur-[60px] rounded-full translate-x-1/2 -translate-y-1/2"></div>

                    <div className="relative z-10">
                        <span className="block text-[10px] font-black text-red-500 uppercase tracking-[0.3em] leading-none mb-1">System Override</span>
                        <h2 className="text-3xl font-black italic uppercase tracking-tighter italic">Configurar <span className="text-red-600">Servicio</span></h2>
                        <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mt-1 opacity-70">Target: {service.name}</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="bg-white/5 hover:bg-red-600 p-3 rounded-2xl transition-all group relative z-10"
                    >
                        <svg className="w-5 h-5 group-hover:rotate-90 transition-all font-black" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                <div className="p-8 overflow-y-auto flex-1 space-y-8 custom-scrollbar">
                    {/* Client Search - Premium Input */}
                    <div className="relative group">
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-3 ml-2">Asignar Cliente</label>
                        <div className="relative">
                            <input
                                type="text"
                                className="w-full pl-12 pr-4 py-4 rounded-[1.5rem] border-2 border-slate-200 bg-white focus:border-red-600 text-slate-900 font-black placeholder:text-slate-300 outline-none transition-all shadow-sm"
                                placeholder="Nombre o teléfono del cliente..."
                                value={phoneSearch}
                                onChange={(e) => searchClient(e.target.value)}
                            />
                            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-red-600 transition-colors">
                                <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" /></svg>
                            </div>
                        </div>
                        {clientResults.length > 0 && (
                            <ul className="absolute z-20 w-full bg-white/95 backdrop-blur-md border border-slate-200 rounded-[1.5rem] mt-2 shadow-2xl overflow-hidden animate-in slide-in-from-top-2">
                                {clientResults.map((c) => (
                                    <li key={c.id} onClick={() => selectClient(c)} className="p-4 hover:bg-neutral-900 hover:text-white cursor-pointer transition-all border-b border-slate-50 last:border-0 group/item flex justify-between items-center text-left">
                                        <div>
                                            <div className="font-black italic uppercase tracking-tighter text-lg">{c.name}</div>
                                            <div className="text-[10px] font-bold opacity-50 group-hover/item:text-red-400">{c.phone}</div>
                                        </div>
                                        <span className="opacity-0 group-hover/item:opacity-100 transition-opacity bg-red-600 text-white text-[8px] font-black px-2 py-1 rounded uppercase tracking-widest">Seleccionar</span>
                                    </li>
                                ))}
                                {phoneSearch.length > 3 && clientResults.length === 0 && !selectedClient && !isRegistering && (
                                    <li className="p-6 text-center bg-slate-50 border-t border-slate-100">
                                        <p className="text-xs font-bold text-slate-500 mb-4 italic">No encontramos al cliente "{phoneSearch}"</p>
                                        <div className="flex gap-2 justify-center">
                                            <button
                                                onClick={() => {
                                                    setIsRegistering(true);
                                                    setNewName(phoneSearch);
                                                }}
                                                className="bg-red-600 text-white text-[10px] font-black py-2 px-4 rounded-xl uppercase tracking-widest hover:scale-105 transition-transform shadow-lg"
                                            >
                                                Registrar Cliente
                                            </button>
                                            <button
                                                onClick={() => setPhoneSearch("Consumidor Final")}
                                                className="bg-slate-200 text-slate-600 text-[10px] font-black py-2 px-4 rounded-xl uppercase tracking-widest hover:bg-slate-300"
                                            >
                                                Continuar Sin Datos
                                            </button>
                                        </div>
                                    </li>
                                )}
                                {isRegistering && (
                                    <li className="p-6 bg-slate-900 text-white border-t border-red-600/50 space-y-4">
                                        <div className="flex justify-between items-center mb-2">
                                            <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-red-500 font-black">Nuevo Registro Rápido</h4>
                                            <button onClick={() => setIsRegistering(false)} className="text-[8px] opacity-50 hover:opacity-100 uppercase font-black">Cancelar</button>
                                        </div>
                                        <div className="grid grid-cols-2 gap-3">
                                            <div className="space-y-1">
                                                <label className="text-[8px] uppercase font-black opacity-50">Nombre</label>
                                                <input
                                                    type="text"
                                                    className="w-full bg-white/10 border border-white/20 rounded-xl p-3 text-sm font-bold placeholder:text-white/30"
                                                    value={newName}
                                                    onChange={e => setNewName(e.target.value)}
                                                />
                                            </div>
                                            <div className="space-y-1">
                                                <label className="text-[8px] uppercase font-black opacity-50">Teléfono</label>
                                                <input
                                                    type="text"
                                                    className="w-full bg-white/10 border border-white/20 rounded-xl p-3 text-sm font-bold placeholder:text-white/30"
                                                    value={newPhone}
                                                    onChange={e => setNewPhone(e.target.value)}
                                                />
                                            </div>
                                        </div>
                                        <p className="text-[8px] opacity-40 font-bold italic">* Al confirmar la misión se guardará automáticamente.</p>
                                    </li>
                                )}
                            </ul>
                        )}
                    </div>

                    {/* Vehicle Search - Premium Input */}
                    <div className="relative group">
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-3 ml-2">Vehículo / Patente</label>
                        <div className="relative">
                            <input
                                type="text"
                                className="w-full pl-12 pr-4 py-4 rounded-[1.5rem] border-2 border-slate-200 bg-white focus:border-red-600 text-slate-900 font-black placeholder:text-slate-300 outline-none transition-all shadow-sm uppercase italic"
                                placeholder="AAA 123"
                                value={plateSearch}
                                onChange={(e) => searchVehicle(e.target.value)}
                            />
                            {selectedClient && !selectedVehicle && vehicleResults.length > 0 && (
                                <div className="absolute top-[-25px] right-2 bg-amber-400 text-white text-[9px] font-black uppercase tracking-tighter px-2 py-0.5 rounded-full animate-bounce shadow-lg">
                                    Sugerencia de Cliente
                                </div>
                            )}
                            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-red-600 transition-colors">
                                <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24"><rect x="3" y="11" width="18" height="10" rx="2" /><circle cx="7" cy="15" r="2" /><circle cx="17" cy="15" r="2" /><path d="M4 11l2-7h12l2 7" /></svg>
                            </div>
                        </div>
                        {vehicleResults.length > 0 && (
                            <ul className="absolute z-20 w-full bg-white/95 backdrop-blur-md border border-slate-200 rounded-[1.5rem] mt-2 shadow-2xl overflow-hidden animate-in slide-in-from-top-2">
                                {vehicleResults.map((v) => (
                                    <li key={v.id} onClick={() => selectVehicle(v)} className="p-4 hover:bg-neutral-900 hover:text-white cursor-pointer transition-all border-b border-slate-50 last:border-0 group/item flex justify-between items-center text-left">
                                        <div>
                                            <div className="font-black italic uppercase tracking-tighter text-lg">{v.plate}</div>
                                            <div className="text-[10px] font-bold opacity-50 group-hover/item:text-red-400">{v.model}</div>
                                        </div>
                                        {selectedClient && (
                                            <span className="bg-amber-100 text-amber-700 text-[8px] font-black px-2 py-1 rounded-md uppercase tracking-widest border border-amber-200">Recomendado</span>
                                        )}
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>

                    <div className="grid grid-cols-1 gap-6">
                        <div className="group">
                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-3 ml-2">Notas Técnicas</label>
                            <textarea
                                className="w-full p-5 rounded-[1.5rem] border-2 border-slate-200 bg-white focus:border-red-600 text-slate-900 font-bold outline-none transition-all shadow-sm min-h-[100px]"
                                placeholder="Especificaciones adicionales o requerimientos..."
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                            />
                        </div>

                        {/* Technical Checklist (Merged from Legacy) */}
                        <div className="bg-slate-50 p-6 rounded-[2rem] border border-slate-200">
                            <h3 className="text-xs font-black text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                                <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" /></svg>
                                Detalle Técnico (Libreta)
                            </h3>

                            {/* Oil */}
                            <div className="mb-6">
                                <label className="label text-[10px] font-bold uppercase text-slate-500 mb-2 block">Aceite de Motor</label>
                                <div className="grid grid-cols-2 gap-3 mb-3 relative">
                                    <div className="relative">
                                        <input
                                            type="text"
                                            placeholder="Marca / Viscosidad (Ej: Shell 10W40)"
                                            className="w-full p-3 rounded-xl border border-slate-200 text-sm font-bold placeholder:font-normal"
                                            value={serviceDetails.oil.brand}
                                            onChange={e => {
                                                setServiceDetails({ ...serviceDetails, oil: { ...serviceDetails.oil, brand: e.target.value } });
                                                searchProduct(e.target.value);
                                            }}
                                        />
                                        {productResults.length > 0 && (
                                            <ul className="absolute z-30 w-full bg-white border border-slate-200 rounded-xl mt-1 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95">
                                                {productResults.map(p => (
                                                    <li
                                                        key={p.id}
                                                        onClick={() => {
                                                            setServiceDetails({ ...serviceDetails, oil: { ...serviceDetails.oil, brand: `${p.name} [${p.code || 'S/C'}]` } });
                                                            setProductResults([]);
                                                        }}
                                                        className="p-3 hover:bg-slate-50 cursor-pointer text-xs font-black border-b last:border-0 flex justify-between items-center group"
                                                    >
                                                        <span>{p.name}</span>
                                                        <span className="text-[8px] bg-slate-100 text-slate-400 px-2 py-1 rounded-md opacity-70 group-hover:bg-red-50 group-hover:text-red-600 transition-colors uppercase font-black">{p.code || 'S/C'}</span>
                                                    </li>
                                                ))}
                                            </ul>
                                        )}
                                    </div>
                                    <input
                                        type="text"
                                        placeholder="Litros"
                                        className="w-full p-3 rounded-xl border border-slate-200 text-sm font-bold placeholder:font-normal"
                                        value={serviceDetails.oil.liters}
                                        onChange={e => setServiceDetails({ ...serviceDetails, oil: { ...serviceDetails.oil, liters: e.target.value } })}
                                    />
                                </div>
                            </div>

                            {/* Filters */}
                            <div className="grid grid-cols-2 gap-4">
                                {(['air', 'oil', 'fuel', 'cabin'] as const).map(f => (
                                    <div key={f} className="space-y-2">
                                        <label className={`flex items-center gap-3 p-3 rounded-xl border transition-all cursor-pointer ${serviceDetails.filters[f] ? 'bg-blue-50 border-blue-200' : 'bg-white border-slate-200 group'}`}>
                                            <input
                                                type="checkbox"
                                                className="w-5 h-5 rounded text-blue-600 focus:ring-0"
                                                checked={serviceDetails.filters[f]}
                                                onChange={e => setServiceDetails({ ...serviceDetails, filters: { ...serviceDetails.filters, [f]: e.target.checked } })}
                                            />
                                            <span className="text-[10px] font-black uppercase text-slate-700">
                                                {f === 'air' ? 'Fil. Aire' : f === 'oil' ? 'Fil. Aceite' : f === 'fuel' ? 'Combustible' : 'Habitáculo'}
                                            </span>
                                        </label>
                                        {serviceDetails.filters[f] && (
                                            <input
                                                type="text"
                                                placeholder="Marca / Código"
                                                className="w-full p-2 bg-white rounded-lg border border-slate-200 text-[10px] font-bold focus:border-red-600 outline-none transition-all placeholder:font-normal"
                                                value={serviceDetails.filterDetails[f]}
                                                onChange={e => setServiceDetails({ ...serviceDetails, filterDetails: { ...serviceDetails.filterDetails, [f]: e.target.value } })}
                                            />
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* DVI Upload - Premium Integration */}
                    <div className="bg-white p-6 rounded-[2rem] border-2 border-dashed border-slate-200 group-hover:border-red-600/30 transition-all">
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4 text-center">Evidencia Digital (DVI)</label>
                        <UploadComponent onUploadComplete={setAttachments} />
                    </div>
                </div>

                <div className="p-8 bg-white border-t border-slate-100 flex justify-between items-center shrink-0">
                    <button
                        onClick={onClose}
                        className="px-8 py-4 rounded-2xl font-black text-slate-400 hover:text-red-600 uppercase tracking-widest text-[10px] hover:bg-red-50 transition-all"
                    >
                        Cancelar
                    </button>
                    <button
                        onClick={handleConfirm}
                        disabled={isProcessing || (!selectedClient && !isRegistering && !plateSearch)}
                        className="px-10 py-5 rounded-[2rem] font-black bg-neutral-900 text-white hover:bg-red-600 disabled:opacity-20 disabled:grayscale disabled:scale-100 shadow-2xl hover:shadow-red-600/20 active:scale-[0.97] transition-all flex items-center gap-3 uppercase italic tracking-widest text-sm group"
                    >
                        <span>Confirmar Misión</span>
                        <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={4}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                        </svg>
                    </button>
                </div>
            </div>
        </div>
    );
}
