
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
        <div className="bg-gradient-to-br from-indigo-600 to-purple-700 rounded-3xl p-6 text-white shadow-xl mb-8 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-10">
                <Sparkles size={120} />
            </div>

            <h3 className="text-xl font-bold mb-4 flex items-center gap-2 relative z-10">
                <Sparkles className="text-yellow-300" />
                Oportunidades Predictivas
                <span className="bg-white/20 px-2 py-0.5 rounded-full text-xs font-medium">
                    {opportunities.length}
                </span>
                <button
                    onClick={handleRefresh}
                    disabled={refreshing}
                    className={`ml-auto p-2 bg-white/10 rounded-full hover:bg-white/20 transition-all ${refreshing ? 'animate-spin' : ''}`}
                    title="Actualizar análisis"
                >
                    <RefreshCw size={16} />
                </button>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 relative z-10">
                {opportunities.slice(0, 6).map(opp => (
                    <div key={opp.id} className="bg-white/10 backdrop-blur-md rounded-xl p-4 border border-white/10 hover:bg-white/20 transition-all flex flex-col justify-between">
                        <div>
                            <div className="flex justify-between items-start mb-2">
                                <span className="font-bold text-lg">{opp.clientName}</span>
                                {opp.daysUntil < 0 ? (
                                    <span className="text-xs bg-red-500/80 px-2 py-1 rounded font-bold">Vencido</span>
                                ) : (
                                    <span className="text-xs bg-emerald-500/80 px-2 py-1 rounded font-bold">en {opp.daysUntil} días</span>
                                )}
                            </div>
                            <p className="text-sm text-indigo-100 mb-1">{opp.model} • {opp.plate}</p>
                            <div className="flex items-center gap-1 text-xs text-indigo-200 mb-3">
                                <Calendar size={12} />
                                Predicción: {new Date(opp.predictedDate).toLocaleDateString()}
                            </div>
                        </div>

                        <button
                            onClick={() => sendWhatsapp(opp)}
                            className="w-full py-2 bg-green-500 hover:bg-green-600 rounded-lg font-bold text-sm flex items-center justify-center gap-2 transition-colors shadow-lg shadow-green-900/20"
                        >
                            <MessageCircle size={16} />
                            Contactar por WhatsApp
                        </button>
                    </div>
                ))}
            </div>

            {opportunities.length > 6 && (
                <div className="mt-4 text-center relative z-10">
                    <button className="text-sm text-indigo-200 hover:text-white font-medium">
                        Ver {opportunities.length - 6} más...
                    </button>
                </div>
            )}
        </div>
    );
}
