'use client';

import { useState, useEffect, useRef } from 'react';
import { Bell, Check, X } from 'lucide-react';
import { getUnreadNotifications, markNotificationRead, checkSlaStatus, checkReminders } from '../../lib/notification-actions';
import { useRouter } from 'next/navigation';

export default function NotificationsWidget({ userId }: { userId: number }) {
    const [notifications, setNotifications] = useState<any[]>([]);
    const [isOpen, setIsOpen] = useState(false);
    const [loading, setLoading] = useState(true);
    const wrapperRef = useRef<HTMLDivElement>(null);
    const router = useRouter();

    const fetchNotes = async () => {
        const res = await getUnreadNotifications(userId);
        if (res.success && res.data) {
            setNotifications(res.data);
            setLoading(false);
        }
    };

    // Run inputs
    useEffect(() => {
        // Initial Fetch
        fetchNotes();

        // Run Checks (Simulate Cron)
        checkSlaStatus();
        checkReminders();

        // Poll every 60s
        const interval = setInterval(() => {
            fetchNotes(); // Fetch list
            // Also run checks periodically? Maybe every 5 mins.
            // For now, checks run only on mount/refresh to save DB hits.
        }, 60000);

        return () => clearInterval(interval);
    }, []);

    // Close on click outside
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [wrapperRef]);

    const handleMarkRead = async (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        await markNotificationRead(id);
        setNotifications(prev => prev.filter(n => n.id !== id));
    };

    const handleItemClick = async (n: any) => {
        await markNotificationRead(n.id);
        setIsOpen(false);
        // Navigate based on type?
        if (n.leadCaseId) {
            router.push(`/admin/inbox/${n.leadCaseId}`);
        }
    };

    return (
        <div className="relative" ref={wrapperRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="relative p-2 text-slate-500 hover:text-blue-600 hover:bg-slate-100 rounded-lg transition-all"
            >
                <Bell className="w-6 h-6" />
                {notifications.length > 0 && (
                    <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-[10px] font-bold flex items-center justify-center rounded-full animate-pulse shadow-sm">
                        {notifications.length}
                    </span>
                )}
            </button>

            {isOpen && (
                <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-xl border border-slate-100 z-50 animate-in fade-in slide-in-from-top-2 overflow-hidden">
                    <div className="p-3 border-b border-slate-50 flex justify-between items-center bg-slate-50/50">
                        <span className="font-bold text-xs text-slate-500 uppercase tracking-wider">Notificaciones</span>
                        {notifications.length > 0 && (
                            <button onClick={() => notifications.forEach(n => markNotificationRead(n.id).then(fetchNotes))} className="text-[10px] text-blue-500 font-bold hover:underline">
                                Marcar todo
                            </button>
                        )}
                    </div>

                    <div className="max-h-80 overflow-y-auto">
                        {loading ? (
                            <div className="p-4 text-center text-xs text-slate-400">Cargando...</div>
                        ) : notifications.length === 0 ? (
                            <div className="p-8 text-center flex flex-col items-center gap-2 text-slate-400">
                                <Bell className="w-8 h-8 opacity-20" />
                                <span className="text-xs">Sin novedades</span>
                            </div>
                        ) : (
                            <div>
                                {notifications.map(n => (
                                    <div
                                        key={n.id}
                                        onClick={() => handleItemClick(n)}
                                        className="p-3 border-b border-slate-50 hover:bg-blue-50/50 cursor-pointer transition-colors flex gap-3 group relative"
                                    >
                                        <div className={`w-2 h-2 mt-1.5 rounded-full shrink-0 ${n.type === 'SLA_DUE' ? 'bg-red-500' : 'bg-blue-500'
                                            }`} />
                                        <div className="flex-1">
                                            <p className="text-sm text-slate-700 font-medium leading-tight mb-1">{n.message}</p>
                                            <p className="text-[10px] text-slate-400">
                                                {new Date(n.createdAt).toLocaleString()}
                                            </p>
                                        </div>
                                        <button
                                            onClick={(e) => handleMarkRead(n.id, e)}
                                            className="absolute right-2 top-2 p-1 text-slate-300 hover:text-slate-500 opacity-0 group-hover:opacity-100 transition-opacity"
                                        >
                                            <Check className="w-3 h-3" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
