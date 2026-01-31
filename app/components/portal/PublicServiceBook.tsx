'use client';

import { Car, AlertTriangle, CheckCircle, Calendar, Droplets } from 'lucide-react';

export default function PublicServiceBook({ data }: { data: any }) {
    return (
        <div className="flex flex-col h-full bg-[#0A0A0A] min-h-screen text-white font-sans selection:bg-[#E20613] selection:text-white">
            {/* Header */}
            <div className="bg-[#171717]/80 backdrop-blur-xl border-b border-white/5 p-8 rounded-b-[3rem] shadow-2xl shrink-0 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-[#E20613]/10 blur-3xl rounded-full -translate-y-1/2 translate-x-1/2 pointer-events-none" />

                <div className="w-12 h-12 bg-[#171717] border border-white/10 rounded-2xl flex items-center justify-center mb-4 shadow-lg">
                    <Car className="text-[#E20613]" size={24} />
                </div>
                <h1 className="text-3xl font-black uppercase tracking-tight mb-2">Libreta de Salud</h1>
                <p className="text-neutral-400 text-sm font-medium">Historial técnico y mantenimiento predictivo.</p>
            </div>

            {/* Content */}
            <div className="flex-1 px-4 py-8 space-y-8">
                {data.vehicles.map((vehicle: any) => (
                    <div key={vehicle.id} className="relative">
                        {/* Vehicle Header */}
                        <div className="flex justify-between items-start mb-6 px-2">
                            <div>
                                <h2 className="text-2xl font-black uppercase italic text-white tracking-tighter leading-none mb-1">{vehicle.plate}</h2>
                                <p className="text-neutral-500 font-bold text-xs uppercase tracking-widest">{vehicle.brand} {vehicle.model}</p>
                            </div>
                            <div className="text-right">
                                <p className="text-[9px] font-black text-neutral-600 uppercase tracking-widest mb-1">Odómetro</p>
                                <div className="bg-[#171717] border border-white/5 px-3 py-1 rounded-xl shadow-lg flex flex-col items-center">
                                    <span className="text-base font-black font-mono leading-none text-white">{vehicle.mileage?.toLocaleString() || '---'}</span>
                                    <span className="text-[7px] font-bold text-[#E20613] uppercase tracking-widest">KM</span>
                                </div>
                            </div>
                        </div>

                        {/* Analysis / Recommendation Card */}
                        {vehicle.predictedNextService && (
                            <div className="mb-8 p-6 bg-gradient-to-br from-[#E20613] to-[#B9050F] rounded-[2rem] text-white shadow-[0_10px_40px_-10px_rgba(226,6,19,0.5)] relative overflow-hidden group border border-white/10">
                                <div className="absolute -right-4 -top-4 opacity-20 group-hover:scale-110 transition-transform duration-500 rotate-12">
                                    <Calendar size={140} />
                                </div>
                                <div className="relative z-10">
                                    <div className="flex items-center gap-2 mb-3">
                                        <div className="bg-black/20 p-1.5 rounded-lg backdrop-blur-md">
                                            <AlertTriangle size={16} className="text-white" />
                                        </div>
                                        <span className="text-[10px] font-black uppercase tracking-widest opacity-90">Próxima Visita Estimada</span>
                                    </div>
                                    <div className="text-4xl font-black tracking-tighter mb-2">
                                        {new Date(vehicle.predictedNextService).toLocaleDateString(undefined, { day: 'numeric', month: 'long' })}
                                    </div>
                                    <p className="text-[10px] text-white/80 font-medium max-w-[80%]">
                                        Calculado según tu promedio de {vehicle.averageDailyKm?.toFixed(1) || 30} km diarios.
                                    </p>
                                </div>
                            </div>
                        )}

                        {/* Maintenance Grid */}
                        {vehicle.maintenanceStatus ? (
                            <div className="space-y-8">
                                {[
                                    { label: 'Sistemas Críticos', key: 'critical', items: [...(vehicle.maintenanceStatus.fluids || []).filter((f: any) => f.key === 'engine_oil'), ...(vehicle.maintenanceStatus.filters || [])] },
                                    { label: 'Servicios Generales', key: 'others', items: [...(vehicle.maintenanceStatus.fluids || []).filter((f: any) => f.key !== 'engine_oil'), ...(vehicle.maintenanceStatus.services || [])] }
                                ].map((group) => (
                                    <div key={group.key}>
                                        <div className="flex items-center gap-3 mb-4 pl-1">
                                            <div className={`w-1 h-3 ${group.key === 'critical' ? 'bg-[#E20613]' : 'bg-neutral-600'} rounded-full`}></div>
                                            <h3 className="text-[10px] font-black text-neutral-500 uppercase tracking-widest">{group.label}</h3>
                                        </div>
                                        <div className="grid grid-cols-1 gap-3">
                                            {group.items.map((item: any) => (
                                                <div
                                                    key={item.key}
                                                    className={`relative p-4 rounded-2xl flex items-center gap-4 border transition-all duration-300 ${item.status === 'OK' ? 'bg-[#171717] border-white/5' :
                                                            item.status === 'WARNING' ? 'bg-[#1F1F1F] border-[#E20613]/40 shadow-[0_0_15px_rgba(226,6,19,0.1)]' :
                                                                'bg-[#171717] border-white/5 opacity-60'
                                                        }`}
                                                >
                                                    {/* Icon Status */}
                                                    <div className={`shrink-0 w-10 h-10 rounded-xl flex items-center justify-center border ${item.status === 'OK' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500' :
                                                            item.status === 'WARNING' ? 'bg-[#E20613]/10 border-[#E20613]/20 text-[#E20613]' :
                                                                'bg-white/5 border-white/10 text-neutral-500'
                                                        }`}>
                                                        {item.status === 'OK' ? <CheckCircle size={18} /> : <AlertTriangle size={18} />}
                                                    </div>

                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex justify-between items-baseline mb-1">
                                                            <h4 className="font-bold text-white text-sm uppercase tracking-tight truncate">{item.label}</h4>
                                                            {item.lastDate && (
                                                                <span className="text-[9px] font-bold text-neutral-500">{new Date(item.lastDate).toLocaleDateString()}</span>
                                                            )}
                                                        </div>

                                                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                                                            {item.lastMileage ? (
                                                                <div className="flex items-center gap-1">
                                                                    <div className={`w-1 h-1 rounded-full ${item.status === 'WARNING' ? 'bg-[#E20613]' : 'bg-neutral-500'}`} />
                                                                    <span className="text-[10px] font-bold text-neutral-400 font-mono tracking-tighter">
                                                                        {item.lastMileage.toLocaleString()} KM
                                                                    </span>
                                                                </div>
                                                            ) : (
                                                                <span className="text-[9px] text-neutral-600 italic">Sin registro</span>
                                                            )}

                                                            {item.detail && (
                                                                <div className="inline-flex items-center px-1.5 py-0.5 bg-white/5 text-white rounded text-[9px] font-bold uppercase tracking-tight truncate border border-white/10 max-w-[120px]">
                                                                    {item.detail}
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
                            <div className="text-center py-12 text-neutral-500 bg-[#171717] rounded-[2.5rem] border border-dashed border-neutral-800">
                                <Car size={48} className="mx-auto mb-4 opacity-20" />
                                <p className="text-sm font-bold">Iniciando historial técnico...</p>
                                <p className="text-xs opacity-60">Tus próximos servicios aparecerán aquí.</p>
                            </div>
                        )}
                    </div>
                ))}
            </div>

            {/* Footer */}
            <div className="p-8 pb-12 text-center bg-gradient-to-t from-[#0A0A0A] to-transparent">
                <div className="w-12 h-1 bg-neutral-800 rounded-full mx-auto mb-6" />
                <p className="text-[9px] text-neutral-600 leading-relaxed font-bold uppercase tracking-[0.2em] max-w-[240px] mx-auto">
                    LubriGarage <br />
                    Engineered for Performance
                </p>
            </div>
        </div>
    );
}
