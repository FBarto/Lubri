'use client';

import { useState, useEffect, useCallback } from 'react';
import { Quote, QuoteItem, QuoteStatus } from '@prisma/client';
import { searchQuoteItems, saveQuote, updateQuoteStatus } from '@/app/lib/actions/quote-actions';
import { Search, Plus, Trash2, Save, Send, Check } from 'lucide-react';

interface QuoteWithItems extends Partial<Quote> {
    items: Partial<QuoteItem>[];
}

export default function QuoteBuilder({
    caseId,
    initialQuote
}: {
    caseId: string,
    initialQuote: QuoteWithItems | null
}) {
    // State
    const [items, setItems] = useState<Partial<QuoteItem>[]>(initialQuote?.items || []);
    const [discount, setDiscount] = useState(initialQuote?.discount || 0);
    const [paymentTerms, setPaymentTerms] = useState(initialQuote?.paymentTerms || 'Efectivo / Transferencia');
    const [status, setStatus] = useState<QuoteStatus>(initialQuote?.status || 'DRAFT');

    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<any[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    // Totals
    const subtotal = items.reduce((acc, item) => acc + ((item.quantity || 0) * (item.unitPrice || 0)), 0);
    const total = subtotal - discount;

    // Search logic
    useEffect(() => {
        const timer = setTimeout(async () => {
            if (searchQuery.length > 2) {
                setIsSearching(true);
                const res = await searchQuoteItems(searchQuery);
                setSearchResults(res);
                setIsSearching(false);
            } else {
                setSearchResults([]);
            }
        }, 300);
        return () => clearTimeout(timer);
    }, [searchQuery]);

    const addItem = (item: any) => {
        setItems([...items, {
            description: item.description,
            quantity: 1,
            unitPrice: item.unitPrice,
            lineTotal: item.unitPrice,
            kind: item.kind
        }]);
        setSearchQuery('');
        setSearchResults([]);
    };

    const removeItem = (index: number) => {
        setItems(items.filter((_, i) => i !== index));
    };

    const updateItem = (index: number, field: keyof QuoteItem, value: any) => {
        const newItems = [...items];
        newItems[index] = { ...newItems[index], [field]: value };
        if (field === 'quantity' || field === 'unitPrice') {
            const q = field === 'quantity' ? value : (newItems[index].quantity || 0);
            const p = field === 'unitPrice' ? value : (newItems[index].unitPrice || 0);
            newItems[index].lineTotal = q * p;
        }
        setItems(newItems);
    };

    const handleSave = async () => {
        setIsSaving(true);
        const res = await saveQuote(caseId, {
            items: items as any,
            discount,
            paymentTerms
        });
        if (res.success) {
            // Optional toast or feedback
        }
        setIsSaving(false);
    };

    const handleStatusChange = async (newStatus: QuoteStatus) => {
        if (!initialQuote?.id) return;
        const res = await updateQuoteStatus(initialQuote.id, newStatus);
        if (res.success) setStatus(newStatus);
    };

    return (
        <div className="bg-white rounded-lg shadow border p-6 space-y-6">
            <div className="flex justify-between items-center border-b pb-4">
                <h3 className="text-lg font-bold text-slate-800">Presupuesto / Cotización</h3>
                <div className="flex items-center gap-2">
                    <span className={`px-2 py-1 rounded text-xs font-bold ${status === 'DRAFT' ? 'bg-gray-100' :
                            status === 'SENT' ? 'bg-blue-100 text-blue-800' :
                                status === 'ACCEPTED' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
                        {status}
                    </span>
                </div>
            </div>

            {/* Item Search */}
            <div className="relative">
                <div className="flex items-center gap-2 border rounded-lg p-2 focus-within:ring-2 ring-blue-500 bg-slate-50">
                    <Search className="text-slate-400" size={18} />
                    <input
                        type="text"
                        placeholder="Buscar producto o servicio..."
                        className="bg-transparent outline-none w-full text-sm"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
                {searchResults.length > 0 && (
                    <div className="absolute top-full left-0 right-0 bg-white border rounded-lg shadow-xl z-50 mt-1 overflow-hidden">
                        {searchResults.map((res: any) => (
                            <button
                                key={res.id}
                                onClick={() => addItem(res)}
                                className="w-full text-left p-3 hover:bg-slate-50 flex justify-between items-center border-b last:border-0"
                            >
                                <div>
                                    <p className="text-sm font-medium">{res.description}</p>
                                    <p className="text-xs text-slate-500 uppercase">{res.kind}</p>
                                </div>
                                <div className="text-sm font-bold text-blue-600">
                                    ${res.unitPrice.toLocaleString()}
                                </div>
                            </button>
                        ))}
                    </div>
                )}
            </div>

            {/* Items Table */}
            <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                    <thead className="text-xs text-slate-500 uppercase bg-slate-50">
                        <tr>
                            <th className="px-3 py-2">Detalle</th>
                            <th className="px-3 py-2 w-20">Cant</th>
                            <th className="px-3 py-2 w-32">P. Unit</th>
                            <th className="px-3 py-2 w-32">Subtotal</th>
                            <th className="px-3 py-2 w-10"></th>
                        </tr>
                    </thead>
                    <tbody className="divide-y">
                        {items.length === 0 && (
                            <tr>
                                <td colSpan={5} className="px-3 py-8 text-center text-slate-400 italic">
                                    No hay ítems cargados.
                                </td>
                            </tr>
                        )}
                        {items.map((item, index) => (
                            <tr key={index} className="group">
                                <td className="px-3 py-2">
                                    <input
                                        type="text"
                                        value={item.description}
                                        onChange={(e) => updateItem(index, 'description', e.target.value)}
                                        className="w-full bg-transparent focus:bg-white border-transparent focus:border-slate-200 outline-none p-1 rounded"
                                    />
                                </td>
                                <td className="px-3 py-2">
                                    <input
                                        type="number"
                                        value={item.quantity}
                                        onChange={(e) => updateItem(index, 'quantity', parseFloat(e.target.value))}
                                        className="w-full bg-white border border-slate-200 p-1 rounded text-center"
                                    />
                                </td>
                                <td className="px-3 py-2">
                                    <input
                                        type="number"
                                        value={item.unitPrice}
                                        onChange={(e) => updateItem(index, 'unitPrice', parseFloat(e.target.value))}
                                        className="w-full bg-white border border-slate-200 p-1 rounded text-right"
                                    />
                                </td>
                                <td className="px-3 py-2 text-right font-medium">
                                    ${(item.lineTotal || 0).toLocaleString()}
                                </td>
                                <td className="px-3 py-2 text-center">
                                    <button
                                        onClick={() => removeItem(index)}
                                        className="text-slate-300 hover:text-red-500 transition-colors"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Summary & Actions */}
            <div className="flex flex-col md:flex-row justify-between gap-6 pt-4 border-t">
                <div className="flex-1 space-y-4">
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Condiciones de pago</label>
                        <textarea
                            value={paymentTerms || ''}
                            onChange={(e) => setPaymentTerms(e.target.value)}
                            rows={2}
                            className="w-full border rounded-lg p-2 text-sm bg-slate-50 focus:bg-white outline-none"
                            placeholder="Ej: Contado efectivo 10% OFF..."
                        />
                    </div>
                </div>

                <div className="w-full md:w-64 space-y-2">
                    <div className="flex justify-between text-sm">
                        <span className="text-slate-500">Subtotal:</span>
                        <span className="font-medium">${subtotal.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-sm items-center">
                        <span className="text-slate-500">Dto:</span>
                        <input
                            type="number"
                            value={discount}
                            onChange={(e) => setDiscount(parseFloat(e.target.value) || 0)}
                            className="w-24 border rounded p-1 text-right text-sm"
                        />
                    </div>
                    <div className="flex justify-between text-lg font-black border-t pt-2 mt-2">
                        <span>TOTAL:</span>
                        <span className="text-blue-600">${total.toLocaleString()}</span>
                    </div>

                    <button
                        onClick={handleSave}
                        disabled={isSaving}
                        className="w-full mt-4 flex items-center justify-center gap-2 px-4 py-2 bg-slate-800 text-white rounded-lg hover:bg-slate-700 disabled:opacity-50 transition-all font-bold"
                    >
                        <Save size={18} />
                        {isSaving ? 'Guardando...' : 'Guardar Presupuesto'}
                    </button>

                    {initialQuote?.id && (
                        <div className="flex gap-2 mt-2">
                            <button
                                onClick={() => handleStatusChange('ACCEPTED')}
                                className="flex-1 flex items-center justify-center gap-1 px-3 py-1.5 bg-green-50 text-green-700 border border-green-200 rounded-lg hover:bg-green-100 text-xs font-bold"
                            >
                                <Check size={14} /> Reservó
                            </button>
                            <button
                                onClick={() => handleStatusChange('REJECTED')}
                                className="flex-1 flex items-center justify-center gap-1 px-3 py-1.5 bg-red-50 text-red-700 border border-red-200 rounded-lg hover:bg-red-100 text-xs font-bold"
                            >
                                <Trash2 size={14} /> Perder
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
