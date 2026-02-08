'use client';

import { useState, useEffect } from 'react';
import { Bell, MessageCircle, CheckCircle2, Calendar, Clock, X } from 'lucide-react';

interface Notification {
    id: string;
    type: 'READY' | 'REMINDER';
    title: string;
    message: string;
    clientName: string;
    clientPhone: string;
    data: any;
}

export default function NotificationCenter() {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [loading, setLoading] = useState(true);
    const [isOpen, setIsOpen] = useState(false);

    const fetchNotifications = async () => {
        try {
            const res = await fetch('/api/notifications/pending');
            const data = await res.json();
            setNotifications(data.notifications || []);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchNotifications();
    }, []);

    const sendWhatsApp = (notif: Notification) => {
        let phone = notif.clientPhone.replace(/[^0-9]/g, '');
        // Argentina heuristic
        if (!phone.startsWith('54')) {
            phone = '549' + phone;
        }
        let text = '';

        if (notif.type === 'READY') {
            text = `¡Hola ${notif.clientName}! 👋 Tu ${notif.data.model} (${notif.data.plate}) ya está listo en el Lubricentro. Podés pasar a retirarlo cuando quieras.`;
        } else {
            text = `¡Hola ${notif.clientName}! 👋 Te recordamos que a tu ${notif.data.model} (${notif.data.plate}) le toca el service pronto. ¿Querés que te reservemos un turno?`;
        }

        window.open(`https://wa.me/${phone}?text=${encodeURIComponent(text)}`, '_blank');
    };

    const count = notifications.length;

    return (
        <div className="relative">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="relative p-3 bg-white rounded-2xl shadow-sm hover:shadow-md transition-all text-slate-600 hover:text-indigo-600 border border-slate-100"
            >
                <Bell size={24} />
                {count > 0 && (
                    <span className="absolute top-0 right-0 transform translate-x-1/3 -translate-y-1/3 bg-red-600 text-white text-[10px] font-bold h-5 w-5 rounded-full flex items-center justify-center border-2 border-white">
                        {count}
                    </span>
                )}
            </button>

            {isOpen && (
                <div className="absolute right-0 mt-4 w-96 glass-dark rounded-[2.5rem] shadow-2xl p-8 z-50 animate-scale-in border border-white/10 ring-1 ring-white/10 overflow-hidden">
                    {/* Background glow */}
                    <div className="absolute top-0 right-0 w-32 h-32 bg-red-600/10 blur-3xl rounded-full -translate-y-1/2 translate-x-1/2"></div>

                    <div className="flex justify-between items-center mb-6 relative z-10">
                        <h3 className="text-white font-black text-xl flex items-center gap-2 italic uppercase">
                            Notificaciones
                            <span className="bg-red-600/20 text-red-500 text-[10px] px-2 py-0.5 rounded-full border border-red-500/30 uppercase tracking-wider not-italic">Activas</span>
                        </h3>
                        <button onClick={() => setIsOpen(false)} className="w-8 h-8 flex items-center justify-center rounded-full bg-white/5 text-slate-400 hover:text-white hover:bg-white/10 transition-all">
                            <X size={18} />
                        </button>
                    </div>

                    <div className="space-y-4 max-h-[450px] overflow-y-auto pr-2 custom-scrollbar relative z-10">
                        {loading ? (
                            <div className="p-8 text-center text-slate-400 animate-pulse">Consultando el servidor...</div>
                        ) : count === 0 ? (
                            <div className="p-12 text-center">
                                <div className="w-16 h-16 bg-white/5 rounded-3xl flex items-center justify-center mx-auto mb-4 text-slate-500">
                                    <Bell size={32} opacity={0.2} />
                                </div>
                                <p className="text-slate-400 font-bold italic tracking-tight">Todo bajo control. No hay pendientes por ahora ✨</p>
                            </div>
                        ) : (
                            notifications.map(notif => (
                                <div key={notif.id} className="bg-white/5 hover:bg-white/10 p-5 rounded-3xl border border-white/5 transition-all group relative overflow-hidden">
                                    <div className="flex items-start gap-4">
                                        <div className={`p-3 rounded-2xl shadow-lg ${notif.type === 'READY' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'}`}>
                                            {notif.type === 'READY' ? <CheckCircle2 size={24} /> : <Calendar size={24} />}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex justify-between items-start mb-1">
                                                <p className="text-white font-black text-sm uppercase tracking-tight">{notif.title}</p>
                                                <span className="text-[9px] text-slate-500 font-bold uppercase tracking-widest">{notif.type === 'READY' ? 'Vehículo Listo' : 'Recordatorio'}</span>
                                            </div>
                                            <p className="text-slate-400 text-xs leading-relaxed font-medium">{notif.message}</p>

                                            <button
                                                onClick={() => sendWhatsApp(notif)}
                                                className="mt-4 w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-2xl text-[11px] font-black uppercase tracking-wider flex items-center justify-center gap-2 transition-all shadow-lg shadow-emerald-900/40 active:scale-95"
                                            >
                                                <MessageCircle size={16} fill="currentColor" className="opacity-20 translate-x-1" />
                                                Notificar a {notif.clientName.split(' ')[0]}
                                            </button>
                                        </div>
                                    </div>
                                    {/* Item decorative line */}
                                    <div className={`absolute left-0 top-1/4 bottom-1/4 w-1 rounded-r-full ${notif.type === 'READY' ? 'bg-emerald-500' : 'bg-red-500'} opacity-30 group-hover:opacity-100 transition-opacity`}></div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
