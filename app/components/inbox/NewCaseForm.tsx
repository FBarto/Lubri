'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createLeadCase } from '../../lib/inbox-actions';
import { Loader2, Sparkles } from 'lucide-react';
import { parseLeadIntake } from '../../lib/gemini';

export default function NewCaseForm({ currentUserId }: { currentUserId: number }) {
    const [summary, setSummary] = useState('');
    const [category, setCategory] = useState('TYRES');
    const [type, setType] = useState('APPOINTMENT');
    const [rawText, setRawText] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const router = useRouter();

    const handleAIAnalyze = async () => {
        if (!rawText.trim()) return;
        setIsAnalyzing(true);
        try {
            const res = await parseLeadIntake(rawText);
            if (res.success && res.data) {
                if (res.data.summary) setSummary(res.data.summary);
            } else {
                // If it's a quota error, we show a friendly message
                if (res.error?.includes('429')) {
                    alert('La IA está un poco ocupada (límite de cuota). Por favor, intenta de nuevo en unos segundos.');
                } else {
                    alert('No se pudo analizar el mensaje. Intenta escribir el título manualmente.');
                }
            }
        } catch (e) {
            console.error(e);
            alert('Error técnico al conectar con la IA.');
        } finally {
            setIsAnalyzing(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!summary.trim()) return;

        setIsSubmitting(true);
        const res = await createLeadCase({
            summary,
            type: type as any,
            serviceCategory: category as any,
            authorUserId: currentUserId,
            rawText
        });

        if (res.success && res.data) {
            router.push(`/admin/inbox/${res.data.id}`);
        } else {
            alert('Error al crear caso');
            setIsSubmitting(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200 max-w-2xl mx-auto">
            <h2 className="text-2xl font-bold mb-6 text-slate-800">Nuevo Caso</h2>

            <div className="space-y-6">
                <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">Resumen / Título</label>
                    <input
                        type="text"
                        value={summary}
                        onChange={e => setSummary(e.target.value)}
                        placeholder="Ej: Cambio de aceite Gol Trend"
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 outline-none font-medium"
                        autoFocus
                    />
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-2">Categoría</label>
                        <select
                            value={category}
                            onChange={e => setCategory(e.target.value)}
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 outline-none"
                        >
                            <option value="TYRES">Neumáticos</option>
                            <option value="BATTERY">Batería</option>
                            <option value="OIL_SERVICE">Aceite y Filtros</option>
                            <option value="OTHER">Otro</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-2">Tipo</label>
                        <select
                            value={type}
                            onChange={e => setType(e.target.value)}
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 outline-none"
                        >
                            <option value="APPOINTMENT">Turno</option>
                            <option value="QUOTE">Presupuesto</option>
                        </select>
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">Mensaje del Cliente (WhatsApp/Chat)</label>
                    <div className="relative">
                        <textarea
                            value={rawText}
                            onChange={e => setRawText(e.target.value)}
                            placeholder="Pega aquí el mensaje tal cual lo recibiste..."
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-violet-500 outline-none font-medium h-32 resize-none pr-12"
                        />
                        {rawText.length > 10 && (
                            <button
                                type="button"
                                onClick={handleAIAnalyze}
                                disabled={isAnalyzing}
                                className="absolute top-3 right-3 p-2 bg-violet-100 text-violet-700 rounded-lg hover:bg-violet-200 transition-all shadow-sm group"
                                title="Autocompletar Título"
                            >
                                <Sparkles className={`w-4 h-4 ${isAnalyzing ? 'animate-spin' : 'group-hover:scale-110 transition-transform'}`} />
                            </button>
                        )}
                    </div>
                    <p className="text-[10px] text-slate-400 mt-1 italic">
                        Si pegas el texto, podrás usar la **IA de Gemini** para autocompletar el checklist en el siguiente paso.
                    </p>
                </div>

                <button
                    type="submit"
                    disabled={!summary || isSubmitting}
                    className="w-full bg-blue-600 text-white font-bold py-4 rounded-xl shadow-lg hover:bg-blue-700 active:scale-95 transition-all disabled:opacity-50 disabled:active:scale-100 flex justify-center items-center gap-2"
                >
                    {isSubmitting ? (
                        <>
                            <Loader2 className="w-5 h-5 animate-spin" />
                            Creando...
                        </>
                    ) : (
                        'Crear Caso'
                    )}
                </button>
            </div>
        </form>
    );
}
