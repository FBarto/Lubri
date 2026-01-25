'use client';

import { useEffect, useState, use } from 'react';
import { useRouter } from 'next/navigation';
import { getClientProfile } from '../../../lib/client-actions';
import MaintenanceGrid from '../../../components/clients/MaintenanceGrid';
import { ArrowLeft, User, Phone, Car, History, ShoppingBag, Calendar, Wrench, ChevronRight, DollarSign } from 'lucide-react';



export default function ClientProfilePage({ params }: { params: Promise<{ id: string }> }) {
    const { id: idParam } = use(params); // Unwrap params
    const [client, setClient] = useState<any>(null);
    const [activeTab, setActiveTab] = useState<'TIMELINE' | 'VEHICLES' | 'INFO'>('TIMELINE');
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        async function loadClient() {
            setLoading(true);
            const id = Number(idParam);

            if (!id || isNaN(id)) {
                setLoading(false);
                return;
            }

            const res = await getClientProfile(id);
            if (res.success) {
                setClient(res.data);
            }
            setLoading(false);
        }
        loadClient();
    }, [idParam]);
    if (res.success) {
        setClient(res.data);
    }
    setLoading(false);
}
loadClient();
    }, [params.id]);

if (loading) return <div className="p-8 text-center text-slate-500 font-bold">Cargando perfil...</div>;
if (!client) return <div className="p-8 text-center text-slate-500 font-bold">Cliente no encontrado.</div>;

const formatCurrency = (val: number) => new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(val);

return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
        {/* Header */}
        <div className="bg-white border-b border-slate-200 sticky top-0 z-10 px-6 py-4 flex items-center gap-4 shadow-sm">
            <button onClick={() => router.back()} className="p-2 hover:bg-slate-100 rounded-full text-slate-500 transition-colors">
                <ArrowLeft size={20} />
            </button>
            <div className="flex-1">
                <h1 className="text-xl font-black text-slate-900 leading-none">{client.name}</h1>
                <div className="flex items-center gap-2 text-sm text-slate-500 mt-1">
                    <Phone size={14} />
                    <span>{client.phone}</span>
                    <span className="text-slate-300">|</span>
                    <span className="text-xs uppercase font-bold bg-slate-100 px-2 py-0.5 rounded text-slate-600">ID: {client.id}</span>
                </div>
            </div>
            <div className="text-right hidden md:block">
                <p className="text-xs font-bold text-slate-400 uppercase">Valor de Vida</p>
                <p className="text-lg font-black text-emerald-600">{formatCurrency(client.lifetimeValue)}</p>
            </div>
        </div>

        {/* Tabs */}
        <div className="px-6 pt-6 pb-2">
            <div className="flex gap-2 border-b border-slate-200">
                <button
                    onClick={() => setActiveTab('TIMELINE')}
                    className={`px-4 py-2 font-bold text-sm border-b-2 transition-all flex items-center gap-2 ${activeTab === 'TIMELINE' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
                >
                    <History size={16} /> Historial
                </button>
                <button
                    onClick={() => setActiveTab('VEHICLES')}
                    className={`px-4 py-2 font-bold text-sm border-b-2 transition-all flex items-center gap-2 ${activeTab === 'VEHICLES' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
                >
                    <Car size={16} /> Vehículos ({client.vehicles.length})
                </button>
                <button
                    onClick={() => setActiveTab('INFO')}
                    className={`px-4 py-2 font-bold text-sm border-b-2 transition-all flex items-center gap-2 ${activeTab === 'INFO' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
                >
                    <User size={16} /> Datos
                </button>
            </div>
        </div>

        {/* Content */}
        <div className="flex-1 p-6 overflow-y-auto w-full max-w-4xl mx-auto">

            {/* TIMELINE TAB */}
            {activeTab === 'TIMELINE' && (
                <div className="space-y-6">
                    {client.history.length === 0 ? (
                        <div className="text-center py-10 text-slate-400">Sin historial registrado.</div>
                    ) : (
                        <div className="relative border-l-2 border-slate-200 ml-3 space-y-8 pb-8">
                            {client.history.map((item: any) => (
                                <div key={`${item.type}-${item.id}`} className="relative pl-8 group">
                                    {/* Icon Dot */}
                                    <div className={`absolute -left-[9px] top-0 w-5 h-5 rounded-full border-2 border-white shadow-sm flex items-center justify-center
                                            ${item.type === 'SALE' ? 'bg-amber-500' : item.type === 'WORK_ORDER' ? 'bg-blue-600' : 'bg-emerald-500'}
                                        `}>
                                        {item.type === 'SALE' && <ShoppingBag size={10} className="text-white" />}
                                        {item.type === 'WORK_ORDER' && <Wrench size={10} className="text-white" />}
                                        {item.type === 'APPOINTMENT' && <Calendar size={10} className="text-white" />}
                                    </div>

                                    {/* Card */}
                                    <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 hover:shadow-md transition-shadow cursor-pointer">
                                        <div className="flex justify-between items-start mb-2">
                                            <div>
                                                <p className="text-xs font-bold text-slate-400 uppercase mb-1">
                                                    {new Date(item.date).toLocaleDateString()} · {new Date(item.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </p>
                                                <h3 className="font-bold text-slate-800 text-lg flex items-center gap-2">
                                                    {item.description}
                                                </h3>
                                                {item.vehicle && <p className="text-sm text-slate-500 flex items-center gap-1 mt-1"><Car size={12} /> {item.vehicle}</p>}
                                            </div>
                                            {item.total !== undefined && (
                                                <div className="text-right">
                                                    <span className="block font-black text-slate-900">{formatCurrency(item.total || 0)}</span>
                                                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded uppercase
                                                            ${item.status === 'COMPLETED' || item.status === 'DELIVERED' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}
                                                        `}>
                                                        {item.status}
                                                    </span>
                                                </div>
                                            )}
                                        </div>

                                        {/* Action / Detail Link hint */}
                                        <div className="mt-3 pt-3 border-t border-slate-100 flex justify-end">
                                            <button className="text-xs font-bold text-blue-600 flex items-center gap-1 hover:underline">
                                                Ver Detalle <ChevronRight size={12} />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* VEHICLES TAB */}
            {activeTab === 'VEHICLES' && (
                <div className="space-y-4">
                    {client.vehicles.map((v: any) => (
                        <div key={v.id} className="bg-white p-5 rounded-xl shadow-sm border border-slate-200 transition-all">
                            <div className="flex justify-between items-center mb-4">
                                <div>
                                    <h3 className="font-black text-xl text-slate-800 uppercase flex items-center gap-2">
                                        {v.plate}
                                        <span className="text-xs font-bold px-2 py-0.5 bg-slate-100 text-slate-500 rounded">{v.year || 'N/A'}</span>
                                    </h3>
                                    <p className="text-slate-500 font-medium">{v.brand} {v.model}</p>
                                </div>
                                <div className="bg-slate-50 p-3 rounded-full text-slate-400">
                                    <Car size={24} />
                                </div>
                            </div>

                            <div className="border-t border-slate-100 pt-3">
                                <MaintenanceGrid vehicleId={v.id} />
                            </div>
                        </div>
                    ))}
                    <button className="w-full border-2 border-dashed border-slate-300 rounded-xl p-6 flex flex-col items-center justify-center text-slate-400 hover:border-blue-400 hover:text-blue-500 hover:bg-blue-50 transition-all font-bold gap-2">
                        <Car size={24} />
                        + Agregar Vehículo
                    </button>
                </div>
            )}

            {/* INFO TAB */}
            {activeTab === 'INFO' && (
                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Nombre Completo</label>
                            <p className="text-lg font-medium text-slate-800">{client.name}</p>
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Teléfono</label>
                            <p className="text-lg font-medium text-slate-800">{client.phone}</p>
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Fecha de Registro</label>
                            <p className="text-lg font-medium text-slate-800">{new Date(client.createdAt).toLocaleDateString()}</p>
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-400 uppercase mb-1">ID Legado</label>
                            <p className="text-lg font-medium text-slate-800">{client.legacyId || '---'}</p>
                        </div>
                    </div>
                </div>
            )}

        </div>
    </div>
);
}
