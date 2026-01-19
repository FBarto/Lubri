'use client';

import { ServiceCategory } from '@prisma/client';
import { useState } from 'react';

const QA_TEMPLATES = {
    TYRES: [
        "¿Me pasás la medida exacta? (ej: 175/70R13)",
        "¿Cuántas cubiertas necesitás?",
        "¿Es para hoy o puede esperar?",
        "¿Es auxilio? ¿Dónde estás ahora?",
        "¿Tenés alguna marca en mente o vemos opciones?"
    ],
    BATTERY: [
        "¿Qué auto es? Marca, modelo y año",
        "¿La batería vieja la entregás para reciclaje?",
        "¿La instalación sería en el local o a domicilio?",
        "¿Arranca algo o está totalmente descargada?",
        "¿Es para ahora o durante el día?"
    ],
    OIL_SERVICE: [
        "¿Qué aceite usás o querés el recomendado?",
        "¿Sabés el kilometraje aproximado?",
        "¿Preferís venir a la mañana o a la tarde?",
        "¿Querés revisar algo más además del service?",
        "¿Necesitás factura?"
    ],
    GENERIC: [
        "¿Me confirmás patente así lo asociamos?",
        "¿Cómo preferís pagar?",
        "¿Te parece bien que te llamemos para coordinar?"
    ]
};

export default function QuickReplies({ category }: { category: ServiceCategory }) {
    const [copied, setCopied] = useState<string | null>(null);

    const questions = [
        ...(QA_TEMPLATES[category as keyof typeof QA_TEMPLATES] || []),
        ...QA_TEMPLATES.GENERIC
    ];

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        setCopied(text);
        setTimeout(() => setCopied(null), 2000);
    };

    return (
        <div className="bg-white p-4 rounded-lg shadow border mb-4">
            <h3 className="text-sm font-bold text-slate-700 mb-2 uppercase tracking-wide">Respuestas Rápidas</h3>
            <div className="flex flex-wrap gap-2">
                {questions.map((q, i) => (
                    <button
                        key={i}
                        onClick={() => copyToClipboard(q)}
                        className={`text-xs text-left px-3 py-2 rounded-lg border transition-all ${copied === q
                                ? 'bg-green-100 border-green-300 text-green-800'
                                : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100 hover:border-slate-300'
                            }`}
                    >
                        {copied === q ? '¡Copiado!' : q}
                    </button>
                ))}
            </div>
        </div>
    );
}
