'use client';

import { Car, AlertTriangle, CheckCircle, Calendar } from 'lucide-react';

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
                    <div key={vehicle.id} className="bg-white p-6 rounded-[2.5rem] shadow-xl shadow-slate-200/50 border border-slate-100 relative overflow-hidden">
                        {/* Status Bar */}
                        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-blue-600 to-indigo-600" />

                        <div className="flex justify-between items-start mb-8">
                            <div>
                                <h2 className="text-3xl font-black text-slate-900 uppercase tracking-tighter leading-none mb-1">{vehicle.plate}</h2>
                                <p className="text-slate-500 font-bold text-sm">{vehicle.brand} {vehicle.model}</p>
                            </div>
                            <div className="text-right">
                                <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest mb-1">Kilometraje Actual</p>
                                <div className="bg-slate-900 text-white px-4 py-2 rounded-2xl shadow-lg flex flex-col items-center">
                                    <span className="text-lg font-black font-mono leading-none">{vehicle.mileage?.toLocaleString() || '---'}</span>
                                    <span className="text-[8px] font-bold opacity-50 uppercase tracking-widest">KILOMETROS</span>
                                </div>
                            </div>
                        </div>

                        {/* Analysis / Recommendation Card */}
                        {vehicle.predictedNextService && (
                            <div className="mb-8 p-5 bg-gradient-to-br from-indigo-600 to-blue-700 rounded-[2rem] text-white shadow-xl shadow-blue-200 relative overflow-hidden group">
                                <div className="absolute -right-4 -top-4 opacity-10 group-hover:scale-110 transition-transform duration-500">
                                    <Calendar size={120} />
                                </div>
                                <div className="relative z-10">
                                    <div className="flex items-center gap-2 mb-3">
                                        <div className="bg-white/20 p-1.5 rounded-lg backdrop-blur-md">
                                            <AlertTriangle size={16} className="text-white" />
                                        </div>
                                        <span className="text-xs font-black uppercase tracking-widest">Próxima Visita Estimada</span>
                                    </div>
                                    <div className="text-4xl font-black tracking-tighter mb-1">
                                        {new Date(vehicle.predictedNextService).toLocaleDateString(undefined, { day: 'numeric', month: 'long' })}
                                    </div>
                                    <p className="text-xs text-blue-100 font-medium">Calculado según tu promedio de {vehicle.averageDailyKm?.toFixed(1) || 30} km diarios.</p>
                                </div>
                            </div>
                        )}

                        {/* Maintenance Grid */}
                        {vehicle.maintenanceStatus ? (
                            <div className="space-y-10">
                                {[
                                    { label: 'Fluidos y Filtros Críticos', key: 'critical', items: [...(vehicle.maintenanceStatus.fluids || []).filter((f: any) => f.key === 'engine_oil'), ...(vehicle.maintenanceStatus.filters || [])] },
                                    { label: 'Otros Servicios', key: 'others', items: [...(vehicle.maintenanceStatus.fluids || []).filter((f: any) => f.key !== 'engine_oil'), ...(vehicle.maintenanceStatus.services || [])] }
                                ].map((group) => (
                                    <div key={group.key}>
                                        <div className="flex items-center gap-3 mb-5 pl-1">
                                            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{group.label}</h3>
                                            <div className="flex-1 h-px bg-slate-100" />
                                        </div>
                                        <div className="grid grid-cols-1 gap-4">
                                            {group.items.map((item: any) => (
                                                <div
                                                    key={item.key}
                                                    className={`relative p-5 rounded-[2rem] flex items-center gap-4 border transition-all duration-300 ${item.status === 'OK' ? 'bg-white border-emerald-100/50 shadow-sm' :
                                                        item.status === 'WARNING' ? 'bg-amber-50/30 border-amber-100 shadow-sm' :
                                                            'bg-slate-50 border-slate-100'
                                                        }`}
                                                >
                                                    {/* Icon Status */}
                                                    <div className={`shrink-0 w-12 h-12 rounded-2xl flex items-center justify-center border-2 ${item.status === 'OK' ? 'bg-emerald-50 border-emerald-100 text-emerald-500' :
                                                        item.status === 'WARNING' ? 'bg-amber-50 border-amber-100 text-amber-500' :
                                                            'bg-slate-100 border-slate-200 text-slate-400'
                                                        }`}>
                                                        {item.status === 'OK' ? <CheckCircle size={24} /> : <AlertTriangle size={24} />}
                                                    </div>

                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex justify-between items-baseline mb-1">
                                                            <h4 className="font-black text-slate-800 text-sm uppercase tracking-tight truncate">{item.label}</h4>
                                                            {item.lastDate && (
                                                                <span className="text-[10px] font-bold text-slate-400">{new Date(item.lastDate).toLocaleDateString()}</span>
                                                            )}
                                                        </div>

                                                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                                                            {item.lastMileage ? (
                                                                <div className="flex items-center gap-1">
                                                                    <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                                                                    <span className="text-xs font-bold text-slate-700 font-mono tracking-tighter">
                                                                        {item.lastMileage.toLocaleString()} KM
                                                                    </span>
                                                                </div>
                                                            ) : (
                                                                <span className="text-[10px] text-slate-400 italic">Sin registro previo</span>
                                                            )}

                                                            {item.detail && (
                                                                <div className="inline-flex items-center px-2 py-0.5 bg-indigo-50 text-indigo-700 rounded-lg border border-indigo-100 max-w-full">
                                                                    <span className="text-[9px] font-black uppercase tracking-tight truncate">
                                                                        {item.detail}
                                                                    </span>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-12 text-slate-400 bg-slate-50 rounded-[2.5rem] border-2 border-dashed border-slate-200">
                                <Car size={48} className="mx-auto mb-4 opacity-10" />
                                <p className="text-sm font-bold">Iniciando historial técnico...</p>
                                <p className="text-xs opacity-60">Tus próximos servicios aparecerán aquí.</p>
                            </div>
                        )}
                    </div>
                ))}
            </div>

            {/* Footer */}
            <div className="p-8 pb-12 text-center">
                <div className="w-12 h-1 bg-slate-200 rounded-full mx-auto mb-6" />
                <p className="text-[11px] text-slate-400 leading-relaxed font-bold uppercase tracking-widest max-w-[240px] mx-auto">
                    Generado por Lubri <br />
                    Mantenimiento Preventivo Inteligente
                </p>
            </div>
        </div>
    );
}
