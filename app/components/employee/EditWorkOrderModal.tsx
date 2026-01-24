
'use client';

import { useState, useEffect } from 'react';
import { Search, Plus, Trash2, Save, X, AlertTriangle, Sparkles } from 'lucide-react';
import { getVehicleMaintenanceHistory } from '../../lib/maintenance-actions';
import { MaintenanceStatus } from '../../lib/maintenance-data';

interface Product {
    id: number;
    name: string;
    price: number;
    code: string;
    stock: number;
    minStock: number;
}

interface OrderItem {
    productId: number;
    name: string;
    quantity: number;
    unitPrice: number;
}

interface EditWorkOrderModalProps {
    isOpen: boolean;
    onClose: () => void;
    workOrder: any;
    onUpdate: () => void;
}

export default function EditWorkOrderModal({ isOpen, onClose, workOrder, onUpdate }: EditWorkOrderModalProps) {
    const [items, setItems] = useState<OrderItem[]>([]);
    const [search, setSearch] = useState('');
    const [searchResults, setSearchResults] = useState<Product[]>([]);
    const [loading, setLoading] = useState(false);
    const [recommendations, setRecommendations] = useState<MaintenanceStatus[]>([]);
    const [recoLoading, setRecoLoading] = useState(false);

    useEffect(() => {
        if (workOrder?.serviceDetails && typeof workOrder.serviceDetails === 'object') {
            const details = workOrder.serviceDetails as any;
            if (Array.isArray(details.items)) {
                setItems(details.items);
            } else {
                setItems([]);
            }
        } else {
            setItems([]);
        }

        if (isOpen && workOrder?.vehicleId) {
            loadRecommendations();
        }
    }, [workOrder, isOpen]);

    const loadRecommendations = async () => {
        setRecoLoading(true);
        const res = await getVehicleMaintenanceHistory(workOrder.vehicleId);
        if (res.success && res.data) {
            // Flatten all items that are Warning, Danger or Unknown (never done)
            const allItems = [
                ...res.data.filters,
                ...res.data.fluids,
                ...res.data.services
            ].filter(i => i.status !== 'OK');
            setRecommendations(allItems);
        }
        setRecoLoading(false);
    };

    const handleSearch = async (term: string) => {
        setSearch(term);
        if (term.length > 2) {
            setLoading(true);
            try {
                const res = await fetch(`/api/products?search=${term}`);
                const data = await res.json();
                setSearchResults(Array.isArray(data) ? data : (data.data || []));
            } catch (e) {
                console.error(e);
            } finally {
                setLoading(false);
            }
        } else {
            setSearchResults([]);
        }
    };

    const addItem = (product: Product) => {
        setItems(prev => {
            const existing = prev.find(i => i.productId === product.id);
            if (existing) {
                return prev.map(i => i.productId === product.id ? { ...i, quantity: i.quantity + 1 } : i);
            }
            return [...prev, {
                productId: product.id,
                name: product.name,
                quantity: 1,
                unitPrice: product.price
            }];
        });
        setSearch('');
        setSearchResults([]);
    };

    const removeItem = (index: number) => {
        setItems(prev => prev.filter((_, i) => i !== index));
    };

    const updateQuantity = (index: number, delta: number) => {
        setItems(prev => prev.map((item, i) => {
            if (i === index) {
                const newQty = Math.max(1, item.quantity + delta);
                return { ...item, quantity: newQty };
            }
            return item;
        }));
    };

    const handleSave = async () => {
        try {
            const res = await fetch(`/api/work-orders/${workOrder.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    serviceDetails: { items }
                })
            });

            if (res.ok) {
                onUpdate();
                onClose();
            } else {
                alert('Error al guardar cambios');
            }
        } catch (e) {
            console.error(e);
            alert('Error al guardar');
        }
    };

    if (!isOpen || !workOrder) return null;

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl flex flex-col max-h-[90vh]">
                <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50 rounded-t-xl">
                    <h3 className="font-black text-slate-800 text-lg">Editar Presupuesto: {workOrder.vehicle.plate} ({workOrder.service?.name})</h3>
                    <button onClick={onClose}><X size={20} className="text-slate-400 hover:text-slate-600" /></button>
                </div>

                <div className="p-6 overflow-y-auto flex-1">
                    {/* Recommendations Section */}
                    {recommendations.length > 0 && (
                        <div className="mb-6 animate-in slide-in-from-top-2 duration-300">
                            <div className="flex items-center gap-2 mb-3">
                                <Sparkles className="text-amber-500 w-4 h-4" />
                                <h4 className="text-sm font-black text-slate-700 uppercase tracking-wider">Sugerencias de Mantenimiento</h4>
                            </div>
                            <div className="flex flex-wrap gap-2">
                                {recommendations.map((reco, idx) => (
                                    <button
                                        key={idx}
                                        onClick={() => handleSearch(reco.label)}
                                        className="flex items-center gap-2 px-3 py-2 bg-amber-50 border border-amber-200 rounded-lg text-amber-700 hover:bg-amber-100 transition-colors group text-sm"
                                    >
                                        <AlertTriangle size={14} className="text-amber-500" />
                                        <div className="text-left">
                                            <span className="font-bold block leading-none">{reco.label}</span>
                                            <span className="text-[10px] opacity-70">
                                                {reco.lastDate ? `Hace ${reco.daysAgo} días` : 'Nunca registrado'}
                                            </span>
                                        </div>
                                        <Plus size={14} className="ml-1 opacity-50 group-hover:opacity-100" />
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Add Item Section */}
                    <div className="mb-8 relative">
                        <label className="block text-sm font-bold text-slate-700 mb-2">Agregar Producto / Insumo</label>
                        <div className="flex gap-2">
                            <div className="relative flex-1">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                                <input
                                    type="text"
                                    className="w-full pl-10 pr-4 py-3 border rounded-xl bg-slate-50 focus:ring-2 ring-blue-500 outline-none"
                                    placeholder="Buscar aceite, filtro..."
                                    value={search}
                                    onChange={e => handleSearch(e.target.value)}
                                />
                            </div>
                        </div>

                        {/* Search Results Dropdown */}
                        {searchResults.length > 0 && (
                            <div className="absolute z-10 w-full bg-white border rounded-xl mt-2 shadow-xl max-h-48 overflow-y-auto">
                                {searchResults.map(p => (
                                    <button
                                        key={p.id}
                                        onClick={() => addItem(p)}
                                        className="w-full text-left p-3 hover:bg-blue-50 border-b last:border-0 border-slate-100 flex justify-between items-center group"
                                    >
                                        <div>
                                            <div className="font-bold text-slate-800 group-hover:text-blue-700 flex items-center gap-2">
                                                {p.name}
                                                {p.stock <= p.minStock && (
                                                    <AlertTriangle size={12} className="text-amber-500" />
                                                )}
                                            </div>
                                            <div className={`text-xs ${p.stock <= p.minStock ? 'text-amber-600 font-bold' : 'text-slate-500'}`}>
                                                Stock: {p.stock} (mín: {p.minStock}) | ${p.price}
                                            </div>
                                        </div>
                                        <Plus size={16} className="text-blue-500" />
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Items List */}
                    <div>
                        <h4 className="font-bold text-slate-700 mb-4 flex items-center gap-2">
                            Items Cargados
                            <span className="bg-slate-200 text-slate-600 text-xs px-2 py-0.5 rounded-full">{items.length}</span>
                        </h4>

                        {items.length === 0 ? (
                            <div className="text-center py-8 text-slate-400 border-2 border-dashed border-slate-200 rounded-xl">
                                No se agregaron insumos extra
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {items.map((item, idx) => (
                                    <div key={idx} className="flex justify-between items-center p-3 bg-white border border-slate-100 rounded-lg shadow-sm">
                                        <div className="flex-1">
                                            <div className="font-bold text-slate-800">{item.name}</div>
                                            <div className="text-xs text-slate-500">${item.unitPrice} c/u</div>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <div className="flex items-center bg-slate-100 rounded-lg">
                                                <button onClick={() => updateQuantity(idx, -1)} className="p-2 hover:bg-slate-200 rounded-l-lg font-bold">-</button>
                                                <span className="w-8 text-center font-mono font-bold text-sm">{item.quantity}</span>
                                                <button onClick={() => updateQuantity(idx, 1)} className="p-2 hover:bg-slate-200 rounded-r-lg font-bold">+</button>
                                            </div>
                                            <button onClick={() => removeItem(idx)} className="text-red-400 hover:text-red-600 p-2">
                                                <Trash2 size={18} />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                                {/* TOTAL FOOTER - Detailed Breakdown */}
                                <div className="mt-6 pt-4 border-t-2 border-slate-100 space-y-3 bg-slate-50/50 p-4 rounded-xl">
                                    <div className="flex justify-between items-center text-xs">
                                        <span className="text-slate-500 font-bold uppercase tracking-wider">Servicio Base ({workOrder.service?.name})</span>
                                        <span className="text-slate-700 font-bold">${(workOrder.price || 0).toLocaleString()}</span>
                                    </div>
                                    <div className="flex justify-between items-center text-xs">
                                        <span className="text-slate-500 font-bold uppercase tracking-wider">Subtotal Insumos Extra</span>
                                        <span className="text-slate-700 font-bold">${items.reduce((sum, i) => sum + (i.unitPrice * i.quantity), 0).toLocaleString()}</span>
                                    </div>
                                    <div className="pt-3 border-t border-slate-200 flex justify-between items-center">
                                        <div className="flex flex-col">
                                            <span className="text-[10px] text-slate-400 font-black uppercase tracking-widest leading-none">Total Estimado</span>
                                            <span className="text-xs text-slate-400 italic font-medium">Sujeto a cambios en caja</span>
                                        </div>
                                        <div className="text-3xl font-black text-indigo-600 tracking-tighter">
                                            ${((workOrder.price || 0) + items.reduce((sum, i) => sum + (i.unitPrice * i.quantity), 0)).toLocaleString()}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                <div className="p-4 border-t border-slate-100 bg-slate-50 rounded-b-xl flex justify-end gap-3">
                    <button onClick={onClose} className="px-6 py-3 font-bold text-slate-500 hover:bg-slate-200 rounded-xl">Cancelar</button>
                    <button onClick={handleSave} className="px-8 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-lg flex items-center gap-2">
                        <Save size={18} /> Guardar Insumos
                    </button>
                </div>
            </div>
        </div>
    );
}
