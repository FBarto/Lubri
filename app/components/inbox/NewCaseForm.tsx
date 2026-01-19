'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createLeadCase } from '../../lib/inbox-actions';
import { Loader2 } from 'lucide-react';

export default function NewCaseForm({ currentUserId }: { currentUserId: number }) {
    const [summary, setSummary] = useState('');
    const [category, setCategory] = useState('TYRES');
    const [type, setType] = useState('APPOINTMENT');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const router = useRouter();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!summary.trim()) return;

        setIsSubmitting(true);
        const res = await createLeadCase({
            summary,
            type: type as any,
            serviceCategory: category as any,
            authorUserId: currentUserId,
            rawText: ''
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
