'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { User, Car, ArrowRight, Check, AlertCircle, MessageCircle } from 'lucide-react';
import { generateWhatsAppLink } from '../lib/inbox-actions';

// Types
type Client = {
    id: number;
    name: string;
    phone: string;
};

type Vehicle = {
    id: number;
    plate: string;
    brand?: string;
    model?: string;
    type?: string;
    clientId: number;
    client?: Client; // Enriched vehicle often has client
};

type Service = {
    id: number;
    name: string;
    category: string;
    price: number;
    duration: number;
    active: boolean;
};

export default function BookAppointment() {
    const router = useRouter();
    // Steps: 0=Select Mode, 1=Phone(New), 1.5=Plate(Returning), 2=Vehicle(New), 3=Service, 4=Date, 5=Confirm, 6=Success
    const [step, setStep] = useState(0);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    // Mode
    const [isReturning, setIsReturning] = useState(false);

    // Data State
    const [phone, setPhone] = useState('+549');
    const [client, setClient] = useState<Client | null>(null);
    const [clientName, setClientName] = useState('');

    const [plate, setPlate] = useState('');
    const [vehicle, setVehicle] = useState<Vehicle | null>(null);
    const [vehicleInfo, setVehicleInfo] = useState({ brand: '', model: '' });

    // Pending state for confirmation flow
    const [pendingVehicle, setPendingVehicle] = useState<Vehicle | null>(null);
    const [needsDataUpdate, setNeedsDataUpdate] = useState(false);

    const [services, setServices] = useState<Service[]>([]);
    const [selectedService, setSelectedService] = useState<Service | null>(null);

    const [date, setDate] = useState('');
    const [slots, setSlots] = useState<string[]>([]);
    const [selectedSlot, setSelectedSlot] = useState<string | null>(null);

    // --- STEP 0: SELECTION ---
    const selectMode = (returning: boolean) => {
        setIsReturning(returning);
        setStep(returning ? 1.5 : 1);
        setError('');
    };

    // --- STEP 1.5: PLATE IDENTITY (Returning) ---
    const checkPlateIdentity = async () => {
        setLoading(true);
        setError('');
        try {
            const res = await fetch(`/api/vehicles/lookup?plate=${plate}`);
            const data = await res.json();

            if (data && data.id) {
                // Found!
                setPendingVehicle(data);

                // Check if data is missing
                const missingData = !data.brand || !data.model || data.brand === '' || data.model === '';
                setNeedsDataUpdate(missingData);
                if (missingData) {
                    setVehicleInfo({
                        brand: data.brand || '',
                        model: data.model || ''
                    });
                }

                // If no client attached (orphan vehicle?), we might have an issue.
                // But usually returning flow assumes vehicle HAS client.
                // If no client, we can't confirm identity easily.
                if (!data.client) {
                    setError("Este vehículo no tiene un cliente asociado. Por favor, usá la opción 'Soy Nuevo' para registrarte.");
                    setPendingVehicle(null);
                }
            } else {
                setError("No encontramos ese vehículo. Probá nuevamente o registrate como nuevo.");
            }
        } catch (e: any) {
            setError(e.message);
        } finally {
            setLoading(false);
        }
    };

    const confirmIdentity = async () => {
        if (!pendingVehicle || !pendingVehicle.client) return;

        // If data update is needed, save it now
        if (needsDataUpdate) {
            setLoading(true);
            try {
                await fetch(`/api/vehicles/${pendingVehicle.id}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        brand: vehicleInfo.brand,
                        model: vehicleInfo.model
                    })
                });

                // Update local object
                pendingVehicle.brand = vehicleInfo.brand;
                pendingVehicle.model = vehicleInfo.model;
            } catch (e) {
                console.error("Failed to update vehicle data", e);
                // Non-blocking error? Or blocking? Let's block to ensure quality.
                setError("Error al guardar los datos del vehículo.");
                setLoading(false);
                return;
            }
            setLoading(false);
        }

        // Everything good!
        setClient(pendingVehicle.client);
        setVehicle(pendingVehicle);
        setPlate(pendingVehicle.plate); // Ensure plate state matches

        fetchServices();
        setStep(3); // Jump to Services
    };

    const resetIdentity = () => {
        setPendingVehicle(null);
        setPlate('');
        setError('');
    };


    // --- STEP 1: PHONE (New) ---
    const checkClient = async () => {
        setLoading(true);
        setError('');
        try {
            const res = await fetch(`/api/clients?phone=${phone}`);
            const data = await res.json();
            if (data && data.length > 0) {
                setClient(data[0]);
                setStep(2);
            } else {
                setClient(null);
            }
        } catch (e: any) {
            setError(e.message);
        } finally {
            setLoading(false);
        }
    };

    const createClient = async () => {
        if (!clientName) return;
        setLoading(true);
        try {
            const res = await fetch('/api/clients', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: clientName, phone })
            });
            const data = await res.json();
            if (data.id) {
                setClient(data);
                setStep(2);
            } else {
                setError(data.error);
            }
        } catch (e: any) {
            setError(e.message);
        } finally {
            setLoading(false);
        }
    };

    // --- STEP 2: VEHICLE (New) ---
    const checkVehicle = async () => {
        setLoading(true);
        setError('');
        try {
            const res = await fetch(`/api/vehicles?plate=${plate}`);
            const data = await res.json();
            if (data && data.length > 0) {
                const v = data[0];
                setVehicle(v);
                fetchServices();
                setStep(3);
            } else {
                setVehicle(null);
            }
        } catch (e: any) {
            setError(e.message);
        } finally {
            setLoading(false);
        }
    };

    const createVehicle = async () => {
        if (!client) return;
        setLoading(true);
        try {
            const res = await fetch('/api/vehicles', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    plate,
                    brand: vehicleInfo.brand,
                    model: vehicleInfo.model,
                    clientId: client.id
                })
            });
            const data = await res.json();
            if (data.id) {
                setVehicle(data);
                fetchServices();
                setStep(3);
            } else {
                if (data.error === 'A vehicle with this plate already exists') {
                    await checkVehicle();
                    return;
                }
                setError(data.error);
            }
        } catch (e: any) {
            setError(e.message);
        } finally {
            setLoading(false);
        }
    };

    // Auto-Fill Logic (Only for New Client Flow Step 2)
    useEffect(() => {
        if (step !== 2) return;

        const lookup = async () => {
            if (plate.length >= 6 && !loading) {
                try {
                    const res = await fetch(`/api/vehicles/lookup?plate=${plate}`);
                    const data = await res.json();
                    if (data && data.id) {
                        setVehicle(data);
                        setVehicleInfo({ brand: data.brand || '', model: data.model || '' });
                        if (data.client && !client) {
                            setClient(data.client);
                            setPhone(data.client.phone);
                        }
                    } else {
                        if (vehicle?.id) setVehicle(null);
                    }
                } catch (e) {
                    console.error(e);
                }
            }
        };
        const timer = setTimeout(lookup, 1000);
        return () => clearTimeout(timer);
    }, [plate, step]); // Add step dependency

    // --- STEP 3: SERVICE ---
    const fetchServices = async () => {
        const res = await fetch('/api/services');
        const data = await res.json();
        setServices(data.filter((s: any) => s.active));
    };

    const selectService = (s: Service) => {
        setSelectedService(s);
        setStep(4);
    };

    // --- STEP 4: DATE/SLOTS ---
    const fetchSlots = async (selectedDate: string) => {
        setDate(selectedDate);
        setSelectedSlot(null);
        if (!selectedService || !selectedDate) return;

        setLoading(true);
        try {
            const res = await fetch(`/api/public/slots?date=${selectedDate}&serviceId=${selectedService.id}`);
            const data = await res.json();
            setSlots(Array.isArray(data) ? data : []);
        } catch (e) {
            console.error(e);
            setSlots([]);
        } finally {
            setLoading(false);
        }
    };

    // --- STEP 5: CONFIRM ---
    const confirmAppointment = async () => {
        if (!client || !vehicle || !selectedService || !selectedSlot) return;
        setLoading(true);
        try {
            const res = await fetch('/api/appointments', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    clientId: client.id,
                    vehicleId: vehicle.id,
                    serviceId: selectedService.id,
                    date: selectedSlot,
                    notes: 'Reserva web'
                })
            });

            if (res.ok) {
                const data = await res.json();
                if (data.caseId) (window as any).lastCaseId = data.caseId;
                setStep(6);
            } else {
                const err = await res.json();
                setError(err.error || 'Error al reservar');
            }
        } catch (e: any) {
            setError(e.message);
        } finally {
            setLoading(false);
        }
    };

    // --- RENDER ---
    return (
        <div className="min-h-screen bg-neutral-50 text-slate-900 pb-20">
            <header className="bg-neutral-900 p-4 shadow-lg text-center sticky top-0 z-10 border-b-4 border-red-600">
                <div className="flex items-center justify-center gap-2 mb-1">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor" className="text-red-600"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zM7 9c0-2.76 2.24-5 5-5s5 2.24 5 5c0 2.88-2.88 7.19-5 10.88C9.92 16.21 7 11.85 7 9z" /><circle cx="12" cy="9" r="2.5" /></svg>
                    <h1 className="font-black text-xl text-white tracking-tighter uppercase italic">FB Lubricentro</h1>
                </div>
                <p className="text-[0.65rem] text-neutral-400 font-bold tracking-[0.2em] uppercase">Reserva de Turnos</p>
            </header>

            <main className="max-w-md mx-auto p-6">
                {error && (
                    <div className="bg-red-50 text-red-600 p-4 rounded-xl mb-6 text-sm flex items-start gap-2 border border-red-100 animate-pulse">
                        <AlertCircle size={20} className="shrink-0" />
                        <span>{error}</span>
                    </div>
                )}

                {/* --- STEP 0: SELECTION --- */}
                {step === 0 && (
                    <div className="fade-in space-y-6 pt-10">
                        <div className="text-center space-y-2">
                            <h2 className="text-3xl font-black italic uppercase text-slate-900">¡Bienvenido! 👋</h2>
                            <p className="text-neutral-500 text-lg">Para empezar, contanos...</p>
                        </div>

                        <div className="grid gap-4">
                            <button
                                onClick={() => selectMode(false)}
                                className="group relative overflow-hidden bg-white p-6 rounded-2xl shadow-sm border-2 border-slate-100 hover:border-red-600 transition-all text-left"
                            >
                                <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                                    <User size={64} className="text-red-600" />
                                </div>
                                <span className="block text-sm font-bold text-red-600 uppercase tracking-wider mb-1">Opción A</span>
                                <span className="block text-2xl font-black text-slate-900 mb-2">Es mi primera vez</span>
                                <p className="text-slate-500 text-sm font-medium">Nunca vine al taller, quiero registrarme.</p>
                            </button>

                            <button
                                onClick={() => selectMode(true)}
                                className="group relative overflow-hidden bg-white p-6 rounded-2xl shadow-sm border-2 border-slate-100 hover:border-red-600 transition-all text-left"
                            >
                                <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                                    <Car size={64} className="text-red-600" />
                                </div>
                                <span className="block text-sm font-bold text-red-600 uppercase tracking-wider mb-1">Opción B</span>
                                <span className="block text-2xl font-black text-slate-900 mb-2">Ya soy Cliente</span>
                                <p className="text-slate-500 text-sm font-medium">Ya vine antes, tengo mi auto registrado.</p>
                            </button>
                        </div>
                    </div>
                )}

                {/* --- STEP 1.5: PLATE IDENTITY (Returning) --- */}
                {step === 1.5 && (
                    <div className="fade-in">
                        <button onClick={() => setStep(0)} className="text-sm text-slate-400 mb-6 hover:text-red-600 flex items-center gap-1 font-bold uppercase tracking-wide">← Volver</button>

                        {!pendingVehicle ? (
                            // Phase A: Enter Plate
                            <>
                                <h2 className="text-2xl font-black italic uppercase mb-2">Tu Vehículo 🚗</h2>
                                <p className="text-slate-500 mb-8 font-medium">Ingresá la patente para encontrarte.</p>

                                <div className="space-y-6">
                                    <div>
                                        <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Patente</label>
                                        <input
                                            type="text"
                                            value={plate}
                                            onChange={(e) => setPlate(e.target.value.toUpperCase())}
                                            placeholder="AA123BB"
                                            className="w-full p-5 rounded-2xl border-2 border-slate-200 text-3xl font-black text-center uppercase tracking-[0.2em] focus:outline-none focus:border-red-600 focus:ring-4 focus:ring-red-600/10 placeholder:text-slate-200"
                                            autoFocus
                                        />
                                    </div>
                                    <button
                                        onClick={checkPlateIdentity}
                                        disabled={loading || plate.length < 5}
                                        className="w-full bg-red-600 text-white p-4 rounded-xl font-black text-lg shadow-xl shadow-red-600/20 disabled:opacity-50 disabled:shadow-none hover:bg-red-700 active:scale-[0.98] transition-all uppercase tracking-wide flex items-center justify-center gap-2"
                                    >
                                        {loading ? <span className="animate-spin">⏳</span> : <ArrowRight />}
                                        {loading ? 'Buscando...' : 'Buscar mi Auto'}
                                    </button>
                                </div>
                            </>
                        ) : (
                            // Phase B: Confirm Identity & Data
                            <div className="bg-white p-8 rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-100 text-center">
                                <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6 text-2xl shadow-inner">
                                    <Check strokeWidth={4} />
                                </div>

                                <h3 className="text-slate-400 font-bold uppercase tracking-wider text-xs mb-2">¡Te encontramos!</h3>
                                <h2 className="text-3xl font-black text-slate-900 mb-6">Hola, {pendingVehicle.client?.name.split(' ')[0]} 👋</h2>

                                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 mb-6 text-left">
                                    <p className="text-xs font-bold text-slate-400 uppercase mb-1">Vehículo detectado:</p>
                                    <p className="text-xl font-black text-slate-800 uppercase flex items-center justify-between">
                                        {plate}
                                        <span className="text-xs bg-slate-200 text-slate-600 px-2 py-1 rounded">PATENTE</span>
                                    </p>
                                    {/* If we have data, show it. If missing, we will ask below */}
                                    {(!needsDataUpdate) && (
                                        <p className="text-sm font-medium text-slate-500 mt-1 uppercase">{pendingVehicle.brand} {pendingVehicle.model}</p>
                                    )}
                                </div>

                                {needsDataUpdate && (
                                    <div className="mb-6 text-left animate-pulse-once">
                                        <div className="flex items-center gap-2 text-amber-600 bg-amber-50 p-3 rounded-lg text-xs font-bold mb-3">
                                            <AlertCircle size={14} />
                                            Faltan datos de tu vehículo
                                        </div>
                                        <div className="space-y-3">
                                            <input
                                                type="text"
                                                value={vehicleInfo.brand}
                                                onChange={(e) => setVehicleInfo({ ...vehicleInfo, brand: e.target.value })}
                                                placeholder="Marca (Ej: Fiat)"
                                                className="w-full p-3 rounded-lg border border-slate-200 text-sm font-bold focus:border-amber-500 outline-none"
                                            />
                                            <input
                                                type="text"
                                                value={vehicleInfo.model}
                                                onChange={(e) => setVehicleInfo({ ...vehicleInfo, model: e.target.value })}
                                                placeholder="Modelo (Ej: Cronos)"
                                                className="w-full p-3 rounded-lg border border-slate-200 text-sm font-bold focus:border-amber-500 outline-none"
                                            />
                                        </div>
                                    </div>
                                )}

                                <div className="space-y-3">
                                    <button
                                        onClick={confirmIdentity}
                                        disabled={loading || (needsDataUpdate && (!vehicleInfo.brand || !vehicleInfo.model))}
                                        className="w-full bg-red-600 text-white p-4 rounded-xl font-black text-lg hover:bg-red-700 active:scale-[0.98] transition-all shadow-lg shadow-red-600/20 disabled:opacity-50"
                                    >
                                        {loading ? 'Guardando...' : 'Sí, soy yo'}
                                    </button>
                                    <button
                                        onClick={resetIdentity}
                                        disabled={loading}
                                        className="w-full text-slate-400 font-bold text-sm p-3 hover:text-slate-600"
                                    >
                                        No es mi cuenta
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* --- STEP 1: CLIENT (New) --- */}
                {step === 1 && (
                    <div className="fade-in">
                        <button onClick={() => setStep(0)} className="text-sm text-slate-400 mb-4 hover:text-red-600 flex items-center gap-1 font-bold uppercase tracking-wide">← Volver</button>
                        <h2 className="text-2xl font-black italic uppercase mb-2">Tus Datos 📱</h2>
                        <p className="text-slate-500 mb-6 font-medium">Ingresá tu celular para contactarte.</p>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Celular</label>
                                <input
                                    type="tel"
                                    value={phone}
                                    onChange={(e) => setPhone(e.target.value)}
                                    placeholder="Ej: 3541123456"
                                    className="w-full p-4 rounded-xl border border-slate-200 text-lg font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    autoFocus
                                />
                            </div>

                            {/* New Client Name Input */}
                            {client === null && phone.length > 6 && !loading && (
                                <div className="fade-in bg-blue-50 p-4 rounded-xl border border-blue-100">
                                    <p className="text-sm text-blue-800 mb-2 font-bold">Es tu primera vez. ¿Cómo te llamás?</p>
                                    <input
                                        type="text"
                                        value={clientName}
                                        onChange={(e) => setClientName(e.target.value)}
                                        placeholder="Nombre completo"
                                        className="w-full p-3 rounded-lg border border-blue-200"
                                    />
                                </div>
                            )}

                            <button
                                onClick={client === null ? createClient : checkClient}
                                disabled={loading || phone.length < 6}
                                className="w-full bg-red-600 text-white p-4 rounded-xl font-black text-lg shadow-xl shadow-red-600/20 disabled:opacity-50 disabled:shadow-none hover:bg-red-700 active:scale-[0.98] transition-all uppercase tracking-wide"
                            >
                                {loading ? '...' : client === null ? 'Continuar' : 'Siguiente'}
                            </button>
                        </div>
                    </div>
                )}

                {/* --- STEP 2: VEHICLE (New) --- */}
                {step === 2 && (
                    <div className="fade-in">
                        <button onClick={() => setStep(1)} className="text-sm text-slate-400 mb-4 hover:text-red-600 flex items-center gap-1 font-bold uppercase tracking-wide">← Volver</button>
                        <h2 className="text-2xl font-black italic uppercase mb-2">Tu Vehículo 🚗</h2>
                        <p className="text-slate-500 mb-6 font-medium">Hola <span className="text-slate-900 font-bold">{client?.name}</span>, ingresá la patente.</p>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Patente</label>
                                <input
                                    type="text"
                                    value={plate}
                                    onChange={(e) => setPlate(e.target.value.toUpperCase())}
                                    placeholder="Ej: AA123BB"
                                    className="w-full p-4 rounded-xl border border-slate-200 text-lg font-black uppercase tracking-widest text-center focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder:text-slate-200"
                                    autoFocus
                                />
                            </div>

                            {/* New Vehicle Inputs */}
                            {vehicle === null && plate.length > 5 && !loading && (
                                <div className="fade-in bg-indigo-50 p-4 rounded-xl border border-indigo-100">
                                    <p className="text-sm text-indigo-800 mb-3 font-bold">Vehículo nuevo. Completa los datos:</p>
                                    <div className="space-y-3">
                                        <input
                                            type="text"
                                            value={vehicleInfo.brand}
                                            onChange={(e) => setVehicleInfo({ ...vehicleInfo, brand: e.target.value })}
                                            placeholder="Marca (Ej: Toyota)"
                                            className="w-full p-3 rounded-lg border border-indigo-200 font-medium"
                                        />
                                        <input
                                            type="text"
                                            value={vehicleInfo.model}
                                            onChange={(e) => setVehicleInfo({ ...vehicleInfo, model: e.target.value })}
                                            placeholder="Modelo (Ej: Corolla)"
                                            className="w-full p-3 rounded-lg border border-indigo-200 font-medium"
                                        />
                                    </div>
                                </div>
                            )}

                            <button
                                onClick={vehicle === null ? createVehicle : checkVehicle}
                                disabled={loading || plate.length < 5}
                                className="w-full bg-red-600 text-white p-4 rounded-xl font-black text-lg shadow-xl shadow-red-600/20 disabled:opacity-50 disabled:shadow-none hover:bg-red-700 active:scale-[0.98] transition-all uppercase tracking-wide"
                            >
                                {loading ? '...' : vehicle === null ? 'Guardar y Seguir' : 'Siguiente'}
                            </button>
                        </div>
                    </div>
                )}

                {/* --- STEP 3: SERVICE --- */}
                {step === 3 && (
                    <div className="fade-in">
                        <button onClick={() => setStep(isReturning ? 1.5 : 2)} className="text-sm text-slate-400 mb-4 hover:text-red-600 flex items-center gap-1 font-bold uppercase tracking-wide">← Volver</button>
                        <h2 className="text-2xl font-black italic uppercase mb-2">Servicio 🛠️</h2>
                        <p className="text-slate-500 mb-6 font-medium">Seleccioná qué necesitás realizar.</p>

                        <div className="space-y-3">
                            {services
                                .filter(s => {
                                    if (!vehicle?.type) return true;
                                    const vType = vehicle.type.toUpperCase();
                                    const sCat = s.category.toUpperCase();

                                    if (sCat === 'GENERAL') return true;
                                    if (vType === 'AUTO' && sCat === 'MOTO') return false;
                                    if (vType === 'MOTO' && sCat === 'AUTO') return false;
                                    if (vType === 'CAMIONETA' && sCat === 'MOTO') return false;

                                    return true;
                                })
                                .map(s => (
                                    <button
                                        key={s.id}
                                        onClick={() => selectService(s)}
                                        className="w-full p-4 rounded-xl border border-slate-200 flex justify-between items-center hover:border-blue-500 hover:bg-blue-50 transition-all text-left group"
                                    >
                                        <div>
                                            <span className="block font-bold text-slate-800 text-lg group-hover:text-blue-700">{s.name}</span>
                                            <span className="text-sm text-slate-400 group-hover:text-blue-500">{s.duration} min</span>
                                        </div>
                                        <span className="font-black text-red-600 text-lg">${s.price}</span>
                                    </button>
                                ))}
                        </div>
                    </div>
                )}

                {/* --- STEP 4: DATE/SLOTS --- */}
                {step === 4 && (
                    <div className="fade-in">
                        <button onClick={() => setStep(3)} className="text-sm text-slate-400 mb-4 hover:text-red-600 flex items-center gap-1 font-bold uppercase tracking-wide">← Volver</button>
                        <h2 className="text-2xl font-black italic uppercase mb-2">Fecha y Hora 📅</h2>
                        <p className="text-slate-500 mb-6 font-medium">Elegí cuándo venir.</p>

                        <div className="mb-6">
                            <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Fecha</label>
                            <input
                                type="date"
                                className="w-full p-4 rounded-xl border border-slate-200 text-lg font-medium outline-none focus:border-red-600"
                                onChange={(e) => fetchSlots(e.target.value)}
                                min={new Date().toISOString().split('T')[0]}
                            />
                        </div>

                        {loading && <p className="text-center text-slate-400 animate-pulse">Buscando horarios...</p>}

                        {date && !loading && (
                            <div className="grid grid-cols-3 gap-3">
                                {slots.length > 0 ? slots.map((slot: any) => {
                                    const time = new Date(slot).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' });
                                    const isSelected = selectedSlot === slot;
                                    return (
                                        <button
                                            key={slot}
                                            onClick={() => setSelectedSlot(slot)}
                                            className={`p-3 rounded-lg font-bold text-sm transition-all border-2 ${isSelected
                                                ? 'bg-neutral-900 border-neutral-900 text-white shadow-lg scale-105'
                                                : 'bg-white border-slate-200 text-slate-700 hover:border-red-600'
                                                }`}
                                        >
                                            {time}
                                        </button>
                                    );
                                }) : (
                                    <p className="col-span-3 text-center text-slate-400 py-4 font-medium bg-slate-100 rounded-xl">No hay turnos disponibles.</p>
                                )}
                            </div>
                        )}

                        <button
                            onClick={() => setStep(5)}
                            disabled={!selectedSlot}
                            className="mt-8 w-full bg-red-600 text-white p-4 rounded-xl font-black text-lg shadow-xl shadow-red-600/20 disabled:opacity-50 disabled:shadow-none hover:bg-red-700 active:scale-[0.98] transition-all uppercase tracking-wide"
                        >
                            Continuar
                        </button>
                    </div>
                )}

                {/* --- STEP 5: CONFIRM --- */}
                {step === 5 && (
                    <div className="fade-in">
                        <button onClick={() => setStep(4)} className="text-sm text-slate-400 mb-4 hover:text-red-600 flex items-center gap-1 font-bold uppercase tracking-wide">← Volver</button>
                        <h2 className="text-2xl font-black italic uppercase mb-6">Confirmar ✅</h2>

                        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 space-y-4 mb-8">
                            <div>
                                <p className="text-xs text-slate-400 uppercase font-bold tracking-wider">Cliente</p>
                                <p className="font-black text-lg text-slate-900">{client?.name}</p>
                            </div>
                            <div className="h-px bg-slate-100" />
                            <div>
                                <p className="text-xs text-slate-400 uppercase font-bold tracking-wider">Vehículo</p>
                                <p className="font-black text-lg text-slate-900 uppercase">{plate} <span className="text-slate-400 font-medium normal-case">({vehicle?.brand} {vehicle?.model})</span></p>
                            </div>
                            <div className="h-px bg-slate-100" />
                            <div>
                                <p className="text-xs text-slate-400 uppercase font-bold tracking-wider">Servicio</p>
                                <div className="flex justify-between items-center">
                                    <p className="font-black text-lg text-slate-900">{selectedService?.name}</p>
                                    <p className="font-black text-green-600 text-lg">${selectedService?.price}</p>
                                </div>
                            </div>
                            <div className="h-px bg-slate-100" />
                            <div>
                                <p className="text-xs text-slate-400 uppercase font-bold tracking-wider">Turno</p>
                                <p className="font-black text-lg text-blue-600 uppercase">
                                    {selectedSlot && new Date(selectedSlot).toLocaleString('es-AR', { weekday: 'long', day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' })}
                                </p>
                                <p className="text-xs text-slate-400 mt-1 font-medium">Asunción 505, Villa Carlos Paz</p>
                            </div>
                        </div>

                        <button
                            onClick={confirmAppointment}
                            disabled={loading}
                            className="w-full bg-red-600 text-white p-4 rounded-xl font-black text-lg shadow-xl shadow-red-600/20 disabled:opacity-50 hover:bg-red-700 active:scale-[0.98] transition-all uppercase tracking-wide"
                        >
                            {loading ? 'Confirmando...' : 'Confirmar Reserva'}
                        </button>
                    </div>
                )}

                {/* --- STEP 6: SUCCESS --- */}
                {step === 6 && (
                    <div className="fade-in text-center py-10">
                        <div className="w-24 h-24 bg-green-100 text-green-600 rounded-full flex items-center justify-center text-4xl mx-auto mb-6 shadow-xl shadow-green-100 animate-bounce">
                            🎉
                        </div>
                        <h2 className="text-3xl font-black text-slate-900 mb-2 italic uppercase">¡Solicitud Enviada!</h2>
                        <p className="text-slate-500 text-lg mb-8 font-medium">Hemos recibido tu solicitud. Te confirmaremos por WhatsApp a la brevedad.</p>

                        <div className="space-y-3">
                            <button
                                onClick={async () => {
                                    const caseId = (window as any).lastCaseId;
                                    if (caseId) {
                                        const res = await generateWhatsAppLink(caseId);
                                        if (res.success && res.url) {
                                            window.open(res.url, '_blank');
                                        }
                                        router.push(`/admin/inbox/${caseId}`);
                                    } else {
                                        router.push('/admin/inbox');
                                    }
                                }}
                                className="w-full bg-green-600 text-white p-4 rounded-xl font-black text-lg shadow-xl shadow-green-600/20 hover:bg-green-700 active:scale-[0.98] transition-all uppercase tracking-wide flex items-center justify-center gap-2"
                            >
                                <MessageCircle size={20} />
                                Confirmar por WhatsApp
                            </button>

                            <button
                                onClick={() => router.push('/')}
                                className="w-full bg-slate-100 text-slate-500 p-4 rounded-xl font-bold text-lg hover:bg-slate-200 transition-all font-medium"
                            >
                                Volver al Inicio
                            </button>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
}
