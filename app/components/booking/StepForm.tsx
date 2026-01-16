'use client';
import { useState } from 'react';

interface ClientData {
    name: string;
    phone: string;
    plate: string;
    model: string;
    notes: string;
}

interface StepFormProps {
    data: ClientData;
    onChange: (data: ClientData) => void;
}

export default function StepForm({ data, onChange }: StepFormProps) {
    const handleChange = (field: keyof ClientData, value: string) => {
        onChange({ ...data, [field]: value });
    };

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 delay-200">
            <h2 className="text-2xl font-black text-slate-800 mb-6 text-center">
                Tus Datos
            </h2>

            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
                {/* Vehículo */}
                <div className="space-y-4">
                    <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest">Vehículo</h3>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-bold text-slate-600 mb-1 ml-1">PATENTE <span className="text-red-500">*</span></label>
                            <input
                                type="text"
                                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 font-mono font-bold text-slate-800 focus:ring-2 focus:ring-slate-900 outline-none uppercase placeholder:text-slate-300"
                                placeholder="AA123BB"
                                value={data.plate}
                                onChange={(e) => handleChange('plate', e.target.value.toUpperCase())}
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-600 mb-1 ml-1">MODELO</label>
                            <input
                                type="text"
                                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 font-semibold text-slate-800 focus:ring-2 focus:ring-slate-900 outline-none placeholder:text-slate-300"
                                placeholder="Ej: Toyota Hilux"
                                value={data.model}
                                onChange={(e) => handleChange('model', e.target.value)}
                            />
                        </div>
                    </div>
                </div>

                <div className="h-px bg-slate-100 my-4" />

                {/* Cliente */}
                <div className="space-y-4">
                    <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest">Contacto</h3>
                    <div>
                        <label className="block text-xs font-bold text-slate-600 mb-1 ml-1">NOMBRE COMPLETO <span className="text-red-500">*</span></label>
                        <input
                            type="text"
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 font-semibold text-slate-800 focus:ring-2 focus:ring-slate-900 outline-none placeholder:text-slate-300"
                            placeholder="Tu nombre"
                            value={data.name}
                            onChange={(e) => handleChange('name', e.target.value)}
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-slate-600 mb-1 ml-1">WHATSAPP / CELULAR <span className="text-red-500">*</span></label>
                        <input
                            type="tel"
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 font-semibold text-slate-800 focus:ring-2 focus:ring-slate-900 outline-none placeholder:text-slate-300"
                            placeholder="3541..."
                            value={data.phone}
                            onChange={(e) => handleChange('phone', e.target.value)}
                        />
                    </div>
                </div>

                <div className="h-px bg-slate-100 my-4" />

                {/* Notas */}
                <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1 ml-1">NOTAS ADICIONALES</label>
                    <textarea
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 font-medium text-slate-800 focus:ring-2 focus:ring-slate-900 outline-none placeholder:text-slate-300 min-h-[80px]"
                        placeholder="Algún detalle extra..."
                        value={data.notes}
                        onChange={(e) => handleChange('notes', e.target.value)}
                    />
                </div>
            </div>

            <p className="text-center text-xs text-slate-400 px-4">
                Al confirmar, tus datos serán registrados para agendar el servicio.
            </p>
        </div>
    );
}
