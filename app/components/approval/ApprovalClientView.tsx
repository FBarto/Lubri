'use client';

import { useState } from 'react';
import { processApproval } from '../../lib/approval-actions';
import { CheckCircle, XCircle, AlertTriangle, FileText, Calendar } from 'lucide-react';

interface ApprovalData {
    id: number;
    clientName: string;
    vehicle: string;
    serviceName: string;
    price: number;
    items: any[];
    status: string;
    date: string;
}

export default function ApprovalClientView({ data, token }: { data: ApprovalData; token: string }) {
    const [status, setStatus] = useState(data.status);
    const [processing, setProcessing] = useState(false);

    const handleDecision = async (decision: 'APPROVE' | 'REJECT') => {
        if (!confirm(`¿Estás seguro de que deseas ${decision === 'APPROVE' ? 'APROBAR' : 'RECHAZAR'} este presupuesto?`)) return;

        setProcessing(true);
        const res = await processApproval(token, decision);
        setProcessing(false);

        if (res.success) {
            setStatus(decision === 'APPROVE' ? 'APPROVED' : 'REJECTED');
        } else {
            alert('Error al procesar la solicitud: ' + res.error);
        }
    };

    if (status === 'APPROVED') {
        return (
            <div className="flex flex-col items-center justify-center min-h-[50vh] text-center p-6 bg-emerald-50 rounded-3xl border border-emerald-100">
                <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mb-4">
                    <CheckCircle size={48} />
                </div>
                <h2 className="text-2xl font-black text-emerald-800">¡Presupuesto Aprobado!</h2>
                <p className="text-emerald-600 mt-2">Gracias por confiar en nosotros. Procederemos con el trabajo de inmediato.</p>
            </div>
        );
    }

    if (status === 'REJECTED') {
        return (
            <div className="flex flex-col items-center justify-center min-h-[50vh] text-center p-6 bg-red-50 rounded-3xl border border-red-100">
                <div className="w-20 h-20 bg-red-100 text-red-600 rounded-full flex items-center justify-center mb-4">
                    <XCircle size={48} />
                </div>
                <h2 className="text-2xl font-black text-red-800">Presupuesto Rechazado</h2>
                <p className="text-red-600 mt-2">Hemos registrado tu respuesta. Nos pondremos en contacto si hay dudas.</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
                <div className="flex items-center gap-3 mb-4">
                    <div className="bg-slate-100 p-2 rounded-xl text-slate-600">
                        <FileText size={24} />
                    </div>
                    <div>
                        <h2 className="font-bold text-slate-400 text-xs uppercase tracking-wider">PRESUPUESTO #{data.id}</h2>
                        <h1 className="text-2xl font-black text-slate-800">{data.serviceName}</h1>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="bg-slate-50 p-3 rounded-xl">
                        <p className="text-slate-400 text-xs font-bold uppercase mb-1">Vehículo</p>
                        <p className="font-bold text-slate-700 truncate">{data.vehicle}</p>
                    </div>
                    <div className="bg-slate-50 p-3 rounded-xl">
                        <p className="text-slate-400 text-xs font-bold uppercase mb-1">Fecha</p>
                        <p className="font-bold text-slate-700">{new Date(data.date).toLocaleDateString()}</p>
                    </div>
                </div>
            </div>

            {/* Items List */}
            <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
                <h3 className="font-black text-slate-800 text-sm uppercase tracking-wider mb-4 border-b border-slate-50 pb-2">Detalle del Servicio</h3>
                <div className="space-y-3">
                    <div className="flex justify-between items-center text-sm">
                        <span className="text-slate-600 font-medium">{data.serviceName} (Base)</span>
                        <span className="font-bold text-slate-700">${data.items.length > 0 ? (data.price - data.items.reduce((s, i) => s + i.subtotal, 0)).toLocaleString() : data.price.toLocaleString()}</span>
                    </div>
                    {data.items.map((item, idx) => (
                        <div key={idx} className="flex justify-between items-center text-sm py-2 border-t border-slate-50">
                            <div className="flex-1">
                                <span className="font-bold text-slate-800">{item.description}</span>
                                <span className="text-slate-400 text-xs ml-2">x{item.quantity}</span>
                            </div>
                            <span className="font-bold text-slate-700">${item.subtotal.toLocaleString()}</span>
                        </div>
                    ))}
                </div>
            </div>

            {/* Price */}
            <div className="bg-slate-900 text-white p-8 rounded-3xl shadow-xl flex flex-col items-center justify-center text-center">
                <p className="text-slate-400 font-medium mb-1">Monto Total Estimado</p>
                <div className="text-5xl font-black tracking-tight">
                    ${data.price.toLocaleString()}
                </div>
                <p className="text-slate-500 text-sm mt-4 max-w-xs">
                    * Este valor incluye mano de obra y materiales. Sujeto a cambios si se detectan fallas adicionales.
                </p>
            </div>

            {/* Actions */}
            <div className="grid grid-cols-2 gap-4 pt-4">
                <button
                    onClick={() => handleDecision('REJECT')}
                    disabled={processing}
                    className="py-4 rounded-2xl font-bold bg-white text-red-600 border-2 border-slate-100 hover:bg-red-50 hover:border-red-200 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50"
                >
                    Rechazar
                </button>
                <button
                    onClick={() => handleDecision('APPROVE')}
                    disabled={processing}
                    className="py-4 rounded-2xl font-bold bg-emerald-500 text-white hover:bg-emerald-600 hover:scale-[1.02] active:scale-95 shadow-lg shadow-emerald-200 transition-all disabled:opacity-50"
                >
                    {processing ? 'Procesando...' : 'APROBAR TRABAJO'}
                </button>
            </div>

            <p className="text-center text-xs text-slate-400 pt-4">
                Al aprobar, aceptas nuestros términos y condiciones de servicio.
            </p>
        </div>
    );
}
