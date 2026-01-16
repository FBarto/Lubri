'use client';

import { useState, useEffect } from 'react';
import { MessageSquare, Clock, CheckCircle, XCircle, RefreshCw, Smartphone } from 'lucide-react';

interface WhatsAppMessage {
    id: number;
    phone: string;
    template: string;
    status: string;
    scheduledAt: string;
    sentAt: string | null;
    error: string | null;
    appointment: {
        client: { name: string };
        date: string;
    };
}

export default function AdminWhatsAppPage() {
    const [messages, setMessages] = useState<WhatsAppMessage[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [processing, setProcessing] = useState(false);

    const fetchMessages = async () => {
        try {
            setError(null);
            const res = await fetch('/api/admin/whatsapp');
            const data = await res.json();
            if (Array.isArray(data)) {
                setMessages(data);
            } else if (data.error) {
                setError(data.error);
                setMessages([]);
            } else {
                setMessages([]);
            }
        } catch (err: any) {
            console.error(err);
            setError('Error de conexión con la API');
            setMessages([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchMessages();
    }, []);

    const handleSync = async () => {
        setProcessing(true);
        try {
            const res = await fetch('/api/admin/whatsapp/sync', { method: 'POST' });
            if (res.ok) {
                fetchMessages();
            }
        } catch (err) {
            console.error(err);
        } finally {
            setProcessing(false);
        }
    };

    return (
        <div className="fade-in space-y-8">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-extrabold text-slate-800 flex items-center gap-3">
                        <MessageSquare className="text-emerald-500" /> Monitor WhatsApp
                    </h1>
                    <p className="text-slate-500">Estado de las notificaciones automáticas y recordatorios</p>
                </div>
                <button
                    onClick={handleSync}
                    disabled={processing}
                    className="bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white px-6 py-3 rounded-2xl font-bold transition-all shadow-lg hover:shadow-emerald-200 active:scale-95 flex items-center gap-2"
                >
                    <RefreshCw className={processing ? 'animate-spin' : ''} size={20} />
                    Procesar Pendientes
                </button>
            </div>

            {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-2xl flex items-center gap-3 font-bold animate-pulse">
                    <XCircle size={20} />
                    <span>Error: {error}</span>
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm flex items-center gap-4">
                    <div className="bg-amber-100 p-3 rounded-2xl text-amber-600"><Clock size={24} /></div>
                    <div>
                        <p className="text-sm text-slate-500 font-bold uppercase tracking-wider">Pendientes</p>
                        <p className="text-3xl font-black text-slate-800">{messages.filter(m => m.status === 'PENDING').length}</p>
                    </div>
                </div>
                <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm flex items-center gap-4">
                    <div className="bg-emerald-100 p-3 rounded-2xl text-emerald-600"><CheckCircle size={24} /></div>
                    <div>
                        <p className="text-sm text-slate-500 font-bold uppercase tracking-wider">Enviados</p>
                        <p className="text-3xl font-black text-slate-800">{messages.filter(m => m.status === 'SENT').length}</p>
                    </div>
                </div>
                <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm flex items-center gap-4">
                    <div className="bg-red-100 p-3 rounded-2xl text-red-600"><XCircle size={24} /></div>
                    <div>
                        <p className="text-sm text-slate-500 font-bold uppercase tracking-wider">Fallidos</p>
                        <p className="text-3xl font-black text-slate-800">{messages.filter(m => m.status === 'FAILED').length}</p>
                    </div>
                </div>
            </div>

            <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
                <table className="w-full text-left">
                    <thead className="bg-slate-50 border-b border-slate-100">
                        <tr>
                            <th className="px-6 py-4 font-semibold text-slate-600">Cliente / Turno</th>
                            <th className="px-6 py-4 font-semibold text-slate-600">Template</th>
                            <th className="px-6 py-4 font-semibold text-slate-600">Programado</th>
                            <th className="px-6 py-4 font-semibold text-slate-600">Estado</th>
                            <th className="px-6 py-4 font-semibold text-slate-600">Destinatario</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                        {loading ? (
                            <tr><td colSpan={5} className="p-20 text-center text-slate-400">Cargando mensajes...</td></tr>
                        ) : messages.length > 0 ? (
                            messages.map((msg) => (
                                <tr key={msg.id} className="hover:bg-slate-50/50 transition-colors">
                                    <td className="px-6 py-5">
                                        <div className="font-bold text-slate-800">{msg.appointment.client.name}</div>
                                        <div className="text-xs text-slate-400">
                                            Turno: {new Date(msg.appointment.date).toLocaleString('es-AR', { dateStyle: 'short', timeStyle: 'short' })}
                                        </div>
                                    </td>
                                    <td className="px-6 py-5">
                                        <span className="text-xs font-mono bg-slate-100 px-2 py-1 rounded text-slate-600">
                                            {msg.template}
                                        </span>
                                    </td>
                                    <td className="px-6 py-5 text-sm text-slate-500">
                                        {new Date(msg.scheduledAt).toLocaleString('es-AR', { dateStyle: 'short', timeStyle: 'short' })}
                                    </td>
                                    <td className="px-6 py-5">
                                        {msg.status === 'PENDING' ? (
                                            <span className="flex items-center gap-1.5 text-amber-600 font-bold text-xs uppercase">
                                                <Clock size={14} /> Pendiente
                                            </span>
                                        ) : msg.status === 'SENT' ? (
                                            <span className="flex items-center gap-1.5 text-emerald-600 font-bold text-xs uppercase">
                                                <CheckCircle size={14} /> Enviado
                                            </span>
                                        ) : (
                                            <span className="flex items-center gap-1.5 text-red-600 font-bold text-xs uppercase" title={msg.error || ''}>
                                                <XCircle size={14} /> Fallido
                                            </span>
                                        )}
                                    </td>
                                    <td className="px-6 py-5">
                                        <div className="flex items-center gap-2 text-slate-700 font-medium">
                                            <Smartphone size={14} className="text-slate-400" />
                                            {msg.phone}
                                        </div>
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan={5} className="p-20 text-center text-slate-300 italic">No hay mensajes registrados</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
