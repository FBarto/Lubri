
'use client';

import { useState, useEffect } from 'react';
import { MaintenanceStatus } from '@/app/lib/maintenance-data';

interface PreviewHealthCardModalProps {
    isOpen: boolean;
    onClose: () => void;
    vehicleId: number;
    vehiclePlate: string;
    workOrderId: number;
    clientName: string;
    onSave: () => void; // Callback to refresh parent or trigger next step
    updateAction: (woId: number, items: any[]) => Promise<any>; // Server action dependency
    fetchAction: (vehicleId: number) => Promise<any>; // Server action dependency
}

export default function PreviewHealthCardModal({
    isOpen, onClose, vehicleId, vehiclePlate, workOrderId, clientName, onSave, updateAction, fetchAction
}: PreviewHealthCardModalProps) {
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [statusData, setStatusData] = useState<any>(null);
    const [editedItems, setEditedItems] = useState<Record<string, { status: string, detail: string }>>({});

    useEffect(() => {
        if (isOpen && vehicleId) {
            loadStatus();
        }
    }, [isOpen, vehicleId]);

    const loadStatus = async () => {
        setLoading(true);
        try {
            const res = await fetchAction(vehicleId);
            if (res.success) {
                setStatusData(res.data);
                // Initialize edited items with current values
                const initial: any = {};
                // Flatten categories
                [...(res.data.filters || []), ...(res.data.fluids || [])].forEach((item: any) => {
                    initial[item.key] = { status: item.status, detail: item.detail || '' };
                });
                setEditedItems(initial);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const handleToggleStatus = (key: string) => {
        setEditedItems(prev => {
            const current = prev[key];
            const newStatus = current.status === 'OK' ? 'WARNING' : 'OK';
            // If switching to OK and detail is empty, suggest "Cambiado" or "Revisado"
            let newDetail = current.detail;
            if (newStatus === 'OK' && (!newDetail || newDetail.trim() === '')) {
                newDetail = 'Cambiado';
            }
            return {
                ...prev,
                [key]: { ...current, status: newStatus, detail: newDetail }
            };
        });
    };

    const handleDetailChange = (key: string, val: string) => {
        setEditedItems(prev => ({
            ...prev,
            [key]: { ...prev[key], detail: val }
        }));
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            // Transform editedItems to array for server action
            const itemsToUpdate = Object.entries(editedItems).map(([key, val]) => ({
                key,
                status: val.status,
                detail: val.detail
            }));

            await updateAction(workOrderId, itemsToUpdate);
            onSave();
            onClose();
        } catch (e) {
            alert('Error al guardar cambios');
        } finally {
            setSaving(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
                <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                    <div>
                        <h2 className="text-xl font-black text-slate-800">Vista Previa Tarjeta</h2>
                        <p className="text-sm text-slate-500">Editá el estado antes de enviar a {clientName}</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full transition-colors">
                        <svg className="w-6 h-6 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                    {loading ? (
                        <div className="text-center py-10 text-slate-400">Cargando diagnóstico...</div>
                    ) : statusData ? (
                        <>
                            {/* Filters Section */}
                            <div>
                                <h3 className="text-xs font-bold uppercase text-slate-400 mb-3 tracking-wider">Filtros</h3>
                                <div className="space-y-3">
                                    {statusData.filters?.map((item: any) => {
                                        const current = editedItems[item.key] || item;
                                        const isOk = current.status === 'OK';
                                        return (
                                            <div key={item.key} className={`flex items-center gap-4 p-4 rounded-xl border ${isOk ? 'border-emerald-100 bg-emerald-50/50' : 'border-red-100 bg-red-50/50'} transition-colors`}>
                                                <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${isOk ? 'bg-emerald-100 text-emerald-600' : 'bg-red-100 text-red-600'}`}>
                                                    <span className="material-symbols-outlined text-xl">{isOk ? 'check' : 'priority_high'}</span>
                                                </div>
                                                <div className="flex-1">
                                                    <div className="flex justify-between items-center mb-1">
                                                        <span className="font-bold text-slate-700">{item.label}</span>
                                                        <button
                                                            onClick={() => handleToggleStatus(item.key)}
                                                            className={`text-[10px] font-black uppercase px-2 py-1 rounded-lg border ${isOk ? 'border-emerald-200 text-emerald-700 hover:bg-emerald-100' : 'border-red-200 text-red-700 hover:bg-red-100'} transition-all`}
                                                        >
                                                            {isOk ? 'ESTADO: OK' : 'ESTADO: REVISAR'}
                                                        </button>
                                                    </div>
                                                    <input
                                                        type="text"
                                                        value={current.detail}
                                                        onChange={(e) => handleDetailChange(item.key, e.target.value)}
                                                        placeholder={isOk ? "Marca/Modelo del filtro" : "Detalle de la falla..."}
                                                        className="w-full text-sm bg-white/50 border border-slate-200 rounded-lg px-3 py-1.5 focus:ring-2 focus:ring-slate-200 outline-none"
                                                    />
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Fluids Section */}
                            <div>
                                <h3 className="text-xs font-bold uppercase text-slate-400 mb-3 tracking-wider">Fluidos</h3>
                                <div className="space-y-3">
                                    {statusData.fluids?.map((item: any) => {
                                        const current = editedItems[item.key] || item;
                                        const isOk = current.status === 'OK';
                                        return (
                                            <div key={item.key} className={`flex items-center gap-4 p-4 rounded-xl border ${isOk ? 'border-emerald-100 bg-emerald-50/50' : 'border-red-100 bg-red-50/50'} transition-colors`}>
                                                <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${isOk ? 'bg-emerald-100 text-emerald-600' : 'bg-red-100 text-red-600'}`}>
                                                    <span className="material-symbols-outlined text-xl">{item.key === 'engine_oil' ? 'oil_barrel' : 'water_drop'}</span>
                                                </div>
                                                <div className="flex-1">
                                                    <div className="flex justify-between items-center mb-1">
                                                        <span className="font-bold text-slate-700">{item.label}</span>
                                                        <button
                                                            onClick={() => handleToggleStatus(item.key)}
                                                            className={`text-[10px] font-black uppercase px-2 py-1 rounded-lg border ${isOk ? 'border-emerald-200 text-emerald-700 hover:bg-emerald-100' : 'border-red-200 text-red-700 hover:bg-red-100'} transition-all`}
                                                        >
                                                            {isOk ? 'ESTADO: OK' : 'ESTADO: REVISAR'}
                                                        </button>
                                                    </div>
                                                    <input
                                                        type="text"
                                                        value={current.detail}
                                                        onChange={(e) => handleDetailChange(item.key, e.target.value)}
                                                        placeholder={isOk ? "Detalle del fluido" : "Nivel bajo / Revisar"}
                                                        className="w-full text-sm bg-white/50 border border-slate-200 rounded-lg px-3 py-1.5 focus:ring-2 focus:ring-slate-200 outline-none"
                                                    />
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </>
                    ) : null}
                </div>

                <div className="p-6 border-t border-slate-100 bg-slate-50 flex justify-end gap-3">
                    <button onClick={onClose} className="px-6 py-3 font-bold text-slate-500 hover:text-slate-800 transition-colors">Cancelar</button>
                    <button
                        onClick={handleSave}
                        disabled={saving}
                        className="bg-slate-900 text-white px-8 py-3 rounded-xl font-bold hover:bg-black transition-all shadow-lg shadow-slate-900/10 active:scale-95 flex items-center gap-2"
                    >
                        {saving ? 'Guardando...' : 'Guardar y Generar Link 🔗'}
                    </button>
                </div>
            </div>
        </div>
    );
}
