'use client';
import { useEffect, useState } from 'react';

interface Service {
    id: number;
    name: string;
    description?: string;
    price: number;
    duration: number;
    category?: string;
}

interface StepServiceProps {
    onSelect: (service: Service) => void;
    selectedId?: number;
}

export default function StepService({ onSelect, selectedId }: StepServiceProps) {
    const [services, setServices] = useState<Service[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch('/api/services')
            .then(res => res.json())
            .then(data => setServices(data))
            .catch(console.error)
            .finally(() => setLoading(false));
    }, []);

    if (loading) return <div className="p-8 text-center text-slate-400 font-bold animate-pulse">Cargando servicios...</div>;

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <h2 className="text-2xl font-black text-slate-800 mb-6 text-center">
                ¿Qué servicio necesitas?
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {services.map((service) => (
                    <button
                        key={service.id}
                        onClick={() => onSelect(service)}
                        className={`group relative p-6 rounded-2xl border-2 text-left transition-all active:scale-[0.98]
                            ${selectedId === service.id
                                ? 'border-slate-900 bg-slate-900 text-white shadow-xl scale-[1.02]'
                                : 'border-slate-200 bg-white hover:border-blue-400 hover:shadow-lg'
                            }
                        `}
                    >
                        <div className="flex justify-between items-start mb-2">
                            <span className={`text-[0.6rem] font-black uppercase tracking-wider px-2 py-1 rounded-full ${selectedId === service.id ? 'bg-white/20 text-white' : 'bg-blue-100 text-blue-700'}`}>
                                {service.category || 'SERVICIO'}
                            </span>
                            <span className={`font-bold ${selectedId === service.id ? 'text-slate-300' : 'text-slate-400'}`}>
                                {service.duration} min
                            </span>
                        </div>

                        <h3 className={`text-xl font-black mb-1 ${selectedId === service.id ? 'text-white' : 'text-slate-800'}`}>
                            {service.name}
                        </h3>

                        <div className={`text-lg font-bold mt-4 ${selectedId === service.id ? 'text-blue-300' : 'text-blue-600'}`}>
                            ${service.price.toLocaleString()}
                        </div>

                        {/* Checkmark for selected */}
                        {selectedId === service.id && (
                            <div className="absolute top-4 right-4 bg-white text-slate-900 rounded-full p-1 shadow-sm">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                </svg>
                            </div>
                        )}
                    </button>
                ))}
            </div>
        </div>
    );
}
