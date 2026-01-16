'use client';

import { useState, useEffect } from 'react';

interface Client {
    id: number;
    name: string;
}

interface Vehicle {
    id: number;
    plate: string;
    brand: string | null;
    model: string | null;
    type: string | null;
    mileage: number | null;
    clientId: number;
    client: Client;
}

export default function VehiclesPage() {
    const [vehicles, setVehicles] = useState<Vehicle[]>([]);
    const [clients, setClients] = useState<Client[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingVehicle, setEditingVehicle] = useState<Vehicle | null>(null);

    // Stats State
    const [topVehicles, setTopVehicles] = useState<any[]>([]);

    // Pagination & Search State
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalRecords, setTotalRecords] = useState(0);

    // Form state
    const [formData, setFormData] = useState({
        plate: '',
        brand: '',
        model: '',
        type: '',
        mileage: '',
        clientId: '',
    });

    // Debounce search
    useEffect(() => {
        const timer = setTimeout(() => {
            setCurrentPage(1); // Reset to page 1 on search
            fetchData(1, searchTerm);
        }, 300);

        return () => clearTimeout(timer);
    }, [searchTerm]);

    // Handle page changes
    useEffect(() => {
        fetchData(currentPage, searchTerm);
    }, [currentPage]);

    // Initial data fetch (dropdowns + stats)
    useEffect(() => {
        // Fetch clients for dropdown (basic)
        fetch('/api/clients').then(r => r.json()).then(d => {
            if (d.data) setClients(d.data);
        });

        // Fetch Stats
        fetch('/api/stats/top-vehicles').then(r => r.json()).then(data => {
            if (Array.isArray(data)) {
                setTopVehicles(data);
            }
        });
    }, []);

    const fetchData = async (page = 1, search = '') => {
        setLoading(true);
        try {
            const params = new URLSearchParams({
                page: page.toString(),
                limit: '10',
                search: search
            });

            const res = await fetch(`/api/vehicles?${params.toString()}`);
            const responseData = await res.json();

            if (responseData.data) {
                setVehicles(responseData.data);
                setTotalPages(responseData.meta.totalPages);
                setTotalRecords(responseData.meta.total);
            } else {
                setVehicles(Array.isArray(responseData) ? responseData : []);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const url = editingVehicle ? `/api/vehicles/${editingVehicle.id}` : '/api/vehicles';
        const method = editingVehicle ? 'PUT' : 'POST';

        try {
            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
            });

            if (res.ok) {
                setShowModal(false);
                setEditingVehicle(null);
                setFormData({ plate: '', brand: '', model: '', type: '', mileage: '', clientId: '' });
                fetchData(currentPage, searchTerm);
                // Refresh stats too if meaningful
                fetch('/api/stats/top-vehicles').then(r => r.json()).then(setTopVehicles);
            }
        } catch (err) {
            console.error(err);
        }
    };

    const handleEdit = (vehicle: Vehicle) => {
        setEditingVehicle(vehicle);
        setFormData({
            plate: vehicle.plate,
            brand: vehicle.brand || '',
            model: vehicle.model || '',
            type: vehicle.type || '',
            mileage: vehicle.mileage?.toString() || '',
            clientId: vehicle.clientId.toString(),
        });
        setShowModal(true);
    };

    const handleDelete = async (id: number) => {
        if (!confirm('¿Estás seguro de eliminar este vehículo?')) return;
        try {
            await fetch(`/api/vehicles/${id}`, { method: 'DELETE' });
            fetchData(currentPage, searchTerm);
            fetch('/api/stats/top-vehicles').then(r => r.json()).then(setTopVehicles);
        } catch (err) {
            console.error(err);
        }
    };

    return (
        <div className="fade-in">
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-6 gap-4">
                <div>
                    <h1 className="text-3xl font-extrabold text-slate-800">Vehículos</h1>
                    <p className="text-slate-500">Gestiona los vehículos de tus clientes ({totalRecords} total)</p>
                </div>
                <div className="w-full lg:w-auto flex flex-col sm:flex-row gap-3">
                    <div className="relative flex-1 sm:flex-none">
                        <input
                            type="text"
                            placeholder="Buscar patente, modelo..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-10 pr-4 py-3 rounded-xl border border-slate-200 bg-white shadow-sm focus:ring-2 focus:ring-indigo-500 outline-none w-full sm:w-64 transition-all"
                        />
                        <svg className="absolute left-3 top-3.5 text-slate-400 w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
                    </div>
                    <button
                        onClick={() => { setShowModal(true); setEditingVehicle(null); setFormData({ plate: '', brand: '', model: '', type: '', mileage: '', clientId: '' }); }}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-xl font-bold transition-all shadow-lg hover:shadow-indigo-200 active:scale-95 shrink-0"
                    >
                        + Nuevo Vehículo
                    </button>
                </div>
            </div>

            {/* Top 10 Vehicles Widget */}
            {topVehicles.length > 0 && (
                <div className="mb-8">
                    <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-3 ml-1">Top Modelos Populares</h3>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
                        {topVehicles.map((item, idx) => (
                            <div key={idx} className="bg-white p-3 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between group hover:shadow-md transition-all">
                                <div>
                                    <div className="font-bold text-slate-700 truncate text-sm" title={`${item.brand} ${item.model}`}>
                                        {item.brand} {item.model}
                                    </div>
                                    <div className="text-xs text-slate-400 font-medium">
                                        {item._count._all} registros
                                    </div>
                                </div>
                                <div className="h-8 w-8 rounded-full bg-slate-50 text-slate-600 flex items-center justify-center font-bold text-xs group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-colors">
                                    #{idx + 1}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden flex flex-col h-full">
                <div className="flex-1 overflow-auto">
                    <table className="w-full text-left">
                        <thead className="bg-slate-50 border-b border-slate-100">
                            <tr>
                                <th className="px-6 py-4 font-semibold text-slate-600">Patente</th>
                                <th className="px-6 py-4 font-semibold text-slate-600">Propietario</th>
                                <th className="px-6 py-4 font-semibold text-slate-600">Marca/Modelo</th>
                                <th className="px-6 py-4 font-semibold text-slate-600">KM</th>
                                <th className="px-6 py-4 font-semibold text-slate-600 text-right">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {loading ? (
                                <tr>
                                    <td colSpan={5} className="p-20 text-center text-slate-400">Cargando...</td>
                                </tr>
                            ) : vehicles.length > 0 ? (
                                vehicles.map((v) => (
                                    <tr key={v.id} className="hover:bg-slate-50/50 transition-colors group">
                                        <td className="px-6 py-5">
                                            <span className="bg-slate-900 text-white px-3 py-1 rounded-md font-mono font-bold tracking-wider border-2 border-slate-700 shadow-sm">
                                                {v.plate}
                                            </span>
                                        </td>
                                        <td className="px-6 py-5 font-medium text-slate-700">{v.client.name}</td>
                                        <td className="px-6 py-5 text-slate-600">
                                            {v.brand} {v.model} <span className="text-slate-300 text-xs ml-1">({v.type})</span>
                                        </td>
                                        <td className="px-6 py-5 font-mono text-slate-500">{v.mileage?.toLocaleString()} km</td>
                                        <td className="px-6 py-5 text-right space-x-2">
                                            <button onClick={() => handleEdit(v)} className="text-blue-500 hover:text-blue-700 p-2 rounded-lg hover:bg-blue-50 transition-colors">
                                                ✏️
                                            </button>
                                            <button onClick={() => handleDelete(v.id)} className="text-red-400 hover:text-red-600 p-2 rounded-lg hover:bg-red-50 transition-colors">
                                                🗑️
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={5} className="p-12 text-center text-slate-400">
                                        No se encontraron vehículos
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination Controls */}
                <div className="p-4 border-t border-slate-100 flex justify-between items-center bg-slate-50/50">
                    <span className="text-sm text-slate-500">
                        Página <b>{currentPage}</b> de <b>{totalPages}</b>
                    </span>
                    <div className="flex gap-2">
                        <button
                            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                            disabled={currentPage === 1 || loading}
                            className="px-4 py-2 rounded-lg bg-white border border-slate-200 text-slate-600 font-bold disabled:opacity-50 hover:bg-slate-50 transition-colors text-sm"
                        >
                            Anterior
                        </button>
                        <button
                            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                            disabled={currentPage === totalPages || loading}
                            className="px-4 py-2 rounded-lg bg-white border border-slate-200 text-slate-600 font-bold disabled:opacity-50 hover:bg-slate-50 transition-colors text-sm"
                        >
                            Siguiente
                        </button>
                    </div>
                </div>
            </div>

            {showModal && (
                <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-[2.5rem] w-full max-w-lg p-8 shadow-2xl scale-in max-h-[90vh] overflow-y-auto">
                        <h2 className="text-2xl font-bold mb-6 text-slate-800">
                            {editingVehicle ? 'Editar Vehículo' : 'Nuevo Vehículo'}
                        </h2>
                        <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-6">
                            <div className="col-span-1">
                                <label className="block text-sm font-semibold text-slate-600 mb-2 ml-1">Patente</label>
                                <input
                                    required
                                    type="text"
                                    value={formData.plate}
                                    onChange={(e) => setFormData({ ...formData, plate: e.target.value.toUpperCase() })}
                                    className="w-full bg-slate-50 border-0 rounded-2xl p-4 focus:ring-2 focus:ring-indigo-500 outline-none transition-all font-mono uppercase"
                                    placeholder="AE123BB"
                                />
                            </div>
                            <div className="col-span-1">
                                <label className="block text-sm font-semibold text-slate-600 mb-2 ml-1">Cliente / Propietario</label>
                                <select
                                    required
                                    value={formData.clientId}
                                    onChange={(e) => setFormData({ ...formData, clientId: e.target.value })}
                                    className="w-full bg-slate-50 border-0 rounded-2xl p-4 focus:ring-2 focus:ring-indigo-500 outline-none transition-all appearance-none"
                                >
                                    <option value="">Selecciona un cliente</option>
                                    {clients.map(c => (
                                        <option key={c.id} value={c.id}>{c.name}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="col-span-1">
                                <label className="block text-sm font-semibold text-slate-600 mb-2 ml-1">Marca</label>
                                <input
                                    type="text"
                                    value={formData.brand}
                                    onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                                    className="w-full bg-slate-50 border-0 rounded-2xl p-4 focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                                    placeholder="Ej: Toyota"
                                />
                            </div>
                            <div className="col-span-1">
                                <label className="block text-sm font-semibold text-slate-600 mb-2 ml-1">Modelo</label>
                                <input
                                    type="text"
                                    value={formData.model}
                                    onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                                    className="w-full bg-slate-50 border-0 rounded-2xl p-4 focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                                    placeholder="Ej: Hilux"
                                />
                            </div>
                            <div className="col-span-1">
                                <label className="block text-sm font-semibold text-slate-600 mb-2 ml-1">Tipo</label>
                                <input
                                    type="text"
                                    value={formData.type}
                                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                                    className="w-full bg-slate-50 border-0 rounded-2xl p-4 focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                                    placeholder="Ej: Camioneta"
                                />
                            </div>
                            <div className="col-span-1">
                                <label className="block text-sm font-semibold text-slate-600 mb-2 ml-1">Kilometraje (km)</label>
                                <input
                                    type="number"
                                    value={formData.mileage}
                                    onChange={(e) => setFormData({ ...formData, mileage: e.target.value })}
                                    className="w-full bg-slate-50 border-0 rounded-2xl p-4 focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                                    placeholder="0"
                                />
                            </div>
                            <div className="col-span-2 flex space-x-3 pt-4">
                                <button
                                    type="button"
                                    onClick={() => setShowModal(false)}
                                    className="flex-1 bg-slate-100 text-slate-600 py-4 rounded-2xl font-bold hover:bg-slate-200 transition-colors"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 bg-indigo-600 text-white py-4 rounded-2xl font-bold hover:bg-indigo-700 shadow-lg shadow-indigo-200 transition-all active:scale-95"
                                >
                                    {editingVehicle ? 'Actualizar' : 'Guardar'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
