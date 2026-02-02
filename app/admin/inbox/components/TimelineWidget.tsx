'use client';

import { CaseLog, LogChannel, User } from '@prisma/client';
import { addCaseLog } from '@/app/actions/inbox';
import { useState, useRef, useEffect } from 'react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface TimelineLog extends CaseLog {
    authorUser?: { name: string | null, username: string };
}

export default function TimelineWidget({ logs, caseId, userId }: { logs: TimelineLog[], caseId: string, userId: number }) {
    const [newMessage, setNewMessage] = useState('');
    const [channel, setChannel] = useState<LogChannel>('INTERNAL_NOTE');
    const [isSending, setIsSending] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);

    const handleSend = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newMessage.trim()) return;

        setIsSending(true);
        await addCaseLog(caseId, userId, newMessage, channel);
        setNewMessage('');
        setIsSending(false);
    };

    // Auto scroll to bottom? relying on flex-col-reverse or similar usually better, but manual scroll ok
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [logs.length]);

    return (
        <div className="flex flex-col h-[600px] bg-white rounded-lg shadow border">
            <div className="p-4 border-b flex justify-between items-center bg-gray-50 rounded-t-lg">
                <h3 className="font-bold text-slate-700">Timeline / Actividad</h3>
                <span className="text-xs text-slate-500">{logs.length} registros</span>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50" ref={scrollRef}>
                {logs.length === 0 && <p className="text-center text-gray-400 text-sm py-10">No hay actividad registrada</p>}

                {logs.map((log) => (
                    <div key={log.id} className={`flex flex-col ${log.channel === 'INTERNAL_NOTE' ? 'items-end' : 'items-start'}`}>
                        <div className={`max-w-[85%] rounded-lg p-3 text-sm shadow-sm ${log.channel === 'INTERNAL_NOTE' ? 'bg-yellow-50 border border-yellow-200 text-slate-800' :
                            log.channel === 'WHATSAPP' ? 'bg-green-100 border border-green-200 text-slate-800' :
                                'bg-white border text-slate-700'
                            }`}>
                            <div className="flex justify-between items-center gap-4 mb-1 border-b border-black/5 pb-1">
                                <span className="font-bold text-xs uppercase tracking-wider opacity-70">
                                    {log.channel === 'INTERNAL_NOTE' ? 'Nota Interna' : log.channel}
                                </span>
                                <span className="text-[10px] opacity-60 ml-2">
                                    {format(log.createdAt, 'dd/MM HH:mm', { locale: es })}
                                </span>
                            </div>
                            <p className="whitespace-pre-wrap">{log.message}</p>
                            <div className="mt-1 text-[10px] text-right opacity-50">
                                {log.authorUser?.username || 'Sistema'}
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            <form onSubmit={handleSend} className="p-3 bg-white border-t rounded-b-lg">
                <div className="flex gap-2 mb-2">
                    <button
                        type="button"
                        onClick={() => setChannel('INTERNAL_NOTE')}
                        className={`text-xs px-2 py-1 rounded-full border ${channel === 'INTERNAL_NOTE' ? 'bg-yellow-100 border-yellow-300 text-yellow-800' : 'bg-gray-50'}`}
                    >
                        Nota Interna
                    </button>
                    <button
                        type="button"
                        onClick={() => setChannel('WHATSAPP')}
                        className={`text-xs px-2 py-1 rounded-full border ${channel === 'WHATSAPP' ? 'bg-green-100 border-green-300 text-green-800' : 'bg-gray-50'}`}
                    >
                        Log WhatsApp
                    </button>
                    <button
                        type="button"
                        onClick={() => setChannel('CALL')}
                        className={`text-xs px-2 py-1 rounded-full border ${channel === 'CALL' ? 'bg-blue-100 border-blue-300 text-blue-800' : 'bg-gray-50'}`}
                    >
                        Llamada
                    </button>
                </div>
                <div className="flex gap-2">
                    <textarea
                        value={newMessage}
                        onChange={e => setNewMessage(e.target.value)}
                        placeholder={channel === 'INTERNAL_NOTE' ? "Escribí una nota interna..." : "Pegá el mensaje o resumen..."}
                        className="flex-1 border rounded p-2 text-sm focus:ring-2 ring-blue-500 outline-none resize-none h-14"
                        onKeyDown={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                                e.preventDefault();
                                handleSend(e);
                            }
                        }}
                    />
                    <button
                        type="submit"
                        disabled={isSending || !newMessage.trim()}
                        className="px-4 bg-slate-800 text-white rounded hover:bg-slate-700 disabled:opacity-50 text-sm font-medium"
                    >
                        Enviar
                    </button>
                </div>
            </form>
        </div>
    );
}
