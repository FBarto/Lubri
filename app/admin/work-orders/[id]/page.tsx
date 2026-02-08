'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
    ChevronLeft, Calendar, Clock, CheckCircle, AlertCircle, Share2,
    Printer, Car, User, Phone, FileText, Wrench, Package
} from 'lucide-react';
import { WhatsAppService } from '@/app/lib/whatsapp/service';

interface WorkOrderDetailProps {
    params: Promise<{ id: string }>;
}

export default function WorkOrderDetailPage({ params }: WorkOrderDetailProps) {
    // Unwrap params using React.use()
    const { id } = use(params);
    const router = useRouter();

    const [workOrder, setWorkOrder] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchOrder = async () => {
            try {
                const res = await fetch(`/api/work-orders/${id}`);
                if (!res.ok) throw new Error('Orden no encontrada');
                const data = await res.json();
                setWorkOrder(data);
            } catch (err: any) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        if (id) fetchOrder();
    }, [id]);

    if (loading) return <div className="p-10 text-center text-slate-400">Cargando detalles...</div>;
    if (error) return <div className="p-10 text-center text-red-500 font-bold">Error: {error}</div>;
    if (!workOrder) return null;

    const { client, vehicle, service, serviceDetails } = workOrder;

    // Helper for Status Badge
    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'COMPLETED': return <span className="flex items-center gap-1 text-sm font-bold bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full border border-emerald-200"><CheckCircle size={14} /> COMPLETADA</span>;
            case 'DELIVERED': return <span className="flex items-center gap-1 text-sm font-bold bg-blue-100 text-blue-700 px-3 py-1 rounded-full border border-blue-200"><Share2 size={14} /> ENTREGADO</span>;
            case 'IN_PROGRESS': return <span className="flex items-center gap-1 text-sm font-bold bg-yellow-100 text-yellow-700 px-3 py-1 rounded-full border border-yellow-200"><Clock size={14} /> EN PROCESO</span>;
            default: return <span className="flex items-center gap-1 text-sm font-bold bg-red-100 text-red-700 px-3 py-1 rounded-full border border-red-200"><AlertCircle size={14} /> PENDIENTE</span>;
        }
    };

    return (
        <div className="max-w-5xl mx-auto p-6 fade-in">
            {/* Header */}
            <div className="flex items-center gap-4 mb-8">
                <button onClick={() => router.back()} className="p-2 hover:bg-slate-100 rounded-full text-slate-500 transition-colors">
                    <ChevronLeft size={24} />
                </button>
                <div>
                    <h1 className="text-2xl font-black text-slate-900 flex items-center gap-3">
                        Orden de Trabajo #{workOrder.id}
                        {getStatusBadge(workOrder.status)}
                    </h1>
                    <p className="text-slate-500">
                        Creada el {new Date(workOrder.date).toLocaleDateString()} a las {new Date(workOrder.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                </div>
                <div className="ml-auto flex gap-2">
                    <button className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-lg font-bold text-slate-600 hover:bg-slate-50 shadow-sm">
                        <Printer size={18} /> Imprimir
                    </button>
                    {/* Placeholder for future specific actions */}
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

                {/* LEFT COL - INFO */}
                <div className="space-y-6">
                    {/* Client Card */}
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                        <div className="flex items-center gap-2 mb-4 text-slate-400 font-bold uppercase text-xs tracking-wider">
                            <User size={14} /> Cliente
                        </div>
                        <h3 className="text-lg font-bold text-slate-900">{client.name}</h3>
                        <div className="flex items-center gap-2 mt-2 text-slate-600">
                            <Phone size={14} />
                            <a href={`https://wa.me/${client.phone}`} target="_blank" className="hover:underline">{client.phone}</a>
                        </div>
                    </div>

                    {/* Vehicle Card */}
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                        <div className="flex items-center gap-2 mb-4 text-slate-400 font-bold uppercase text-xs tracking-wider">
                            <Car size={14} /> Vehículo
                        </div>
                        <div className="flex items-center justify-between mb-2">
                            <span className="bg-slate-900 text-white px-2 py-1 rounded font-mono font-bold text-sm">{vehicle.plate}</span>
                            <span className="text-xs font-bold text-slate-400">{vehicle.year || '-'}</span>
                        </div>
                        <p className="font-medium text-slate-700">{vehicle.brand} {vehicle.model}</p>
                        <hr className="my-3 border-slate-100" />
                        <div className="flex justify-between text-sm">
                            <span className="text-slate-500">Kilometraje:</span>
                            <span className="font-bold text-slate-900">{workOrder.mileage?.toLocaleString() || '-'} km</span>
                        </div>
                    </div>
                </div>

                {/* RIGHT COL - DETAILS */}
                <div className="md:col-span-2 space-y-6">

                    {/* Service Info */}
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                        <div className="flex items-center gap-2 mb-6 text-slate-400 font-bold uppercase text-xs tracking-wider">
                            <Wrench size={14} /> Detalle del Servicio
                        </div>

                        <div className="mb-6">
                            <p className="text-sm text-slate-400 mb-1">Servicio Base</p>
                            <h2 className="text-xl font-bold text-slate-900">{service.name}</h2>
                        </div>

                        {/* Items JSON Parsing */}
                        {serviceDetails && serviceDetails.items && Array.isArray(serviceDetails.items) && serviceDetails.items.length > 0 ? (
                            <div className="space-y-3">
                                <h4 className="font-bold text-sm text-slate-700 border-b border-slate-100 pb-2">Ítems Utilizados</h4>
                                {serviceDetails.items.map((item: any, idx: number) => (
                                    <div key={idx} className="flex justify-between items-center py-2">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center text-blue-600">
                                                <Package size={14} />
                                            </div>
                                            <div>
                                                <p className="font-medium text-slate-900">{item.name || item.description}</p>
                                                <p className="text-xs text-slate-400">Cant: {item.quantity}</p>
                                            </div>
                                        </div>
                                        <div className="font-bold text-slate-700">
                                            ${(item.unitPrice * item.quantity).toLocaleString()}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="p-4 bg-slate-50 rounded-lg text-center text-slate-400 italic text-sm">
                                No hay ítems detallados guardados en esta orden.
                            </div>
                        )}

                        {/* Notes */}
                        {workOrder.notes && (
                            <div className="mt-6 pt-6 border-t border-slate-100">
                                <h4 className="font-bold text-sm text-slate-700 mb-2">Notas / Observaciones</h4>
                                <p className="bg-yellow-50 text-yellow-800 p-4 rounded-lg text-sm italic border border-yellow-100">
                                    {workOrder.notes}
                                </p>
                            </div>
                        )}
                    </div>

                    {/* Financials */}
                    <div className="bg-slate-900 text-white p-6 rounded-2xl shadow-lg flex justify-between items-center">
                        <div>
                            <p className="text-slate-400 text-sm font-medium mb-1">Total del Servicio</p>
                            <p className="text-3xl font-black">${workOrder.price?.toLocaleString() || '0'}</p>
                        </div>
                        {workOrder.saleId ? (
                            <div className="text-right">
                                <span className="inline-block px-3 py-1 bg-emerald-500/20 text-emerald-300 rounded-lg text-xs font-bold border border-emerald-500/30 mb-1">
                                    Venta #{workOrder.saleId}
                                </span>
                                <p className="text-xs text-slate-400">Vinculado a Caja</p>
                            </div>
                        ) : (
                            <div className="text-right">
                                <span className="inline-block px-3 py-1 bg-yellow-500/20 text-yellow-300 rounded-lg text-xs font-bold border border-yellow-500/30 mb-1">
                                    Sin Cobrar
                                </span>
                            </div>
                        )}
                    </div>

                </div>
            </div>
        </div>
    );
}
