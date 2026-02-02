'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { User, Car, ArrowRight, Check, AlertCircle, MessageCircle } from 'lucide-react';
import { generateWhatsAppLink } from '../actions/inbox';
import { suggestServiceItems } from '../actions/smart';

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
    const [plateError, setPlateError] = useState<string | null>(null);
    const [phoneError, setPhoneError] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);

    // Validation Logic
    const validatePlate = (plate: string) => {
        const mercosur = /^[A-Z]{2}\s*\d{3}\s*[A-Z]{2}$/; // AA 123 BB
        const old = /^[A-Z]{3}\s*\d{3}$/;                // AAA 123
        const moto = /^\d{3}\s*[A-Z]{3}$/;               // 123 AAA
        const motoNew = /^[A-Z]{1}\s*\d{3}\s*[A-Z]{3}$/; // A 123 AAA

        if (!plate) return null;

        if (mercosur.test(plate) || old.test(plate) || moto.test(plate) || motoNew.test(plate)) {
            return null;
        }
        return "Formato inválido (Ej: AA 123 BB)";
    };

    const validatePhone = (phone: string) => {
        const digits = phone.replace(/\D/g, '');
        if (!phone) return null;
        if (digits.length < 10) return "Mínimo 10 dígitos (Ej: 351xxxxxx)";
        if (digits.length > 13) return "Número demasiado largo";
        return null;
    };

    const cleanPhone = (p: string) => {
        let val = p.replace(/[^0-9]/g, '');
        if (val.startsWith('549')) val = val.slice(3);
        else if (val.startsWith('54')) val = val.slice(2);
        if (val.startsWith('0')) val = val.slice(1);
        return val;
    };

    // Mode
    const [isReturning, setIsReturning] = useState(false);

    // Data State
    const [phone, setPhone] = useState('+549');
    const [client, setClient] = useState<Client | null>(null);
    const [clientName, setClientName] = useState('');

    const [plate, setPlate] = useState('');
    const [vehicle, setVehicle] = useState<Vehicle | null>(null);
    const [vehicleInfo, setVehicleInfo] = useState({ brand: '', model: '', fuelType: 'Nafta', engine: '' });
    const [activeField, setActiveField] = useState<'brand' | 'model' | null>(null);

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
        const key = Object.keys(VEHICLE_DATA).find(k => k.toLowerCase() === input.toLowerCase());
        return key || input;
    };

    const availableModels = VEHICLE_DATA[normalizeBrand(vehicleInfo.brand)] || [];

    // Pending state for confirmation flow
    const [pendingVehicle, setPendingVehicle] = useState<Vehicle | null>(null);
    const [needsDataUpdate, setNeedsDataUpdate] = useState(false);

    const [services, setServices] = useState<Service[]>([]);
    const [selectedService, setSelectedService] = useState<Service | null>(null);

    const [date, setDate] = useState('');
    const [slots, setSlots] = useState<string[]>([]);
    const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
    const [isSoftBooking, setIsSoftBooking] = useState(false);

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
                    const specs = data.specifications || {};
                    setVehicleInfo({
                        brand: data.brand || '',
                        model: data.model || '',
                        fuelType: specs.fuelType || 'Nafta',
                        engine: specs.engine || ''
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
    // Force clean phone if it gets dirty from anywhere
    useEffect(() => {
        if (!phone) return;
        const cleaned = cleanPhone(phone);
        if (cleaned !== phone) {
            setPhone(cleaned);
        }
    }, [phone]);

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

            // API Route wrapper might return the client directly or { error }
            // Ensure we handle both success formats if wrapper changes
            if (data.error) {
                setError(data.error);
                return;
            }
            if (data.id || data.existing) {
                if (data.existing) {
                    setSuccessMessage(`¡Hola ${data.name}! Ya tenías cuenta, te conectamos automáticamente.`);
                    setTimeout(() => {
                        setSuccessMessage(null);
                        setClient(data);
                        setStep(2);
                    }, 2500);
                } else {
                    setClient(data);
                    setStep(2);
                }
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
        if (!client) {
            setError("Error: No se ha detectado el cliente. Por favor, refresca y vuelve a intentar.");
            return;
        }
        setLoading(true);
        try {
            const res = await fetch('/api/vehicles', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    plate,
                    brand: vehicleInfo.brand,
                    model: vehicleInfo.model,
                    clientId: Number(client.id),
                    fuelType: vehicleInfo.fuelType,
                    engine: vehicleInfo.engine
                })
            });
            const data = await res.json();

            // Check for specific "Exists" error to recover automatically
            // Relaxed check: Use "includes" instead of strict equality to catch variations
            if (data.error && (data.error.includes('already exists') || data.error.includes('ya existe'))) {
                console.log('Vehicle exists (loose match), switching to fetch mode...');
                await checkVehicle();
                return;
            }

            // Other errors: Debugging alert
            if (data.error) throw new Error(data.error);

            if (data.id) {
                setVehicle(data);
                await fetchServices(); // Wait for services
                setStep(3);
            } else {
                console.error('Strange API Response:', data);
                setError('Error desconocido al crear vehículo. ID no retornado.');
            }
        } catch (e: any) {
            console.error(e);
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
                        const specs = data.specifications || {};
                        setVehicleInfo({
                            brand: data.brand || '',
                            model: data.model || '',
                            fuelType: specs.fuelType || 'Nafta',
                            engine: specs.engine || ''
                        });
                        if (data.client && !client) {
                            setClient(data.client);
                            // Use outer cleanPhone
                            setPhone(cleanPhone(data.client.phone));
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

    // Smart Quote State
    const [smartQuote, setSmartQuote] = useState<any>(null);
    const [loadingQuote, setLoadingQuote] = useState(false);

    // --- STEP 3: SERVICE ---
    const fetchServices = async () => {
        const res = await fetch('/api/services');
        const data = await res.json();
        setServices(data.filter((s: any) => s.active));
    };

    // Smart Quote Effect
    useEffect(() => {
        if (step === 3 && vehicle?.id) {
            setLoadingQuote(true);
            suggestServiceItems(vehicle.id)
                .then(res => {
                    if (res.success) {
                        setSmartQuote(res.data);
                    } else {
                        setSmartQuote(null);
                    }
                })
                .catch(err => console.error(err))
                .finally(() => setLoadingQuote(false));
        }
    }, [step, vehicle]);

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
            const slotsArray = Array.isArray(data) ? data : [];
            setSlots(slotsArray);

            // Auto-reset soft booking if we change date
            setIsSoftBooking(false);
        } catch (e) {
            console.error(e);
            setSlots([]);
        } finally {
            setLoading(false);
        }
    };

    const confirmAppointment = async () => {
        if (!client || !vehicle || !selectedService || !selectedSlot) return;

        // Handle Smart Quote Selection
        const isSmart = selectedService.id === -1;
        const noteContent = isSmart
            ? `Reserva Smart Quote: ${smartQuote?.items?.map((i: any) => i.name).join(', ')}`
            : 'Reserva web';

        setLoading(true);
        try {
            const res = await fetch('/api/appointments', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    clientId: client.id,
                    vehicleId: vehicle.id,
                    serviceId: isSmart ? 1 : selectedService.id, // Fallback to ID 1
                    date: selectedSlot,
                    force: isSoftBooking,
                    notes: isSoftBooking ? `[SOLICITUD MANUAL] ${noteContent}` : noteContent
                })
            });

            if (res.ok) {
                const data = await res.json();
                if (data.data?.caseId) (window as any).lastCaseId = data.data.caseId;
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

            <main className="max-w-md mx-auto p-6 relative">
                {/* Success Overlay */}
                {successMessage && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-white/90 backdrop-blur-sm animate-in fade-in duration-300">
                        <div className="bg-white p-8 rounded-3xl shadow-2xl border border-slate-100 text-center max-w-sm w-full animate-in zoom-in-95 duration-300">
                            <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6 text-3xl shadow-inner animate-bounce">
                                👋
                            </div>
                            <h3 className="text-2xl font-black text-slate-900 mb-2">¡Bienvenido!</h3>
                            <p className="text-slate-500 font-medium text-lg leading-relaxed">
                                {successMessage.replace('¡Hola ', '').replace('! Ya tenías cuenta, te conectamos automáticamente.', '')}
                            </p>
                            <p className="text-green-600 font-bold mt-4 text-sm uppercase tracking-wide animate-pulse">
                                Conectando tu cuenta...
                            </p>
                        </div>
                    </div>
                )}
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
                                            onChange={(e) => {
                                                const val = e.target.value.toUpperCase();
                                                setPlate(val);
                                                if (plateError) setPlateError(validatePlate(val));
                                            }}
                                            onBlur={() => setPlateError(validatePlate(plate))}
                                            placeholder="AA123BB"
                                            className={`w-full p-5 rounded-2xl border-2 ${plateError ? 'border-red-500 focus:border-red-600 focus:ring-red-600/10' : 'border-slate-200 focus:border-red-600 focus:ring-red-600/10'} text-3xl font-black text-center uppercase tracking-[0.2em] focus:outline-none focus:ring-4 placeholder:text-slate-200 transition-all`}
                                            autoFocus
                                        />
                                        {plateError && (
                                            <p className="text-center text-xs font-bold text-red-500 mt-2 animate-in slide-in-from-top-1">
                                                {plateError}
                                            </p>
                                        )}
                                    </div>
                                    <button
                                        onClick={checkPlateIdentity}
                                        disabled={loading || plate.length < 5 || !!plateError}
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
                                <div className={`relative flex items-center w-full rounded-xl border ${phoneError ? 'border-red-500 ring-4 ring-red-500/10' : 'border-slate-200 focus-within:ring-4 focus-within:ring-blue-500/10 focus-within:border-blue-500'} transition-all bg-white overflow-hidden`}>
                                    <div className="pl-4 flex items-center gap-2 border-r border-slate-100 pr-3 py-4 select-none bg-slate-50 text-slate-600 flex-shrink-0 whitespace-nowrap">
                                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 9 6" className="w-6 h-auto shadow-sm rounded-sm">
                                            <rect width="9" height="6" fill="#75AADB" />
                                            <rect y="2" width="9" height="2" fill="#fff" />
                                            <circle cx="4.5" cy="3" r="0.6" fill="#F6B40E" />
                                        </svg>
                                        <span className="font-black text-sm tracking-wider">+54 9</span>
                                    </div>
                                    <input
                                        type="tel"
                                        value={phone}
                                        onChange={(e) => {
                                            const val = cleanPhone(e.target.value);
                                            setPhone(val);
                                            if (phoneError) setPhoneError(validatePhone(val));
                                        }}
                                        onBlur={() => setPhoneError(validatePhone(phone))}
                                        placeholder="351 123 4567"
                                        className="flex-1 w-full p-4 bg-transparent outline-none text-lg font-bold tracking-widest pl-3 text-slate-800 placeholder:text-slate-300"
                                        autoFocus
                                    />
                                </div>
                                {phoneError && (
                                    <p className="text-xs font-bold text-red-500 mt-2 animate-in slide-in-from-top-1">
                                        {phoneError}
                                    </p>
                                )}
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
                                disabled={loading || phone.length < 6 || !!phoneError}
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
                                    onChange={(e) => {
                                        const val = e.target.value.toUpperCase();
                                        setPlate(val);
                                        if (plateError) setPlateError(validatePlate(val));
                                    }}
                                    onBlur={() => setPlateError(validatePlate(plate))}
                                    placeholder="Ej: AA123BB"
                                    className={`w-full p-4 rounded-xl border ${plateError ? 'border-red-500 focus:ring-red-200' : 'border-slate-200 focus:ring-blue-500'} text-lg font-black uppercase tracking-widest text-center focus:outline-none focus:ring-2 placeholder:text-slate-200 transition-all`}
                                    autoFocus
                                />
                                {plateError && (
                                    <p className="text-center text-xs font-bold text-red-500 mt-2 animate-in slide-in-from-top-1">
                                        {plateError}
                                    </p>
                                )}
                            </div>

                            {/* New Vehicle Inputs */}
                            {vehicle === null && plate.length > 5 && !loading && (
                                <div className="fade-in bg-indigo-50 p-4 rounded-xl border border-indigo-100">
                                    <p className="text-sm text-indigo-800 mb-3 font-bold">Vehículo nuevo. Completa los datos:</p>
                                    <div className="space-y-4">

                                        <div className="grid grid-cols-2 gap-3">
                                            <div className="space-y-1 relative group">
                                                <input
                                                    type="text"
                                                    value={vehicleInfo.brand}
                                                    onChange={(e) => {
                                                        setVehicleInfo({ ...vehicleInfo, brand: e.target.value });
                                                        setActiveField('brand');
                                                    }}
                                                    onFocus={() => setActiveField('brand')}
                                                    onBlur={() => setTimeout(() => setActiveField(null), 200)}
                                                    placeholder="Marca (Ej: Toyota)"
                                                    className="w-full p-3 rounded-lg border border-indigo-200 font-medium bg-white"
                                                />
                                                {activeField === 'brand' && vehicleInfo.brand.length > 0 && (
                                                    <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-100 shadow-xl rounded-xl max-h-48 overflow-y-auto z-50">
                                                        {Object.keys(VEHICLE_DATA)
                                                            .filter(b => b.toLowerCase().includes(vehicleInfo.brand.toLowerCase()))
                                                            .map(b => (
                                                                <button
                                                                    key={b}
                                                                    type="button"
                                                                    onClick={() => {
                                                                        setVehicleInfo({ ...vehicleInfo, brand: b });
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
                                                <input
                                                    type="text"
                                                    value={vehicleInfo.model}
                                                    onChange={(e) => {
                                                        setVehicleInfo({ ...vehicleInfo, model: e.target.value });
                                                        setActiveField('model');
                                                    }}
                                                    onFocus={() => setActiveField('model')}
                                                    onBlur={() => setTimeout(() => setActiveField(null), 200)}
                                                    placeholder="Modelo (Ej: Corolla)"
                                                    className="w-full p-3 rounded-lg border border-indigo-200 font-medium bg-white"
                                                />
                                                {activeField === 'model' && availableModels.length > 0 && (
                                                    <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-100 shadow-xl rounded-xl max-h-48 overflow-y-auto z-50">
                                                        {availableModels
                                                            .filter(m => m.toLowerCase().includes(vehicleInfo.model.toLowerCase()))
                                                            .map(m => (
                                                                <button
                                                                    key={m}
                                                                    type="button"
                                                                    onClick={() => {
                                                                        setVehicleInfo({ ...vehicleInfo, model: m });
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

                                        <div className="grid grid-cols-2 gap-3">
                                            <div className="space-y-1">
                                                <select
                                                    className="w-full p-3 rounded-lg border border-indigo-200 font-medium bg-white"
                                                    value={vehicleInfo.fuelType}
                                                    onChange={(e) => setVehicleInfo({ ...vehicleInfo, fuelType: e.target.value })}
                                                >
                                                    <option value="Nafta">Nafta</option>
                                                    <option value="Diesel">Diesel</option>
                                                    <option value="GNC">GNC</option>
                                                    <option value="Híbrido">Híbrido</option>
                                                    <option value="Eléctrico">Eléctrico</option>
                                                </select>
                                            </div>
                                            <div className="space-y-1">
                                                <input
                                                    type="text"
                                                    value={vehicleInfo.engine}
                                                    onChange={(e) => setVehicleInfo({ ...vehicleInfo, engine: e.target.value })}
                                                    placeholder="Motor (Ej: 1.6)"
                                                    className="w-full p-3 rounded-lg border border-indigo-200 font-medium bg-white"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            <button
                                onClick={vehicle === null ? createVehicle : checkVehicle}
                                disabled={loading || plate.length < 5 || !!plateError}
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
                        <h2 className="text-2xl font-black italic uppercase mb-2">Servicio 🔧</h2>
                        <p className="text-slate-500 mb-6 font-medium">Seleccioná qué necesitás realizar.</p>

                        <div className="space-y-4">
                            {/* SMART QUOTE CARD */}
                            {loadingQuote && (
                                <div className="bg-slate-50 border-2 border-slate-100 rounded-2xl p-6 animate-pulse">
                                    <div className="h-6 bg-slate-200 rounded w-1/3 mb-4"></div>
                                    <div className="h-4 bg-slate-200 rounded w-2/3 mb-2"></div>
                                    <div className="h-4 bg-slate-200 rounded w-1/2"></div>
                                </div>
                            )}

                            {!loadingQuote && smartQuote?.success && smartQuote.items?.length > 0 && (
                                <button
                                    onClick={() => selectService({ id: -1, name: 'Smart Quote', category: 'SMART', price: smartQuote.items.reduce((sum: number, i: any) => sum + (i.price * i.quantity), 0), duration: 45, active: true })}
                                    className="w-full relative overflow-hidden bg-gradient-to-br from-indigo-600 to-blue-700 text-white p-6 rounded-2xl shadow-lg border-2 border-transparent hover:scale-[1.02] transition-all text-left group"
                                >
                                    <div className="absolute top-0 right-0 p-4 opacity-10">
                                        <div className="bg-white p-2 rounded-full">
                                            <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z" /></svg>
                                        </div>
                                    </div>

                                    <span className="inline-block bg-white/20 backdrop-blur-sm text-white text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded mb-3">
                                        Recomendado para vos
                                    </span>

                                    <h3 className="text-xl font-black mb-1">Presupuesto Inteligente</h3>
                                    <p className="text-indigo-100 text-sm mb-4 font-medium opacity-90 line-clamp-2">
                                        {smartQuote.items.map((i: any) => i.name).join(' + ')}
                                    </p>

                                    <div className="flex items-end justify-between mt-2">
                                        <div className="text-3xl font-black">
                                            $ {smartQuote.items.reduce((sum: number, i: any) => sum + (i.price * i.quantity), 0).toLocaleString()}
                                        </div>
                                        <span className="bg-white text-blue-700 px-4 py-2 rounded-xl font-bold text-sm shadow-sm group-hover:bg-blue-50 transition-colors">
                                            Seleccionar
                                        </span>
                                    </div>
                                </button>
                            )}

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
                                        className="w-full bg-white p-6 rounded-2xl shadow-sm border-2 border-slate-100 hover:border-red-600 hover:shadow-md transition-all text-left flex justify-between items-center group"
                                    >
                                        <div>
                                            <h3 className="text-lg font-black text-slate-900 mb-1 group-hover:text-red-700 transition-colors">{s.name}</h3>
                                            <p className="text-slate-400 text-sm font-bold">{s.duration} min</p>
                                        </div>
                                        <span className="text-xl font-black text-red-600 group-hover:scale-110 transition-transform">
                                            ${s.price.toLocaleString()}
                                        </span>
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
                                    <div className="col-span-3 text-center space-y-4 py-8 px-4 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200">
                                        <p className="text-slate-400 font-bold uppercase tracking-tight text-sm">No hay turnos disponibles online</p>
                                        <button
                                            onClick={() => {
                                                const fallbackTime = `${date}T08:30:00.000Z`;
                                                setSelectedSlot(fallbackTime);
                                                setIsSoftBooking(true);
                                            }}
                                            className="bg-white text-red-600 border-2 border-red-600 px-6 py-3 rounded-xl font-black text-sm hover:bg-red-50 transition-all uppercase italic"
                                        >
                                            Solicitar sobre-turno (Manual)
                                        </button>
                                        <p className="text-[10px] text-slate-400 leading-tight">Tu pedido entrará como pendiente y te confirmaremos la hora exacta por WhatsApp.</p>
                                    </div>
                                )}
                            </div>
                        )}

                        {isSoftBooking && (
                            <div className="mt-6 bg-amber-50 border-2 border-amber-200 p-4 rounded-2xl flex items-start gap-3 animate-in fade-in slide-in-from-bottom-2">
                                <AlertCircle className="text-amber-500 shrink-0" size={20} />
                                <div>
                                    <p className="text-amber-900 font-black text-xs uppercase italic">Reserva en espera</p>
                                    <p className="text-amber-700 text-[11px] font-medium leading-tight mt-0.5">Te asignamos un horario tentativo, pero un asesor se comunicará con vos para confirmarlo.</p>
                                </div>
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
                                        if (res.success) {
                                            const url = res.data?.url;
                                            if (url) window.open(url, '_blank');
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
