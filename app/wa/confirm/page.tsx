'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';

function ConfirmContent() {
    const searchParams = useSearchParams();
    const token = searchParams.get('token');
    const [status, setStatus] = useState<'loading' | 'success' | 'error'>(token ? 'loading' : 'error');
    const [message, setMessage] = useState(token ? 'Procesando confirmación...' : 'Token inválido o ausente.');

    useEffect(() => {
        if (!token) return;

        fetch('/api/wa/process-token', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ token, action: 'CONFIRM' })
        })
            .then(async res => {
                const data = await res.json();
                if (res.ok) {
                    setStatus('success');
                    setMessage('¡Turno confirmado con éxito! Te esperamos.');
                } else {
                    setStatus('error');
                    setMessage(data.error || 'Error al confirmar el turno.');
                }
            })
            .catch(() => {
                setStatus('error');
                setMessage('Error de conexión.');
            });
    }, [token]);

    return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
            <div className="bg-white p-8 rounded-[2.5rem] shadow-xl max-w-sm w-full text-center space-y-6">
                <div className={`w-20 h-20 mx-auto rounded-full flex items-center justify-center text-4xl shadow-inner
                    ${status === 'success' ? 'bg-emerald-100 text-emerald-600' :
                        status === 'error' ? 'bg-red-100 text-red-600' : 'bg-blue-100 text-blue-600 animate-pulse'}
                `}>
                    {status === 'success' ? '✅' : status === 'error' ? '❌' : '⏳'}
                </div>
                <h1 className="text-2xl font-black text-slate-800">
                    {status === 'success' ? '¡Excelente!' : status === 'error' ? 'Ups...' : 'Cargando'}
                </h1>
                <p className="text-slate-500 font-medium leading-relaxed">
                    {message}
                </p>
                {status === 'success' && token && (
                    <a
                        href={`/portal/${token}`}
                        className="block w-full bg-blue-600 text-white py-4 rounded-2xl font-bold hover:bg-blue-700 transition-all active:scale-95 shadow-lg shadow-blue-200 mb-3"
                    >
                        📖 Ver Mi Libreta Digital
                    </a>
                )}

                {status !== 'loading' && (
                    <button
                        onClick={() => window.close()}
                        className="w-full bg-slate-100 text-slate-500 py-4 rounded-2xl font-bold hover:bg-slate-200 transition-all active:scale-95"
                    >
                        Cerrar Ventana
                    </button>
                )}
            </div>
        </div>
    );
}

export default function WaConfirmPage() {
    return (
        <Suspense fallback={<div>Cargando...</div>}>
            <ConfirmContent />
        </Suspense>
    );
}
