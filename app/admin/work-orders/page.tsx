'use client';

import { useState, useEffect, useMemo, Suspense } from 'react';
import Link from 'next/link';
import { Search, Calendar, Filter, ChevronDown, ChevronUp, FileText, CheckCircle, Clock, XCircle, AlertCircle, Share2, Printer } from 'lucide-react';
import { useSearchParams } from 'next/navigation';

function WorkOrdersContent() {
    const searchParams = useSearchParams();
    const idParam = searchParams.get('id');

    const [workOrders, setWorkOrders] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);

    // Filters
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState<'ALL' | 'COMPLETED' | 'PENDING' | 'IN_PROGRESS'>('ALL');
    const [dateRange, setDateRange] = useState({ start: '', end: '' });

    // UX State
    const [expandedRow, setExpandedRow] = useState<number | null>(null);

    const fetchOrders = async () => {
        setLoading(true);
        try {
            // Build query params
            const params = new URLSearchParams();
            if (dateRange.start) params.append('from', dateRange.start);

            const res = await fetch(`/api/work-orders`);
            const data = await res.json();
            if (Array.isArray(data)) {
                setWorkOrders(data);

                // If ID param exists, auto-select it once data is loaded
                if (idParam) {
                    setSearchTerm(idParam);
                    setExpandedRow(Number(idParam));
                }
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchOrders();
    }, []);

    const filteredOrders = useMemo(() => {
        return workOrders.filter(wo => {
            // Text Search
            const searchLower = searchTerm.toLowerCase();
            const matchesSearch =
                wo.client.name.toLowerCase().includes(searchLower) ||
                wo.vehicle.plate.toLowerCase().includes(searchLower) ||
                wo.service.name.toLowerCase().includes(searchLower) ||
                wo.id.toString().includes(searchLower);

            // Status Filter
            const matchesStatus = statusFilter === 'ALL' || wo.status === statusFilter;

            // Date Filter (Client Side for now)
            let matchesDate = true;
            if (dateRange.start) {
                matchesDate = matchesDate && new Date(wo.date) >= new Date(dateRange.start);
            }
            if (dateRange.end) {
                matchesDate = matchesDate && new Date(wo.date) <= new Date(dateRange.end + 'T23:59:59');
            }

            return matchesSearch && matchesStatus && matchesDate;
        });
    }, [workOrders, searchTerm, statusFilter, dateRange]);

    const toggleExpand = (id: number) => {
        setExpandedRow(expandedRow === id ? null : id);
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'COMPLETED': return <span className="flex items-center gap-1 text-xs font-bold bg-green-100 text-green-700 px-3 py-1 rounded-full border border-green-200"><CheckCircle size={12} /> LISTO (VERDE)</span>;
            case 'DELIVERED': return <span className="flex items-center gap-1 text-xs font-bold bg-slate-100 text-slate-600 px-3 py-1 rounded-full border border-slate-200"><Share2 size={12} /> ENTREGADO</span>;
            case 'IN_PROGRESS': return <span className="flex items-center gap-1 text-xs font-bold bg-yellow-100 text-yellow-700 px-3 py-1 rounded-full border border-yellow-200"><Clock size={12} /> EN PROCESO (AMARILLO)</span>;
            default: return <span className="flex items-center gap-1 text-xs font-bold bg-red-100 text-red-700 px-3 py-1 rounded-full border border-red-200"><AlertCircle size={12} /> PENDIENTE (ROJO)</span>;
        }
    };

    return (
        <div className="fade-in max-w-7xl mx-auto p-6">
            <header className="mb-8">
                <h1 className="text-3xl font-black text-slate-900 mb-2">Historial de Servicios</h1>
                <p className="text-slate-500">Gestión y auditoría de trabajos realizados.</p>
            </header>

            {/* --- CONTROLS --- */}
            <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200 mb-6 flex flex-col md:flex-row gap-4 items-center justify-between">

                {/* Search */}
                <div className="relative w-full md:w-96">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                    <input
                        type="text"
                        placeholder="Buscar por cliente, patente, servicio..."
                        className="w-full pl-10 pr-4 py-3 bg-slate-50 border-none rounded-xl font-medium text-slate-700 outline-none focus:ring-2 focus:ring-red-100 placeholder:text-slate-400"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>

                {/* Filters */}
                <div className="flex gap-2 w-full md:w-auto overflow-x-auto pb-2 md:pb-0">
                    {['ALL', 'COMPLETED', 'IN_PROGRESS', 'PENDING'].map((status) => (
                        <button
                            key={status}
                            onClick={() => setStatusFilter(status as any)}
                            className={`px-4 py-2 rounded-lg font-bold text-sm whitespace-nowrap transition-colors ${statusFilter === status
                                ? 'bg-slate-900 text-white'
                                : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                                }`}
                        >
                            {status === 'ALL' ? 'Todos' : status}
                        </button>
                    ))}
                </div>

                {/* Date Hack (Simple) */}
                <div className="flex items-center gap-2 bg-slate-50 p-2 rounded-lg border border-slate-100">
                    <Calendar size={18} className="text-slate-400" />
                    <input
                        type="date"
                        className="bg-transparent text-sm font-bold text-slate-600 outline-none"
                        onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
                    />
                </div>
            </div>

            {/* --- TABLE --- */}
            {loading ? (
                <div className="text-center py-20 text-slate-400">Cargando historial...</div>
            ) : filteredOrders.length === 0 ? (
                <div className="text-center py-24 bg-slate-50 rounded-3xl border border-dashed border-slate-200">
                    <Filter className="mx-auto h-12 w-12 text-slate-300 mb-4" />
                    <p className="text-slate-500 font-medium">No se encontraron servicios con estos filtros.</p>
                </div>
            ) : (
                <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
                    <table className="w-full">
                        <thead className="bg-slate-50 border-b border-slate-100">
                            <tr>
                                <th className="text-left p-6 text-xs font-bold text-slate-400 uppercase tracking-wider">Fecha</th>
                                <th className="text-left p-6 text-xs font-bold text-slate-400 uppercase tracking-wider">Cliente / Vehículo</th>
                                <th className="text-left p-6 text-xs font-bold text-slate-400 uppercase tracking-wider">Servicio</th>
                                <th className="text-center p-6 text-xs font-bold text-slate-400 uppercase tracking-wider">Estado</th>
                                <th className="text-right p-6 text-xs font-bold text-slate-400 uppercase tracking-wider">Total</th>
                                <th className="p-6"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {filteredOrders.map((wo) => {
                                const isExpanded = expandedRow === wo.id;
                                return (
                                    <>
                                        {/* Main Row */}
                                        <tr
                                            key={wo.id}
                                            className={`transition-colors cursor-pointer ${isExpanded ? 'bg-blue-50/50' : 'hover:bg-slate-50'}`}
                                            onClick={() => toggleExpand(wo.id)}
                                        >
                                            <td className="p-6">
                                                <div className="flex flex-col">
                                                    <span className="font-bold text-slate-700">{new Date(wo.date).toLocaleDateString()}</span>
                                                    <span className="text-xs text-slate-400">{new Date(wo.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                                </div>
                                            </td>
                                            <td className="p-6">
                                                <p className="font-bold text-slate-900">{wo.client.name}</p>
                                                <div className="flex items-center gap-2 mt-1">
                                                    <span className="text-xs font-bold bg-slate-200 text-slate-600 px-2 py-0.5 rounded uppercase tracking-wider">{wo.vehicle.plate}</span>
                                                    <span className="text-xs text-slate-500">{wo.vehicle.brand} {wo.vehicle.model}</span>
                                                </div>
                                            </td>
                                            <td className="p-6">
                                                <p className="font-medium text-slate-700">{wo.service.name}</p>
                                                {wo.mileage && <p className="text-xs text-slate-400 mt-1 font-mono">{wo.mileage.toLocaleString()} km</p>}
                                            </td>
                                            <td className="p-6 text-center">
                                                {getStatusBadge(wo.status)}
                                            </td>
                                            <td className="p-6 text-right">
                                                <span className="font-bold text-slate-900">
                                                    ${wo.price.toLocaleString('es-AR')}
                                                </span>
                                            </td>
                                            <td className="p-6 text-right">
                                                <button className="text-slate-400 hover:text-slate-600">
                                                    {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                                                </button>
                                            </td>
                                        </tr>

                                        {/* Expanded Detail Row */}
                                        {isExpanded && (
                                            <tr className="bg-blue-50/30">
                                                <td colSpan={6} className="p-0">
                                                    <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-6 animate-in slide-in-from-top-2 duration-200">

                                                        {/* Details Column */}
                                                        <div className="space-y-4">
                                                            <div>
                                                                <h4 className="text-xs font-bold text-slate-400 uppercase mb-1">Notas del Servicio</h4>
                                                                <p className="text-sm text-slate-700 bg-white p-3 rounded-lg border border-slate-200 italic">
                                                                    {wo.notes || "Sin notas adicionales."}
                                                                </p>
                                                            </div>
                                                            <div>
                                                                <h4 className="text-xs font-bold text-slate-400 uppercase mb-1">Mecánico Asignado</h4>
                                                                <p className="text-sm font-medium text-slate-900 flex items-center gap-2">
                                                                    👷 {wo.userId ? `ID #${wo.userId}` : "Sin asignar"}
                                                                </p>
                                                            </div>
                                                        </div>

                                                        {/* Actions Column */}
                                                        <div className="flex flex-col gap-3 justify-center items-start">
                                                            <Link href={`/admin/work-orders/${wo.id}`} className="flex items-center gap-2 text-sm font-bold text-blue-600 hover:bg-blue-50 px-4 py-2 rounded-lg transition-colors">
                                                                <FileText size={16} /> Ver Detalles Completos
                                                            </Link>
                                                            <button className="flex items-center gap-2 text-sm font-bold text-emerald-600 hover:bg-emerald-50 px-4 py-2 rounded-lg transition-colors">
                                                                <Share2 size={16} /> Enviar Comprobante (WhatsApp)
                                                            </button>
                                                            <button className="flex items-center gap-2 text-sm font-bold text-slate-600 hover:bg-slate-100 px-4 py-2 rounded-lg transition-colors">
                                                                <Printer size={16} /> Imprimir Orden
                                                            </button>
                                                        </div>

                                                        {/* Timeline / Status (Mock) */}
                                                        <div className="bg-white p-4 rounded-xl border border-slate-200">
                                                            <h4 className="text-xs font-bold text-slate-400 uppercase mb-3 text-center">Línea de Tiempo</h4>
                                                            <div className="space-y-3 relative before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-100">
                                                                <div className="relative pl-6">
                                                                    <div className="absolute left-0 top-1.5 w-4 h-4 rounded-full bg-emerald-500 border-2 border-white"></div>
                                                                    <p className="text-xs font-bold text-slate-700">Creada</p>
                                                                    <p className="text-[10px] text-slate-400">{new Date(wo.date).toLocaleString()}</p>
                                                                </div>
                                                                {wo.finishedAt && (
                                                                    <div className="relative pl-6">
                                                                        <div className="absolute left-0 top-1.5 w-4 h-4 rounded-full bg-blue-500 border-2 border-white"></div>
                                                                        <p className="text-xs font-bold text-slate-700">Finalizada</p>
                                                                        <p className="text-[10px] text-slate-400">{new Date(wo.finishedAt).toLocaleString()}</p>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>

                                                    </div>
                                                </td>
                                            </tr>
                                        )}
                                    </>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}

export default function WorkOrdersList() {
    return (
        <Suspense fallback={<div className="p-8 text-center text-slate-400">Cargando modulo de ordenes...</div>}>
            <WorkOrdersContent />
        </Suspense>
    );
}
