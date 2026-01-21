'use client';

import { useState } from 'react';
import { Car, Calendar, History, FileText, Image as ImageIcon, Video, AlertTriangle } from 'lucide-react';

interface PortalData {
    name: string;
    phone: string;
    vehicles: any[];
    workOrders: any[];
}

export default function PortalClientView({ data }: { data: PortalData }) {
    const [activeTab, setActiveTab] = useState<'VEHICLES' | 'HISTORY'>('VEHICLES');

    return (
        <div className="flex flex-col h-full">
            {/* Header */}
            <div className="bg-slate-900 text-white p-6 rounded-b-3xl shadow-xl shrink-0">
                <h1 className="text-2xl font-black mb-1">Hola, {data.name.split(' ')[0]} 👋</h1>
                <p className="text-slate-400 text-sm">Esta es tu Libreta de Mantenimiento Digital</p>
            </div>

            {/* Tabs */}
            <div className="flex p-4 gap-4 shrink-0">
                <button
                    onClick={() => setActiveTab('VEHICLES')}
                    className={`flex-1 py-3 px-4 rounded-2xl font-bold flex items-center justify-center gap-2 transition-all hover:scale-[1.02] active:scale-95 ${activeTab === 'VEHICLES'
                        ? 'bg-blue-600 text-white shadow-lg shadow-blue-200'
                        : 'bg-white text-slate-500 hover:bg-slate-50'
                        }`}
                >
                    <Car size={20} />
                    Mis Autos
                </button>
                <button
                    onClick={() => setActiveTab('HISTORY')}
                    className={`flex-1 py-3 px-4 rounded-2xl font-bold flex items-center justify-center gap-2 transition-all hover:scale-[1.02] active:scale-95 ${activeTab === 'HISTORY'
                        ? 'bg-blue-600 text-white shadow-lg shadow-blue-200'
                        : 'bg-white text-slate-500 hover:bg-slate-50'
                        }`}
                >
                    <History size={20} />
                    Historial
                </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto px-4 pb-8 space-y-4">
                {activeTab === 'VEHICLES' && (
                    <div className="space-y-4">
                        {data.vehicles.map(vehicle => (
                            <div key={vehicle.id} className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100">
                                <div className="flex justify-between items-start mb-4">
                                    <div>
                                        <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight">{vehicle.plate}</h3>
                                        <p className="text-slate-500 font-medium">{vehicle.brand} {vehicle.model}</p>
                                    </div>
                                    <div className="bg-slate-100 p-2 rounded-xl text-slate-600">
                                        <Car size={24} />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <div className="flex items-center gap-2 text-sm text-slate-500 bg-slate-50 p-3 rounded-xl">
                                        <Calendar size={16} />
                                        <span>Último km: <strong>{vehicle.mileage || '---'} km</strong></span>
                                    </div>
                                    {vehicle.predictedNextService && (
                                        <div className="flex items-center gap-2 text-sm text-blue-600 bg-blue-50 p-3 rounded-xl border border-blue-100 animate-pulse">
                                            <AlertTriangle size={16} />
                                            <span>Próximo Service estimado: <strong>{new Date(vehicle.predictedNextService).toLocaleDateString()}</strong></span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {activeTab === 'HISTORY' && (
                    <div className="space-y-4">
                        {data.workOrders.length === 0 ? (
                            <div className="text-center py-10 text-slate-400">
                                <p>Aún no tienes servicios registrados.</p>
                            </div>
                        ) : (
                            data.workOrders.map((wo: any) => (
                                <div key={wo.id} className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 relative overflow-hidden">
                                    <div className={`absolute left-0 top-0 bottom-0 w-1 ${wo.status === 'COMPLETED' || wo.status === 'DELIVERED' ? 'bg-emerald-500' : 'bg-amber-500'
                                        }`} />

                                    <div className="flex justify-between items-start mb-2 pl-2">
                                        <div>
                                            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
                                                {new Date(wo.date).toLocaleDateString()}
                                            </p>
                                            <h3 className="font-bold text-slate-800 text-lg">{wo.serviceName}</h3>
                                            <p className="text-sm text-slate-500">{wo.vehicleModel} ({wo.vehiclePlate})</p>
                                        </div>
                                        <div className="text-right">
                                            <span className={`text-xs font-bold px-2 py-1 rounded uppercase ${wo.status === 'COMPLETED' || wo.status === 'DELIVERED'
                                                ? 'bg-emerald-100 text-emerald-700'
                                                : 'bg-amber-100 text-amber-700'
                                                }`}>
                                                {wo.status === 'DELIVERED' ? 'Finalizado' : wo.status}
                                            </span>
                                        </div>
                                    </div>

                                    {wo.mileage && (
                                        <div className="mt-3 pl-2 text-sm text-slate-600 flex items-center gap-2">
                                            <div className="w-1.5 h-1.5 rounded-full bg-blue-400" />
                                            Kilometraje: <strong>{wo.mileage.toLocaleString()} km</strong>
                                        </div>
                                    )}

                                    {/* Itemized Breakdown for Client */}
                                    {wo.serviceDetails?.items?.length > 0 && (
                                        <div className="mt-3 pl-2 pr-2">
                                            <div className="bg-slate-50 rounded-xl p-3 space-y-2">
                                                {wo.serviceDetails.items.map((item: any, idx: number) => (
                                                    <div key={idx} className="flex justify-between items-center text-[11px]">
                                                        <span className="text-slate-500 font-medium">{item.name}</span>
                                                        <span className="text-slate-400">x{item.quantity}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* Attachments Section */}
                                    {wo.attachments && wo.attachments.length > 0 && (
                                        <div className="mt-4 pl-2 pt-4 border-t border-slate-100">
                                            <p className="text-xs font-bold text-slate-400 mb-2 flex items-center gap-1">
                                                <ImageIcon size={12} /> EVIDENCIA DIGITAL
                                            </p>
                                            <div className="flex gap-2 overflow-x-auto pb-2">
                                                {wo.attachments.map((att: any) => (
                                                    <a
                                                        key={att.id}
                                                        href={att.url}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="block w-16 h-16 rounded-lg bg-slate-100 shrink-0 relative overflow-hidden border border-slate-200"
                                                    >
                                                        {att.type === 'VIDEO' ? (
                                                            <div className="absolute inset-0 flex items-center justify-center text-slate-400">
                                                                <Video size={24} />
                                                            </div>
                                                        ) : (
                                                            <img src={att.url} alt="Evidencia" className="w-full h-full object-cover" />
                                                        )}
                                                    </a>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ))
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
