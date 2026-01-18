
'use client';

import { useState, useEffect } from 'react';
import { Search, Plus, Trash2, Save, X } from 'lucide-react';

interface Product {
    id: number;
    name: string;
    price: number;
    code: string;
    stock: number;
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
    }, [workOrder]);

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
                    <h3 className="font-black text-slate-800 text-lg">Editar Orden: {workOrder.vehicle.plate}</h3>
                    <button onClick={onClose}><X size={20} className="text-slate-400 hover:text-slate-600" /></button>
                </div>

                <div className="p-6 overflow-y-auto flex-1">
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
                                            <div className="font-bold text-slate-800 group-hover:text-blue-700">{p.name}</div>
                                            <div className="text-xs text-slate-500">Stock: {p.stock} | ${p.price}</div>
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
