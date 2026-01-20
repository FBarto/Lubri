'use client';

import { useState } from 'react';
import { LeadCase, CaseChecklistItem, CaseLog, CaseStatus, LogChannel, ChecklistTemplate } from '@prisma/client';
import { ArrowLeft, CheckCircle2, Circle, Copy, Send, Save, AlertCircle, Sparkles, CalendarClock, X, MessageCircle, UserPlus, Car, FileText } from 'lucide-react';
import { updateChecklistItem, addCaseLog, updateCaseStatus, convertCaseToAppointment, getServicesList, generateWhatsAppLink, searchClients, assignClientToCase, createQuickClient, createQuickVehicle, getClientVehicles } from '../../lib/inbox-actions';
import { useRouter } from 'next/navigation';
import SmartInput from './SmartInput';
import QuoteBuilder from './QuoteBuilder';

interface CaseDetailProps {
    leadCase: LeadCase & {
        checklist: CaseChecklistItem[];
        logs: (CaseLog & { authorUser: { username: string } })[];
        client: any;
        vehicle: any;
    };
    currentUserId: number;
}

// ... QUICK_REPLIES moved inside or kept
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

    // Conversion Modal State
    const [isConvertModalOpen, setIsConvertModalOpen] = useState(false);
    const [isQuoteModalOpen, setIsQuoteModalOpen] = useState(false);


    const [convertDate, setConvertDate] = useState('');
    const [convertTime, setConvertTime] = useState('');
    const [services, setServices] = useState<any[]>([]);
    const [selectedServiceId, setSelectedServiceId] = useState<number | null>(null);

    const openConvertModal = async () => {
        setIsConvertModalOpen(true);
        const res = await getServicesList();
        if (res.success && res.data) {
            setServices(res.data);
        }
    };

    const handleConvert = async () => {
        if (!convertDate || !convertTime || !selectedServiceId) {
            alert('Completa fecha, hora y servicio.');
            return;
        }

        const isoDate = new Date(`${convertDate}T${convertTime}:00`);

        setIsSending(true);
        const res = await convertCaseToAppointment({
            caseId: leadCase.id,
            date: isoDate,
            serviceId: selectedServiceId,
            notes: `[Desde Inbox] ${leadCase.summary}`
        });

        if (res.success) {
            alert('¡Turno creado!');
            router.push('/admin/appointments');
        } else {
            alert('Error: ' + res.error);
        }
        setIsSending(false);
    };

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

    // Quick Fix State
    const [currentClient, setCurrentClient] = useState(leadCase.client);
    const [currentVehicle, setCurrentVehicle] = useState(leadCase.vehicle);

    // Client Search
    const [clientSearch, setClientSearch] = useState('');
    const [foundClients, setFoundClients] = useState<any[]>([]);
    const [isSearchingClient, setIsSearchingClient] = useState(false);

    // Client Creation
    const [isCreatingClient, setIsCreatingClient] = useState(false);
    const [newClientName, setNewClientName] = useState('');
    const [newClientPhone, setNewClientPhone] = useState('');

    // Vehicle Selection/Creation
    const [clientVehicles, setClientVehicles] = useState<any[]>([]);
    const [isCreatingVehicle, setIsCreatingVehicle] = useState(false);
    const [newVehBrand, setNewVehBrand] = useState('');
    const [newVehModel, setNewVehModel] = useState('');
    const [newVehPlate, setNewVehPlate] = useState('');

    const runClientSearch = async (q: string) => {
        setClientSearch(q);
        if (q.length > 2) {
            setIsSearchingClient(true);
            const res = await searchClients(q);
            setFoundClients(res.data || []);
            setIsSearchingClient(false);
        }
    };

    const handleSelectClient = async (c: any) => {
        setIsSending(true);
        // Link to case
        await assignClientToCase(leadCase.id, c.id);
        setCurrentClient(c);
        // Fetch vehicles
        const res = await getClientVehicles(c.id);
        setClientVehicles(res.data || []);
        setIsSending(false);
    };

    const handleCreateClient = async () => {
        if (!newClientName || !newClientPhone) return;
        setIsSending(true);
        const res = await createQuickClient(newClientName, newClientPhone);
        if (res.success && res.data) {
            await handleSelectClient(res.data);
            setIsCreatingClient(false);
        } else {
            alert('Error al crear cliente');
        }
        setIsSending(false);
    };

    const handleSelectVehicle = async (v: any) => {
        setIsSending(true);
        await assignClientToCase(leadCase.id, currentClient.id, v.id);
        setCurrentVehicle(v);
        setIsSending(false);
    };

    const handleCreateVehicle = async () => {
        if (!newVehPlate || !newVehModel) return;
        setIsSending(true);
        const res = await createQuickVehicle(currentClient.id, newVehBrand, newVehModel, newVehPlate);
        if (res.success && res.data) {
            await handleSelectVehicle(res.data);
            setIsCreatingVehicle(false);
        } else {
            alert('Error al crear vehículo');
        }
        setIsSending(false);
    };

    const handleWhatsApp = async () => {
        setIsSending(true);
        const res = await generateWhatsAppLink(leadCase.id);
        if (res.success && res.url) {
            window.open(res.url, '_blank');
        } else {
            alert('Error generando link: ' + res.error);
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


                    {/* WhatsApp Button */}
                    <button
                        onClick={handleWhatsApp}
                        className="w-full py-3 bg-green-500 text-white rounded-xl font-bold shadow-sm hover:bg-green-600 transition-all active:scale-95 flex justify-center items-center gap-2"
                    >
                        <MessageCircle className="w-4 h-4" />
                        Enviar Resumen Rápido (WA)
                    </button>

                    {/* Quote Button */}
                    <button
                        onClick={() => setIsQuoteModalOpen(true)}
                        className="w-full py-3 bg-white border-2 border-slate-200 text-slate-700 rounded-xl font-bold shadow-sm hover:border-blue-400 hover:text-blue-600 transition-all active:scale-95 flex justify-center items-center gap-2"
                    >
                        <FileText className="w-4 h-4" />
                        Gestionar Presupuesto Formal
                    </button>

                    {/* Convert Button */}
                    <button
                        onClick={openConvertModal}
                        className="w-full py-3 bg-emerald-600 text-white rounded-xl font-bold shadow-sm hover:bg-emerald-700 transition-all active:scale-95 flex justify-center items-center gap-2"
                    >
                        <CalendarClock className="w-4 h-4" />
                        Agendar Turno
                    </button>

                    <button
                        onClick={() => router.push('/admin/inbox')}
                        className="w-full py-3 bg-slate-900 text-white rounded-xl font-bold shadow-lg hover:bg-slate-800 transition-all active:scale-95 flex justify-center items-center gap-2"
                    >
                        <Save className="w-4 h-4" />
                        Guardar y Volver
                    </button>
                </div>

            </div>

            {/* MODAL */}
            {isConvertModalOpen && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
                        <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                            <h3 className="font-bold text-lg text-slate-800">Agendar Turno</h3>
                            <button onClick={() => setIsConvertModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="p-6 space-y-4">
                            {!currentClient ? (
                                // STEP 1: CLIENT
                                <div>
                                    <div className="flex items-center gap-2 mb-4 bg-amber-50 p-2 rounded-lg text-amber-700 text-sm">
                                        <AlertCircle className="w-4 h-4" />
                                        <span>Falta asociar el Cliente</span>
                                    </div>

                                    {!isCreatingClient ? (
                                        <>
                                            <input
                                                autoFocus
                                                type="text"
                                                placeholder="Buscar por nombre, tel o patente..."
                                                className="w-full p-2 border rounded-lg mb-2"
                                                value={clientSearch}
                                                onChange={e => runClientSearch(e.target.value)}
                                            />
                                            <div className="max-h-40 overflow-y-auto mb-2 space-y-1">
                                                {foundClients.map(c => (
                                                    <button key={c.id} onClick={() => handleSelectClient(c)} className="w-full text-left p-2 hover:bg-slate-50 border rounded-lg text-sm">
                                                        <div className="font-bold">{c.name}</div>
                                                        <div className="text-xs text-slate-500">{c.phone}</div>
                                                    </button>
                                                ))}
                                                {clientSearch.length > 2 && foundClients.length === 0 && !isSearchingClient && (
                                                    <p className="text-xs text-slate-400 p-2">No se encontraron resultados.</p>
                                                )}
                                            </div>

                                            <button onClick={() => setIsCreatingClient(true)} className="w-full py-2 bg-blue-100 text-blue-700 rounded-lg font-bold text-sm flex justify-center items-center gap-2 hover:bg-blue-200">
                                                <UserPlus className="w-4 h-4" /> Crear Nuevo Cliente
                                            </button>
                                        </>
                                    ) : (
                                        <div className="space-y-2 animate-in fade-in slide-in-from-bottom-2">
                                            <input placeholder="Nombre Completo" className="w-full p-2 border rounded-lg" value={newClientName} onChange={e => setNewClientName(e.target.value)} />
                                            <input placeholder="Teléfono (Whatsapp)" className="w-full p-2 border rounded-lg" value={newClientPhone} onChange={e => setNewClientPhone(e.target.value)} />
                                            <div className="flex gap-2 pt-2">
                                                <button onClick={() => setIsCreatingClient(false)} className="px-4 py-2 text-slate-500 font-bold border rounded-lg">Volver</button>
                                                <button onClick={handleCreateClient} disabled={!newClientName || !newClientPhone || isSending} className="flex-1 py-2 bg-blue-600 text-white rounded-lg font-bold">Guardar</button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ) : !currentVehicle ? (
                                // STEP 2: VEHICLE
                                <div>
                                    <div className="flex items-center gap-2 mb-4 bg-amber-50 p-2 rounded-lg text-amber-700 text-sm">
                                        <Car className="w-4 h-4" />
                                        <span>Falta asociar el Vehículo de <span className="font-bold">{currentClient.name}</span></span>
                                    </div>

                                    {!isCreatingVehicle ? (
                                        <>
                                            <div className="space-y-2 mb-4">
                                                {clientVehicles.map(v => (
                                                    <button key={v.id} onClick={() => handleSelectVehicle(v)} className="w-full text-left p-3 hover:bg-slate-50 border rounded-lg flex justify-between items-center group">
                                                        <div>
                                                            <div className="font-bold text-slate-800">{v.model}</div>
                                                            <div className="text-xs text-slate-500">{v.brand} - {v.plate}</div>
                                                        </div>
                                                        <CheckCircle2 className="w-4 h-4 text-emerald-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                                                    </button>
                                                ))}
                                                {clientVehicles.length === 0 && <p className="text-center text-sm text-slate-400 py-4">Este cliente no tiene vehículos registrados.</p>}
                                            </div>

                                            <button onClick={() => setIsCreatingVehicle(true)} className="w-full py-2 bg-blue-100 text-blue-700 rounded-lg font-bold text-sm flex justify-center items-center gap-2 hover:bg-blue-200">
                                                <Car className="w-4 h-4" /> Registrar Vehículo
                                            </button>
                                        </>
                                    ) : (
                                        <div className="space-y-2 animate-in fade-in slide-in-from-bottom-2">
                                            <input placeholder="Marca (ej: Ford)" className="w-full p-2 border rounded-lg" value={newVehBrand} onChange={e => setNewVehBrand(e.target.value)} />
                                            <input placeholder="Modelo (ej: Focus)" className="w-full p-2 border rounded-lg" value={newVehModel} onChange={e => setNewVehModel(e.target.value)} />
                                            <input placeholder="Patente (ej: AA123BB)" className="w-full p-2 border rounded-lg" value={newVehPlate} onChange={e => setNewVehPlate(e.target.value)} />
                                            <div className="flex gap-2 pt-2">
                                                <button onClick={() => setIsCreatingVehicle(false)} className="px-4 py-2 text-slate-500 font-bold border rounded-lg">Volver</button>
                                                <button onClick={handleCreateVehicle} disabled={!newVehPlate || !newVehModel || isSending} className="flex-1 py-2 bg-blue-600 text-white rounded-lg font-bold">Guardar</button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                // STEP 3: SCHEDULE (Original)
                                <>
                                    <div className="bg-emerald-50 border border-emerald-100 p-2 rounded-lg text-xs text-emerald-700 mb-4 flex gap-2 items-center">
                                        <CheckCircle2 className="w-3 h-3" />
                                        <span>Turno para: <b>{currentClient.name}</b> - {currentVehicle.model} ({currentVehicle.plate})</span>
                                    </div>

                                    <div>
                                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Fecha y Hora</label>
                                        <div className="flex gap-2">
                                            <input
                                                type="date"
                                                value={convertDate}
                                                onChange={e => setConvertDate(e.target.value)}
                                                className="flex-1 border border-slate-200 rounded-lg px-3 py-2 text-sm"
                                            />
                                            <input
                                                type="time"
                                                value={convertTime}
                                                onChange={e => setConvertTime(e.target.value)}
                                                className="w-32 border border-slate-200 rounded-lg px-3 py-2 text-sm"
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Servicio a Realizar</label>
                                        <select
                                            value={selectedServiceId || ''}
                                            onChange={e => setSelectedServiceId(Number(e.target.value))}
                                            className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm"
                                        >
                                            <option value="">Seleccionar...</option>
                                            {services.map(s => (
                                                <option key={s.id} value={s.id}>{s.name} (${s.price})</option>
                                            ))}
                                        </select>
                                    </div>

                                    <div className="pt-2">
                                        <button
                                            onClick={handleConvert}
                                            disabled={isSending}
                                            className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-md transition-all active:scale-95"
                                        >
                                            {isSending ? 'Creando...' : 'Confirmar Turno'}
                                        </button>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* QUOTE MODAL */}
            {isQuoteModalOpen && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
                    <div className="w-full max-w-3xl animate-in fade-in zoom-in duration-200">
                        <QuoteBuilder
                            leadCaseId={leadCase.id}
                            clientPhone={currentClient?.phone || leadCase.client?.phone}
                            onClose={() => {
                                setIsQuoteModalOpen(false);
                                router.refresh();
                            }}
                        />
                    </div>
                </div>
            )}

        </div>
    );
}
