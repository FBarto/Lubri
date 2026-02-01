'use client';

import { useState, useEffect } from 'react';
import ServiceModal from '@/app/components/pos/ServiceModal';
import { Wrench, Zap, Truck, Lightbulb, Bike } from 'lucide-react';
import { useSession } from 'next-auth/react';
import { createWorkOrder } from '../../lib/business-actions';

interface ServicesWizardProps {
    onAddService: (item: any) => void;
    initialClient?: any;
}

export default function ServicesWizard({ onAddService, initialClient }: ServicesWizardProps) {
    const { data: session } = useSession();
    const [services, setServices] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedService, setSelectedService] = useState<any>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [processing, setProcessing] = useState(false);
    const [selectedCategory, setSelectedCategory] = useState<string>('GOMERIA'); // Default to Gomeria as it's the newest addition

    useEffect(() => {
        fetch('/api/services')
            .then(res => res.json())
            .then(data => {
                setServices(data || []);
                setLoading(false);
            })
            .catch(err => {
                console.error(err);
                setLoading(false);
            });
    }, []);

    const handleServiceClick = (service: any) => {
        // Determine rules based on service name
        const isGomeria = service.name.toLowerCase().includes('gomería') || service.name.toLowerCase().includes('gomeria');
        const isLampara = service.name.toLowerCase().includes('lámpara') || service.name.toLowerCase().includes('lampara');
        const optionalClient = isGomeria || isLampara;

        setSelectedService({ ...service, optionalClient });
        setIsModalOpen(true);
    };

    const handleConfirm = async (data: any) => {
        setProcessing(true);
        try {
            // 1. Create Work Order in Backend
            const woResult = await createWorkOrder({
                clientId: Number(data.clientId),
                vehicleId: Number(data.vehicleId),
                serviceId: Number(selectedService.id),
                userId: session?.user?.id ? Number(session.user.id) : undefined,
                mileage: data.mileage ? Number(data.mileage) : undefined,
                notes: data.notes,
                price: Number(selectedService.price),
                serviceDetails: data.serviceDetails, // From ServiceModal (Wizard)
                attachments: data.attachments
            });

            if (!woResult.success) {
                alert('Error al crear Orden de Trabajo: ' + woResult.error);
                setProcessing(false);
                return;
            }

            const woId = woResult.success ? woResult.workOrder?.id : undefined;

            // 2. Add to Cart (via Parent)
            onAddService({
                type: 'SERVICE',
                id: selectedService.id,
                name: selectedService.name,
                price: selectedService.price,
                workOrderId: woId,
                clientId: data.clientId,
                vehicleId: data.vehicleId,
                notes: data.notes // Pass notes to cart item too
            });

            setIsModalOpen(false);
            // alert('Servicio agregado al carrito'); // Optional feedback
        } catch (e) {
            console.error(e);
            alert('Error al procesar servicio');
        } finally {
            setProcessing(false);
        }
    };

    // const [selectedCategory, setSelectedCategory] = useState<string>('GOMERIA'); // Moved to top

    // Categories Configuration
    const SERVICE_CATEGORIES = [
        { id: 'LUBRICENTRO', label: 'Lubricentro', icon: <Wrench size={24} /> },
        { id: 'GOMERIA', label: 'Gomería', icon: <div className="font-black text-lg">O</div> },
        { id: 'BATERIA', label: 'Batería', icon: <Zap size={24} /> },
        { id: 'AUXILIO', label: 'Auxilio', icon: <Truck size={24} /> },
        { id: 'LAMPARA', label: 'Lámparas', icon: <Lightbulb size={24} /> },
        { id: 'OTROS', label: 'Otros', icon: <Bike size={24} /> }
    ];

    const filteredServices = services.filter(service => {
        const n = service.name.toLowerCase();
        const cat = service.category?.toUpperCase() || '';

        switch (selectedCategory) {
            case 'GOMERIA':
                return cat === 'GOMERIA' || n.includes('parche') || n.includes('balanceo') || n.includes('rotacion') || n.includes('arme') || n.includes('pico') || n.includes('gomeria');
            case 'BATERIA':
                return n.includes('bateria') || n.includes('batería');
            case 'AUXILIO':
                return n.includes('auxilio') || n.includes('remolque');
            case 'LAMPARA':
                return n.includes('lampara') || n.includes('lámpara') || n.includes('foco') || n.includes('luces');
            case 'LUBRICENTRO':
                return n.includes('aceite') || n.includes('filtro') || n.includes('service') || n.includes('grasa') || n.includes('fluido');
            case 'OTROS':
                // Everything else not caught above? Or explicitly specific ones?
                // Let's make "Otros" catch meaningful remainders or specific "Otros"
                return !n.includes('parche') && !n.includes('balanceo') && !n.includes('bateria') && !n.includes('auxilio') && !n.includes('lampara') && !n.includes('aceite') && cat !== 'GOMERIA';
            default:
                return true;
        }
    });

    if (loading) return <div className="p-8 text-center text-slate-500">Cargando servicios...</div>;

    return (
        <div className="p-6 h-full overflow-y-auto flex flex-col">
            <h2 className="text-2xl font-bold text-slate-800 mb-6 flex items-center gap-3 shrink-0">
                <Wrench className="w-8 h-8 text-slate-400" />
                Catálogo de Servicios
            </h2>

            {/* Category Selector */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-6 shrink-0">
                {SERVICE_CATEGORIES.map(cat => (
                    <button
                        key={cat.id}
                        onClick={() => setSelectedCategory(cat.id)}
                        className={`flex flex-col items-center justify-center gap-2 p-3 rounded-xl border-2 transition-all ${selectedCategory === cat.id ? 'border-slate-900 bg-slate-900 text-white shadow-lg' : 'border-slate-200 bg-white text-slate-500 hover:border-slate-300 hover:bg-slate-50'}`}
                    >
                        <div className={`${selectedCategory === cat.id ? 'text-white' : 'text-slate-400'}`}>
                            {cat.icon}
                        </div>
                        <span className="font-bold text-xs uppercase tracking-wider">{cat.label}</span>
                    </button>
                ))}
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 pb-8">
                {filteredServices.map(service => (
                    <button
                        key={service.id}
                        onClick={() => handleServiceClick(service)}
                        disabled={processing}
                        className={`relative flex flex-col items-center justify-center p-6 bg-white border-2 rounded-2xl transition-all group text-center h-48 disabled:opacity-50 animate-in fade-in zoom-in-95 duration-200 ${service.name.toLowerCase().includes('pack') || service.name.toLowerCase().includes('full')
                            ? 'border-amber-400 shadow-[0_0_20px_rgba(251,191,36,0.2)] hover:shadow-amber-400/40 hover:scale-[1.02]'
                            : 'border-slate-200 hover:border-blue-500 hover:shadow-lg'
                            }`}
                    >
                        {(service.name.toLowerCase().includes('pack') || service.name.toLowerCase().includes('full')) && (
                            <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-amber-400 text-white text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full shadow-lg">
                                Recomendado
                            </div>
                        )}
                        <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-4 transition-colors ${service.name.toLowerCase().includes('pack') ? 'bg-amber-100 text-amber-600 group-hover:bg-amber-500 group-hover:text-white' : 'bg-blue-50 text-blue-600 group-hover:bg-blue-100'
                            }`}>
                            {service.name.toLowerCase().includes('moto') ? <Bike size={32} /> :
                                service.name.toLowerCase().includes('gomería') || service.name.toLowerCase().includes('parche') ? <div className="font-black text-2xl">O</div> :
                                    service.name.toLowerCase().includes('lámpara') ? <Lightbulb size={32} /> :
                                        service.name.toLowerCase().includes('auxilio') ? <Truck size={32} /> :
                                            service.name.toLowerCase().includes('bateria') ? <Zap size={32} /> :
                                                <Wrench size={32} />
                            }
                        </div>
                        <h3 className="font-bold text-slate-800 text-lg leading-tight group-hover:text-blue-600 line-clamp-2">
                            {service.name}
                        </h3>
                        <p className="font-bold text-slate-400 mt-2">${service.price}</p>
                    </button>
                ))}
            </div>

            <ServiceModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onConfirm={handleConfirm}
                service={selectedService}
                initialClient={initialClient}
            />
        </div>
    );
}
