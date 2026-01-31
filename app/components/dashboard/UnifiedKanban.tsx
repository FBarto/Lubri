'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { Play, CheckCircle, LogOut, Send, Clock, FileCheck, FileX, PenTool, Calendar, User, Truck } from 'lucide-react';
import { sendBudgetForApproval, generateVehicleReadyWhatsAppLink } from '../../lib/approval-actions';
import EditWorkOrderModal from '../employee/EditWorkOrderModal';

// --- Types ---
type CardType = 'APPOINTMENT' | 'WORK_ORDER';

interface KanbanCard {
    id: string; // Composite ID for key
    realId: number;
    type: CardType;
    status: string;
    clientName: string;
    clientPhone: string;
    plate: string;
    vehicleName: string;
    serviceName: string;
    date: string;

    // WorkOrder specific
    employeeName?: string;
    approvalStatus?: string;

    // Original Objects
    originalAppt?: any;
    originalOrder?: any;
}

const COLUMNS = [
    // Appointment Stages
    { id: 'APP_REQUESTED', title: 'Solicitado', color: 'bg-yellow-50 border-yellow-200', type: 'APPOINTMENT' },
    { id: 'APP_CONFIRMED', title: 'Confirmado', color: 'bg-blue-50 border-blue-200', type: 'APPOINTMENT' },
    { id: 'APP_TODAY', title: 'En Cola (Hoy)', color: 'bg-orange-50 border-orange-200', type: 'APPOINTMENT' },

    // Work Order Stages (The "Taller" part)
    { id: 'WO_PENDING', title: 'Ingresó Taller', color: 'bg-indigo-50 border-indigo-200', type: 'WORK_ORDER' },
    { id: 'WO_PROGRESS', title: 'En Proceso', color: 'bg-blue-100 border-blue-400', type: 'WORK_ORDER' },
    { id: 'WO_COMPLETED', title: 'Listo / Avisar', color: 'bg-emerald-50 border-emerald-300', type: 'WORK_ORDER' },
];

export default function UnifiedKanban({ onPassToCheckout }: { onPassToCheckout?: (wo: any) => void }) {
    const { data: session } = useSession();
    const [cards, setCards] = useState<KanbanCard[]>([]);
    const [loading, setLoading] = useState(true);
    const [draggedCard, setDraggedCard] = useState<KanbanCard | null>(null);

    // Modals
    const [finishModalOpen, setFinishModalOpen] = useState(false);
    const [editModalOpen, setEditModalOpen] = useState(false);
    const [selectedOrder, setSelectedOrder] = useState<any | null>(null);
    const [mileage, setMileage] = useState('');
    const [finishDate, setFinishDate] = useState(''); // New: Backdating
    const [checklist, setChecklist] = useState({
        oilFilter: true,
        airFilter: false,
        fuelFilter: false,
        cabinFilter: false
    });

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const [apptRes, woRes] = await Promise.all([
                fetch('/api/appointments?active=true'), // Should return non-done appointments
                fetch('/api/work-orders/kanban')
            ]);

            const appts = await apptRes.json();
            const wos = await woRes.json();

            const mappedCards: KanbanCard[] = [];

            // Map Appointments
            if (Array.isArray(appts)) {
                appts.forEach((a: any) => {
                    // Map Status
                    let colId = 'APP_REQUESTED';
                    if (a.status === 'CONFIRMED') colId = 'APP_CONFIRMED';
                    if (a.status === 'TODAY_QUEUE') colId = 'APP_TODAY';

                    // Filter out done/cancelled for the board (unless we want a cancelled col?)
                    if (['DONE', 'CANCELLED', 'NO_SHOW'].includes(a.status)) return;

                    mappedCards.push({
                        id: `appt-${a.id}`,
                        realId: a.id,
                        type: 'APPOINTMENT',
                        status: colId,
                        clientName: a.client.name,
                        clientPhone: a.client.phone,
                        plate: a.vehicle.plate,
                        vehicleName: `${a.vehicle.brand} ${a.vehicle.model}`,
                        serviceName: a.service.name,
                        date: a.date,
                        originalAppt: a
                    });
                });
            }

            // Map Work Orders
            if (Array.isArray(wos)) {
                wos.forEach((w: any) => {
                    let colId = 'WO_PENDING';
                    if (w.status === 'IN_PROGRESS') colId = 'WO_PROGRESS';
                    if (w.status === 'COMPLETED') colId = 'WO_COMPLETED';
                    if (w.status === 'DELIVERED') return; // Hide delivered

                    mappedCards.push({
                        id: `wo-${w.id}`,
                        realId: w.id,
                        type: 'WORK_ORDER',
                        status: colId,
                        clientName: w.client.name,
                        clientPhone: '', // WO fetch needs client phone if consistent
                        plate: w.vehicle.plate,
                        vehicleName: `${w.vehicle.brand} ${w.vehicle.model}`,
                        serviceName: w.service.name,
                        date: w.date,
                        employeeName: w.user?.name,
                        approvalStatus: w.approvalStatus,
                        originalOrder: w
                    });
                });
            }

            setCards(mappedCards);

        } catch (error) {
            console.error("Error fetching board:", error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
        const interval = setInterval(fetchData, 30000);
        return () => clearInterval(interval);
    }, [fetchData]);

    // --- Actions ---

    const handleDragStart = (e: React.DragEvent, card: KanbanCard) => {
        setDraggedCard(card);
        e.dataTransfer.effectAllowed = 'move';
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
    };

    const handleDrop = async (e: React.DragEvent, targetColId: string) => {
        e.preventDefault();
        if (!draggedCard) return;
        if (draggedCard.status === targetColId) return;

        const sourceColId = draggedCard.status;

        // 1. Appt -> Appt movement
        if (targetColId.startsWith('APP_')) {
            if (draggedCard.type !== 'APPOINTMENT') return; // Can't move WO back to Appt easily

            let newStatus = 'REQUESTED';
            if (targetColId === 'APP_CONFIRMED') newStatus = 'CONFIRMED';
            if (targetColId === 'APP_TODAY') newStatus = 'TODAY_QUEUE';

            updateCardLocally(draggedCard.id, targetColId);
            await fetch(`/api/appointments/${draggedCard.realId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: newStatus })
            });
        }

        // 2. WO -> WO movement
        if (targetColId.startsWith('WO_')) {
            if (draggedCard.type === 'WORK_ORDER') {
                let newStatus = 'PENDING';
                if (targetColId === 'WO_PROGRESS') newStatus = 'IN_PROGRESS';
                if (targetColId === 'WO_COMPLETED') newStatus = 'COMPLETED';

                updateCardLocally(draggedCard.id, targetColId);
                await updateWorkOrderStatus(draggedCard.realId, newStatus);
            }

            // 3. SPECIAL: Appointment -> Work Order (Conversion)
            if (draggedCard.type === 'APPOINTMENT') {
                if (!confirm(`¿Iniciar Orden de Trabajo para ${draggedCard.plate}?`)) return;

                // Create WO from Appt
                try {
                    const res = await fetch('/api/work-orders', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            vehicleId: draggedCard.originalAppt.vehicle.id,
                            clientId: draggedCard.originalAppt.client.id,
                            serviceId: draggedCard.originalAppt.service.id,
                            notes: draggedCard.originalAppt.notes
                        })
                    });

                    if (res.ok) {
                        // Mark Appt as DONE
                        await fetch(`/api/appointments/${draggedCard.realId}`, {
                            method: 'PATCH',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ status: 'DONE' })
                        });
                        fetchData(); // Refresh to swap card
                    }
                } catch (e) {
                    console.error("Conversion failed", e);
                }
            }
        }

        setDraggedCard(null);
    };

    const updateCardLocally = (id: string, newCol: string) => {
        setCards(prev => prev.map(c => c.id === id ? { ...c, status: newCol } : c));
    };

    const updateWorkOrderStatus = async (id: number, status: string, extraData: any = {}) => {
        await fetch(`/api/work-orders/${id}/status`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status, userId: session?.user?.id, ...extraData })
        });

        if (status === 'COMPLETED') {
            const waRes = await generateVehicleReadyWhatsAppLink(id);
            if (waRes.success && waRes.waUrl) window.open(waRes.waUrl, '_blank');
        }
        fetchData();
    };

    // --- Render Helpers ---

    const renderCard = (card: KanbanCard) => {
        const isAppt = card.type === 'APPOINTMENT';

        return (
            <div
                key={card.id}
                draggable
                onDragStart={(e) => handleDragStart(e, card)}
                className={`bg-white p-3 rounded-xl shadow-sm border hover:shadow-md transition-all cursor-grab active:cursor-grabbing relative group ${isAppt ? 'border-slate-100' : 'border-indigo-100'}`}
            >
                {/* Header */}
                <div className="flex justify-between items-start mb-2">
                    <span className="font-mono text-[10px] font-bold text-slate-400 bg-slate-50 px-1.5 py-0.5 rounded border border-slate-100">
                        {new Date(card.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                    {isAppt ? (
                        <div className="bg-yellow-100 text-yellow-700 text-[10px] px-1.5 py-0.5 rounded font-bold">TURN</div>
                    ) : (
                        <div className="bg-indigo-100 text-indigo-700 text-[10px] px-1.5 py-0.5 rounded font-bold">ORDEN</div>
                    )}
                </div>

                {/* Main Info */}
                <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-black text-slate-800 text-base">{card.plate}</h4>
                    {!isAppt && card.originalOrder?.approvalStatus === 'PENDING' && (
                        <span title="Esperando aprobación" className="text-amber-500 animate-pulse">⚠️</span>
                    )}
                </div>

                <div className="text-xs text-slate-500 mb-2 truncate">{card.vehicleName}</div>

                {/* Service Badge */}
                <div className="bg-slate-50 p-1.5 rounded-lg border border-slate-100 text-xs font-bold text-slate-600 mb-2 truncate">
                    {card.serviceName}
                </div>

                {/* Footer / Actions */}
                <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-50">
                    <div className="flex items-center gap-1.5">
                        <div className="h-5 w-5 rounded-full bg-slate-100 flex items-center justify-center text-[10px] font-bold text-slate-400">
                            {card.clientName.charAt(0)}
                        </div>
                        <span className="text-[10px] font-bold text-slate-400 max-w-[80px] truncate">{card.clientName}</span>
                    </div>

                    {/* Quick Actions */}
                    <div className="flex gap-1">
                        {isAppt && (
                            <button className="text-green-500 hover:bg-green-50 p-1 rounded transition-colors" title="WhatsApp">
                                <Send size={14} />
                            </button>
                        )}
                        {!isAppt && card.status === 'WO_PROGRESS' && (
                            <button
                                onClick={() => { setSelectedOrder(card.originalOrder); setFinishModalOpen(true); }}
                                className="text-emerald-600 hover:bg-emerald-50 p-1 rounded transition-colors font-bold text-xs"
                            >
                                <CheckCircle size={16} />
                            </button>
                        )}
                        {!isAppt && card.status === 'WO_COMPLETED' && (
                            <button
                                onClick={() => {
                                    updateWorkOrderStatus(card.realId, 'DELIVERED');
                                    if (onPassToCheckout) onPassToCheckout(card.originalOrder);
                                }}
                                className="text-slate-600 hover:bg-slate-100 p-1 rounded transition-colors font-bold text-xs"
                            >
                                <LogOut size={16} />
                            </button>
                        )}
                        {!isAppt && (card.status === 'WO_PENDING' || card.status === 'WO_PROGRESS') && (
                            <button
                                onClick={() => { setSelectedOrder(card.originalOrder); setEditModalOpen(true); }}
                                className="text-indigo-400 hover:bg-indigo-50 p-1 rounded transition-colors"
                            >
                                <PenTool size={14} />
                            </button>
                        )}
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className="h-full flex flex-col bg-slate-50 p-4">
            <header className="flex justify-between items-center mb-4">
                <div>
                    <h2 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                        <Truck className="text-indigo-600" />
                        Tablero Unificado
                    </h2>
                    <p className="text-slate-400 text-xs font-bold uppercase tracking-wider">De Turnos a Entregas</p>
                </div>
                <button onClick={fetchData} className="bg-white p-2 rounded-lg border shadow-sm hover:bg-slate-50">↻</button>
            </header>

            <div className="flex-1 overflow-x-auto pb-4">
                <div className="flex gap-4 h-full min-w-max">
                    {COLUMNS.map(col => {
                        const colCards = cards.filter(c => c.status === col.id);
                        return (
                            <div key={col.id} className={`w-72 flex-shrink-0 flex flex-col rounded-2xl border-t-4 ${col.color} bg-white/50`}>
                                <div className="p-3 border-b border-black/5 bg-white/80 backdrop-blur rounded-t-xl flex justify-between items-center">
                                    <h3 className="font-black text-slate-700 text-xs uppercase tracking-wider">{col.title}</h3>
                                    <span className="bg-slate-200 text-slate-600 text-[10px] font-bold px-1.5 py-0.5 rounded-full">{colCards.length}</span>
                                </div>
                                <div
                                    className="flex-1 p-2 space-y-2 overflow-y-auto"
                                    onDragOver={handleDragOver}
                                    onDrop={(e) => handleDrop(e, col.id)}
                                >
                                    {colCards.map(renderCard)}
                                    {colCards.length === 0 && (
                                        <div className="h-full flex items-center justify-center border-2 border-dashed border-slate-200 rounded-xl m-2 opacity-50">
                                            <span className="text-xs font-bold text-slate-300">Vacío</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Modals reused from OperationalKanban logic */}
            <EditWorkOrderModal
                isOpen={editModalOpen}
                onClose={() => setEditModalOpen(false)}
                workOrder={selectedOrder}
                onUpdate={fetchData}
            />

            {finishModalOpen && selectedOrder && (
                <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6 animate-in zoom-in-95">
                        <h3 className="text-lg font-black text-slate-900 mb-4">Finalizar Service</h3>

                        {/* Date Picker (Backdating) */}
                        <div className="mb-4">
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Fecha (Opcional)</label>
                            <input
                                type="datetime-local"
                                value={finishDate}
                                onChange={(e) => setFinishDate(e.target.value)}
                                className="w-full border border-slate-200 rounded-lg p-2 font-mono text-sm"
                            />
                        </div>

                        <input
                            type="number"
                            value={mileage}
                            onChange={(e) => setMileage(e.target.value)}
                            className="w-full border-2 border-slate-200 rounded-xl p-3 font-bold text-center text-xl outline-none focus:border-emerald-500 mb-4"
                            placeholder="Km Actual"
                            autoFocus
                        />
                        <div className="flex gap-2">
                            <button onClick={() => setFinishModalOpen(false)} className="flex-1 py-3 font-bold text-slate-400 hover:bg-slate-50 rounded-xl">Cancelar</button>
                            <button
                                onClick={() => {
                                    updateWorkOrderStatus(selectedOrder.id, 'COMPLETED', { mileage, checklist, date: finishDate });
                                    setFinishModalOpen(false);
                                    setMileage('');
                                    setFinishDate('');
                                }}
                                disabled={!mileage}
                                className="flex-1 py-3 bg-emerald-600 text-white font-bold rounded-xl disabled:opacity-50"
                            >
                                Confirmar
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
