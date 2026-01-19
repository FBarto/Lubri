'use client';

import { useState, useEffect } from 'react';
import { Client, Vehicle } from '@prisma/client';
import {
    searchClients,
    searchVehicles,
    linkClientToCase,
    linkVehicleToCase,
    createAndLinkClient,
    createAndLinkVehicle,
    unlinkClient,
    unlinkVehicle
} from '@/app/lib/actions/client-vehicle-actions';
import { User, Car, Search, Plus, X, Check, Phone, Tag } from 'lucide-react';

export default function LinkClientVehicleWidget({
    caseId,
    linkedClient,
    linkedVehicle
}: {
    caseId: string,
    linkedClient: Client | null,
    linkedVehicle: Vehicle | null
}) {
    // Mode: 'VIEW' | 'SEARCH_CLIENT' | 'SEARCH_VEHICLE' | 'CREATE_CLIENT' | 'CREATE_VEHICLE'
    const [mode, setMode] = useState<'VIEW' | 'SEARCH_CLIENT' | 'SEARCH_VEHICLE' | 'CREATE_CLIENT' | 'CREATE_VEHICLE'>('VIEW');

    // Search
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    // Create New
    const [newName, setNewName] = useState('');
    const [newPhone, setNewPhone] = useState('');
    const [newPlate, setNewPlate] = useState('');
    const [newBrand, setNewBrand] = useState('');
    const [newModel, setNewModel] = useState('');

    // Search logic
    useEffect(() => {
        const timer = setTimeout(async () => {
            if (query.length > 1) {
                setIsLoading(true);
                if (mode === 'SEARCH_CLIENT') {
                    const res = await searchClients(query);
                    setResults(res);
                } else if (mode === 'SEARCH_VEHICLE') {
                    const res = await searchVehicles(query);
                    setResults(res);
                }
                setIsLoading(false);
            } else {
                setResults([]);
            }
        }, 300);
        return () => clearTimeout(timer);
    }, [query, mode]);

    // Handlers
    const handleLinkClient = async (client: Client) => {
        await linkClientToCase(caseId, client.id);
        setMode('VIEW');
        setQuery('');
    };

    const handleLinkVehicle = async (vehicle: Vehicle) => {
        await linkVehicleToCase(caseId, vehicle.id);
        setMode('VIEW');
        setQuery('');
    };

    const handleCreateClient = async () => {
        if (!newName || !newPhone) return;
        setIsLoading(true);
        await createAndLinkClient(caseId, { name: newName, phone: newPhone });
        setMode('VIEW');
        setNewName('');
        setNewPhone('');
        setIsLoading(false);
    };

    const handleCreateVehicle = async () => {
        if (!newPlate || !linkedClient) return;
        setIsLoading(true);
        await createAndLinkVehicle(caseId, linkedClient.id, {
            plate: newPlate,
            brand: newBrand,
            model: newModel
        });
        setMode('VIEW');
        setNewPlate('');
        setNewBrand('');
        setNewModel('');
        setIsLoading(false);
    };

    const handleUnlinkClient = async () => {
        if (confirm('¿Desvincular cliente y vehículo?')) {
            await unlinkClient(caseId);
        }
    };

    const handleUnlinkVehicle = async () => {
        await unlinkVehicle(caseId);
    };

    // Render VIEW mode
    if (mode === 'VIEW') {
        return (
            <div className="space-y-4">
                {/* Client Card */}
                <div className="bg-white rounded-xl border shadow-sm overflow-hidden group">
                    <div className="p-4 flex items-start gap-4">
                        <div className={`p-2 rounded-lg ${linkedClient ? 'bg-blue-50 text-blue-600' : 'bg-slate-50 text-slate-400'}`}>
                            <User size={24} />
                        </div>
                        <div className="flex-1">
                            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Cliente</h4>
                            {linkedClient ? (
                                <div>
                                    <p className="font-bold text-slate-800">{linkedClient.name}</p>
                                    <p className="text-sm text-slate-500 flex items-center gap-1">
                                        <Phone size={12} /> {linkedClient.phone}
                                    </p>
                                </div>
                            ) : (
                                <button
                                    onClick={() => setMode('SEARCH_CLIENT')}
                                    className="text-sm font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1"
                                >
                                    <Search size={14} /> Vincular Cliente
                                </button>
                            )}
                        </div>
                        {linkedClient && (
                            <button onClick={handleUnlinkClient} className="opacity-0 group-hover:opacity-100 text-slate-300 hover:text-red-500 transition-all">
                                <X size={16} />
                            </button>
                        )}
                    </div>
                </div>

                {/* Vehicle Card */}
                <div className={`bg-white rounded-xl border shadow-sm overflow-hidden group ${!linkedClient ? 'opacity-50 grayscale' : ''}`}>
                    <div className="p-4 flex items-start gap-4">
                        <div className={`p-2 rounded-lg ${linkedVehicle ? 'bg-purple-50 text-purple-600' : 'bg-slate-50 text-slate-400'}`}>
                            <Car size={24} />
                        </div>
                        <div className="flex-1">
                            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Vehículo</h4>
                            {linkedVehicle ? (
                                <div>
                                    <p className="font-bold text-slate-800 uppercase">{linkedVehicle.plate}</p>
                                    <p className="text-sm text-slate-500">
                                        {linkedVehicle.brand} {linkedVehicle.model}
                                    </p>
                                </div>
                            ) : (
                                <button
                                    onClick={() => linkedClient && setMode('SEARCH_VEHICLE')}
                                    disabled={!linkedClient}
                                    className={`text-sm font-bold flex items-center gap-1 ${linkedClient ? 'text-purple-600 hover:text-purple-700' : 'text-slate-400'}`}
                                >
                                    <Search size={14} /> Vincular Vehículo
                                </button>
                            )}
                        </div>
                        {linkedVehicle && (
                            <button onClick={handleUnlinkVehicle} className="opacity-0 group-hover:opacity-100 text-slate-300 hover:text-red-500 transition-all">
                                <X size={16} />
                            </button>
                        )}
                    </div>
                </div>
            </div>
        );
    }

    // Render SEARCH / CREATE modes
    return (
        <div className="bg-white rounded-xl border-2 border-blue-200 shadow-xl overflow-hidden p-4 space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
            <div className="flex justify-between items-center">
                <h4 className="text-sm font-black uppercase tracking-wider text-slate-700">
                    {mode === 'SEARCH_CLIENT' && 'Buscar Cliente'}
                    {mode === 'CREATE_CLIENT' && 'Nuevo Cliente'}
                    {mode === 'SEARCH_VEHICLE' && 'Buscar Vehículo'}
                    {mode === 'CREATE_VEHICLE' && 'Nuevo Vehículo'}
                </h4>
                <button onClick={() => setMode('VIEW')} className="text-slate-400 hover:text-slate-600"><X size={20} /></button>
            </div>

            {(mode === 'SEARCH_CLIENT' || mode === 'SEARCH_VEHICLE') && (
                <div className="space-y-4">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                        <input
                            autoFocus
                            type="text"
                            placeholder={mode === 'SEARCH_CLIENT' ? "Nombre o Celular..." : "Patente..."}
                            className="w-full pl-10 pr-4 py-2 bg-slate-50 border rounded-lg outline-none focus:ring-2 ring-blue-500"
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                        />
                    </div>

                    <div className="max-h-60 overflow-y-auto space-y-1">
                        {isLoading && <p className="text-xs text-center py-4 text-slate-400 italic">Buscando...</p>}
                        {!isLoading && results.length === 0 && query.length > 1 && (
                            <div className="p-8 text-center text-slate-400">
                                <p className="text-sm mb-4">No se encontraron resultados.</p>
                                <button
                                    onClick={() => setMode(mode === 'SEARCH_CLIENT' ? 'CREATE_CLIENT' : 'CREATE_VEHICLE')}
                                    className="px-4 py-2 bg-blue-600 text-white rounded-lg font-bold text-xs"
                                >
                                    CREAR NUEVO
                                </button>
                            </div>
                        )}
                        {results.map((item) => (
                            <button
                                key={item.id}
                                onClick={() => mode === 'SEARCH_CLIENT' ? handleLinkClient(item) : handleLinkVehicle(item)}
                                className="w-full text-left p-3 hover:bg-blue-50 border rounded-lg flex justify-between items-center transition-colors group"
                            >
                                <div className="flex-1">
                                    <p className="font-bold text-slate-800">{item.name || item.plate}</p>
                                    <p className="text-xs text-slate-500">
                                        {item.phone || `${item.brand} ${item.model}`}
                                        {item.client && <span className="ml-2 bg-slate-100 px-1 rounded">({item.client.name})</span>}
                                    </p>
                                </div>
                                <Plus size={16} className="text-slate-300 group-hover:text-blue-500" />
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {mode === 'CREATE_CLIENT' && (
                <div className="space-y-4">
                    <input
                        type="text" placeholder="Nombre completo"
                        className="w-full p-2 border rounded-lg outline-none"
                        value={newName} onChange={(e) => setNewName(e.target.value)}
                    />
                    <input
                        type="text" placeholder="Teléfono / WhatsApp"
                        className="w-full p-2 border rounded-lg outline-none"
                        value={newPhone} onChange={(e) => setNewPhone(e.target.value)}
                    />
                    <button
                        onClick={handleCreateClient}
                        disabled={!newName || !newPhone || isLoading}
                        className="w-full py-2 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700"
                    >
                        {isLoading ? 'Creando...' : 'CREAR Y VINCULAR'}
                    </button>
                    <button onClick={() => setMode('SEARCH_CLIENT')} className="w-full text-xs text-slate-400 font-bold">VOLVER A BUSCAR</button>
                </div>
            )}

            {mode === 'CREATE_VEHICLE' && (
                <div className="space-y-4">
                    <p className="text-xs text-slate-500 italic mb-2">Vehículo para: {linkedClient?.name}</p>
                    <input
                        type="text" placeholder="PATENTE"
                        className="w-full p-2 border rounded-lg outline-none font-black text-center uppercase"
                        value={newPlate} onChange={(e) => setNewPlate(e.target.value)}
                    />
                    <div className="grid grid-cols-2 gap-2">
                        <input
                            type="text" placeholder="Marca"
                            className="w-full p-2 border rounded-lg outline-none"
                            value={newBrand} onChange={(e) => setNewBrand(e.target.value)}
                        />
                        <input
                            type="text" placeholder="Modelo"
                            className="w-full p-2 border rounded-lg outline-none"
                            value={newModel} onChange={(e) => setNewModel(e.target.value)}
                        />
                    </div>
                    <button
                        onClick={handleCreateVehicle}
                        disabled={!newPlate || isLoading}
                        className="w-full py-2 bg-purple-600 text-white rounded-lg font-bold hover:bg-purple-700"
                    >
                        {isLoading ? 'Creando...' : 'CREAR Y VINCULAR'}
                    </button>
                    <button onClick={() => setMode('SEARCH_VEHICLE')} className="w-full text-xs text-slate-400 font-bold">VOLVER A BUSCAR</button>
                </div>
            )}
        </div>
    );
}
