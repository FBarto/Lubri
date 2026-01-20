'use client';

import { useState, useEffect, useRef } from 'react';
import { Search, Plus, Trash2, Save, FileText, Send, X, Loader2 } from 'lucide-react';
import { searchProductsForQuote, createOrUpdateQuote, getQuote } from '../../lib/inbox-actions';

interface QuoteBuilderProps {
    leadCaseId: string;
    clientPhone?: string;
    onClose?: () => void;
}

export default function QuoteBuilder({ leadCaseId, clientPhone, onClose }: QuoteBuilderProps) {
    const [items, setItems] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [query, setQuery] = useState('');
    const [searchResults, setSearchResults] = useState<any[]>([]);
    const [discount, setDiscount] = useState(0);
    const searchTimeout = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        loadQuote();
    }, [leadCaseId]);

    const loadQuote = async () => {
        const res = await getQuote(leadCaseId);
        if (res.success && res.data) {
            setItems(res.data.items.map((i: any) => ({
                id: i.id || Math.random(),
                name: i.description,
                price: i.unitPrice,
                quantity: i.quantity,
                type: i.kind
            })));
            setDiscount(res.data.discount || 0);
        }
        setLoading(false);
    };

    const handleSearch = (val: string) => {
        setQuery(val);
        if (searchTimeout.current) clearTimeout(searchTimeout.current);
        if (val.length < 2) {
            setSearchResults([]);
            return;
        }

        searchTimeout.current = setTimeout(async () => {
            const res = await searchProductsForQuote(val);
            if (res.success && res.data) {
                setSearchResults(res.data);
            }
        }, 400);
    };

    const addItem = (product: any) => {
        setItems(prev => [
            ...prev,
            { ...product, quantity: 1, type: product.type }
        ]);
        setQuery('');
        setSearchResults([]);
    };

    const updateItem = (index: number, field: string, value: any) => {
        const newItems = [...items];
        newItems[index] = { ...newItems[index], [field]: value };
        setItems(newItems);
    };

    const removeItem = (index: number) => {
        setItems(prev => prev.filter((_, i) => i !== index));
    };

    const calculateTotals = () => {
        const subtotal = items.reduce((sum, i) => sum + (Number(i.price) * Number(i.quantity)), 0);
        const total = subtotal - discount;
        return { subtotal, total };
    };

    const handleSave = async () => {
        setSaving(true);
        const res = await createOrUpdateQuote(leadCaseId, items, discount);
        setSaving(false);
        if (res.success) {
            alert('Presupuesto Guardado');
        } else {
            alert('Error al guardar');
        }
    };

    const handleWhatsApp = async () => {
        await handleSave(); // Save first
        const { total } = calculateTotals();

        let msg = `*Presupuesto FB Lubricentro*\n\n`;
        items.forEach(i => {
            msg += `- ${i.name} (x${i.quantity}): $${(i.price * i.quantity).toLocaleString()}\n`;
        });

        if (discount > 0) msg += `\nDescuento: -$${discount.toLocaleString()}`;
        msg += `\n\n*TOTAL: $${total.toLocaleString()}*`;
        msg += `\n\nValidez: 7 días.`;

        const url = `https://wa.me/${clientPhone?.replace(/\D/g, '')}?text=${encodeURIComponent(msg)}`;
        window.open(url, '_blank');
    };

    if (loading) return <div className="p-4 flex justify-center"><Loader2 className="animate-spin text-slate-400" /></div>;

    const { subtotal, total } = calculateTotals();

    return (
        <div className="bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden flex flex-col h-full max-h-[600px]">
            <div className="p-4 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
                <h3 className="font-bold text-slate-700 flex items-center gap-2">
                    <FileText className="w-4 h-4 text-blue-600" />
                    Constructor de Presupuesto
                </h3>
                {onClose && <button onClick={onClose}><X className="w-5 h-5 text-slate-400 hover:text-red-500" /></button>}
            </div>

            <div className="p-4 border-b border-slate-100 bg-white z-10">
                <div className="relative">
                    <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                    <input
                        type="text"
                        value={query}
                        onChange={e => handleSearch(e.target.value)}
                        placeholder="Buscar producto o servicio..."
                        className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-100 outline-none"
                    />
                    {searchResults.length > 0 && (
                        <div className="absolute top-full left-0 right-0 bg-white border border-slate-200 rounded-lg shadow-xl mt-1 max-h-48 overflow-y-auto z-50">
                            {searchResults.map((res: any) => (
                                <button
                                    key={res.type + res.id}
                                    onClick={() => addItem(res)}
                                    className="w-full text-left px-4 py-2 hover:bg-blue-50 text-xs flex justify-between"
                                >
                                    <span className="font-bold text-slate-700">{res.name}</span>
                                    <span className="text-slate-500">${res.price}</span>
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 content-start">
                {items.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-slate-400 text-sm">
                        <FileText className="w-8 h-8 mb-2 opacity-20" />
                        Sin ítems
                    </div>
                ) : (
                    <div className="space-y-2">
                        {items.map((item, idx) => (
                            <div key={idx} className="flex items-center gap-2 bg-slate-50 p-2 rounded-lg border border-slate-100">
                                <div className="flex-1">
                                    <div className="font-bold text-xs text-slate-700 truncate">{item.name}</div>
                                    <div className="text-[10px] text-slate-400 ml-1">{item.type}</div>
                                </div>
                                <input
                                    type="number"
                                    value={item.quantity}
                                    onChange={e => updateItem(idx, 'quantity', Number(e.target.value))}
                                    className="w-12 p-1 text-center text-xs border rounded"
                                    min="1"
                                />
                                <input
                                    type="number"
                                    value={item.price}
                                    onChange={e => updateItem(idx, 'price', Number(e.target.value))}
                                    className="w-20 p-1 text-right text-xs border rounded"
                                />
                                <div className="w-16 text-right text-xs font-bold text-slate-700">
                                    ${(item.price * item.quantity).toLocaleString()}
                                </div>
                                <button onClick={() => removeItem(idx)} className="p-1 text-slate-400 hover:text-red-500">
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-200">
                <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-bold text-slate-500">Subtotal:</span>
                    <span className="font-mono text-slate-700">${subtotal.toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center mb-4">
                    <span className="text-sm font-bold text-slate-500">Descuento:</span>
                    <input
                        type="number"
                        value={discount}
                        onChange={e => setDiscount(Number(e.target.value))}
                        className="w-24 text-right p-1 text-sm border rounded"
                    />
                </div>
                <div className="flex justify-between items-center mb-4 pt-2 border-t border-slate-200">
                    <span className="text-lg font-black text-slate-800">TOTAL:</span>
                    <span className="text-xl font-black text-blue-600">${total.toLocaleString()}</span>
                </div>

                <div className="grid grid-cols-2 gap-3">
                    <button
                        onClick={handleSave}
                        disabled={saving}
                        className="py-2 bg-slate-800 text-white rounded-lg font-bold text-sm flex justify-center items-center gap-2 hover:bg-slate-900"
                    >
                        {saving ? <Loader2 className="animate-spin w-4 h-4" /> : <Save className="w-4 h-4" />}
                        Guardar
                    </button>
                    <button
                        onClick={handleWhatsApp}
                        disabled={items.length === 0}
                        className="py-2 bg-green-500 text-white rounded-lg font-bold text-sm flex justify-center items-center gap-2 hover:bg-green-600"
                    >
                        <Send className="w-4 h-4" /> Enviar WA
                    </button>
                </div>
            </div>
        </div>
    );
}
