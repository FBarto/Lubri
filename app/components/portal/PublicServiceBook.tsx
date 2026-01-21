'use client';

import { Car, AlertTriangle, CheckCircle } from 'lucide-react';

export default function PublicServiceBook({ data }: { data: any }) {
    return (
        <div className="flex flex-col h-full bg-slate-50 min-h-screen">
            {/* Header */}
            <div className="bg-slate-900 text-white p-8 rounded-b-[3rem] shadow-2xl shrink-0">
                <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center mb-4">
                    <Car className="text-white" size={24} />
                </div>
                <h1 className="text-3xl font-black mb-2">Libreta de Salud</h1>
                <p className="text-slate-400 text-sm">Historial de mantenimiento preventivo y alertas técnicas.</p>
            </div>

            {/* Content */}
            <div className="flex-1 px-4 py-8 space-y-8">
                {data.vehicles.map((vehicle: any) => (
                    <div key={vehicle.id} className="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100">
                        <div className="flex justify-between items-start mb-6">
                            <div>
                                <h2 className="text-2xl font-black text-slate-800 uppercase tracking-tight">{vehicle.plate}</h2>
                                <p className="text-slate-500 font-medium">{vehicle.brand} {vehicle.model}</p>
                            </div>
                            <div className="bg-blue-50 px-3 py-1.5 rounded-full border border-blue-100 flex items-center gap-2 shadow-sm">
                                <span className="text-[10px] uppercase tracking-wider font-bold text-blue-400">Últ. Service</span>
                                <span className="text-xs font-black text-blue-700 font-mono">{vehicle.lastServiceMileage ? `${vehicle.lastServiceMileage.toLocaleString()} KM` : '---'}</span>
                            </div>
                        </div>

                        {/* Maintenance Grid */}
                        {vehicle.maintenanceStatus ? (
                            <div className="space-y-8">
                                {[
                                    { label: 'Filtros y Fluidos', items: [...(vehicle.maintenanceStatus.filters || []), ...(vehicle.maintenanceStatus.fluids || [])] },
                                    { label: 'Servicios y Componentes', items: vehicle.maintenanceStatus.services || [] }
                                ].map((group, idx) => (
                                    <div key={idx}>
                                        <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4 pl-1">{group.label}</h3>
                                        <div className="grid grid-cols-2 gap-3">
                                            {group.items.map((item: any) => (
                                                <div
                                                    key={item.key}
                                                    className={`relative p-4 rounded-3xl flex flex-col justify-between gap-3 border transition-all duration-200 ${item.status === 'OK' ? 'bg-white border-emerald-100/50 shadow-[0_4px_20px_-8px_rgba(16,185,129,0.1)]' :
                                                        item.status === 'WARNING' ? 'bg-amber-50/50 border-amber-100 shadow-[0_4px_20px_-8px_rgba(245,158,11,0.1)]' :
                                                            'bg-slate-50 border-slate-100'
                                                        }`}
                                                >
                                                    {/* Header Label */}
                                                    <div className="flex justify-between items-start gap-2">
                                                        <span className={`text-[12px] font-bold leading-tight ${item.status === 'OK' ? 'text-emerald-950' :
                                                            item.status === 'WARNING' ? 'text-amber-900' :
                                                                'text-slate-500'
                                                            }`}>
                                                            {item.label}
                                                        </span>
                                                        <div className={`shrink-0 rounded-full p-1 ${item.status === 'OK' ? 'bg-emerald-100 text-emerald-600' :
                                                            item.status === 'WARNING' ? 'bg-amber-100 text-amber-600' :
                                                                'bg-slate-200 text-slate-400'
                                                            }`}>
                                                            {item.status === 'OK' ? <CheckCircle size={12} strokeWidth={2.5} /> : <AlertTriangle size={12} strokeWidth={2.5} />}
                                                        </div>
                                                    </div>

                                                    {/* Content */}
                                                    <div className="flex flex-col gap-1">
                                                        {item.lastDate ? (
                                                            <>
                                                                <div className="flex flex-col">
                                                                    <span className="text-[10px] text-slate-400 font-medium">{new Date(item.lastDate).toLocaleDateString()}</span>
                                                                    {item.lastMileage && (
                                                                        <span className="text-xs font-bold text-slate-700 font-mono tracking-tight">
                                                                            {item.lastMileage.toLocaleString()} KM
                                                                        </span>
                                                                    )}
                                                                </div>

                                                                {/* Oil Type / Detail Badge */}
                                                                {item.detail && (
                                                                    <div className="mt-2 pt-2 border-t border-dashed border-slate-100">
                                                                        <div className="inline-flex items-center px-2 py-1 bg-blue-50 border border-blue-100 rounded-lg max-w-full">
                                                                            <span className="text-[9px] font-black text-blue-600 uppercase tracking-tight truncate w-full">
                                                                                {item.detail}
                                                                            </span>
                                                                        </div>
                                                                    </div>
                                                                )}
                                                            </>
                                                        ) : (
                                                            <span className="text-[10px] text-slate-400 italic">Sin registro</span>
                                                        )}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-8 text-slate-400 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                                <p className="text-xs">No hay datos de mantenimiento disponibles.</p>
                            </div>
                        )}
                    </div>
                ))}
            </div>

            {/* Footer */}
            <div className="p-8 text-center">
                <p className="text-[10px] text-slate-400 leading-relaxed uppercase tracking-tighter">
                    Esta libreta es generada automáticamente basada en tus visitas. <br />
                    Consulta con un técnico ante cualquier duda.
                </p>
            </div>
        </div>
    );
}
