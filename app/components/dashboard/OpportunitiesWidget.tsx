
'use client';

import { useState, useEffect } from 'react';
import { Sparkles, Calendar, MessageCircle, AlertTriangle, RefreshCw } from 'lucide-react';

interface Opportunity {
    id: number;
    plate: string;
    model: string;
    clientName: string;
    clientPhone: string;
    predictedDate: string;
    daysUntil: number;
    confidence: 'HIGH' | 'LOW';
}

export default function OpportunitiesWidget() {
    const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const fetchOpps = async () => {
        try {
            setLoading(true);
            const res = await fetch('/api/dashboard/opportunities');
            if (res.ok) {
                const data = await res.json();
                setOpportunities(data.opportunities || []);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchOpps();
    }, []);

    const handleRefresh = async () => {
        setRefreshing(true);
        try {
            await fetch('/api/dashboard/opportunities/refresh', { method: 'POST' });
            await fetchOpps();
        } catch (e) {
            console.error(e);
        } finally {
            setRefreshing(false);
        }
    };

    const sendWhatsapp = (opp: Opportunity) => {
        if (!opp.clientPhone) return alert('Cliente sin teléfono');

        let message = `Hola ${opp.clientName}! 👋 desde Lubri.\n\n`;
        message += `Vimos que tu ${opp.model} (${opp.plate}) ya estaría para el próximo service. `;
        message += `Calculamos que te toca cerca del ${new Date(opp.predictedDate).toLocaleDateString()}.\n\n`;
        message += `¿Querés reservar un turno?`;

        const url = `https://wa.me/${opp.clientPhone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(message)}`;
        window.open(url, '_blank');
    };

    if (loading) return <div className="h-48 bg-white rounded-2xl animate-pulse" />;

    if (opportunities.length === 0) return null; // Hide if empty

    return (
        <div className="bg-neutral-900 rounded-[2.5rem] p-8 text-white shadow-2xl mb-8 relative overflow-hidden border border-white/5">
            {/* Animated background element */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-red-600/10 blur-[100px] rounded-full -translate-y-1/2 translate-x-1/2 animate-pulse"></div>

            <div className="flex justify-between items-center mb-8 relative z-10">
                <h3 className="text-2xl font-black flex items-center gap-3 italic uppercase tracking-tighter">
                    <Sparkles className="text-red-500" size={28} />
                    <span>Oportunidades Predictivas</span>
                    <span className="bg-red-600/20 text-red-500 text-xs px-3 py-1 rounded-full border border-red-500/30 not-italic">
                        {opportunities.length} detectadas
                    </span>
                </h3>
                <button
                    onClick={handleRefresh}
                    disabled={refreshing}
                    className={`p-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl transition-all ${refreshing ? 'animate-spin' : 'hover:rotate-180'}`}
                    title="Recalcular con IA"
                >
                    <RefreshCw size={20} />
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 relative z-10">
                {opportunities.slice(0, 6).map(opp => (
                    <div key={opp.id} className="glass-dark hover:bg-white/10 rounded-[2rem] p-6 border border-white/5 hover:border-red-500/30 transition-all group flex flex-col justify-between">
                        <div>
                            <div className="flex justify-between items-start mb-4">
                                <div className="p-3 bg-red-500/10 text-red-500 rounded-2xl group-hover:bg-red-500 group-hover:text-white transition-all">
                                    <Sparkles size={20} />
                                </div>
                                {opp.daysUntil < 0 ? (
                                    <span className="text-[10px] font-black bg-red-600/20 text-red-500 border border-red-600/30 px-3 py-1 rounded-full uppercase tracking-widest">Vencido {Math.abs(opp.daysUntil)}d</span>
                                ) : (
                                    <span className="text-[10px] font-black bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-3 py-1 rounded-full uppercase tracking-widest">en {opp.daysUntil} días</span>
                                )}
                            </div>

                            <h4 className="font-black text-xl mb-1 truncate group-hover:text-red-500 transition-colors uppercase tracking-tight">{opp.clientName}</h4>
                            <p className="text-xs text-slate-400 font-bold mb-4 uppercase tracking-[0.1em]">{opp.model} • <span className="text-slate-300">{opp.plate}</span></p>

                            <div className="flex items-center gap-2 text-[10px] text-slate-500 font-black uppercase tracking-widest mb-6">
                                <Calendar size={14} className="text-red-500" />
                                Predicción: {new Date(opp.predictedDate).toLocaleDateString()}
                            </div>
                        </div>

                        <button
                            onClick={() => sendWhatsapp(opp)}
                            className="w-full py-4 bg-emerald-600 hover:bg-emerald-500 active:scale-95 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 transition-all shadow-lg shadow-emerald-950/40"
                        >
                            <MessageCircle size={18} fill="currentColor" className="opacity-20" />
                            Contactar por WhatsApp
                        </button>
                    </div>
                ))}
            </div>

            {opportunities.length > 6 && (
                <div className="mt-8 text-center relative z-10">
                    <button className="px-8 py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-full text-xs font-black uppercase tracking-widest text-slate-400 hover:text-white transition-all">
                        Ver {opportunities.length - 6} oportunidades adicionales
                    </button>
                </div>
            )}
        </div>
    );
}
