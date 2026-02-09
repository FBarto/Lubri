'use client';

import { useState, useRef } from 'react';
import html2canvas from 'html2canvas';
/* eslint-disable @next/next/no-img-element */

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

    const handleOpenWhatsApp = (action: string, detail?: string) => {
        const phone = '5493516756248'; // FB Lubricentro Phone (replace with env var if needed)
        let message = '';
        if (action === 'technical_sheet') {
            message = `Hola! 👋 Necesito la ficha técnica del servicio *${detail}* para mi vehículo ${vehicle.plate}.`;
        } else if (action === 'emergency') {
            message = `🆘 *URGENCIA MECÁNICA* \nHola, necesito ayuda con mi vehículo ${vehicle.brand} ${vehicle.model} (${vehicle.plate}).`;
        } else if (action === 'appointment') {
            message = `Hola! Quiero agendar un nuevo turno para mi ${vehicle.brand} ${vehicle.model}.`;
        } else if (action === 'history') {
            message = `Hola! Quisiera solicitar el historial completo de servicios de mi ${vehicle.brand} ${vehicle.model} (${vehicle.plate}).`;
        }

        window.open(`https://wa.me/${phone}?text=${encodeURIComponent(message)}`, '_blank');
    };

    const contentRef = useRef<HTMLDivElement>(null);
    const [isSharing, setIsSharing] = useState(false);

    const handleGenerateImage = async (mode: 'share' | 'download') => {
        if (!contentRef.current) return;
        setIsSharing(true);

        try {
            // Wait a bit for any images or fonts (optional but can help)
            await new Promise(resolve => setTimeout(resolve, 100));

            const canvas = await html2canvas(contentRef.current, {
                backgroundColor: '#120909', // Force dark background
                scale: 2, // High resolution
                useCORS: true, // Allow fetching cross-origin images if any
            });

            canvas.toBlob(async (blob) => {
                if (!blob) return;

                const file = new File([blob], `health-card-${vehicle.plate}.png`, { type: 'image/png' });

                if (mode === 'share' && navigator.canShare && navigator.canShare({ files: [file] })) {
                    // Try Native Share
                    try {
                        await navigator.share({
                            files: [file],
                            title: 'Tarjeta de Salud Digital',
                            text: `Hola! Acá tenés la tarjeta de salud actualizada de tu ${vehicle.brand} ${vehicle.model}.`
                        });
                    } catch (err) {
                        console.log('Share cancelled or failed', err);
                    }
                } else {
                    // Fallback to Download (or explicit download)
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `health-card-${vehicle.plate}.png`;
                    document.body.appendChild(a);
                    a.click();
                    document.body.removeChild(a);
                    URL.revokeObjectURL(url);
                }
                setIsSharing(false);
            }, 'image/png');

        } catch (error) {
            console.error('Error generating image:', error);
            setIsSharing(false);
        }
    };

    return (
        <div ref={contentRef} className="font-sans text-slate-900 dark:text-slate-100 min-h-screen bg-[#f8f6f6] dark:bg-[#120909]">
            <style jsx global>{`
                @import url('https://fonts.googleapis.com/css2?family=Manrope:wght@200..800&display=swap');
                @import url('https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@24,400,0,0');
                
                body {
                    font-family: 'Manrope', sans-serif;
                }
                
                .glass-card {
                    background: rgba(235, 64, 55, 0.05);
                    backdrop-filter: blur(12px);
                    border: 1px solid rgba(235, 64, 55, 0.1);
                }
                .timeline-line {
                    width: 2px;
                    background: linear-gradient(180deg, #eb4037 0%, rgba(235, 64, 55, 0) 100%);
                }
                .material-symbols-outlined {
                    font-variation-settings: 'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24;
                }
            `}</style>

            {/* Top Navigation Bar */}
            <nav className="sticky top-0 z-50 bg-[#120909]/80 backdrop-blur-md border-b border-[#eb4037]/10">
                <div className="flex items-center p-4 justify-between max-w-md mx-auto">
                    <div className="text-white flex items-center justify-center rounded-full hover:bg-white/10 transition-colors w-10 h-10">
                        {/* <span className="material-symbols-outlined">arrow_back_ios_new</span> */}
                        {/* Replaced back button with Logo Icon since this is root for client */}
                        <span className="material-symbols-outlined">verified_user</span>
                    </div>
                    <div className="flex-1 text-center">
                        <h1 className="text-white text-sm font-bold uppercase tracking-widest">FB Service Ledger</h1>
                        <p className="text-[#eb4037] text-[10px] font-bold">PROFESSIONAL REPORT</p>
                    </div>
                    <div className="flex items-center justify-end gap-2">
                        <button
                            onClick={() => handleGenerateImage('download')}
                            disabled={isSharing}
                            className="text-white hover:bg-white/10 p-2 rounded-full transition-colors relative"
                            title="Descargar Imagen"
                        >
                            {isSharing ? (
                                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            ) : (
                                <span className="material-symbols-outlined">download</span>
                            )}
                        </button>
                        <button
                            onClick={() => handleGenerateImage('share')}
                            disabled={isSharing}
                            className="text-white hover:bg-white/10 p-2 rounded-full transition-colors relative"
                            title="Compartir"
                        >
                            {isSharing ? (
                                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            ) : (
                                <span className="material-symbols-outlined">share</span>
                            )}
                        </button>
                    </div>
                </div>
            </nav>

            <main className="max-w-md mx-auto pb-24">
                {/* Vehicle Summary Header */}
                <header className="p-6 bg-gradient-to-b from-[#eb4037]/10 to-transparent">
                    <div className="flex items-center gap-6">
                        <div className="relative shrink-0">
                            {/* Vehicle Image Placeholder - Dynamic or Standard Brand Logo/Image */}
                            <div className="bg-center bg-no-repeat bg-cover rounded-xl w-24 h-24 ring-2 ring-[#eb4037]/20 bg-slate-800 flex items-center justify-center overflow-hidden">
                                <span className="material-symbols-outlined text-4xl text-white/20">directions_car</span>
                            </div>
                            <div className="absolute -bottom-2 -right-2 bg-[#eb4037] text-white text-[10px] font-bold px-2 py-1 rounded shadow-lg uppercase">
                                Active
                            </div>
                        </div>
                        <div className="flex flex-col min-w-0">
                            <h2 className="text-white text-2xl font-extrabold leading-tight truncate">
                                {vehicle?.brand} {vehicle?.model}
                            </h2>
                            <div className="flex items-center gap-2 mt-1">
                                <span className="bg-white/10 text-slate-300 text-xs font-mono px-2 py-0.5 rounded border border-white/5 tracking-wider uppercase">
                                    {vehicle?.plate}
                                </span>
                            </div>
                            <div className="flex items-center gap-1.5 mt-2 text-[#eb4037]/80">
                                <span className="material-symbols-outlined text-sm">speed</span>
                                <p className="text-sm font-bold tracking-tight">
                                    {vehicle?.mileage?.toLocaleString() || '---'} KM
                                </p>
                            </div>
                        </div>
                    </div>
                </header>

                {/* Health Diagnostic Section */}
                <section className="px-6 mb-8">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-white text-lg font-bold tracking-tight">Diagnóstico de Salud</h3>
                        <span className="text-[#eb4037]/60 text-[10px] font-bold uppercase">Technical Checkup</span>
                    </div>
                    <div className="grid grid-cols-1 gap-3">
                        {/* Oil Status */}
                        {(() => {
                            const oilStatus = vehicle?.maintenanceStatus?.fluids?.find((f: any) => f.key === 'engine_oil');
                            return (
                                <div className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/5">
                                    <div className="flex items-center gap-3">
                                        <span className="material-symbols-outlined text-slate-400">oil_barrel</span>
                                        <div className="overflow-hidden">
                                            <p className="text-sm font-bold text-white">Aceite de Motor</p>
                                            {oilStatus?.detail && (
                                                <p className="text-[10px] text-slate-400 uppercase tracking-wide truncate max-w-[180px]">
                                                    {oilStatus.detail}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                    <span className={`px-3 py-1 rounded-full text-[10px] font-bold border ${oilLife > 20 ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : 'bg-[#eb4037]/10 text-[#eb4037] border-[#eb4037]/20'}`}>
                                        {oilLife > 20 ? 'OK' : 'CAMBIO'}
                                    </span>
                                </div>
                            );
                        })()}

                        {/* Filters Status - Dynamic */}
                        {vehicle?.maintenanceStatus?.filters?.map((f: any, idx: number) => (
                            <div key={idx} className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/5">
                                <div className="flex items-center gap-3">
                                    <span className="material-symbols-outlined text-slate-400">filter_alt</span>
                                    <div className="overflow-hidden">
                                        <p className="text-sm font-bold text-white truncate max-w-[150px]">{f.label}</p>
                                        {f.detail && (
                                            <p className="text-[10px] text-slate-400 uppercase tracking-wide truncate max-w-[150px]">{f.detail}</p>
                                        )}
                                    </div>
                                </div>
                                <span className={`px-3 py-1 rounded-full text-[10px] font-bold border ${f.status === 'OK' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : 'bg-[#eb4037]/10 text-[#eb4037] border-[#eb4037]/20'}`}>
                                    {f.status === 'OK' ? 'OK' : 'REVISAR'}
                                </span>
                            </div>
                        ))}
                    </div>
                </section>

                {/* Service History Timeline */}
                <section className="px-6 relative">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="text-white text-lg font-bold tracking-tight">Historial de Servicios</h3>
                        <span className="material-symbols-outlined text-white/40">history</span>
                    </div>
                    <div className="relative pl-8">
                        {/* Timeline Line */}
                        <div className="absolute left-2.5 top-2 bottom-0 timeline-line opacity-30"></div>

                        {data.workOrders.length > 0 ? (
                            <>
                                {data.workOrders.slice(0, 1).map((wo: any, index: number) => (
                                    <div key={wo.id} className="relative mb-8 last:mb-0">
                                        <div className={`absolute -left-[27px] top-1.5 size-4 rounded-full border-4 border-[#120909] ${index === 0 ? 'bg-[#eb4037] shadow-[0_0_10px_rgba(235,64,55,0.5)]' : 'bg-slate-700'}`}></div>
                                        <div className={`p-5 rounded-xl ${index === 0 ? 'glass-card' : 'bg-white/[0.02] border border-white/5'}`}>
                                            <div className="flex justify-between items-start mb-2">
                                                <div>
                                                    <h4 className={`font-bold text-base ${index === 0 ? 'text-white' : 'text-white/80'}`}>
                                                        {wo.serviceName}
                                                    </h4>
                                                    <p className="text-slate-400 text-xs">
                                                        {new Date(wo.date).toLocaleDateString()}
                                                    </p>
                                                </div>
                                                <span className={`font-mono text-xs font-bold ${index === 0 ? 'text-[#eb4037]' : 'text-slate-500'}`}>
                                                    #{wo.id}
                                                </span>
                                            </div>
                                            <p className="text-slate-300 text-sm mb-4 leading-relaxed line-clamp-2">
                                                {wo.serviceDetails?.notes || 'Servicio de mantenimiento técnico especializado.'}
                                            </p>
                                            <button
                                                onClick={() => handleOpenWhatsApp('technical_sheet', `#${wo.id} - ${wo.serviceName}`)}
                                                className={`w-full flex items-center justify-center gap-2 border text-[11px] font-bold py-2.5 rounded transition-all uppercase tracking-widest ${index === 0 ? 'border-[#eb4037]/40 text-[#eb4037] hover:bg-[#eb4037]/10' : 'border-white/10 text-white/40 hover:bg-white/5'}`}
                                            >
                                                <span className="material-symbols-outlined text-sm">description</span>
                                                SOLICITAR FICHA TÉCNICA
                                            </button>
                                        </div>
                                    </div>
                                ))}

                                {/* Request Full History Button */}
                                <div className="mt-6 text-center">
                                    <p className="text-slate-500 text-xs mb-3">¿Necesitás ver servicios anteriores?</p>
                                    <button
                                        onClick={() => handleOpenWhatsApp('history')}
                                        className="w-full flex items-center justify-center gap-2 bg-[#120909] border border-white/10 text-white py-4 rounded-xl font-bold hover:bg-white/5 transition-colors uppercase tracking-widest text-xs"
                                    >
                                        <span className="material-symbols-outlined text-sm">history</span>
                                        SOLICITAR HISTORIAL COMPLETO
                                    </button>
                                </div>
                            </>
                        ) : (
                            <div className="text-center py-8">
                                <p className="text-slate-500 text-sm">Sin historial registrado.</p>
                            </div>
                        )}
                    </div>
                </section>
            </main>

            {/* Floating Emergency Button */}
            <div className="fixed bottom-24 right-6 z-50">
                <button
                    onClick={() => handleOpenWhatsApp('emergency')}
                    className="group relative flex items-center justify-center bg-[#eb4037] text-white w-14 h-14 rounded-full shadow-[0_0_20px_rgba(235,64,55,0.4)] active:scale-95 transition-transform overflow-hidden"
                >
                    <div className="absolute inset-0 bg-white/20 opacity-0 group-active:opacity-100 transition-opacity"></div>
                    <span className="material-symbols-outlined text-2xl">emergency_home</span>
                </button>
            </div>

            {/* Tab Bar Simulation */}
            <div className="fixed bottom-0 w-full max-w-md left-1/2 -translate-x-1/2 bg-[#120909]/90 backdrop-blur-xl border-t border-white/5 px-8 py-3 flex justify-between items-center z-40">
                <div className="flex flex-col items-center gap-1 text-[#eb4037]">
                    <span className="material-symbols-outlined text-2xl">dashboard_customize</span>
                    <span className="text-[9px] font-bold uppercase tracking-tighter">Panel</span>
                </div>
                <div
                    onClick={() => handleOpenWhatsApp('appointment')}
                    className="flex flex-col items-center gap-1 text-slate-500 cursor-pointer hover:text-slate-300 transition-colors"
                >
                    <span className="material-symbols-outlined text-2xl">calendar_today</span>
                    <span className="text-[9px] font-bold uppercase tracking-tighter">Turnos</span>
                </div>
                <div
                    onClick={() => handleOpenWhatsApp('technical_sheet', 'GENERAL')}
                    className="flex flex-col items-center gap-1 text-slate-500 cursor-pointer hover:text-slate-300 transition-colors"
                >
                    <span className="material-symbols-outlined text-2xl">person</span>
                    <span className="text-[9px] font-bold uppercase tracking-tighter">Perfil</span>
                </div>
            </div>
        </div>
    );
}
