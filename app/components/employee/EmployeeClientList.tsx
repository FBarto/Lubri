'use client';

import { useState, useEffect } from 'react';
import { Search, User, Phone, Car, ChevronRight, History } from 'lucide-react';

interface Client {
    id: number;
    name: string;
    phone: string;
    vehicles: {
        id: number;
        plate: string;
        brand: string | null;
        model: string | null;
    }[];
}

export default function EmployeeClientList() {
    const [searchTerm, setSearchTerm] = useState('');
    const [clients, setClients] = useState<Client[]>([]);
    const [loading, setLoading] = useState(false);
    const [selectedClient, setSelectedClient] = useState<Client | null>(null);

    useEffect(() => {
        const timer = setTimeout(() => {
            if (searchTerm.length > 2) {
                fetchClients();
            } else if (searchTerm.length === 0) {
                setClients([]);
            }
        }, 300);

        return () => clearTimeout(timer);
    }, [searchTerm]);

    const fetchClients = async () => {
        setLoading(true);
        try {
            const res = await fetch(`/api/clients?search=${searchTerm}&limit=10`);
            const data = await res.json();
            setClients(data.data || []);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="h-full flex flex-col bg-slate-50">
            {/* Search Header */}
            <div className="p-6 bg-white border-b border-slate-200 shadow-sm">
                <div className="max-w-2xl mx-auto">
                    <h2 className="text-xl font-black text-slate-800 mb-4">Buscador de Clientes</h2>
                    <div className="relative">
                        <Search className="absolute left-4 top-3.5 text-slate-400 w-5 h-5" />
                        <input
                            type="text"
                            placeholder="Buscar por nombre, teléfono o patente..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-12 pr-4 py-3 bg-slate-100 border-0 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all text-slate-800 font-medium"
                        />
                        {loading && (
                            <div className="absolute right-4 top-3.5 animate-spin rounded-full h-5 w-5 border-b-2 border-indigo-600" />
                        )}
                    </div>
                </div>
            </div>

            {/* Results */}
            <div className="flex-1 overflow-y-auto p-6">
                <div className="max-w-2xl mx-auto space-y-4">
                    {clients.length === 0 && !loading && searchTerm.length > 2 && (
                        <div className="text-center py-12 bg-white rounded-3xl border border-dashed border-slate-200 text-slate-400">
                            No se encontraron clientes para "{searchTerm}"
                        </div>
                    )}

                    {searchTerm.length <= 2 && (
                        <div className="text-center py-12 text-slate-400 italic">
                            Ingresa al menos 3 caracteres para buscar...
                        </div>
                    )}

                    {clients.map((client) => (
                        <div key={client.id} className="bg-white rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-md transition-all overflow-hidden group">
                            <div className="p-6">
                                <div className="flex justify-between items-start mb-4">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center font-black text-lg">
                                            {client.name[0].toUpperCase()}
                                        </div>
                                        <div>
                                            <h3 className="font-black text-slate-800 text-lg leading-tight">{client.name}</h3>
                                            <div className="flex items-center gap-2 text-slate-400 text-sm font-bold">
                                                <Phone size={14} />
                                                <span>{client.phone}</span>
                                            </div>
                                        </div>
                                    </div>
                                    <a
                                        href={`https://wa.me/${client.phone.replace(/\D/g, '')}`}
                                        target="_blank"
                                        className="p-2 bg-green-50 text-green-600 rounded-xl hover:bg-green-100 transition-colors"
                                    >
                                        <Phone size={20} />
                                    </a>
                                </div>

                                <div className="space-y-2">
                                    <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Vehículos Registrados</div>
                                    <div className="flex flex-wrap gap-2">
                                        {client.vehicles.map((v) => (
                                            <div key={v.id} className="bg-slate-50 border border-slate-100 px-3 py-2 rounded-xl flex items-center gap-2">
                                                <Car size={14} className="text-slate-400" />
                                                <span className="font-mono font-black text-slate-700 text-xs tracking-wider uppercase">{v.plate}</span>
                                                <span className="text-[10px] text-slate-400 font-bold">{v.brand} {v.model}</span>
                                            </div>
                                        ))}
                                        {client.vehicles.length === 0 && (
                                            <div className="text-xs text-slate-400 italic pl-1">Sin vehículos registrados</div>
                                        )}
                                    </div>
                                </div>

                                <div className="mt-6 flex gap-2">
                                    <button
                                        onClick={() => {/* TODO: Show history modal */ }}
                                        className="flex-1 bg-slate-900 text-white py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 hover:bg-black transition-colors"
                                    >
                                        <History size={16} />
                                        Ver Historial
                                    </button>
                                    <button
                                        onClick={() => {
                                            // TODO: Start Quick Quote or Job for this client
                                        }}
                                        className="flex-1 bg-indigo-600 text-white py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 hover:bg-indigo-700 transition-colors"
                                    >
                                        <ChevronRight size={16} />
                                        Gestionar
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
