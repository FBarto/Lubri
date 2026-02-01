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
        const phone = notif.clientPhone.replace(/[^0-9]/g, '');
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
                <div className="absolute right-0 mt-4 w-96 glass-dark rounded-3xl shadow-2xl p-6 z-50 animate-scale-in border border-white/5 ring-1 ring-black/5">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="text-white font-black text-xl flex items-center gap-2 italic uppercase">
                            Notificaciones
                            <span className="bg-red-600 text-[10px] px-2 py-0.5 rounded-full uppercase tracking-wider not-italic">Activas</span>
                        </h3>
                        <button onClick={() => setIsOpen(false)} className="text-slate-400 hover:text-white">
                            <X size={20} />
                        </button>
                    </div>

                    <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                        {loading ? (
                            <div className="p-8 text-center text-slate-400">Cargando...</div>
                        ) : count === 0 ? (
                            <div className="p-8 text-center text-slate-400 font-medium">No hay notificaciones pendientes ✨</div>
                        ) : (
                            notifications.map(notif => (
                                <div key={notif.id} className="bg-white/5 hover:bg-white/10 p-4 rounded-2xl border border-white/5 transition-all group">
                                    <div className="flex items-start gap-4">
                                        <div className={`p-3 rounded-xl ${notif.type === 'READY' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-indigo-500/20 text-indigo-400'}`}>
                                            {notif.type === 'READY' ? <CheckCircle2 size={20} /> : <Calendar size={20} />}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-white font-bold text-sm truncate">{notif.title}</p>
                                            <p className="text-slate-400 text-xs leading-relaxed mt-1">{notif.message}</p>

                                            <button
                                                onClick={() => sendWhatsApp(notif)}
                                                className="mt-4 w-full py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-colors"
                                            >
                                                <MessageCircle size={14} />
                                                Notificar a {notif.clientName.split(' ')[0]}
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
