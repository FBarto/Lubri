'use client';

import { useState, useEffect } from 'react';
import CreateVehicleModal from '../../components/employee/CreateVehicleModal';

interface Vehicle {
    id: number;
    plate: string;
    brand: string | null;
    model: string | null;
}

interface Client {
    id: number;
    name: string;
    phone: string;
    vehicles: Vehicle[];
}

export default function ClientsPage() {
    const [clients, setClients] = useState<Client[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingClient, setEditingClient] = useState<Client | null>(null);

    // Pagination & Search State
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalRecords, setTotalRecords] = useState(0);

    // Form state
    const [formData, setFormData] = useState({
        name: '',
        phone: '',
    });

    // Flow state
    const [isVehicleModalOpen, setIsVehicleModalOpen] = useState(false);
    const [createdClient, setCreatedClient] = useState<Client | null>(null);

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

    const fetchData = async (page = 1, search = '') => {
        setLoading(true);
        try {
            const params = new URLSearchParams({
                page: page.toString(),
                limit: '10',
                search: search
            });

            const res = await fetch(`/api/clients?${params.toString()}`);
            const responseData = await res.json();

            if (responseData.data) {
                setClients(responseData.data);
                setTotalPages(responseData.meta.totalPages);
                setTotalRecords(responseData.meta.total);
            } else {
                setClients([]);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const url = editingClient ? `/api/clients/${editingClient.id}` : '/api/clients';
        const method = editingClient ? 'PUT' : 'POST';

        try {
            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
            });

            if (res.ok) {
                setShowModal(false);
                setEditingClient(null);
                setFormData({ name: '', phone: '' });

                const savedClient = await res.json(); // Assuming API returns the created object
                // If it was a create action (POST), trigger vehicle flow
                if (!editingClient && savedClient.data) {
                    setCreatedClient(savedClient.data);
                    setIsVehicleModalOpen(true);
                }

                fetchData(currentPage, searchTerm);
            } else {
                alert('Error al guardar');
            }
        } catch (err) {
            console.error(err);
        }
    };

    const handleEdit = (client: Client) => {
        setEditingClient(client);
        setFormData({
            name: client.name,
            phone: client.phone,
        });
        setShowModal(true);
    };

    const handleDelete = async (id: number) => {
        if (!confirm('¿Estás seguro de eliminar este cliente? Se borrarán también sus vehículos y datos relacionados.')) return;
        try {
            await fetch(`/api/clients/${id}`, { method: 'DELETE' });
            fetchData(currentPage, searchTerm);
        } catch (err) {
            console.error(err);
        }
    };

    return (
        <div className="fade-in">
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-6 gap-4">
                <div>
                    <h1 className="text-3xl font-extrabold text-slate-800">Clientes</h1>
                    <p className="text-slate-500">Administra tu base de datos de clientes ({totalRecords} total)</p>
                </div>
                <div className="w-full lg:w-auto flex flex-col sm:flex-row gap-3">
                    <div className="relative flex-1 sm:flex-none">
                        <input
                            type="text"
                            placeholder="Buscar nombre, teléfono, patente..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-10 pr-4 py-3 rounded-xl border border-slate-200 bg-white shadow-sm focus:ring-2 focus:ring-indigo-500 outline-none w-full sm:w-80 transition-all"
                        />
                        <svg className="absolute left-3 top-3.5 text-slate-400 w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
                    </div>
                    <button
                        onClick={() => { setShowModal(true); setEditingClient(null); setFormData({ name: '', phone: '' }); }}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-xl font-bold transition-all shadow-lg hover:shadow-indigo-200 active:scale-95 shrink-0"
                    >
                        + Nuevo Cliente
                    </button>
                </div>
            </div>

            <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden flex flex-col h-full">
                <div className="flex-1 overflow-auto">
                    <table className="w-full text-left">
                        <thead className="bg-slate-50 border-b border-slate-100">
                            <tr>
                                <th className="px-6 py-4 font-semibold text-slate-600">Nombre</th>
                                <th className="px-6 py-4 font-semibold text-slate-600">Teléfono / WhatsApp</th>
                                <th className="px-6 py-4 font-semibold text-slate-600">Vehículos</th>
                                <th className="px-6 py-4 font-semibold text-slate-600 text-right">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {loading ? (
                                <tr>
                                    <td colSpan={4} className="p-20 text-center text-slate-400">Cargando...</td>
                                </tr>
                            ) : clients.length > 0 ? (
                                clients.map((c) => (
                                    <tr key={c.id} className="hover:bg-slate-50/50 transition-colors group">
                                        <td className="px-6 py-5">
                                            <div className="flex items-center gap-3">
                                                <div className="h-10 w-10 rounded-full bg-slate-100 flex items-center justify-center font-bold text-slate-500">
                                                    {c.name.charAt(0)}
                                                </div>
                                                <span className="font-bold text-slate-700 text-lg">{c.name}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-5">
                                            <div className="flex items-center gap-2 text-slate-600 font-mono font-medium">
                                                <span>📱</span> {c.phone}
                                                <a href={`https://wa.me/${c.phone}`} target="_blank" className="text-green-500 hover:scale-110 transition-transform ml-2">
                                                    ↗
                                                </a>
                                            </div>
                                        </td>
                                        <td className="px-6 py-5 text-slate-600">
                                            {c.vehicles && c.vehicles.length > 0 ? (
                                                <div className="flex flex-wrap gap-2">
                                                    {c.vehicles.map(v => (
                                                        <span key={v.id} className="bg-slate-100 border border-slate-200 px-2 py-1 rounded-md text-xs font-bold text-slate-600" title={`${v.brand} ${v.model}`}>
                                                            {v.plate}
                                                        </span>
                                                    ))}
                                                </div>
                                            ) : (
                                                <div className="flex items-center gap-2">
                                                    <span className="text-slate-300 italic text-sm">Sin vehículos</span>
                                                    <a href={`/admin/vehicles?new=true&clientId=${c.id}`} className="p-1 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-400 hover:text-indigo-600 transition-colors" title="Agregar Vehículo">
                                                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14" /><path d="M12 5v14" /></svg>
                                                    </a>
                                                </div>
                                            )}
                                        </td>
                                        <td className="px-6 py-5 text-right space-x-2">
                                            <a href={`/admin/clients/${c.id}`} className="inline-block text-slate-500 hover:text-indigo-600 p-2 rounded-lg hover:bg-slate-100 transition-colors" title="Ver Perfil Completo">
                                                👁️
                                            </a>
                                            <button onClick={() => handleEdit(c)} className="text-blue-500 hover:text-blue-700 p-2 rounded-lg hover:bg-blue-50 transition-colors" title="Editar">
                                                ✏️
                                            </button>
                                            <button onClick={() => handleDelete(c.id)} className="text-red-400 hover:text-red-600 p-2 rounded-lg hover:bg-red-50 transition-colors" title="Eliminar">
                                                🗑️
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={4} className="p-12 text-center text-slate-400">
                                        No se encontraron clientes
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
                            {editingClient ? 'Editar Cliente' : 'Nuevo Cliente'}
                        </h2>
                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div>
                                <label className="block text-sm font-semibold text-slate-600 mb-2 ml-1">Nombre Completo</label>
                                <input
                                    required
                                    type="text"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    className="w-full bg-slate-50 border-0 rounded-2xl p-4 focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                                    placeholder="Juan Pérez"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-slate-600 mb-2 ml-1">Teléfono / WhatsApp</label>
                                <input
                                    required
                                    type="tel"
                                    value={formData.phone}
                                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                    className="w-full bg-slate-50 border-0 rounded-2xl p-4 focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                                    placeholder="3541..."
                                />
                            </div>

                            <div className="flex space-x-3 pt-4">
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
                                    {editingClient ? 'Actualizar' : 'Guardar'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            <CreateVehicleModal
                isOpen={isVehicleModalOpen}
                clientId={createdClient?.id || null}
                clientName={createdClient?.name}
                onClose={() => setIsVehicleModalOpen(false)}
                onSuccess={(vehicle) => {
                    setIsVehicleModalOpen(false);
                    alert('Vehículo creado correctamente (Flujo Admin finalizado)');
                    fetchData(currentPage, searchTerm);
                }}
            />
        </div>
    );
}
