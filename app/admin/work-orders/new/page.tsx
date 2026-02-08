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
        date: new Date().toISOString().split('T')[0] // Default to today
    });

    useEffect(() => {
        if (appointmentId) {
            loadAppointment(appointmentId);
        }
    }, [appointmentId]);

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
                    date: new Date().toISOString().split('T')[0]
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
                    date: formData.date, // Pass the date
                    appointmentId: appointmentId // Link it!
                })
            });

            if (res.ok) {
                router.push('/admin/dashboard'); // Or to work-orders list
                router.refresh();
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

    if (loading) return <div className="p-10 text-center">Cargando datos...</div>;

    return (
        <div className="max-w-2xl mx-auto">
            <h1 className="text-3xl font-extrabold text-slate-900 mb-8">Iniciar Servicio 🛠️</h1>

            <form onSubmit={handleSubmit} className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100 space-y-6">
                {error && <div className="p-3 bg-red-50 text-red-600 rounded-lg text-sm">{error}</div>}

                {/* Read Only Context */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                    <div>
                        <label className="block text-xs font-bold uppercase text-slate-400">Cliente</label>
                        <p className="font-bold text-slate-900">{formData.clientName}</p>
                    </div>
                    <div>
                        <label className="block text-xs font-bold uppercase text-slate-400">Vehículo</label>
                        <p className="font-bold text-slate-900">{formData.vehiclePlate}</p>
                    </div>
                    <div className="md:col-span-2">
                        <label className="block text-xs font-bold uppercase text-slate-400">Servicio Base</label>
                        <p className="font-bold text-slate-900">{formData.serviceName}</p>
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
