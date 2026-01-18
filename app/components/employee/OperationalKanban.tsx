'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { Play, CheckCircle, LogOut, Send, Clock, FileCheck, FileX, PenTool } from 'lucide-react';
import { sendBudgetForApproval } from '../../lib/approval-actions';
import EditWorkOrderModal from './EditWorkOrderModal';

type WorkOrderStatus = 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'DELIVERED';

interface WorkOrder {
    id: number;
    status: WorkOrderStatus;
    clientId: number;
    vehicleId: number;
    client: { name: string };
    vehicle: { plate: string; brand: string; model: string };
    service: { id: number; name: string; price: number };
    user?: { name: string }; // Assigned employee
    date: string;
    price: number;
    approvalStatus: string; // IDLE, PENDING, APPROVED, REJECTED
    approvalToken?: string;
    serviceDetails?: any;
}

interface OperationalKanbanProps {
    onPassToCheckout?: (workOrder: WorkOrder) => void;
}

export default function OperationalKanban({ onPassToCheckout }: OperationalKanbanProps) {
    const { data: session } = useSession();
    const [orders, setOrders] = useState<WorkOrder[]>([]);
    const [loading, setLoading] = useState(true);

    // Modal States
    const [finishModalOpen, setFinishModalOpen] = useState(false);
    const [editModalOpen, setEditModalOpen] = useState(false);
    const [selectedOrder, setSelectedOrder] = useState<WorkOrder | null>(null);
    const [mileage, setMileage] = useState('');

    const fetchOrders = useCallback(async () => {
        try {
            const res = await fetch('/api/work-orders/kanban');
            if (res.ok) {
                const data = await res.json();
                setOrders(data);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchOrders();
        const interval = setInterval(fetchOrders, 30000); // Poll every 30s
        return () => clearInterval(interval);
    }, [fetchOrders]);

    const handleTransition = async (id: number, status: WorkOrderStatus, extraData: any = {}) => {
        try {
            const res = await fetch(`/api/work-orders/${id}/status`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status, userId: session?.user?.id, ...extraData })
            });
            if (res.ok) {
                fetchOrders();
                setFinishModalOpen(false);
                setMileage('');
            } else {
                alert('Error al actualizar estado');
            }
        } catch (error) {
            console.error(error);
            alert('Error de conexión');
        }
    };

    const columns = [
        { id: 'PENDING', title: 'INGRESÓ', color: 'bg-yellow-100 border-yellow-300' },
        { id: 'IN_PROGRESS', title: 'EN SERVICIO', color: 'bg-blue-100 border-blue-300' },
        { id: 'COMPLETED', title: 'LISTO', color: 'bg-green-100 border-green-300' }
    ];

    if (loading) return <div className="p-8 text-center text-slate-500">Cargando tablero operativo...</div>;

    return (
        <div className="h-full flex flex-col bg-slate-50 p-4">
            <h1 className="text-2xl font-black text-slate-900 mb-6 flex justify-between">
                Tablero Operativo
                <button onClick={fetchOrders} className="text-sm bg-white px-3 py-1 rounded border shadow-sm">↻ Actualizar</button>
            </h1>

            <div className="flex-1 overflow-x-auto">
                <div className="flex gap-4 h-full min-w-[1000px]">
                    {columns.map(col => {
                        const colOrders = orders.filter(o => o.status === col.id);
                        return (
                            <div key={col.id} className={`flex-1 flex flex-col rounded-xl border-t-8 ${col.color} bg-white shadow-sm`}>
                                <div className="p-4 border-b border-slate-100 bg-slate-50/50">
                                    <h2 className="font-black text-slate-700 text-lg flex justify-between items-center">
                                        {col.title}
                                        <span className="bg-slate-800 text-white text-xs px-2 py-1 rounded-full">{colOrders.length}</span>
                                    </h2>
                                </div>
                                <div className="flex-1 p-3 space-y-3 overflow-y-auto">
                                    {colOrders.map(order => (
                                        <div key={order.id} className="bg-white border border-slate-200 p-4 rounded-lg shadow-sm hover:shadow-md transition-shadow relative overflow-hidden">
                                            <div className="flex justify-between items-start mb-2">
                                                <span className="font-mono font-bold text-lg text-slate-800">{order.vehicle.plate}</span>
                                                <span className="text-xs text-slate-500">{new Date(order.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                            </div>
                                            <div className="text-sm font-medium text-slate-700 mb-1">{order.vehicle.brand} {order.vehicle.model}</div>
                                            <div className="text-xs text-slate-500 mb-3 bg-slate-100 p-1.5 rounded inline-block">{order.service.name}</div>

                                            {order.user && (
                                                <div className="text-xs text-indigo-600 font-bold mb-3 flex items-center gap-1">
                                                    👷 {order.user.name || 'Empleado'}
                                                </div>
                                            )}

                                            {/* Approval Status Badge */}
                                            {order.approvalStatus === 'PENDING' && (
                                                <div className="mb-3 bg-amber-50 text-amber-600 px-2 py-1 rounded text-xs font-bold flex items-center gap-1 border border-amber-100">
                                                    <Clock size={12} /> Esperando Aprobación
                                                </div>
                                            )}
                                            {order.approvalStatus === 'APPROVED' && (
                                                <div className="mb-3 bg-emerald-50 text-emerald-600 px-2 py-1 rounded text-xs font-bold flex items-center gap-1 border border-emerald-100">
                                                    <FileCheck size={12} /> Presupuesto Aprobado
                                                </div>
                                            )}
                                            {order.approvalStatus === 'REJECTED' && (
                                                <div className="mb-3 bg-red-50 text-red-600 px-2 py-1 rounded text-xs font-bold flex items-center gap-1 border border-red-100">
                                                    <FileX size={12} /> Presupuesto Rechazado
                                                </div>
                                            )}

                                            {/* Actions */}
                                            <div className="flex flex-col gap-2 mt-2">
                                                {col.id === 'PENDING' && (
                                                    <button
                                                        onClick={() => handleTransition(order.id, 'IN_PROGRESS')}
                                                        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg flex items-center justify-center gap-2 transition-colors"
                                                    >
                                                        <Play className="w-4 h-4" /> Iniciar Service
                                                    </button>
                                                )}

                                                {/* Budget Action */}
                                                {(col.id === 'PENDING' || col.id === 'IN_PROGRESS') && (order.approvalStatus === 'IDLE' || order.approvalStatus === 'REJECTED') && (
                                                    <button
                                                        onClick={async () => {
                                                            if (!confirm('¿Enviar presupuesto al cliente por WhatsApp?')) return;
                                                            const res = await sendBudgetForApproval(order.id);
                                                            if (res.success) {
                                                                alert('Enlace generado: /approval/' + res.token);
                                                                fetchOrders();
                                                            } else {
                                                                alert('Error al generar presupuesto');
                                                            }
                                                        }}
                                                        className="w-full bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold py-2 px-4 rounded-lg flex items-center justify-center gap-2 transition-colors text-xs"
                                                    >
                                                        <Send className="w-3 h-3" /> Enviar Presupuesto
                                                    </button>
                                                )}
                                                {/* Edit Action - Available in PENDING and IN_PROGRESS */}
                                                {(col.id === 'PENDING' || col.id === 'IN_PROGRESS') && (
                                                    <button
                                                        onClick={() => { setSelectedOrder(order); setEditModalOpen(true); }}
                                                        className="w-full bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold py-2 px-4 rounded-lg flex items-center justify-center gap-2 transition-colors border border-indigo-200"
                                                    >
                                                        <PenTool className="w-4 h-4" /> Agregar Insumos
                                                    </button>
                                                )}

                                                {col.id === 'IN_PROGRESS' && (
                                                    <button
                                                        onClick={() => { setSelectedOrder(order); setFinishModalOpen(true); }}
                                                        className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2 px-4 rounded-lg flex items-center justify-center gap-2 transition-colors"
                                                    >
                                                        <CheckCircle className="w-4 h-4" /> Marcar Listo
                                                    </button>
                                                )}
                                                {col.id === 'COMPLETED' && (
                                                    <button
                                                        onClick={async () => {
                                                            await handleTransition(order.id, 'DELIVERED');
                                                            if (onPassToCheckout) onPassToCheckout(order);
                                                        }}
                                                        className="w-full bg-slate-800 hover:bg-slate-900 text-white font-bold py-2 px-4 rounded-lg flex items-center justify-center gap-2 transition-colors"
                                                    >
                                                        <LogOut className="w-4 h-4" /> Pasar a Caja
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                    {colOrders.length === 0 && <div className="text-center text-slate-400 py-8 italic">Sin vehículos</div>}
                                </div>
                            </div>
                        )
                    })}
                </div>
            </div>

            {/* Edit Modal */}
            <EditWorkOrderModal
                isOpen={editModalOpen}
                onClose={() => setEditModalOpen(false)}
                workOrder={selectedOrder}
                onUpdate={fetchOrders}
            />

            {/* Finish Modal */}
            {finishModalOpen && selectedOrder && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 animate-in fade-in zoom-in-95 duration-200">
                        <h3 className="text-xl font-black text-slate-900 mb-4">Finalizar Service - {selectedOrder.vehicle.plate}</h3>

                        <div className="bg-blue-50 p-4 rounded-lg mb-4 border border-blue-100">
                            <h4 className="font-bold text-blue-900 text-sm mb-2">Checklist de Seguridad</h4>
                            <ul className="text-sm text-blue-800 space-y-1">
                                <li>✅ Tapón de cárter ajustado</li>
                                <li>✅ Filtros asegurados</li>
                                <li>✅ Niveles revisados</li>
                                <li>✅ Etiqueta de aceite colocada</li>
                            </ul>
                        </div>

                        <div className="mb-6">
                            <label className="block text-sm font-bold text-slate-700 mb-2">Kilometraje Actual</label>
                            <input
                                type="number"
                                value={mileage}
                                onChange={(e) => setMileage(e.target.value)}
                                className="w-full border-2 border-slate-200 rounded-lg p-3 text-lg font-mono focus:border-indigo-500 outline-none"
                                placeholder="Ej: 54000"
                                autoFocus
                            />
                        </div>

                        <div className="flex gap-3">
                            <button
                                onClick={() => setFinishModalOpen(false)}
                                className="flex-1 py-3 font-bold text-slate-500 hover:bg-slate-100 rounded-lg transition-colors"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={() => handleTransition(selectedOrder.id, 'COMPLETED', { mileage })}
                                disabled={!mileage}
                                className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Confirmar y Notificar
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
