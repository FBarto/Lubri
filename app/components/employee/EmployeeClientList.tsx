'use client';

import { useState, useEffect } from 'react';
import { Search, User, Phone, Car, ChevronRight, History, Plus, FilePlus } from 'lucide-react';
import Plate from '../ui/Plate';
import CreateClientModal from './CreateClientModal';
import PostClientActionModal from './PostClientActionModal';
import CreateVehicleModal from './CreateVehicleModal';
import ClientHistoryModal from './ClientHistoryModal';
import LegacyServiceModal from '../clients/LegacyServiceModal';

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

interface EmployeeClientListProps {
    onClientAction?: (client: any, action: 'SERVICE' | 'POS' | 'QUOTE') => void;
}

export default function EmployeeClientList({ onClientAction }: EmployeeClientListProps) {
    const [searchTerm, setSearchTerm] = useState('');
    const [clients, setClients] = useState<Client[]>([]);
    const [loading, setLoading] = useState(false);

    // Flow State
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);
    const [isVehicleModalOpen, setIsVehicleModalOpen] = useState(false);
    const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false); // New
    const [isManageModalOpen, setIsManageModalOpen] = useState(false); // New

    const [createdClient, setCreatedClient] = useState<Client | null>(null);
    const [selectedClient, setSelectedClient] = useState<Client | null>(null); // New
    const [legacyVehicle, setLegacyVehicle] = useState<any>(null); // Track vehicle for legacy modal

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

    const handleClientCreated = (client: any) => {
        setIsCreateModalOpen(false);
        setCreatedClient(client);
        // Auto-flow: Open Vehicle Modal immediately for new clients
        setIsVehicleModalOpen(true);

        // Add to list and maybe select it
        setClients(prev => [client, ...prev]);
    };

    const handlePostAction = (action: 'SERVICE' | 'SALE' | 'VEHICLE', targetClient: Client | null = null) => {
        setIsSuccessModalOpen(false);
        setIsManageModalOpen(false);

        // If targetClient is passed, ensure it is set as 'createdClient' for vehicle modal context if needed, 
        // OR update vehicle logic to take targetClient.
        // For simplicity, let's update `createdClient` to `targetClient` effectively "selecting" it for downstream actions like Vehicle Modal.
        if (targetClient) setCreatedClient(targetClient);

        const clientToUse = targetClient || createdClient;

        if (action === 'VEHICLE') {
            setIsVehicleModalOpen(true);
        } else if (action === 'SERVICE') {
            onClientAction?.(clientToUse, 'SERVICE');
        } else if (action === 'SALE') {
            onClientAction?.(clientToUse, 'POS');
        }
    };

    const handleVehicleCreated = (vehicle: any) => {
        setIsVehicleModalOpen(false);
        // Auto-flow: Vehicle created, automatically start SERVICE flow
        // We find the client and pass it up
        const client = clients.find(c => c.id === vehicle.clientId);
        if (client || createdClient) {
            const clientToUse = client || createdClient;
            // We need to attach the new vehicle to it locally so the service wizard sees it
            const updatedClient = {
                ...clientToUse,
                vehicles: [...(clientToUse?.vehicles || []), vehicle]
            };
            onClientAction?.(updatedClient, 'SERVICE');
        }

        // Update the list locally
        setClients(prev => prev.map(c => {
            if (c.id === vehicle.clientId) {
                return {
                    ...c,
                    vehicles: [...(c.vehicles || []), vehicle]
                };
            }
            return c;
        }));
    };

    return (
        <div className="h-full flex flex-col bg-slate-50 relative">
            {/* Search Header */}
            <div className="p-6 bg-white border-b border-slate-200 shadow-sm flex flex-col gap-4">
                <div className="max-w-2xl mx-auto w-full flex justify-between items-center">
                    <h2 className="text-xl font-black text-slate-800">Buscador de Clientes</h2>
                    <button
                        onClick={() => setIsCreateModalOpen(true)}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl font-bold text-sm flex items-center gap-2 shadow-lg shadow-indigo-200 active:scale-95 transition-all"
                    >
                        <Plus size={18} strokeWidth={3} />
                        Nuevo Cliente
                    </button>
                </div>

                <div className="max-w-2xl mx-auto w-full relative">
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

            {/* Results */}
            <div className="flex-1 overflow-y-auto p-6">
                {/* Results Grid */}
                <div className="space-y-4">
                    {clients.map((client) => (
                        <div key={client.id} className="bg-white rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-md transition-all overflow-hidden group">
                            <div className="p-6">
                                <div className="flex justify-between items-start mb-6">
                                    <div className="flex items-center gap-4">
                                        <div className="w-14 h-14 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center font-black text-xl shadow-inner border border-indigo-100">
                                            {client.name[0].toUpperCase()}
                                        </div>
                                        <div>
                                            <h3 className="font-black text-slate-800 text-lg leading-tight mb-1">{client.name}</h3>
                                            <div className="flex items-center gap-3">
                                                <div className="flex items-center gap-1.5 px-2.5 py-1 bg-slate-100 rounded-lg text-slate-500 text-xs font-bold">
                                                    <Phone size={12} strokeWidth={2.5} />
                                                    <span>{client.phone}</span>
                                                </div>
                                                <a
                                                    href={`https://wa.me/${client.phone.replace(/\D/g, '')}`}
                                                    target="_blank"
                                                    className="text-green-500 hover:text-green-600 transition-colors p-1"
                                                    title="Abrir WhatsApp"
                                                >
                                                    <Phone size={16} strokeWidth={3} />
                                                </a>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-3 mb-6">
                                    <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Flota / Vehículos</div>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                        {client.vehicles?.map((v) => (
                                            <div key={v.id} className="bg-slate-50 border border-slate-100 p-3 rounded-2xl flex items-center gap-3 group/vehicle hover:border-indigo-200 transition-colors relative overflow-hidden">

                                                {/* Plate Component */}
                                                <Plate plate={v.plate} size="md" />

                                                <div className="font-bold text-slate-700 text-sm truncate">{v.brand} {v.model}</div>

                                                {/* Status & Actions - Stacked for mobile, Row for desktop */}
                                                <div className="flex flex-col gap-2 mt-2">
                                                    <span className="flex items-center gap-1 text-[10px] uppercase font-bold text-emerald-600 bg-emerald-100 px-2 py-0.5 rounded-full w-fit">
                                                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                                        Al día
                                                    </span>

                                                    <button
                                                        onClick={() => setLegacyVehicle(v)}
                                                        className="text-[10px] font-bold text-white bg-amber-500 hover:bg-amber-600 px-3 py-1.5 rounded-lg flex items-center justify-center gap-2 transition-all shadow-sm w-full"
                                                        title="Cargar Histórico (Ficha Vieja)"
                                                    >
                                                        <History size={12} strokeWidth={3} /> Historial
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                        {(!client.vehicles || client.vehicles.length === 0) && (
                                            <div className="col-span-full py-4 border-2 border-dashed border-slate-200 rounded-2xl text-center">
                                                <p className="text-xs text-slate-400 font-bold mb-2">Sin vehículos registrados</p>
                                                <button
                                                    onClick={() => {
                                                        setCreatedClient(client);
                                                        setIsVehicleModalOpen(true);
                                                    }}
                                                    className="text-xs text-indigo-600 font-bold hover:underline"
                                                >
                                                    + Agregar Vehículo
                                                </button>
                                            </div>
                                        )}
                                        {/* Hidden Portal Generator specific for Test - Can be made official feature */}
                                        <div className="hidden">
                                            {/* Helper for the agent to inject functionality */}
                                        </div>
                                    </div>
                                </div>

                                <div className="flex gap-3 pt-4 border-t border-slate-50">
                                    <button
                                        onClick={() => {
                                            setSelectedClient(client);
                                            setIsHistoryModalOpen(true);
                                        }}
                                        className="flex-1 bg-slate-900 text-white py-3.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2 hover:bg-black transition-all shadow-lg shadow-slate-200"
                                    >
                                        <History size={16} strokeWidth={2.5} />
                                        Ver Historial
                                    </button>

                                    <div className="w-px bg-slate-200 my-1" />

                                    <button
                                        onClick={() => onClientAction?.(client, 'QUOTE')}
                                        className="px-4 bg-orange-50 text-orange-600 rounded-xl hover:bg-orange-100 transition-colors"
                                        title="Generar Presupuesto"
                                    >
                                        <FilePlus size={20} strokeWidth={2.5} />
                                    </button>
                                    <button
                                        onClick={() => {
                                            setSelectedClient(client);
                                            setIsManageModalOpen(true);
                                        }}
                                        className="px-4 bg-indigo-50 text-indigo-600 rounded-xl hover:bg-indigo-100 transition-colors"
                                        title="Gestionar"
                                    >
                                        <ChevronRight size={20} strokeWidth={2.5} />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Modals */}
            <CreateClientModal
                isOpen={isCreateModalOpen}
                onClose={() => setIsCreateModalOpen(false)}
                onSuccess={handleClientCreated}
            />

            {/* Modal for Newly Created Client (Success Mode) */}
            <PostClientActionModal
                isOpen={isSuccessModalOpen}
                clientName={createdClient?.name || ''}
                onClose={() => setIsSuccessModalOpen(false)}
                onAction={(action) => handlePostAction(action, createdClient)}
                mode="CREATED"
            />

            {/* Modal for Existing Client (Manage Mode) */}
            <PostClientActionModal
                isOpen={isManageModalOpen}
                clientName={selectedClient?.name || ''}
                onClose={() => setIsManageModalOpen(false)}
                onAction={(action) => handlePostAction(action, selectedClient)}
                mode="MANAGE"
            />

            <ClientHistoryModal
                isOpen={isHistoryModalOpen}
                client={selectedClient}
                onClose={() => setIsHistoryModalOpen(false)}
            />

            <CreateVehicleModal
                isOpen={isVehicleModalOpen}
                clientId={createdClient?.id || null}
                clientName={createdClient?.name}
                onClose={() => setIsVehicleModalOpen(false)}
                onSuccess={handleVehicleCreated}
            />

            {legacyVehicle && (
                <LegacyServiceModal
                    vehicleId={legacyVehicle.id}
                    clientId={selectedClient?.id || createdClient?.id || 0}
                    onClose={() => setLegacyVehicle(null)}
                    onSuccess={() => {
                        setLegacyVehicle(null);
                        alert('Historial actualizado correctamente');
                    }}
                />
            )}

        </div >
    );
}
