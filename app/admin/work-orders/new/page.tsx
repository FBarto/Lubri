'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createQuickClient, sendWorkOrderWhatsApp } from '@/app/actions/business';
import { generatePortalLinkForVehicle } from '@/app/actions/portal';
import WhatsAppEditorModal from '@/app/components/whatsapp/WhatsAppEditorModal';

function NewWorkOrderForm() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const appointmentId = searchParams.get('appointmentId');

    const [loading, setLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');
    const [searchingPlate, setSearchingPlate] = useState(false);
    const [isNewVehicle, setIsNewVehicle] = useState(false);
    const [availableServices, setAvailableServices] = useState<any[]>([]);
    const [isMassLoad, setIsMassLoad] = useState(false);
    const [lastSavedOrder, setLastSavedOrder] = useState<any>(null);
    const [sendingWhatsApp, setSendingWhatsApp] = useState(false);
    const [whatsappPreviewModal, setWhatsappPreviewModal] = useState(false);
    const [waMessage, setWaMessage] = useState('');

    // Form Data
    const [formData, setFormData] = useState({
        clientId: '',
        vehicleId: '',
        serviceId: '',
        price: '',
        mileage: '',
        notes: '',
        clientName: '',
        clientPhone: '',
        vehiclePlate: '',
        vehicleBrand: '',
        vehicleModel: '',
        vehicleFuelType: 'NAFTA',
        vehicleEngine: '',
        serviceName: '',
        date: new Date().toISOString().split('T')[0], // Default to today
        serviceDetails: {
            oil: { brand: '', liters: '', type: 'SINTETICO' },
            filters: { air: false, oil: false, fuel: false, cabin: false },
            filterDetails: { air: '', oil: '', fuel: '', cabin: '' },
            fluids: { coolant: true, brakes: true, gearbox: true, differential: true, hydraulic: true },
            additives: [] as any[]
        }
    });


    const [productResults, setProductResults] = useState<any[]>([]);
    const [clientResults, setClientResults] = useState<any[]>([]);
    const [activeSearchField, setActiveSearchField] = useState<string | null>(null);

    // Initial Date Persistence Logic
    useEffect(() => {
        const savedDate = localStorage.getItem('lastWorkOrderDate');
        if (savedDate) {
            setFormData(prev => ({ ...prev, date: savedDate }));
        }
    }, []);

    // Sync Date to localStorage
    useEffect(() => {
        if (formData.date) {
            localStorage.setItem('lastWorkOrderDate', formData.date);
        }
    }, [formData.date]);

    const searchProduct = async (val: string) => {
        if (val.length > 2) {
            try {
                const res = await fetch(`/api/products?search=${val}`);
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

    const searchClient = async (val: string) => {
        if (val.length > 2) {
            try {
                const res = await fetch(`/api/clients?search=${val}`);
                const data = await res.json();
                setClientResults(Array.isArray(data.data) ? data.data : (Array.isArray(data) ? data : []));
            } catch (e) {
                console.error("Error searching client", e);
                setClientResults([]);
            }
        } else {
            setClientResults([]);
        }
    };


    useEffect(() => {
        fetchServices();
        if (appointmentId) {
            loadAppointment(appointmentId);
        }
    }, [appointmentId]);

    const fetchServices = async () => {
        try {
            const res = await fetch('/api/services');
            const data = await res.json();
            if (Array.isArray(data)) {
                setAvailableServices(data);

                // Pre-select service if not coming from appointment
                if (!appointmentId && data.length > 0) {
                    const defaultService = data.find(s =>
                        s.name.toLowerCase().includes('service') ||
                        s.name.toLowerCase().includes('aceite')
                    ) || data[0];

                    if (defaultService) {
                        setFormData(prev => ({
                            ...prev,
                            serviceId: defaultService.id.toString(),
                            serviceName: defaultService.name,
                            price: defaultService.price.toString()
                        }));
                    }
                }
            }
        } catch (e) {
            console.error('Error fetching services', e);
        }
    };

    const resetForm = () => {
        setFormData(prev => ({
            ...prev,
            vehiclePlate: '',
            vehicleId: '',
            clientId: '',
            clientName: '',
            clientPhone: '',
            vehicleBrand: '',
            vehicleModel: '',
            mileage: '',
            notes: '',
            serviceDetails: {
                oil: { brand: '', liters: prev.serviceDetails.oil.liters, type: prev.serviceDetails.oil.type },
                filters: { air: false, oil: false, fuel: false, cabin: false },
                filterDetails: { air: '', oil: '', fuel: '', cabin: '' },
                fluids: { coolant: true, brakes: true, gearbox: true, differential: true, hydraulic: true },
                additives: []
            }
        }));
        setIsNewVehicle(false);
        setProductResults([]);
        setClientResults([]);
        setLastSavedOrder(null);
        setActiveSearchField(null);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handlePlateSearch = async (plate: string) => {
        if (plate.length < 6) return;
        setSearchingPlate(true);
        setError('');
        try {
            const res = await fetch(`/api/vehicles/by-plate?plate=${plate}`);
            if (res.ok) {
                const vehicle = await res.json();

                // Autofill logic from last service
                let lastServiceDetails = {};
                if (vehicle.workOrders && vehicle.workOrders.length > 0) {
                    const lastWO = vehicle.workOrders[0];
                    if (lastWO.serviceDetails) {
                        const ls = lastWO.serviceDetails;
                        // Map last service details to current form structure
                        // We reset booleans to false (as they need to be checked again for new service)
                        // But we KEEP the types/brands to save typing
                        lastServiceDetails = {
                            oil: {
                                brand: ls.oil?.brand || '',
                                liters: ls.oil?.liters || '',
                                type: ls.oil?.type || 'SINTETICO'
                            },
                            filters: { air: false, oil: false, fuel: false, cabin: false }, // Reset checks
                            filterDetails: {
                                air: ls.filterDetails?.air || '',
                                oil: ls.filterDetails?.oil || '',
                                fuel: ls.filterDetails?.fuel || '',
                                cabin: ls.filterDetails?.cabin || ''
                            },
                            fluids: { coolant: true, brakes: true, gearbox: true, differential: true, hydraulic: true },
                            additives: []
                        };
                    }
                }

                setFormData(prev => ({
                    ...prev,
                    vehicleId: vehicle.id,
                    clientId: vehicle.clientId,
                    clientName: vehicle.client.name,
                    clientPhone: vehicle.client.phone || '',
                    vehiclePlate: vehicle.plate,
                    vehicleBrand: vehicle.brand || '',
                    vehicleModel: vehicle.model || '',
                    mileage: vehicle.mileage || '',
                    serviceDetails: {
                        ...prev.serviceDetails,
                        ...lastServiceDetails
                    }
                }));
                setIsNewVehicle(false);
            } else {
                setIsNewVehicle(true);
                setFormData(prev => ({
                    ...prev,
                    clientId: '',
                    vehicleId: '',
                    clientName: '',
                    clientPhone: '',
                    vehicleBrand: '',
                    vehicleModel: '',
                    vehicleFuelType: 'NAFTA',
                    vehicleEngine: ''
                }));
                setError('Vehículo no encontrado. Podés registrarlo ahora.');
            }
        } catch (e) {
            console.error(e);
        } finally {
            setSearchingPlate(false);
        }
    };

    const loadAppointment = async (id: string) => {
        setLoading(true);
        try {
            const res = await fetch(`/api/appointments/${id}`);
            const data = await res.json();
            if (data.id) {
                setFormData({
                    clientId: data.clientId,
                    vehicleId: data.vehicleId,
                    serviceId: data.serviceId,
                    price: data.service.price,
                    mileage: data.vehicle.mileage || '',
                    notes: '',
                    clientName: data.client.name,
                    clientPhone: data.client.phone || '', // Added
                    vehiclePlate: data.vehicle.plate,
                    vehicleBrand: data.vehicle.brand || '', // Added
                    vehicleModel: data.vehicle.model || '', // Added
                    vehicleFuelType: data.vehicle.specifications?.fuelType || 'NAFTA',
                    vehicleEngine: data.vehicle.specifications?.engine || '',
                    serviceName: data.service.name,
                    date: new Date().toISOString().split('T')[0],
                    serviceDetails: data.serviceDetails || {
                        oil: { brand: '', liters: '', type: 'SINTETICO' },
                        filters: { air: false, oil: false, fuel: false, cabin: false },
                        filterDetails: { air: '', oil: '', fuel: '', cabin: '' },
                        fluids: { coolant: true, brakes: true, gearbox: true, differential: true, hydraulic: true },
                        additives: [] as any[]
                    }
                });
                setIsNewVehicle(false); // Ensure reset
            }
        } catch (e) {
            console.error(e);
            setError('Error cargando el turno');
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e?: React.FormEvent, shouldShare = false) => {
        if (e) e.preventDefault();
        setSubmitting(true);
        setError('');
        try {
            let currentClientId = formData.clientId;
            let currentVehicleId = formData.vehicleId;

            // Handle New Vehicle Registration
            if (isNewVehicle) {
                const registration = await createQuickClient({
                    name: formData.clientName,
                    phone: formData.clientPhone,
                    plate: formData.vehiclePlate,
                    brand: formData.vehicleBrand,
                    model: formData.vehicleModel,
                    fuelType: formData.vehicleFuelType,
                    engine: formData.vehicleEngine,
                    clientId: formData.clientId ? Number(formData.clientId) : undefined
                });

                if (registration.success && registration.data.client && registration.data.vehicle) {
                    currentClientId = registration.data.client.id.toString();
                    currentVehicleId = registration.data.vehicle.id.toString();
                } else {
                    setError('Error al registrar cliente: ' + (registration.error || 'No se pudo crear el vehículo'));
                    setSubmitting(false);
                    return;
                }
            }

            const res = await fetch('/api/work-orders', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    clientId: currentClientId,
                    vehicleId: currentVehicleId,
                    serviceId: formData.serviceId,
                    price: formData.price,
                    mileage: formData.mileage,
                    notes: formData.notes,
                    date: formData.date,
                    serviceDetails: formData.serviceDetails,
                    appointmentId: appointmentId
                })
            });

            if (res.ok) {
                const newOrder = await res.json();

                // Set last saved order for the banner
                setLastSavedOrder({
                    id: newOrder.id,
                    vehicleId: currentVehicleId,
                    plate: formData.vehiclePlate,
                    clientName: formData.clientName,
                    clientPhone: formData.clientPhone || '', // Use the phone already in state
                    vehicleBrand: formData.vehicleBrand,
                    vehicleModel: formData.vehicleModel
                });

                if (isMassLoad) {
                    resetForm();

                    if (shouldShare) {
                        const carName = [formData.vehicleBrand, formData.vehicleModel].filter(Boolean).join(' ') || 'vehículo';
                        const resLink = await generatePortalLinkForVehicle(currentVehicleId);
                        if (resLink.success && resLink.data?.url) {
                            const origin = window.location.origin;
                            const fullLink = `${origin}${resLink.data.url}`;
                            const message = `¡Hola ${formData.clientName}! 👋 Te paso la Tarjeta de Salud Digital de tu ${carName} para que lleves el control de tus services en FB Lubricentro 🛠️.\n\nAcá tenés el link: ${fullLink}\n\nGuardalo para tu próximo service. ¡Te esperamos! 🚗`;
                            const encodedMessage = encodeURIComponent(message);
                            window.open(`https://wa.me/${formData.clientPhone.replace(/\D/g, '')}?text=${encodedMessage}`, '_blank');
                        }
                    }
                } else {
                    if (shouldShare) {
                        const carName = [formData.vehicleBrand, formData.vehicleModel].filter(Boolean).join(' ') || 'vehículo';
                        const resLink = await generatePortalLinkForVehicle(currentVehicleId);
                        if (resLink.success && resLink.data?.url) {
                            const origin = window.location.origin;
                            const fullLink = `${origin}${resLink.data.url}`;
                            const message = `¡Hola ${formData.clientName}! 👋 Te paso la Tarjeta de Salud Digital de tu ${carName} para que lleves el control de tus services en FB Lubricentro 🛠️.\n\nAcá tenés el link: ${fullLink}\n\nGuardalo para tu próximo service. ¡Te esperamos! 🚗`;
                            const encodedMessage = encodeURIComponent(message);
                            window.open(`https://wa.me/${formData.clientPhone.replace(/\D/g, '')}?text=${encodedMessage}`, '_blank');
                        }
                        resetForm();
                    }
                    // Continue showing success banner/modal if not sharing or just let the reset handle it if necessary
                }
            } else {
                const err = await res.json();
                setError(err.error || 'Error al guardar');
            }
        } catch (e: any) {
            setError(e.message);
        } finally {
            setSubmitting(false);
        }
    };

    const handleSendWhatsApp = async () => {
        if (!lastSavedOrder?.id) return;
        setSendingWhatsApp(true);
        try {
            // Get Vehicle ID for the link (we need to fetch it if from mass load or we don't have it)
            // But we already have the plate in lastSavedOrder.
            // Let's assume we have it or fetch by ID if possible.
            const resLink = await generatePortalLinkForVehicle(lastSavedOrder.vehicleId || Number(formData.vehicleId));

            if (resLink.success && resLink.data?.url) {
                const origin = window.location.origin;
                const fullLink = `${origin}${resLink.data.url}`;

                // Construct vehicle string
                const carName = [lastSavedOrder.vehicleBrand, lastSavedOrder.vehicleModel].filter(Boolean).join(' ') || 'vehículo';

                // personalized message
                const message = `¡Hola ${lastSavedOrder.clientName}! 👋 Te paso la Tarjeta de Salud Digital de tu ${carName} para que lleves el control de tus services en FB Lubricentro 🛠️.\n\nAcá tenés el link: ${fullLink}\n\nGuardalo para tu próximo service. ¡Te esperamos! 🚗`;

                setWaMessage(message);
                setWhatsappPreviewModal(true);
            } else {
                alert('Error al generar el link: ' + resLink.error);
            }
        } catch (e) {
            console.error(e);
            alert('Error al preparar el mensaje de WhatsApp.');
        } finally {
            setSendingWhatsApp(false);
        }
    };

    const handleFinalWAShare = () => {
        const encodedMsg = encodeURIComponent(waMessage);
        const phone = lastSavedOrder.clientPhone || formData.clientPhone;
        const cleanPhone = phone.replace(/\D/g, '');
        const waLink = `https://wa.me/${cleanPhone}?text=${encodedMsg}`;

        window.open(waLink, '_blank');
        setWhatsappPreviewModal(false);
        setLastSavedOrder(null);
    };

    if (loading) return <div className="p-10 text-center">Cargando datos...</div>;

    return (
        <div className="max-w-2xl mx-auto">
            <h1 className="text-3xl font-extrabold text-slate-900 mb-8">Iniciar Servicio 🛠️</h1>

            {/* Success Pop-up Modal */}
            {lastSavedOrder && !whatsappPreviewModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-300">
                    <div className="bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl shadow-emerald-500/20 overflow-hidden animate-in zoom-in-95 slide-in-from-bottom-8 duration-500">
                        {/* Header Image/Icon */}
                        <div className="bg-emerald-500 p-8 flex justify-center">
                            <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center shadow-lg animate-bounce">
                                <svg width="40" height="40" fill="none" viewBox="0 0 24 24" stroke="black" strokeWidth="3">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                </svg>
                            </div>
                        </div>

                        <div className="p-8 text-center">
                            <h2 className="text-2xl font-black text-slate-900 mb-2 italic uppercase">¡Papel Guardado!</h2>
                            <p className="text-slate-500 font-medium mb-6">
                                La orden para <span className="text-slate-900 font-black">{lastSavedOrder.plate}</span> se registró correctamente.
                            </p>

                            {/* Detalle Link */}
                            <a
                                href={`/admin/work-orders/${lastSavedOrder.id}`}
                                target="_blank"
                                className="group flex items-center justify-center gap-2 text-sm font-black text-emerald-600 mb-8 hover:text-emerald-700 transition-colors"
                            >
                                <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3"><path d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                                REVISAR DETALLE TÉCNICO
                            </a>

                            {/* Actions */}
                            <div className="space-y-3">
                                <button
                                    type="button"
                                    onClick={handleSendWhatsApp}
                                    className="w-full bg-emerald-500 text-white p-5 rounded-2xl font-black flex items-center justify-center gap-3 hover:bg-emerald-600 transition-all shadow-xl shadow-emerald-500/20 active:scale-95 group uppercase tracking-widest text-sm"
                                    disabled={sendingWhatsApp}
                                >
                                    <svg className="w-5 h-5 fill-current group-hover:rotate-12 transition-transform" viewBox="0 0 448 512"><path d="M380.9 97.1C339 55.1 283.2 32 223.9 32c-122.4 0-222 99.6-222 222 0 39.1 10.2 77.3 29.6 111L0 480l117.7-30.9c32.4 17.7 68.9 27 106.1 27h.1c122.3 0 224.1-99.6 224.1-222 0-59.3-25.2-115-67.1-157zm-157 341.6c-33.2 0-65.7-8.9-94-25.7l-6.7-4-69.8 18.3L72 359.2l-4.4-7c-18.5-29.4-28.2-63.3-28.2-98.2 0-101.7 82.8-184.5 184.6-184.5 49.3 0 95.6 19.2 130.4 54.1 34.8 34.9 56.2 81.2 56.1 130.5 0 101.8-84.9 184.6-186.6 184.6zm101.2-138.2c-5.5-2.8-32.8-16.2-37.9-18-5.1-1.9-8.8-2.8-12.5 2.8-3.7 5.6-14.3 18-17.6 21.8-3.2 3.7-6.5 4.2-12 1.4-5.5-2.8-23.2-8.5-44.2-27.1-16.4-14.6-27.4-32.6-30.6-38.1-3.2-5.6-.3-8.6 2.5-11.3 2.5-2.5 5.5-6.5 8.3-9.7 2.8-3.3 3.7-5.6 5.5-9.2 1.8-3.7.9-6.9-.5-9.7-1.4-2.8-12.5-30.1-17.1-41.2-4.5-10.8-9.1-9.3-12.5-9.5-3.2-.2-6.9-.2-10.6-.2-3.7 0-9.7 1.4-14.8 6.9-5.1 5.6-19.4 19-19.4 46.3 0 27.3 19.9 53.7 22.6 57.4 2.8 3.7 39.1 59.7 94.8 83.8 13.2 5.8 23.5 9.2 31.5 11.8 13.3 4.2 25.4 3.6 35 2.2 10.7-1.5 32.8-13.4 37.4-26.4 4.6-13 4.6-24.1 3.2-26.4-1.3-2.5-5-3.9-10.5-6.6z" /></svg>
                                    Enviar Tarjeta Digital 📱
                                </button>

                                <button
                                    type="button"
                                    onClick={resetForm}
                                    className="w-full bg-slate-900 text-white p-5 rounded-2xl font-black flex items-center justify-center gap-3 hover:bg-black transition-all shadow-xl shadow-slate-900/10 active:scale-95 uppercase tracking-widest text-sm"
                                >
                                    Cargar Siguiente 📄
                                </button>

                                <button
                                    type="button"
                                    onClick={() => {
                                        setLastSavedOrder(null);
                                        router.push('/admin/dashboard');
                                        router.refresh();
                                    }}
                                    className="w-full text-slate-400 p-2 rounded-xl text-[10px] font-bold hover:text-slate-600 transition-colors uppercase tracking-widest"
                                >
                                    Volver al Dashboard 🏠
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* WhatsApp Preview & Editor Modal */}
            <WhatsAppEditorModal
                isOpen={whatsappPreviewModal}
                onClose={() => setWhatsappPreviewModal(false)}
                message={waMessage}
                onMessageChange={setWaMessage}
                onSend={handleFinalWAShare}
            />

            <form onSubmit={handleSubmit} className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100 space-y-6">
                {error && <div className="p-3 bg-red-50 text-red-600 rounded-lg text-sm">{error}</div>}

                {/* Mass Load Toggle */}
                <div className="flex items-center justify-between p-4 bg-blue-50 rounded-2xl border border-blue-100 mb-6">
                    <div>
                        <p className="font-bold text-blue-900 text-sm">Modo Carga Masiva ⚡</p>
                        <p className="text-xs text-blue-700">Activalo para cargar muchos papeles seguidos sin salir de la página.</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                        <input
                            type="checkbox"
                            checked={isMassLoad}
                            onChange={(e) => setIsMassLoad(e.target.checked)}
                            className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                </div>

                {/* Plate Search (Optional if not appointment) */}
                {!appointmentId && (
                    <div className="space-y-2">
                        <label className="block text-sm font-bold text-slate-700">Buscar por Patente</label>
                        <div className="flex gap-2">
                            <input
                                type="text"
                                placeholder="Ej: AA123BB"
                                className="flex-1 p-4 rounded-xl border border-slate-200 text-lg font-bold uppercase focus:ring-2 focus:ring-blue-500 outline-none"
                                value={formData.vehiclePlate}
                                onChange={(e) => setFormData({ ...formData, vehiclePlate: e.target.value.toUpperCase() })}
                                onBlur={(e) => handlePlateSearch(e.target.value)}
                            />
                            <button
                                type="button"
                                onClick={() => handlePlateSearch(formData.vehiclePlate)}
                                className="bg-slate-900 text-white px-6 rounded-xl font-bold hover:bg-black transition-colors"
                                disabled={searchingPlate}
                            >
                                {searchingPlate ? '...' : 'Buscar'}
                            </button>
                        </div>
                    </div>
                )}

                {/* Read Only Context / Results */}
                {(appointmentId || (formData.clientId && !isNewVehicle)) && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                        <div>
                            <label className="block text-xs font-bold uppercase text-slate-400">Cliente</label>
                            <p className="font-bold text-slate-900">{formData.clientName}</p>
                        </div>
                        <div>
                            <label className="block text-xs font-bold uppercase text-slate-400">Vehículo</label>
                            <p className="font-bold text-slate-900">{formData.vehiclePlate}</p>
                        </div>
                    </div>
                )}

                {/* New Vehicle / Registration Fields */}
                {isNewVehicle && (
                    <div className="space-y-4 p-6 bg-blue-50/50 rounded-[2rem] border border-blue-200 animate-in slide-in-from-top-4 duration-300">
                        <div className="flex items-center gap-2 text-blue-800 font-extrabold text-xs uppercase tracking-widest mb-2">
                            <span className="w-2 h-2 bg-blue-600 rounded-full animate-pulse" />
                            Registrar Nuevo Cliente y Vehículo
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-1 relative order-first md:col-span-2">
                                <label className="text-[10px] font-black uppercase text-slate-500 ml-1">Elegir Cliente Existente (Opcional)</label>
                                <input
                                    type="text"
                                    placeholder="Buscar por Nombre o Teléfono..."
                                    className="w-full p-4 rounded-xl border border-slate-200 text-sm font-bold bg-white outline-none focus:ring-2 focus:ring-blue-500 transition-all placeholder:text-slate-300"
                                    onChange={e => {
                                        setActiveSearchField('client');
                                        searchClient(e.target.value);
                                    }}
                                    onFocus={() => setActiveSearchField('client')}
                                />
                                {activeSearchField === 'client' && clientResults.length > 0 && (
                                    <ul className="absolute z-30 w-full bg-white border border-slate-200 rounded-xl mt-1 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 max-h-40 overflow-y-auto">
                                        {clientResults.map(c => (
                                            <li
                                                key={c.id}
                                                onClick={() => {
                                                    setFormData(prev => ({
                                                        ...prev,
                                                        clientId: c.id.toString(),
                                                        clientName: c.name,
                                                        clientPhone: c.phone
                                                    }));
                                                    setClientResults([]);
                                                    setActiveSearchField(null);
                                                }}
                                                className="p-3 hover:bg-slate-50 cursor-pointer text-xs font-black border-b last:border-0 flex justify-between items-center group"
                                            >
                                                <span>{c.name}</span>
                                                <span className="text-[8px] bg-slate-100 text-slate-400 px-2 py-1 rounded-md transition-colors uppercase font-black">{c.phone}</span>
                                            </li>
                                        ))}
                                    </ul>
                                )}
                            </div>

                            <div className="space-y-1">
                                <label className="text-[10px] font-black uppercase text-slate-500 ml-1">Nombre del Cliente</label>
                                <input
                                    type="text"
                                    placeholder="Nombre Completo"
                                    required
                                    className={`w-full p-4 rounded-xl border border-slate-200 text-sm font-bold bg-white outline-none focus:ring-2 focus:ring-blue-500 transition-all placeholder:text-slate-300 ${formData.clientId ? 'bg-slate-50 text-slate-400' : ''}`}
                                    value={formData.clientName}
                                    onChange={e => setFormData({ ...formData, clientName: e.target.value, clientId: '' })}
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="text-[10px] font-black uppercase text-slate-500 ml-1">Teléfono (WhatsApp)</label>
                                <input
                                    type="text"
                                    placeholder="Ej: 3511234567"
                                    className={`w-full p-4 rounded-xl border border-slate-200 text-sm font-bold bg-white outline-none focus:ring-2 focus:ring-blue-500 transition-all placeholder:text-slate-300 ${formData.clientId ? 'bg-slate-50 text-slate-400' : ''}`}
                                    value={formData.clientPhone}
                                    onChange={e => setFormData({ ...formData, clientPhone: e.target.value, clientId: '' })}
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="text-[10px] font-black uppercase text-slate-500 ml-1">Marca del Vehículo</label>
                                <input
                                    type="text"
                                    list="vehicle-brands"
                                    placeholder="Ej: Toyota"
                                    required
                                    className="w-full p-4 rounded-xl border border-slate-200 text-sm font-bold bg-white outline-none focus:ring-2 focus:ring-blue-500 transition-all placeholder:text-slate-300"
                                    value={formData.vehicleBrand}
                                    onChange={e => setFormData({ ...formData, vehicleBrand: e.target.value })}
                                />
                                <datalist id="vehicle-brands">
                                    <option value="Toyota" />
                                    <option value="Volkswagen" />
                                    <option value="Ford" />
                                    <option value="Chevrolet" />
                                    <option value="Fiat" />
                                    <option value="Renault" />
                                    <option value="Peugeot" />
                                    <option value="Citroen" />
                                    <option value="Honda" />
                                    <option value="Nissan" />
                                    <option value="Jeep" />
                                    <option value="RAM" />
                                    <option value="Mercedes-Benz" />
                                    <option value="BMW" />
                                    <option value="Audi" />
                                    <option value="Hyundai" />
                                    <option value="Kia" />
                                    <option value="Chery" />
                                    <option value="Suzuki" />
                                    <option value="Mitsubishi" />
                                </datalist>
                            </div>
                            <div className="space-y-1">
                                <label className="text-[10px] font-black uppercase text-slate-500 ml-1">Modelo del Vehículo</label>
                                <input
                                    type="text"
                                    placeholder="Ej: Corolla"
                                    required
                                    className="w-full p-4 rounded-xl border border-slate-200 text-sm font-bold bg-white outline-none focus:ring-2 focus:ring-blue-500 transition-all placeholder:text-slate-300"
                                    value={formData.vehicleModel}
                                    onChange={e => setFormData({ ...formData, vehicleModel: e.target.value })}
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="text-[10px] font-black uppercase text-slate-500 ml-1">Combustible</label>
                                <select
                                    className="w-full p-4 rounded-xl border border-slate-200 text-sm font-bold bg-white outline-none focus:ring-2 focus:ring-blue-500 transition-all focus:border-blue-500 text-slate-700 appearance-none"
                                    value={formData.vehicleFuelType}
                                    onChange={e => setFormData({ ...formData, vehicleFuelType: e.target.value })}
                                >
                                    <option value="NAFTA">NAFTA</option>
                                    <option value="DIESEL">DIESEL</option>
                                    <option value="GNC">GNC</option>
                                    <option value="ELECTRICO">ELECTRICO</option>
                                    <option value="HIBRIDO">HIBRIDO</option>
                                </select>
                            </div>
                            <div className="space-y-1">
                                <label className="text-[10px] font-black uppercase text-slate-500 ml-1">Motor</label>
                                <input
                                    type="text"
                                    placeholder="Ej: 1.6"
                                    className="w-full p-4 rounded-xl border border-slate-200 text-sm font-bold bg-white outline-none focus:ring-2 focus:ring-blue-500 transition-all placeholder:text-slate-300"
                                    value={formData.vehicleEngine}
                                    onChange={e => setFormData({ ...formData, vehicleEngine: e.target.value })}
                                />
                            </div>
                        </div>
                    </div>
                )}

                {/* Service Selection */}
                <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">Servicio Realizado</label>
                    <select
                        value={formData.serviceId}
                        onChange={(e) => {
                            const s = availableServices.find(x => x.id === parseInt(e.target.value));
                            setFormData({
                                ...formData,
                                serviceId: e.target.value,
                                serviceName: s?.name || '',
                                price: s?.price || formData.price
                            });
                        }}
                        className="w-full p-4 rounded-xl border border-slate-200 text-lg font-medium focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                        required
                    >
                        <option value="">Selecciona un servicio...</option>
                        {availableServices.map(s => (
                            <option key={s.id} value={s.id}>{s.name} - ${s.price}</option>
                        ))}
                    </select>
                </div>

                {/* Technical Details */}
                <div className="bg-slate-50 p-6 rounded-[2rem] border border-slate-200 space-y-6">
                    <h3 className="text-xs font-black text-slate-400 uppercase tracking-wider flex items-center gap-2">
                        <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" /></svg>
                        Detalle Técnico del Service
                    </h3>

                    {/* Oil Section */}
                    <div className="space-y-4">
                        <label className="block text-xs font-black uppercase text-slate-500">Aceite de Motor</label>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 relative">
                            <div className="relative">
                                <input
                                    type="text"
                                    placeholder="Marca / Viscosidad (Ej: Shell 10W40)"
                                    className="w-full p-3 rounded-xl border border-slate-200 text-sm font-bold bg-white outline-none focus:ring-2 focus:ring-blue-500"
                                    value={formData.serviceDetails.oil.brand}
                                    onChange={e => {
                                        setFormData({
                                            ...formData,
                                            serviceDetails: {
                                                ...formData.serviceDetails,
                                                oil: { ...formData.serviceDetails.oil, brand: e.target.value }
                                            }
                                        });
                                        setActiveSearchField('oil');
                                        searchProduct(e.target.value);
                                    }}
                                    onFocus={() => setActiveSearchField('oil')}
                                />
                                {activeSearchField === 'oil' && productResults.length > 0 && (
                                    <ul className="absolute z-30 w-full bg-white border border-slate-200 rounded-xl mt-1 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 max-h-40 overflow-y-auto">
                                        {productResults.map(p => (
                                            <li
                                                key={p.id}
                                                onClick={() => {
                                                    setFormData(prev => ({
                                                        ...prev,
                                                        serviceDetails: {
                                                            ...prev.serviceDetails,
                                                            oil: { ...prev.serviceDetails.oil, brand: `${p.name} [${p.code || 'S/C'}]` }
                                                        }
                                                    }));
                                                    setProductResults([]);
                                                    setActiveSearchField(null);
                                                }}
                                                className="p-3 hover:bg-slate-50 cursor-pointer text-xs font-black border-b last:border-0 flex justify-between items-center group"
                                            >
                                                <span>{p.name}</span>
                                                <span className="text-[8px] bg-slate-100 text-slate-400 px-2 py-1 rounded-md transition-colors uppercase font-black">{p.code || 'S/C'}</span>
                                            </li>
                                        ))}
                                    </ul>
                                )}
                            </div>
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    placeholder="Litros"
                                    className="w-20 p-3 rounded-xl border border-slate-200 text-sm font-bold bg-white outline-none focus:ring-2 focus:ring-blue-500"
                                    value={formData.serviceDetails.oil.liters}
                                    onChange={e => setFormData({
                                        ...formData,
                                        serviceDetails: {
                                            ...formData.serviceDetails,
                                            oil: { ...formData.serviceDetails.oil, liters: e.target.value }
                                        }
                                    })}
                                />
                                <select
                                    className="flex-1 p-3 rounded-xl border border-slate-200 text-sm font-bold bg-white outline-none focus:ring-2 focus:ring-blue-500"
                                    value={formData.serviceDetails.oil.type}
                                    onChange={e => setFormData({
                                        ...formData,
                                        serviceDetails: {
                                            ...formData.serviceDetails,
                                            oil: { ...formData.serviceDetails.oil, type: e.target.value }
                                        }
                                    })}
                                >
                                    <option value="SINTETICO">Sintético</option>
                                    <option value="SEMI">Semi-Sint.</option>
                                    <option value="MINERAL">Mineral</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* Filters Section */}
                    <div className="space-y-4">
                        <label className="block text-xs font-black uppercase text-slate-500">Filtros Cambiados</label>
                        <div className="grid grid-cols-2 gap-3">
                            {(['air', 'oil', 'fuel', 'cabin'] as const).map(f => (
                                <div key={f} className="space-y-2 relative">
                                    <label className={`flex items-center gap-3 p-3 rounded-xl border transition-all cursor-pointer ${formData.serviceDetails.filters[f] ? 'bg-blue-50 border-blue-200' : 'bg-white border-slate-200 text-slate-400 outline-none focus:ring-2 focus:ring-blue-500'}`}>
                                        <input
                                            type="checkbox"
                                            className="w-5 h-5 rounded text-blue-600 focus:ring-0"
                                            checked={formData.serviceDetails.filters[f]}
                                            onChange={e => setFormData({
                                                ...formData,
                                                serviceDetails: {
                                                    ...formData.serviceDetails,
                                                    filters: { ...formData.serviceDetails.filters, [f]: e.target.checked }
                                                }
                                            })}
                                        />
                                        <span className="text-[10px] font-black uppercase text-slate-700">
                                            {f === 'air' ? 'Aire' : f === 'oil' ? 'Aceite' : f === 'fuel' ? 'Combustible' : 'Habitáculo'}
                                        </span>
                                    </label>
                                    {formData.serviceDetails.filters[f] && (
                                        <div className="relative">
                                            <input
                                                type="text"
                                                placeholder="Código/Marca"
                                                className="w-full p-2 bg-white rounded-lg border border-slate-200 text-[10px] font-bold uppercase outline-none focus:ring-2 focus:ring-blue-500"
                                                value={formData.serviceDetails.filterDetails[f]}
                                                onChange={e => {
                                                    setFormData({
                                                        ...formData,
                                                        serviceDetails: {
                                                            ...formData.serviceDetails,
                                                            filterDetails: { ...formData.serviceDetails.filterDetails, [f]: e.target.value }
                                                        }
                                                    });
                                                    setActiveSearchField(`filter_${f}`);
                                                    searchProduct(e.target.value);
                                                }}
                                                onFocus={() => setActiveSearchField(`filter_${f}`)}
                                            />
                                            {activeSearchField === `filter_${f}` && productResults.length > 0 && (
                                                <ul className="absolute z-40 left-0 w-full bg-white border border-slate-200 rounded-lg mt-1 shadow-xl overflow-hidden animate-in fade-in zoom-in-95 max-h-40 overflow-y-auto">
                                                    {productResults.map(p => (
                                                        <li
                                                            key={p.id}
                                                            onClick={() => {
                                                                setFormData(prev => ({
                                                                    ...prev,
                                                                    serviceDetails: {
                                                                        ...prev.serviceDetails,
                                                                        filterDetails: { ...prev.serviceDetails.filterDetails, [f]: `${p.name} [${p.code || 'S/C'}]` }
                                                                    }
                                                                }));
                                                                setProductResults([]);
                                                                setActiveSearchField(null);
                                                            }}
                                                            className="p-2 hover:bg-slate-50 cursor-pointer text-[9px] font-black border-b last:border-0 flex justify-between items-center group"
                                                        >
                                                            <span className="truncate max-w-[70%]">{p.name}</span>
                                                            <span className="text-[8px] bg-slate-100 text-slate-400 px-1 py-0.5 rounded transition-colors uppercase font-black">{p.code || 'S/C'}</span>
                                                        </li>
                                                    ))}
                                                </ul>
                                            )}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>


                    {/* Fluids Section */}
                    <div className="space-y-4">
                        <label className="block text-xs font-black uppercase text-slate-500">Líquidos (Revisado y a Nivel)</label>
                        <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
                            {([
                                { key: 'coolant', label: 'Refrig.' },
                                { key: 'brakes', label: 'Frenos' },
                                { key: 'gearbox', label: 'Caja' },
                                { key: 'differential', label: 'Diferenc.' },
                                { key: 'hydraulic', label: 'Hidrául.' }
                            ] as const).map(f => (
                                <label key={f.key} className={`flex flex-col items-center justify-center p-2 rounded-xl border transition-all cursor-pointer ${formData.serviceDetails.fluids[f.key] ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'bg-white border-slate-200 text-slate-400'}`}>
                                    <input
                                        type="checkbox"
                                        className="hidden"
                                        checked={formData.serviceDetails.fluids[f.key]}
                                        onChange={e => setFormData({
                                            ...formData,
                                            serviceDetails: {
                                                ...formData.serviceDetails,
                                                fluids: { ...formData.serviceDetails.fluids, [f.key]: e.target.checked }
                                            }
                                        })}
                                    />
                                    <span className="text-[10px] font-black uppercase mb-1">{f.label}</span>
                                    {formData.serviceDetails.fluids[f.key] ? (
                                        <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                                    ) : (
                                        <div className="w-[14px] h-[14px] rounded-full border-2 border-slate-200" />
                                    )}
                                </label>
                            ))}
                        </div>
                    </div>

                    {/* Additives Section */}
                    <div className="space-y-4">
                        <label className="block text-xs font-black uppercase text-slate-500">Aditivos (Generan Mayor Ticket)</label>
                        <div className="relative">
                            <input
                                type="text"
                                placeholder="Buscar aditivo para agregar..."
                                className="w-full p-3 rounded-xl border border-slate-200 text-sm font-bold bg-white outline-none focus:ring-2 focus:ring-blue-500"
                                onChange={e => {
                                    setActiveSearchField('additive');
                                    searchProduct(e.target.value);
                                }}
                                onFocus={() => setActiveSearchField('additive')}
                            />
                            {activeSearchField === 'additive' && productResults.length > 0 && (
                                <ul className="absolute z-30 w-full bg-white border border-slate-200 rounded-xl mt-1 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 max-h-40 overflow-y-auto">
                                    {productResults.map(p => (
                                        <li
                                            key={p.id}
                                            onClick={() => {
                                                if (!formData.serviceDetails.additives.find((a: any) => a.id === p.id)) {
                                                    setFormData(prev => ({
                                                        ...prev,
                                                        serviceDetails: {
                                                            ...prev.serviceDetails,
                                                            additives: [...prev.serviceDetails.additives, { id: p.id, name: p.name, code: p.code, price: p.price }]
                                                        }
                                                    }));
                                                }
                                                setProductResults([]);
                                                setActiveSearchField(null);
                                            }}
                                            className="p-3 hover:bg-slate-50 cursor-pointer text-xs font-black border-b last:border-0 flex justify-between items-center group"
                                        >
                                            <span>{p.name} {p.price ? `- $${p.price}` : ''}</span>
                                            <span className="text-[8px] bg-slate-100 text-slate-400 px-2 py-1 rounded-md transition-colors uppercase font-black">{p.code || 'S/C'}</span>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>

                        {/* List of additives */}
                        {formData.serviceDetails.additives.length > 0 && (
                            <div className="flex flex-wrap gap-2">
                                {formData.serviceDetails.additives.map((a: any) => (
                                    <div key={a.id} className="bg-blue-600 text-white px-3 py-1 rounded-full text-[10px] font-black flex items-center gap-2 animate-in zoom-in-90 tracking-widest uppercase shadow-lg shadow-blue-500/20">
                                        <span>{a.name}</span>
                                        <button
                                            type="button"
                                            onClick={() => setFormData(prev => ({
                                                ...prev,
                                                serviceDetails: {
                                                    ...prev.serviceDetails,
                                                    additives: prev.serviceDetails.additives.filter((item: any) => item.id !== a.id)
                                                }
                                            }))}
                                            className="p-1 hover:bg-black/20 rounded-full"
                                        >
                                            <svg width="10" height="10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Editable Fields */}

                {/* Mileage */}
                <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">Kilometraje Actual (km)</label>
                    <input
                        type="number"
                        value={formData.mileage}
                        onChange={(e) => setFormData({ ...formData, mileage: e.target.value })}
                        className="w-full p-4 rounded-xl border border-slate-200 text-lg font-medium focus:ring-2 focus:ring-blue-500 outline-none"
                        placeholder="Ej: 54000"
                        required
                    />
                </div>

                {/* Price */}
                <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">Precio Final ($)</label>
                    <input
                        type="number"
                        value={formData.price}
                        onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                        className="w-full p-4 rounded-xl border border-slate-200 text-lg font-bold text-emerald-600 focus:ring-2 focus:ring-emerald-500 outline-none"
                        required
                    />
                    <p className="text-xs text-slate-400 mt-1">Podés ajustar el precio si hubo adicionales o descuentos.</p>
                </div>

                {/* Date Selection */}
                <div className="space-y-3">
                    <label className="block text-sm font-bold text-slate-700 mb-2 flex justify-between items-center">
                        <span>Fecha del Servicio</span>
                        <span className="text-[10px] bg-blue-100 text-blue-600 px-2 py-0.5 rounded font-black uppercase">Obligatorio</span>
                    </label>

                    {/* Quick Date Shortcuts */}
                    <div className="flex flex-wrap gap-2 mb-2">
                        {[
                            { label: 'Hoy', days: 0 },
                            { label: 'Ayer', days: 1 },
                            { label: 'Hace 2 días', days: 2 },
                            { label: 'Mes Pasado', type: 'month' }
                        ].map((btn) => {
                            const today = new Date();
                            let targetDate: Date;
                            if (btn.type === 'month') {
                                targetDate = new Date(today.getFullYear(), today.getMonth() - 1, today.getDate());
                            } else {
                                targetDate = new Date(today);
                                targetDate.setDate(today.getDate() - (btn.days as number));
                            }
                            const dateStr = targetDate.toISOString().split('T')[0];
                            const isActive = formData.date === dateStr;

                            return (
                                <button
                                    key={btn.label}
                                    type="button"
                                    onClick={() => setFormData({ ...formData, date: dateStr })}
                                    className={`px-3 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider border transition-all active:scale-95 ${isActive
                                        ? 'bg-blue-600 border-blue-600 text-white shadow-lg shadow-blue-500/30'
                                        : 'bg-white border-slate-200 text-slate-500 hover:border-blue-400 hover:text-blue-600'
                                        }`}
                                >
                                    {btn.label}
                                </button>
                            );
                        })}
                    </div>

                    <div className="relative group">
                        <input
                            type="date"
                            value={formData.date}
                            onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                            className="w-full p-4 rounded-xl border border-slate-200 text-lg font-medium focus:ring-2 focus:ring-blue-500 outline-none pr-12 transition-all group-hover:border-slate-300"
                        />
                        <div className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none group-hover:text-blue-500 transition-colors">
                            <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                        </div>
                    </div>
                    <p className="text-[10px] font-bold text-slate-400 italic">Dejar hoy para servicio actual, o cambiar para cargar historial viejo.</p>
                </div>

                {/* Notes */}
                <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">Notas / Observaciones</label>
                    <textarea
                        value={formData.notes}
                        onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                        className="w-full p-4 rounded-xl border border-slate-200 text-base font-medium focus:ring-2 focus:ring-blue-500 outline-none h-32 resize-none"
                        placeholder="Detalles del trabajo realizado..."
                    />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <button
                        type="submit"
                        disabled={submitting}
                        className="w-full bg-slate-900 text-white p-5 rounded-[2rem] font-black shadow-xl hover:bg-black transition-all active:scale-95 disabled:opacity-50 uppercase tracking-widest text-sm"
                    >
                        {submitting ? 'Guardando...' : 'Solo Guardar 💾'}
                    </button>
                    <button
                        type="button"
                        onClick={() => handleSubmit(undefined, true)}
                        disabled={submitting}
                        className="w-full bg-emerald-500 text-white p-5 rounded-[2rem] font-black shadow-xl hover:bg-emerald-600 transition-all active:scale-95 disabled:opacity-50 uppercase tracking-widest text-sm flex items-center justify-center gap-3"
                    >
                        {submitting ? 'Guardando...' : (
                            <>
                                <svg className="w-5 h-5 fill-current" viewBox="0 0 448 512"><path d="M380.9 97.1C339 55.1 283.2 32 223.9 32c-122.4 0-222 99.6-222 222 0 39.1 10.2 77.3 29.6 111L0 480l117.7-30.9c32.4 17.7 68.9 27 106.1 27h.1c122.3 0 224.1-99.6 224.1-222 0-59.3-25.2-115-67.1-157zm-157 341.6c-33.2 0-65.7-8.9-94-25.7l-6.7-4-69.8 18.3L72 359.2l-4.4-7c-18.5-29.4-28.2-63.3-28.2-98.2 0-101.7 82.8-184.5 184.6-184.5 49.3 0 95.6 19.2 130.4 54.1 34.8 34.9 56.2 81.2 56.1 130.5 0 101.8-84.9 184.6-186.6 184.6zm101.2-138.2c-5.5-2.8-32.8-16.2-37.9-18-5.1-1.9-8.8-2.8-12.5 2.8-3.7 5.6-14.3 18-17.6 21.8-3.2 3.7-6.5 4.2-12 1.4-5.5-2.8-23.2-8.5-44.2-27.1-16.4-14.6-27.4-32.6-30.6-38.1-3.2-5.6-.3-8.6 2.5-11.3 2.5-2.5 5.5-6.5 8.3-9.7 2.8-3.3 3.7-5.6 5.5-9.2 1.8-3.7.9-6.9-.5-9.7-1.4-2.8-12.5-30.1-17.1-41.2-4.5-10.8-9.1-9.3-12.5-9.5-3.2-.2-6.9-.2-10.6-.2-3.7 0-9.7 1.4-14.8 6.9-5.1 5.6-19.4 19-19.4 46.3 0 27.3 19.9 53.7 22.6 57.4 2.8 3.7 39.1 59.7 94.8 83.8 13.2 5.8 23.5 9.2 31.5 11.8 13.3 4.2 25.4 3.6 35 2.2 10.7-1.5 32.8-13.4 37.4-26.4 4.6-13 4.6-24.1 3.2-26.4-1.3-2.5-5-3.9-10.5-6.6z" /></svg>
                                Guardar y Enviar 🚀
                            </>
                        )}
                    </button>
                </div>
            </form>
        </div>
    );
}

export default function NewWorkOrderPage() {
    return (
        <Suspense fallback={<div>Cargando...</div>}>
            <NewWorkOrderForm />
        </Suspense>
    );
}
