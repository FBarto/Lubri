'use client';

import { useState } from 'react';
import { LeadCase, CaseChecklistItem, CaseLog, CaseStatus, LogChannel, ChecklistTemplate } from '@prisma/client';
import { ArrowLeft, CheckCircle2, Circle, Copy, Send, Save, AlertCircle } from 'lucide-react';
import { updateChecklistItem, addCaseLog, updateCaseStatus } from '../../lib/inbox-actions';
import { useRouter } from 'next/navigation';

interface CaseDetailProps {
    leadCase: LeadCase & {
        checklist: CaseChecklistItem[];
        logs: (CaseLog & { authorUser: { username: string } })[];
        client: any;
        vehicle: any;
    };
    currentUserId: number;
}

const QUICK_REPLIES: Record<ChecklistTemplate | 'GENERIC', string[]> = {
    TYRES: [
        "¿Me pasás la medida exacta? (ej: 175/70R13)",
        "¿Cuántas cubiertas necesitás?",
        "¿Es para hoy o puede esperar?",
        "¿Es auxilio? ¿Dónde estás ahora?",
    ],
    BATTERY: [
        "¿Qué auto es? Marca, modelo y año",
        "¿La batería vieja la entregás para reciclaje?",
        "¿Arranca algo o está totalmente descargada?",
        "¿Es para ahora o durante el día?",
    ],
    OIL_SERVICE: [
        "¿Qué aceite usás o querés el recomendado?",
        "¿Sabés el kilometraje aproximado?",
        "¿Preferís venir a la mañana o a la tarde?",
        "¿Necesitás factura?",
    ],
    GENERIC: [
        "¿Me confirmás patente así lo asociamos?",
        "¿Cómo preferís pagar?",
        "¿Te parece bien que te llamemos para coordinar?",
    ]
};

export default function CaseDetailView({ leadCase, currentUserId }: CaseDetailProps) {
    const [checklist, setChecklist] = useState(leadCase.checklist.sort((a, b) => a.sortOrder - b.sortOrder));
    const [logs, setLogs] = useState(leadCase.logs);
    const [newMessage, setNewMessage] = useState('');
    const [isSending, setIsSending] = useState(false);
    const router = useRouter();

    const handleChecklistChange = async (item: CaseChecklistItem, value: any, isDone: boolean) => {
        // Optimistic update
        setChecklist(prev => prev.map(i => i.id === item.id ? { ...i, value: String(value), isDone } : i));

        await updateChecklistItem(item.id, value, isDone);
    };

    const handleSendLog = async () => {
        if (!newMessage.trim()) return;
        setIsSending(true);
        const res = await addCaseLog(leadCase.id, currentUserId, newMessage, 'INTERNAL_NOTE');
        if (res.success && res.data) {
            setLogs(prev => [res.data as any, ...prev]);
            setNewMessage('');
        }
        setIsSending(false);
    };

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        // Could show toast here
    };

    // Calculate progress
    const requiredItems = checklist.filter(i => i.isRequired);
    const completedRequired = requiredItems.filter(i => i.isDone).length;
    const progress = Math.round((completedRequired / requiredItems.length) * 100) || 0;
    const isReady = completedRequired === requiredItems.length;

    // Determine quick replies based on category
    const categoryKey = (leadCase.serviceCategory as string) in QUICK_REPLIES ? (leadCase.serviceCategory as ChecklistTemplate) : 'GENERIC';
    const replies = [...(QUICK_REPLIES[categoryKey] || []), ...QUICK_REPLIES.GENERIC];

    return (
        <div className="flex h-[calc(100vh-100px)] gap-6 overflow-hidden">

            {/* LEFT: Checklist & Info */}
            <div className="flex-1 flex flex-col gap-6 overflow-y-auto pr-2">

                {/* Header Card */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                    <div className="flex justify-between items-start mb-4">
                        <div>
                            <h2 className="text-2xl font-bold text-slate-900">{leadCase.summary}</h2>
                            <p className="text-slate-500 text-sm">SLA: {new Date(leadCase.slaDueAt).toLocaleString()}</p>
                        </div>
                        <div className="text-right">
                            <div className="mb-2">
                                <span className={`px-3 py-1 rounded-full font-bold text-xs ${isReady ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                                    {isReady ? 'Listo para Agendar' : 'Faltan datos'}
                                </span>
                            </div>
                            <div className="w-32 bg-slate-200 rounded-full h-2 ml-auto">
                                <div className="bg-emerald-500 h-2 rounded-full transition-all duration-500" style={{ width: `${progress}%` }}></div>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 text-sm mt-4 p-4 bg-slate-50 rounded-xl border border-slate-100">
                        <div>
                            <p className="text-xs font-bold text-slate-400 uppercase">Cliente</p>
                            <p className="font-semibold text-slate-700">{leadCase.client?.name || '---'}</p>
                            <p className="text-slate-400">{leadCase.client?.phone || 'Sin teléfono'}</p>
                        </div>
                        <div>
                            <p className="text-xs font-bold text-slate-400 uppercase">Vehículo</p>
                            <p className="font-semibold text-slate-700">{leadCase.vehicle?.model || '---'}</p>
                            <p className="text-slate-400">{leadCase.vehicle?.plate || 'Sin patente'}</p>
                        </div>
                    </div>
                </div>

                {/* Checklist Form */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex-1">
                    <h3 className="font-bold text-slate-800 mb-6 flex items-center gap-2">
                        <CheckCircle2 className="w-5 h-5 text-blue-500" />
                        Checklist Requerido
                    </h3>

                    <div className="space-y-6">
                        {checklist.map(item => (
                            <div key={item.id} className={`p-4 rounded-xl border-l-4 transition-all ${item.isDone ? 'bg-emerald-50 border-emerald-500' : 'bg-slate-50 border-slate-300'}`}>
                                <div className="flex justify-between items-center mb-2">
                                    <label className="font-bold text-slate-700 text-sm">
                                        {item.label} {item.isRequired && <span className="text-red-500">*</span>}
                                    </label>
                                    <button
                                        onClick={() => handleChecklistChange(item, item.value, !item.isDone)}
                                        className={`transition-colors ${item.isDone ? 'text-emerald-600' : 'text-slate-300 hover:text-slate-400'}`}
                                    >
                                        {item.isDone ? <CheckCircle2 className="w-6 h-6" /> : <Circle className="w-6 h-6" />}
                                    </button>
                                </div>

                                {/* Dynamic Input Render */}
                                {item.inputType === 'TEXT' && (
                                    <input
                                        type="text"
                                        value={item.value || ''}
                                        onChange={(e) => handleChecklistChange(item, e.target.value, !!e.target.value)}
                                        placeholder="Escribir..."
                                        className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm focus:border-blue-500 outline-none"
                                    />
                                )}
                                {item.inputType === 'SELECT' && item.options && (
                                    <div className="flex flex-wrap gap-2 mt-2">
                                        {JSON.parse(item.options as string).map((opt: string) => (
                                            <button
                                                key={opt}
                                                onClick={() => handleChecklistChange(item, opt, true)}
                                                className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all ${item.value === opt
                                                        ? 'bg-blue-600 text-white border-blue-600 shadow-md'
                                                        : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                                                    }`}
                                            >
                                                {opt}
                                            </button>
                                        ))}
                                    </div>
                                )}
                                {item.inputType === 'NUMBER' && (
                                    <input
                                        type="number"
                                        value={item.value || ''}
                                        onChange={(e) => handleChecklistChange(item, e.target.value, !!e.target.value)}
                                        className="w-32 bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm focus:border-blue-500 outline-none"
                                    />
                                )}

                            </div>
                        ))}
                    </div>
                </div>

            </div>

            {/* RIGHT: Timeline & Actions */}
            <div className="w-[400px] flex flex-col gap-6">

                {/* Quick Actions */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                    <h3 className="text-xs font-bold text-slate-400 uppercase mb-4 tracking-wider">Respuestas Rápidas</h3>
                    <div className="flex flex-col gap-2 max-h-48 overflow-y-auto pr-2 custom-scrollbar">
                        {replies.map((reply, i) => (
                            <button
                                key={i}
                                onClick={() => copyToClipboard(reply)}
                                className="text-left text-xs p-3 hover:bg-slate-50 rounded-lg border border-transparent hover:border-slate-200 transition-all flex justify-between group text-slate-600"
                            >
                                <span>{reply}</span>
                                <Copy className="w-3 h-3 opacity-0 group-hover:opacity-100 text-blue-500" />
                            </button>
                        ))}
                    </div>
                </div>

                {/* Timeline CaseLogs */}
                <div className="flex-1 bg-white rounded-2xl shadow-sm border border-slate-200 flex flex-col overflow-hidden">
                    <div className="p-4 bg-slate-50 border-b border-slate-200">
                        <h3 className="font-bold text-slate-700">Timeline</h3>
                    </div>

                    <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/50">
                        {logs.map(log => (
                            <div key={log.id} className="flex gap-3">
                                <div className="w-8 h-8 rounded-full bg-slate-200 flex-shrink-0 flex items-center justify-center text-xs font-bold text-slate-600">
                                    {log.authorUser.username[0].toUpperCase()}
                                </div>
                                <div className="bg-white p-3 rounded-tr-xl rounded-br-xl rounded-bl-xl shadow-sm border border-slate-100 max-w-[85%]">
                                    <p className="text-sm text-slate-800">{log.message}</p>
                                    <p className="text-[10px] text-slate-400 mt-1 text-right">
                                        {new Date(log.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="p-3 bg-white border-t border-slate-200 flex gap-2">
                        <input
                            type="text"
                            value={newMessage}
                            onChange={e => setNewMessage(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && handleSendLog()}
                            placeholder="Escribir nota interna..."
                            className="flex-1 bg-slate-100 border-none rounded-xl px-4 text-sm focus:ring-2 focus:ring-blue-100"
                        />
                        <button
                            onClick={handleSendLog}
                            disabled={isSending}
                            className="p-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition"
                        >
                            <Send className="w-4 h-4" />
                        </button>
                    </div>
                </div>

                {/* Status Actions */}
                <div className="flex flex-col gap-2">
                    <button
                        onClick={() => router.push('/admin/inbox')} // Placeholder
                        className="w-full py-4 bg-slate-900 text-white rounded-xl font-bold shadow-lg hover:bg-slate-800 transition-all active:scale-95 flex justify-center items-center gap-2"
                    >
                        <Save className="w-4 h-4" />
                        Guardar y Volver
                    </button>
                </div>

            </div>

        </div>
    );
}
