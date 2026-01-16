'use client';

import { useState, useEffect } from 'react';

interface Service {
    id: number;
    name: string;
    category: string;
    duration: number;
    price: number;
    active: boolean;
}

export default function ServicesPage() {
    const [services, setServices] = useState<Service[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingService, setEditingService] = useState<Service | null>(null);
    const [searchTerm, setSearchTerm] = useState('');

    // Form state
    const [formData, setFormData] = useState({
        name: '',
        category: '',
        duration: '30',
        price: '',
    });

    useEffect(() => {
        fetchServices();
    }, []);

    const fetchServices = async () => {
        try {
            const res = await fetch('/api/services');
            const data = await res.json();
            setServices(data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const filteredServices = services.filter(service => {
        const term = searchTerm.toLowerCase();
        return (
            service.name.toLowerCase().includes(term) ||
            service.category.toLowerCase().includes(term)
        );
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const url = editingService ? `/api/services/${editingService.id}` : '/api/services';
        const method = editingService ? 'PUT' : 'POST';

        try {
            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
            });

            if (res.ok) {
                setShowModal(false);
                setEditingService(null);
                setFormData({ name: '', category: '', duration: '30', price: '' });
                fetchServices();
            }
        } catch (err) {
            console.error(err);
        }
    };

    const handleEdit = (service: Service) => {
        setEditingService(service);
        setFormData({
            name: service.name,
            category: service.category,
            duration: service.duration.toString(),
            price: service.price.toString(),
        });
        setShowModal(true);
    };

    const handleDelete = async (id: number) => {
        if (!confirm('¿Estás seguro de eliminar este servicio?')) return;
        try {
            await fetch(`/api/services/${id}`, { method: 'DELETE' });
            fetchServices();
        } catch (err) {
            console.error(err);
        }
    };

    const categories = ['Aceites', 'Filtros', 'Revisiones', 'Frenos', 'Otros'];

    return (
        <div className="fade-in">
            <div className="flex justify-between items-center mb-8 gap-4">
                <div className="flex-1">
                    <h1 className="text-3xl font-extrabold text-slate-800">Servicios</h1>
                    <p className="text-slate-500">Configura tu catálogo de servicios y precios</p>
                </div>
                <div className="relative">
                    <input
                        type="text"
                        placeholder="Buscar servicio o categoría..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10 pr-4 py-3 rounded-xl border border-slate-200 bg-white shadow-sm focus:ring-2 focus:ring-emerald-500 outline-none w-64 lg:w-96 transition-all"
                    />
                    <svg className="absolute left-3 top-3.5 text-slate-400 w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
                </div>
                <button
                    onClick={() => { setShowModal(true); setEditingService(null); setFormData({ name: '', category: '', duration: '30', price: '' }); }}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-3 rounded-2xl font-bold transition-all shadow-lg hover:shadow-emerald-200 active:scale-95 shrink-0"
                >
                    + Nuevo Servicio
                </button>
            </div>

            <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
                {loading ? (
                    <div className="p-20 text-center text-slate-400">Cargando...</div>
                ) : (
                    <table className="w-full text-left">
                        <thead className="bg-slate-50 border-b border-slate-100">
                            <tr>
                                <th className="px-6 py-4 font-semibold text-slate-600">Servicio</th>
                                <th className="px-6 py-4 font-semibold text-slate-600">Categoría</th>
                                <th className="px-6 py-4 font-semibold text-slate-600">Duración</th>
                                <th className="px-6 py-4 font-semibold text-slate-600">Precio</th>
                                <th className="px-6 py-4 font-semibold text-slate-600 text-right">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {filteredServices.length > 0 ? (
                                filteredServices.map((service) => (
                                    <tr key={service.id} className="hover:bg-slate-50/50 transition-colors group">
                                        <td className="px-6 py-5 font-medium text-slate-700">{service.name}</td>
                                        <td className="px-6 py-5">
                                            <span className="bg-emerald-50 text-emerald-700 text-xs px-2 py-1 rounded-lg font-bold">
                                                {service.category}
                                            </span>
                                        </td>
                                        <td className="px-6 py-5 text-slate-500">{service.duration} min</td>
                                        <td className="px-6 py-5 font-bold text-slate-800">${service.price.toLocaleString()}</td>
                                        <td className="px-6 py-5 text-right space-x-2">
                                            <button onClick={() => handleEdit(service)} className="text-blue-500 hover:text-blue-700 p-2 rounded-lg hover:bg-blue-50 transition-colors">
                                                ✏️
                                            </button>
                                            <button onClick={() => handleDelete(service.id)} className="text-red-400 hover:text-red-600 p-2 rounded-lg hover:bg-red-50 transition-colors">
                                                🗑️
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={5} className="p-12 text-center text-slate-400">
                                        No se encontraron servicios que coincidan con &quot;{searchTerm}&quot;
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                )}
            </div>

            {showModal && (
                <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-[2.5rem] w-full max-w-md p-8 shadow-2xl scale-in">
                        <h2 className="text-2xl font-bold mb-6 text-slate-800">
                            {editingService ? 'Editar Servicio' : 'Nuevo Servicio'}
                        </h2>
                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div>
                                <label className="block text-sm font-semibold text-slate-600 mb-2 ml-1">Nombre del Servicio</label>
                                <input
                                    required
                                    type="text"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    className="w-full bg-slate-50 border-0 rounded-2xl p-4 focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                                    placeholder="Ej: Cambio de Aceite y Filtro"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-slate-600 mb-2 ml-1">Categoría</label>
                                <select
                                    required
                                    value={formData.category}
                                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                                    className="w-full bg-slate-50 border-0 rounded-2xl p-4 focus:ring-2 focus:ring-emerald-500 outline-none transition-all appearance-none"
                                >
                                    <option value="">Selecciona categoría</option>
                                    {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                                </select>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-semibold text-slate-600 mb-2 ml-1">Duración (min)</label>
                                    <input
                                        required
                                        type="number"
                                        value={formData.duration}
                                        onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                                        className="w-full bg-slate-50 border-0 rounded-2xl p-4 focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                                        placeholder="30"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-slate-600 mb-2 ml-1">Precio ($)</label>
                                    <input
                                        required
                                        type="number"
                                        value={formData.price}
                                        onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                                        className="w-full bg-slate-50 border-0 rounded-2xl p-4 focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                                        placeholder="5000"
                                    />
                                </div>
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
                                    className="flex-1 bg-emerald-600 text-white py-4 rounded-2xl font-bold hover:bg-emerald-700 shadow-lg shadow-emerald-200 transition-all active:scale-95"
                                >
                                    {editingService ? 'Actualizar' : 'Guardar'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
