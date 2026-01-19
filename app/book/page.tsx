'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

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
};

type Service = {
    id: number;
    name: string;
    category: string;
    price: number;
    duration: number;
};

export default function BookAppointment() {
    const router = useRouter();
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    // Data
    const [phone, setPhone] = useState('+549');
    const [client, setClient] = useState<Client | null>(null);
    const [clientName, setClientName] = useState(''); // For new clients

    const [plate, setPlate] = useState('');
    const [vehicle, setVehicle] = useState<Vehicle | null>(null);
    const [vehicleInfo, setVehicleInfo] = useState({ brand: '', model: '' }); // For new vehicles

    const [services, setServices] = useState<Service[]>([]);
    const [selectedService, setSelectedService] = useState<Service | null>(null);

    const [date, setDate] = useState('');
    const [slots, setSlots] = useState<string[]>([]);
    const [selectedSlot, setSelectedSlot] = useState<string | null>(null);

    // --- STEP 1: CLIENT ---
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
                // Client not found, show name input
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

    // --- STEP 2: VEHICLE ---
    const checkVehicle = async () => {
        setLoading(true);
        setError('');
        try {
            const res = await fetch(`/api/vehicles?plate=${plate}`);
            const data = await res.json();
            // Filter vehicle by client? Optional, but good security.
            // For now, let's assume if it exists, use it.
            if (data && data.length > 0) {
                const v = data[0];
                // Check ownership if needed. For now simple.
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
                    // It exists, so let's just use it!
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

    // Auto-Fill Logic
    useEffect(() => {
        const lookup = async () => {
            if (plate.length >= 6 && !loading) {
                // Debounce simple
                try {
                    const res = await fetch(`/api/vehicles/lookup?plate=${plate}`);
                    const data = await res.json();
                    if (data && data.id) {
                        setVehicle(data);
                        setVehicleInfo({ brand: data.brand || '', model: data.model || '' });
                        // Also auto-link client if not set?
                        if (data.client && !client) {
                            setClient(data.client);
                            setPhone(data.client.phone);
                        }
                    } else {
                        // Not found, ensure we allow manual entry
                        if (vehicle?.id) setVehicle(null); // Reset if was previously set to another real car
                    }
                } catch (e) {
                    console.error(e);
                }
            }
        };
        const timer = setTimeout(lookup, 1000);
        return () => clearTimeout(timer);
    }, [plate]);

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
            if (Array.isArray(data)) {
                setSlots(data);
            } else {
                setSlots([]);
            }
        } catch (e) {
            console.error(e);
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
                setStep(6); // Success
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
        <div className="min-h-screen bg-slate-50 text-slate-900 pb-20">
            <header className="bg-neutral-900 p-4 shadow-lg text-center sticky top-0 z-10 border-b-4 border-red-600">
                <div className="flex items-center justify-center gap-2 mb-1">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor" className="text-red-600"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zM7 9c0-2.76 2.24-5 5-5s5 2.24 5 5c0 2.88-2.88 7.19-5 10.88C9.92 16.21 7 11.85 7 9z" /><circle cx="12" cy="9" r="2.5" /></svg>
                    <h1 className="font-black text-xl text-white tracking-tighter uppercase italic">FB Lubricentro</h1>
                </div>
                <p className="text-[0.65rem] text-neutral-400 font-bold tracking-[0.2em] uppercase">Reserva de Turnos</p>
            </header>

            <main className="max-w-md mx-auto p-6">
                {error && (
                    <div className="bg-red-50 text-red-600 p-4 rounded-xl mb-6 text-sm">
                        {error}
                    </div>
                )}

                {/* STEP 1: CLIENT */}
                {step === 1 && (
                    <div className="fade-in">
                        <h2 className="text-2xl font-bold mb-2">¡Hola! 👋</h2>
                        <p className="text-slate-500 mb-6">Ingresa tu número de celular para comenzar.</p>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-1">Celular</label>
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
                                    <p className="text-sm text-blue-800 mb-2">Es tu primera vez. ¿Cómo te llamás?</p>
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

                {/* STEP 2: VEHICLE */}
                {step === 2 && (
                    <div className="fade-in">
                        <button onClick={() => setStep(1)} className="text-sm text-slate-400 mb-4 hover:text-blue-600">← Volver</button>
                        <h2 className="text-2xl font-bold mb-2">Tu Vehículo 🚗</h2>
                        <p className="text-slate-500 mb-6">Hola {client?.name}, ingresá la patente.</p>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-1">Patente</label>
                                <input
                                    type="text"
                                    value={plate}
                                    onChange={(e) => setPlate(e.target.value.toUpperCase())}
                                    placeholder="Ej: AA123BB"
                                    className="w-full p-4 rounded-xl border border-slate-200 text-lg font-black uppercase tracking-widest text-center focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    autoFocus
                                />
                            </div>

                            {/* New Vehicle Inputs */}
                            {vehicle === null && plate.length > 5 && !loading && (
                                <div className="fade-in bg-indigo-50 p-4 rounded-xl border border-indigo-100">
                                    <p className="text-sm text-indigo-800 mb-3">Vehículo nuevo. Completa los datos:</p>
                                    <div className="space-y-3">
                                        <input
                                            type="text"
                                            value={vehicleInfo.brand}
                                            onChange={(e) => setVehicleInfo({ ...vehicleInfo, brand: e.target.value })}
                                            placeholder="Marca (Ej: Toyota)"
                                            className="w-full p-3 rounded-lg border border-indigo-200"
                                        />
                                        <input
                                            type="text"
                                            value={vehicleInfo.model}
                                            onChange={(e) => setVehicleInfo({ ...vehicleInfo, model: e.target.value })}
                                            placeholder="Modelo (Ej: Corolla)"
                                            className="w-full p-3 rounded-lg border border-indigo-200"
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

                {/* STEP 3: SERVICE */}
                {step === 3 && (
                    <div className="fade-in">
                        <button onClick={() => setStep(2)} className="text-sm text-slate-400 mb-4 hover:text-blue-600">← Volver</button>
                        <h2 className="text-2xl font-bold mb-2">Servicio 🛠️</h2>
                        <p className="text-slate-500 mb-6">Seleccioná qué necesitás realizar.</p>

                        <div className="space-y-3">
                            {services
                                .filter(s => {
                                    if (!vehicle?.type) return true; // Show all if unknown
                                    // Logic: If car is AUTO, hide MOTO. If car is MOTO, hide AUTO.
                                    // Assuming Service Category: 'AUTO', 'MOTO', 'GENERAL'
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
                                        className="w-full p-4 rounded-xl border border-slate-200 flex justify-between items-center hover:border-blue-500 hover:bg-blue-50 transition-all text-left"
                                    >
                                        <div>
                                            <span className="block font-bold text-slate-800 text-lg">{s.name}</span>
                                            <span className="text-sm text-slate-500">{s.duration} min</span>
                                        </div>
                                        <span className="font-black text-red-600 text-lg">${s.price}</span>
                                    </button>
                                ))}
                        </div>
                    </div>
                )}

                {/* STEP 4: DATE/SLOTS */}
                {step === 4 && (
                    <div className="fade-in">
                        <button onClick={() => setStep(3)} className="text-sm text-slate-400 mb-4 hover:text-blue-600">← Volver</button>
                        <h2 className="text-2xl font-bold mb-2">Fecha y Hora 📅</h2>
                        <p className="text-slate-500 mb-6">Elegí cuándo venir.</p>

                        <div className="mb-6">
                            <label className="block text-sm font-bold text-slate-700 mb-2">Fecha</label>
                            <input
                                type="date"
                                className="w-full p-4 rounded-xl border border-slate-200 text-lg font-medium"
                                onChange={(e) => fetchSlots(e.target.value)}
                                min={new Date().toISOString().split('T')[0]}
                            />
                        </div>

                        {loading && <p className="text-center text-slate-400">Buscando horarios...</p>}

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
                                    <p className="col-span-3 text-center text-slate-400 py-4">No hay turnos disponibles para esta fecha.</p>
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

                {/* STEP 5: CONFIRM */}
                {step === 5 && (
                    <div className="fade-in">
                        <button onClick={() => setStep(4)} className="text-sm text-slate-400 mb-4 hover:text-blue-600">← Volver</button>
                        <h2 className="text-2xl font-bold mb-6">Confirmar ✅</h2>

                        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 space-y-4 mb-8">
                            <div>
                                <p className="text-xs text-slate-400 uppercase font-bold tracking-wider">Cliente</p>
                                <p className="font-medium text-lg text-slate-900">{client?.name}</p>
                            </div>
                            <div className="h-px bg-slate-100" />
                            <div>
                                <p className="text-xs text-slate-400 uppercase font-bold tracking-wider">Vehículo</p>
                                <p className="font-medium text-lg text-slate-900 uppercase">{plate} <span className="text-slate-400 font-normal normal-case">({vehicle?.brand} {vehicle?.model})</span></p>
                            </div>
                            <div className="h-px bg-slate-100" />
                            <div>
                                <p className="text-xs text-slate-400 uppercase font-bold tracking-wider">Servicio</p>
                                <div className="flex justify-between items-center">
                                    <p className="font-medium text-lg text-slate-900">{selectedService?.name}</p>
                                    <p className="font-bold text-green-600 text-lg">${selectedService?.price}</p>
                                </div>
                            </div>
                            <div className="h-px bg-slate-100" />
                            <div>
                                <p className="text-xs text-slate-400 uppercase font-bold tracking-wider">Turno</p>
                                <p className="font-medium text-lg text-blue-600">
                                    {selectedSlot && new Date(selectedSlot).toLocaleString('es-AR', { weekday: 'long', day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' })}
                                </p>
                            </div>
                        </div>

                        <button
                            onClick={confirmAppointment}
                            disabled={loading}
                            className="w-full bg-red-600 text-white p-4 rounded-xl font-black text-lg shadow-xl shadow-red-600 text-lg shadow-xl shadow-red-600/20 disabled:opacity-50 hover:bg-red-700 active:scale-[0.98] transition-all uppercase tracking-wide"
                        >
                            {loading ? 'Confirmando...' : 'Confirmar Reserva'}
                        </button>
                    </div>
                )}

                {/* STEP 6: SUCCESS */}
                {step === 6 && (
                    <div className="fade-in text-center py-10">
                        <div className="w-24 h-24 bg-green-100 text-green-600 rounded-full flex items-center justify-center text-4xl mx-auto mb-6">
                            🎉
                        </div>
                        <h2 className="text-3xl font-black text-slate-900 mb-2">¡Solicitud Enviada!</h2>
                        <p className="text-slate-500 text-lg mb-8">Hemos recibido tu solicitud. Te confirmaremos por WhatsApp a la brevedad.</p>

                        <button
                            onClick={() => router.push('/')}
                            className="w-full bg-slate-900 text-white p-4 rounded-xl font-bold text-lg"
                        >
                            Volver al Inicio
                        </button>
                    </div>
                )}
            </main>
        </div>
    );
}
