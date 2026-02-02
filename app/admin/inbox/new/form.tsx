'use client';

import { useState } from 'react';
import { createLeadCase } from '@/app/actions/inbox';
import { useRouter } from 'next/navigation';
import { ServiceCategory, CaseType } from '@prisma/client';

export default function CreateCaseForm({ userId }: { userId: number }) {
    const router = useRouter();
    const [loading, setLoading] = useState(false);

    // State
    const [summary, setSummary] = useState('');
    const [category, setCategory] = useState<ServiceCategory>('OTHER');
    const [type, setType] = useState<CaseType>('QUOTE');
    const [source, setSource] = useState('');
    const [error, setError] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        const res = await createLeadCase({
            summary,
            serviceCategory: category,
            type,
            authorUserId: userId,
            source
        });

        if (res.success && res.caseId) {
            router.push(`/admin/inbox/${res.caseId}`);
        } else {
            setError(res.error || 'Error desconocido');
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6 max-w-lg bg-white p-6 rounded-lg shadow border">
            {error && <div className="bg-red-50 text-red-600 p-3 rounded">{error}</div>}

            <div>
                <label className="block text-sm font-medium mb-1">Resumen del Pedido</label>
                <input
                    type="text"
                    required
                    value={summary}
                    onChange={e => setSummary(e.target.value)}
                    className="w-full border p-2 rounded focus:ring-2 ring-blue-500 outline-none"
                    placeholder="Ej: Cambio de aceite Gol Trend"
                />
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium mb-1">Categoría</label>
                    <select
                        className="w-full border p-2 rounded"
                        value={category}
                        onChange={e => setCategory(e.target.value as ServiceCategory)}
                    >
                        <option value="TYRES">Neumáticos</option>
                        <option value="BATTERY">Baterías</option>
                        <option value="OIL_SERVICE">Lubricentro</option>
                        <option value="OTHER">Otros</option>
                    </select>
                </div>
                <div>
                    <label className="block text-sm font-medium mb-1">Tipo</label>
                    <select
                        className="w-full border p-2 rounded"
                        value={type}
                        onChange={e => setType(e.target.value as CaseType)}
                    >
                        <option value="QUOTE">Presupuesto</option>
                        <option value="APPOINTMENT">Solo Turno</option>
                    </select>
                </div>
            </div>

            <div>
                <label className="block text-sm font-medium mb-1"> Texto Original (WhatsApp/Redes)</label>
                <textarea
                    rows={4}
                    value={source}
                    onChange={e => setSource(e.target.value)}
                    className="w-full border p-2 rounded focus:ring-2 ring-blue-500 outline-none"
                    placeholder="Pegar aquí el mensaje del cliente..."
                />
                <p className="text-xs text-gray-500 mt-1">Ayuda a tener contexto rápido.</p>
            </div>

            <div className="flex gap-4 pt-4">
                <button
                    type="button"
                    onClick={() => router.back()}
                    className="flex-1 px-4 py-2 border rounded text-gray-600 hover:bg-gray-50"
                >
                    Cancelar
                </button>
                <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
                >
                    {loading ? 'Creando...' : 'Crear Caso'}
                </button>
            </div>
        </form>
    );
}
