'use client';

import { useState } from 'react';
import { Car, Calendar, History, Activity, AlertTriangle, Zap, Droplets, CheckCircle2, ChevronRight, Plus } from 'lucide-react';

interface PortalData {
    name: string;
    phone: string;
    vehicles: any[];
    workOrders: any[];
}

export default function PortalClientView({ data }: { data: PortalData }) {
    const [selectedVehicleIndex, setSelectedVehicleIndex] = useState(0);
    const vehicle = data.vehicles[selectedVehicleIndex] || data.vehicles[0];

    // Helper to calculate percentages
    const calculateLife = (lastKm = 0, currentKm = 0, interval = 10000) => {
        if (!currentKm || !lastKm) return 100;
        const diff = currentKm - lastKm;
        const left = Math.max(0, interval - diff);
        return Math.min(100, Math.round((left / interval) * 100));
    };

    const oilLife = calculateLife(vehicle?.lastServiceMileage, vehicle?.mileage);

    // Simulate Battery Voltage (Mock for "Live" Telemetry vibe)
    // In a real app, this would come from the last check or a connected device
    const batteryVoltage = vehicle?.maintenanceStatus?.batteryVoltage || "12.6";

    return (
        <div className="flex flex-col h-full bg-[#0A0A0A] text-white min-h-screen font-sans selection:bg-[#E20613] selection:text-white">

            {/* Header / Nav */}
            <header className="px-6 py-6 flex justify-between items-center bg-gradient-to-b from-black/50 to-transparent backdrop-blur-sm sticky top-0 z-20">
                <div className="flex items-center gap-3">
                    {/* Logo Placeholder - User requested logo placement */}
                    <div className="w-10 h-10 rounded-xl bg-[#171717] flex items-center justify-center border border-white/5 shadow-lg shadow-black/50 overflow-hidden">
                        {/* <img src="/logo.png" alt="Logo" className="w-full h-full object-cover" /> */}
                        <Car size={20} className="text-[#E20613]" />
                    </div>
                    <div>
                        <h1 className="text-sm font-bold tracking-widest uppercase text-neutral-400">Lubri<span className="text-[#E20613]">Garage</span></h1>
                        <p className="text-xs font-medium text-neutral-600">Telemetry System v2.0</p>
                    </div>
                </div>
                <div className="w-8 h-8 rounded-full bg-[#171717] border border-white/5 flex items-center justify-center">
                    <div className="w-2 h-2 bg-[#E20613] rounded-full animate-pulse shadow-[0_0_8px_#E20613]" />
                </div>
            </header>

            <div className="flex-1 overflow-y-auto pb-24 px-6 space-y-8">

                {/* Vehicle Module (Card) */}
                {vehicle ? (
                    <section className="relative group">
                        <div className="absolute inset-0 bg-gradient-to-br from-[#E20613]/20 via-transparent to-transparent blur-3xl rounded-full opacity-20 -translate-y-10 pointer-events-none" />

                        <div className="bg-[#171717]/80 backdrop-blur-xl border border-white/10 rounded-[2rem] p-6 shadow-2xl relative overflow-hidden">
                            {/* Vehicle Switcher (if multiple) */}
                            {data.vehicles.length > 1 && (
                                <div className="flex gap-2 mb-4 overflow-x-auto no-scrollbar">
                                    {data.vehicles.map((v, idx) => (
                                        <button
                                            key={v.id}
                                            onClick={() => setSelectedVehicleIndex(idx)}
                                            className={`w-2 h-2 rounded-full transition-all ${idx === selectedVehicleIndex ? 'bg-[#E20613] w-6' : 'bg-neutral-600'}`}
                                        />
                                    ))}
                                </div>
                            )}

                            <div className="flex justify-between items-start mb-6">
                                <div>
                                    <h2 className="text-3xl font-black uppercase italic tracking-tighter leading-none mb-1 text-white">
                                        {vehicle.model?.split(' ')[0] || 'Unknown'}
                                    </h2>
                                    <p className="text-neutral-400 font-bold uppercase tracking-widest text-xs">
                                        {vehicle.brand || 'Brand'} • {vehicle.year || '2023'}
                                    </p>
                                </div>
                                <div className="px-3 py-1 rounded-full bg-black/40 border border-white/5 backdrop-blur-md">
                                    <span className="font-mono font-bold text-[#E20613] text-sm tabular-nums">
                                        {vehicle.plate}
                                    </span>
                                </div>
                            </div>

                            {/* Mileage / Life Bar */}
                            <div className="space-y-2">
                                <div className="flex justify-between text-[10px] uppercase font-bold tracking-wider text-neutral-500">
                                    <span>Vida Útil Servicio</span>
                                    <span>{vehicle.mileage?.toLocaleString() || 0} km</span>
                                </div>
                                <div className="h-2 bg-black/50 rounded-full overflow-hidden border border-white/5">
                                    <div
                                        className="h-full bg-gradient-to-r from-[#E20613] to-orange-500 rounded-full transition-all duration-1000 shadow-[0_0_15px_rgba(226,6,19,0.5)]"
                                        style={{ width: `${oilLife}%` }}
                                    />
                                </div>
                            </div>

                            {/* Decorational Icon */}
                            <div className="absolute -right-4 top-1/2 -translate-y-1/2 opacity-5 pointer-events-none text-white">
                                <Car size={180} />
                            </div>
                        </div>
                    </section>
                ) : (
                    <div className="text-center py-10 text-neutral-500">
                        <p>No hay vehículos registrados.</p>
                    </div>
                )}

                {/* Telemetry (Gauges) */}
                {vehicle && (
                    <section className="grid grid-cols-2 gap-4">
                        {/* Oil Gauge */}
                        <div className="bg-[#171717]/60 backdrop-blur-md border border-white/5 rounded-[2rem] p-5 flex flex-col items-center justify-center relative overflow-hidden group">
                            <div className="relative w-24 h-24 flex items-center justify-center mb-3">
                                <svg className="w-full h-full transform -rotate-90">
                                    <circle cx="48" cy="48" r="40" stroke="#333" strokeWidth="6" fill="transparent" />
                                    <circle
                                        cx="48" cy="48" r="40" stroke={oilLife < 20 ? '#E20613' : oilLife < 50 ? '#F59E0B' : '#10B981'} strokeWidth="6" fill="transparent"
                                        strokeDasharray={251.2}
                                        strokeDashoffset={251.2 - (251.2 * oilLife) / 100}
                                        strokeLinecap="round"
                                        className="transition-all duration-1000 ease-out"
                                    />
                                </svg>
                                <Droplets className={`absolute ${oilLife < 20 ? 'text-[#E20613]' : 'text-neutral-500'}`} size={24} />
                            </div>
                            <h3 className="text-xs font-bold uppercase tracking-widest text-neutral-400">Aceite</h3>
                            <p className="text-lg font-black">{oilLife}%</p>
                        </div>

                        {/* Battery Gauge */}
                        <div className="bg-[#171717]/60 backdrop-blur-md border border-white/5 rounded-[2rem] p-5 flex flex-col items-start justify-between relative overflow-hidden">
                            <div className="mb-2 p-2 bg-black/30 rounded-lg border border-white/5 text-[#E20613]">
                                <Zap size={20} />
                            </div>
                            <div>
                                <div className="flex items-baseline gap-1">
                                    <span className="text-3xl font-black tracking-tight">{batteryVoltage}</span>
                                    <span className="text-xs font-bold text-neutral-500">v</span>
                                </div>
                                <h3 className="text-xs font-bold uppercase tracking-widest text-neutral-400 mt-1">Batería</h3>
                            </div>
                            {/* Fake voltage graph line */}
                            <div className="absolute right-0 bottom-4 w-1/2 h-8 opacity-20">
                                <Activity className="w-full h-full text-[#E20613]" />
                            </div>
                        </div>
                    </section>
                )}

                {/* Pending Tasks (Priority) */}
                {vehicle && (
                    <section>
                        <div className="flex items-center gap-2 mb-4">
                            <div className="w-1 h-4 bg-[#E20613] rounded-full" />
                            <h3 className="text-sm font-bold uppercase tracking-widest text-neutral-300">Diagnóstico Activo</h3>
                        </div>

                        <div className="space-y-3">
                            {/* Filters Section - Show ALL filters with status */}
                            {vehicle.maintenanceStatus?.filters?.map((item: any, idx: number) => (
                                <div key={idx} className={`border p-4 rounded-2xl flex items-center justify-between shadow-sm transition-all ${item.status === 'OK'
                                    ? 'bg-[#171717] border-emerald-500/20 shadow-[0_4px_20px_-10px_rgba(16,185,129,0.1)]'
                                    : 'bg-[#1F1F1F] border-[#E20613]/30 shadow-[0_4px_20px_-10px_rgba(226,6,19,0.2)]'
                                    }`}>
                                    <div className="flex items-center gap-3">
                                        <div className={`w-10 h-10 rounded-full flex items-center justify-center animate-pulse ${item.status === 'OK'
                                            ? 'bg-emerald-500/10 text-emerald-500'
                                            : 'bg-[#E20613]/10 text-[#E20613]'
                                            }`}>
                                            {item.status === 'OK' ? <CheckCircle2 size={18} /> : <AlertTriangle size={18} />}
                                        </div>
                                        <div>
                                            <p className={`font-bold text-sm ${item.status === 'OK' ? 'text-white' : 'text-white'}`}>{item.label}</p>
                                            <p className={`text-[10px] font-bold uppercase tracking-wide ${item.status === 'OK' ? 'text-emerald-500' : 'text-[#E20613]'
                                                }`}>
                                                {item.status === 'OK' ? 'Cambiado / OK' : 'Atención Requerida'}
                                            </p>
                                        </div>
                                    </div>
                                    <ChevronRight size={18} className="text-neutral-600" />
                                </div>
                            ))}

                            {/* Show 1 or 2 normal items just to populate (Fluids) */}
                            {vehicle.maintenanceStatus?.fluids?.slice(0, 2).map((item: any, idx: number) => (
                                <div key={idx} className="bg-[#171717] border border-white/5 p-4 rounded-2xl flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-neutral-400">
                                            <CheckCircle2 size={18} />
                                        </div>
                                        <div>
                                            <p className="font-bold text-sm text-neutral-300">{item.label}</p>
                                            <p className="text-[10px] text-neutral-500 font-bold uppercase tracking-wide">Operativo</p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>
                )}

                {/* Recent History Teaser */}
                <section>
                    <div className="flex items-center justify-between mb-4 mt-4">
                        <div className="flex items-center gap-2">
                            <div className="w-1 h-4 bg-neutral-600 rounded-full" />
                            <h3 className="text-sm font-bold uppercase tracking-widest text-neutral-400">Historial Reciente</h3>
                        </div>
                    </div>
                    {data.workOrders.length > 0 ? (
                        data.workOrders.slice(0, 2).map((wo) => (
                            <div key={wo.id} className="bg-[#171717] border border-white/5 p-5 rounded-2xl mb-3 last:mb-0">
                                <div className="flex justify-between items-start mb-2">
                                    <div>
                                        <p className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest mb-1">
                                            {new Date(wo.date).toLocaleDateString()}
                                        </p>
                                        <h4 className="font-bold text-white text-base">{wo.serviceName}</h4>
                                    </div>
                                    <span className={`px-2 py-1 rounded bg-white/5 text-[10px] font-bold uppercase ${wo.status.includes('COMPLETED') ? 'text-emerald-500' : 'text-neutral-400'}`}>
                                        {wo.status === 'COMPLETED' ? 'Finalizado' : wo.status}
                                    </span>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="p-4 text-center text-neutral-600 text-sm">Sin historial reciente</div>
                    )}
                </section>

            </div>

            {/* Bottom Nav (Floating) */}
            <div className="fixed bottom-6 left-6 right-6 z-30">
                <div className="bg-[#171717]/90 backdrop-blur-xl border border-white/10 rounded-2xl p-2 flex items-center justify-between shadow-2xl">
                    <button className="p-3 rounded-xl hover:bg-white/5 text-neutral-400 hover:text-white transition-colors">
                        <History size={20} />
                    </button>

                    {/* Main CTA: Quick Charge / Book */}
                    <button className="flex items-center gap-2 bg-[#E20613] hover:bg-red-600 text-white px-6 py-3 rounded-xl shadow-[0_0_20px_rgba(226,6,19,0.4)] transition-all transform hover:scale-105 active:scale-95 group">
                        <Plus size={20} className="group-hover:rotate-90 transition-transform" />
                        <span className="font-bold text-xs uppercase tracking-widest">Agendar Service</span>
                    </button>

                    <button className="p-3 rounded-xl hover:bg-white/5 text-neutral-400 hover:text-white transition-colors">
                        <Calendar size={20} />
                    </button>
                </div>
            </div>

        </div>
    );
}
