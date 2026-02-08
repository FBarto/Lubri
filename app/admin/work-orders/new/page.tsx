'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

function NewWorkOrderForm() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const appointmentId = searchParams.get('appointmentId');

    const [loading, setLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');
    const [searchingPlate, setSearchingPlate] = useState(false);
    const [availableServices, setAvailableServices] = useState<any[]>([]);
    const [isMassLoad, setIsMassLoad] = useState(false);
    const [lastSavedOrder, setLastSavedOrder] = useState<any>(null);
    const [sendingWhatsApp, setSendingWhatsApp] = useState(false);

    // Form Data
    const [formData, setFormData] = useState({
        clientId: '',
        vehicleId: '',
        serviceId: '',
        price: '',
        mileage: '',
        notes: '',
        clientName: '',
        vehiclePlate: '',
        serviceName: '',
        date: new Date().toISOString().split('T')[0], // Default to today
        serviceDetails: {
            oil: { brand: '', liters: '', type: 'SINTETICO' },
            filters: { air: false, oil: false, fuel: false, cabin: false },
            filterDetails: { air: '', oil: '', fuel: '', cabin: '' },
            battery: { voltage: '' }
        }
    });


    const [productResults, setProductResults] = useState<any[]>([]);
    const [activeSearchField, setActiveSearchField] = useState<string | null>(null);

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

    const handlePlateSearch = async (plate: string) => {
        if (plate.length < 6) return;
        setSearchingPlate(true);
        setError('');
        try {
            const res = await fetch(`/api/vehicles/by-plate?plate=${plate}`);
            if (res.ok) {
                const vehicle = await res.json();
                setFormData(prev => ({
                    ...prev,
                    vehicleId: vehicle.id,
                    clientId: vehicle.clientId,
                    clientName: vehicle.client.name,
                    vehiclePlate: vehicle.plate,
                    mileage: vehicle.mileage || ''
                }));
            } else {
                setError('Vehículo no encontrado. Verificá la patente.');
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
                    vehiclePlate: data.vehicle.plate,
                    serviceName: data.service.name,
                    date: new Date().toISOString().split('T')[0],
                    serviceDetails: data.serviceDetails || {
                        oil: { brand: '', liters: '', type: 'SINTETICO' },
                        filters: { air: false, oil: false, fuel: false, cabin: false },
                        filterDetails: { air: '', oil: '', fuel: '', cabin: '' },
                        battery: { voltage: '' }
                    }
                });
            }
        } catch (e) {
            console.error(e);
            setError('Error cargando el turno');
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            const res = await fetch('/api/work-orders', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    clientId: formData.clientId,
                    vehicleId: formData.vehicleId,
                    serviceId: formData.serviceId,
                    price: formData.price,
                    mileage: formData.mileage,
                    notes: formData.notes,
                    date: formData.date,
                    serviceDetails: formData.serviceDetails, // Pass the details!
                    appointmentId: appointmentId // Link it!
                })
            });

            if (res.ok) {
                const newOrder = await res.json();
                if (isMassLoad) {
                    setLastSavedOrder({
                        id: newOrder.id,
                        plate: formData.vehiclePlate,
                        clientPhone: formData.vehicleId ? (await (await fetch(`/api/vehicles/${formData.vehicleId}`)).json()).client.phone : ''
                    });

                    setFormData(prev => ({
                        ...prev,
                        vehiclePlate: '',
                        vehicleId: '',
                        clientId: '',
                        clientName: '',
                        mileage: '',
                        notes: '',
                        serviceDetails: { // Reset details but keep structure
                            oil: { brand: '', liters: prev.serviceDetails.oil.liters, type: prev.serviceDetails.oil.type },
                            filters: { air: false, oil: false, fuel: false, cabin: false },
                            filterDetails: { air: '', oil: '', fuel: '', cabin: '' },
                            battery: { voltage: '' }
                        }
                    }));
                } else {
                    router.push('/admin/dashboard');
                    router.refresh();
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
            const res = await fetch(`/api/wa/send-book`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    workOrderId: lastSavedOrder.id,
                    phone: lastSavedOrder.clientPhone
                })
            });
            if (res.ok) {
                alert('Libreta enviada por WhatsApp');
                setLastSavedOrder(null);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setSendingWhatsApp(false);
        }
    };

    if (loading) return <div className="p-10 text-center">Cargando datos...</div>;

    return (
        <div className="max-w-2xl mx-auto">
            <h1 className="text-3xl font-extrabold text-slate-900 mb-8">Iniciar Servicio 🛠️</h1>

            {/* Success Banner for Mass Load */}
            {lastSavedOrder && (
                <div className="bg-emerald-50 border border-emerald-200 p-6 rounded-3xl mb-8 flex flex-col md:flex-row items-center justify-between gap-4 animate-in fade-in zoom-in duration-300">
                    <div>
                        <p className="font-black text-emerald-800 text-lg">¡Guardado con éxito! ✅</p>
                        <p className="text-emerald-600 text-sm font-medium">Orden registrada para {lastSavedOrder.plate}</p>
                    </div>
                    <div className="flex gap-2">
                        <button
                            onClick={handleSendWhatsApp}
                            className="bg-emerald-600 text-white px-6 py-3 rounded-2xl font-bold flex items-center gap-2 hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-500/20"
                            disabled={sendingWhatsApp}
                        >
                            <svg className="w-5 h-5 fill-current" viewBox="0 0 448 512"><path d="M380.9 97.1C339 55.1 283.2 32 223.9 32c-122.4 0-222 99.6-222 222 0 39.1 10.2 77.3 29.6 111L0 480l117.7-30.9c32.4 17.7 68.9 27 106.1 27h.1c122.3 0 224.1-99.6 224.1-222 0-59.3-25.2-115-67.1-157zm-157 341.6c-33.2 0-65.7-8.9-94-25.7l-6.7-4-69.8 18.3L72 359.2l-4.4-7c-18.5-29.4-28.2-63.3-28.2-98.2 0-101.7 82.8-184.5 184.6-184.5 49.3 0 95.6 19.2 130.4 54.1 34.8 34.9 56.2 81.2 56.1 130.5 0 101.8-84.9 184.6-186.6 184.6zm101.2-138.2c-5.5-2.8-32.8-16.2-37.9-18-5.1-1.9-8.8-2.8-12.5 2.8-3.7 5.6-14.3 18-17.6 21.8-3.2 3.7-6.5 4.2-12 1.4-5.5-2.8-23.2-8.5-44.2-27.1-16.4-14.6-27.4-32.6-30.6-38.1-3.2-5.6-.3-8.6 2.5-11.3 2.5-2.5 5.5-6.5 8.3-9.7 2.8-3.3 3.7-5.6 5.5-9.2 1.8-3.7.9-6.9-.5-9.7-1.4-2.8-12.5-30.1-17.1-41.2-4.5-10.8-9.1-9.3-12.5-9.5-3.2-.2-6.9-.2-10.6-.2-3.7 0-9.7 1.4-14.8 6.9-5.1 5.6-19.4 19-19.4 46.3 0 27.3 19.9 53.7 22.6 57.4 2.8 3.7 39.1 59.7 94.8 83.8 13.2 5.8 23.5 9.2 31.5 11.8 13.3 4.2 25.4 3.6 35 2.2 10.7-1.5 32.8-13.4 37.4-26.4 4.6-13 4.6-24.1 3.2-26.4-1.3-2.5-5-3.9-10.5-6.6z" /></svg>
                            {sendingWhatsApp ? 'Enviando...' : 'Enviar Libreta'}
                        </button>
                        <button
                            onClick={() => setLastSavedOrder(null)}
                            className="bg-white text-slate-500 px-6 py-3 rounded-2xl font-bold border border-slate-200 hover:bg-slate-50 transition-all"
                        >
                            Siguiente Paper 📄
                        </button>
                    </div>
                </div>
            )}

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
                {(appointmentId || formData.clientId) && (
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


                    {/* Battery Section */}
                    <div>
                        <label className="block text-xs font-black uppercase text-slate-500 mb-2">Batería (Voltios)</label>
                        <input
                            type="text"
                            placeholder="Ej: 12.6"
                            className="w-full p-3 rounded-xl border border-slate-200 text-sm font-bold bg-white"
                            value={formData.serviceDetails.battery.voltage}
                            onChange={e => setFormData({
                                ...formData,
                                serviceDetails: {
                                    ...formData.serviceDetails,
                                    battery: { voltage: e.target.value }
                                }
                            })}
                        />
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

                {/* Date (Historical Entry) */}
                <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">Fecha del Servicio</label>
                    <input
                        type="date"
                        value={formData.date}
                        onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                        className="w-full p-4 rounded-xl border border-slate-200 text-lg font-medium focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                    <p className="text-xs text-slate-400 mt-1">Dejar hoy para servicio actual, o cambiar para cargar historial viejo.</p>
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

                <button
                    type="submit"
                    disabled={submitting}
                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white p-4 rounded-xl font-bold text-lg shadow-lg shadow-emerald-500/30 transition-all active:scale-95 disabled:opacity-50"
                >
                    {submitting ? 'Guardando...' : 'Finalizar y Cobrar'}
                </button>
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
