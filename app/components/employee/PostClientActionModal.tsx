'use client';

import {
    X,
    CheckCircle2,
    Wrench,
    ShoppingCart,
    Car,
    ChevronRight
} from 'lucide-react';

interface PostClientActionModalProps {
    isOpen: boolean;
    onClose: () => void;
    clientName: string;
    onAction: (action: 'SERVICE' | 'SALE' | 'VEHICLE') => void;
    mode?: 'CREATED' | 'MANAGE';
}

export default function PostClientActionModal({ isOpen, onClose, clientName, onAction, mode = 'CREATED' }: PostClientActionModalProps) {
    if (!isOpen) return null;

    // Derived mode for "Vehicle Created" context if needed, 
    // but for now we reuse 'CREATED' or add a new prop/logic.
    // Let's assume the parent sets 'mode' or we infer it. 
    // To keep it simple, we'll make the header generic if it's a vehicle flow, 
    // OR we relies on the fact that `handleVehicleCreated` calls `setIsSuccessModalOpen(true)`.
    // We should probably update the props or message.

    const isVehicleContext = mode === 'CREATED' && clientName; // We can infer or add a prop.

    const actions = [
        {
            id: 'SERVICE',
            label: 'Crear Servicio',
            sub: 'Orden de Trabajo',
            icon: <Wrench className="w-6 h-6 text-white" />,
            color: 'bg-blue-600',
            bg: 'bg-blue-50',
            hover: 'hover:border-blue-200 hover:bg-blue-50'
        },
        {
            id: 'SALE',
            label: 'Venta Rápida',
            sub: 'Pasar al POS',
            icon: <ShoppingCart className="w-6 h-6 text-white" />,
            color: 'bg-emerald-600',
            bg: 'bg-emerald-50',
            hover: 'hover:border-emerald-200 hover:bg-emerald-50'
        },
        // Only show "Add Vehicle" if we are managing or if we just finished adding one and want another?
        // Usually if we just added a vehicle, we want to service IT.
        {
            id: 'VEHICLE',
            label: 'Agregar Otro Vehículo',
            sub: 'Vincular Auto/Moto',
            icon: <Car className="w-6 h-6 text-white" />,
            color: 'bg-slate-800',
            bg: 'bg-slate-50',
            hover: 'hover:border-slate-300 hover:bg-slate-100'
        }
    ];

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-[2px] p-4 animate-in fade-in duration-300">
            <div className="bg-white w-full max-w-lg rounded-[2rem] shadow-2xl overflow-hidden scale-in zoom-in-95 duration-200 relative">

                {/* Header based on Mode */}
                {mode === 'CREATED' ? (
                    <div className="bg-emerald-500 p-8 text-center relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
                        <div className="relative z-10 flex flex-col items-center">
                            <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center mb-3 shadow-inner">
                                <CheckCircle2 className="w-10 h-10 text-white" />
                            </div>
                            <h2 className="text-2xl font-black text-white leading-tight">¡Todo Listo!</h2>
                            <p className="text-emerald-100 font-medium mt-1 text-lg">
                                {clientName} y su vehículo están registrados.
                            </p>
                        </div>
                    </div>
                ) : (
                    <div className="bg-slate-900 p-8 text-center relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
                        <div className="relative z-10 flex flex-col items-center">
                            <div className="w-16 h-16 bg-white/10 backdrop-blur-sm rounded-full flex items-center justify-center mb-3 shadow-inner">
                                <Wrench className="w-8 h-8 text-white" />
                            </div>
                            <h2 className="text-xl font-black text-white leading-tight uppercase tracking-wider">Gestión de Cliente</h2>
                            <p className="text-slate-300 font-medium mt-1 text-lg">
                                {clientName}
                            </p>
                        </div>
                    </div>
                )}

                {/* Actions Body */}
                <div className="p-8">
                    <p className="text-center text-slate-500 font-bold mb-6 text-sm uppercase tracking-wide">
                        {mode === 'CREATED' ? '¿Qué querés hacer ahora?' : 'Selecciona una acción'}
                    </p>

                    <div className="space-y-3">
                        {actions.map((action: any) => (
                            <button
                                key={action.id}
                                onClick={() => onAction(action.id)} // This will be passed up to component list then page
                                className={`w-full p-4 rounded-2xl border border-slate-100 transition-all duration-200 flex items-center justify-between group ${action.hover} shadow-sm hover:shadow-md hover:-translate-y-0.5`}
                            >
                                <div className="flex items-center gap-4">
                                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center shadow-lg transform group-hover:scale-110 transition-transform ${action.color}`}>
                                        {action.icon}
                                    </div>
                                    <div className="text-left">
                                        <div className="font-black text-slate-800 text-lg leading-none">{action.label}</div>
                                        <div className="text-slate-400 text-sm font-medium mt-1">{action.sub}</div>
                                    </div>
                                </div>
                                <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center text-slate-300 group-hover:bg-white group-hover:text-slate-600 transition-colors">
                                    <ChevronRight size={18} />
                                </div>
                            </button>
                        ))}
                    </div>

                    <button
                        onClick={onClose}
                        className="w-full mt-6 py-4 text-slate-400 font-bold hover:text-slate-600 transition-colors text-sm"
                    >
                        {mode === 'CREATED' ? 'Nada por ahora, volver al listado' : 'Cancelar'}
                    </button>
                </div>
            </div>
        </div>
    );
}
