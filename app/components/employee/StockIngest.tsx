'use client';

import { useState, useRef, useEffect } from 'react';
import { Search, Plus, Trash2, Save, ScanBarcode, ArrowDownToLine } from 'lucide-react';

interface Product {
    id: number;
    name: string;
    code: string;
    price: number;
    stock: number;
    category: string;
}

interface StockItem extends Product {
    entryQuantity: number;
}

export default function StockIngest() {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<Product[]>([]);
    const [entryList, setEntryList] = useState<StockItem[]>([]);
    const [loading, setLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const searchInputRef = useRef<HTMLInputElement>(null);

    // Focus search on mount
    useEffect(() => {
        searchInputRef.current?.focus();
    }, []);

    // Debounced search
    useEffect(() => {
        const timer = setTimeout(async () => {
            if (query.trim().length > 1) {
                setLoading(true);
                try {
                    const res = await fetch(`/api/products?search=${encodeURIComponent(query)}`);
                    if (res.ok) {
                        const data = await res.json();
                        setResults(data.products || []);
                    }
                } catch (error) {
                    console.error('Search error:', error);
                } finally {
                    setLoading(false);
                }
            } else {
                setResults([]);
            }
        }, 300);

        return () => clearTimeout(timer);
    }, [query]);

    const addToEntryList = (product: Product) => {
        setEntryList(prev => {
            const existing = prev.find(p => p.id === product.id);
            if (existing) {
                return prev.map(p =>
                    p.id === product.id
                        ? { ...p, entryQuantity: p.entryQuantity + 1 }
                        : p
                );
            }
            return [...prev, { ...product, entryQuantity: 1 }];
        });
        setQuery(''); // Clear search to allow scanning next
        setResults([]);
        searchInputRef.current?.focus();
    };

    const updateQuantity = (id: number, delta: number) => {
        setEntryList(prev => prev.map(item => {
            if (item.id === id) {
                const newQty = Math.max(1, item.entryQuantity + delta);
                return { ...item, entryQuantity: newQty };
            }
            return item;
        }));
    };

    const removeFromList = (id: number) => {
        setEntryList(prev => prev.filter(item => item.id !== id));
    };

    const handleSubmit = async () => {
        if (entryList.length === 0) return;

        if (!confirm(`¿Confirmar ingreso de stock para ${entryList.length} productos?`)) return;

        setSubmitting(true);
        try {
            const payload = {
                items: entryList.map(item => ({
                    productId: item.id,
                    quantity: item.entryQuantity
                }))
            };

            const res = await fetch('/api/stock/entry', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (!res.ok) throw new Error('Failed to update stock');

            // Success
            alert('Stock actualizado correctamente');
            setEntryList([]);
            setQuery('');
        } catch (error) {
            console.error(error);
            alert('Error al actualizar stock');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="flex flex-col h-full md:flex-row gap-4 p-4">
            {/* Left: Search & Results */}
            <div className="flex-1 flex flex-col gap-4">
                <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
                    <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                        <Search className="w-5 h-5 text-emerald-600" />
                        Buscar Producto
                    </h2>
                    <div className="relative">
                        <input
                            ref={searchInputRef}
                            type="text"
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            placeholder="Buscar por nombre, código o escanear..."
                            className="w-full pl-12 pr-4 py-4 text-lg border-2 border-slate-200 rounded-xl focus:border-emerald-500 focus:ring-0 transition-colors"
                        />
                        <ScanBarcode className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-6 h-6" />
                        {loading && (
                            <div className="absolute right-4 top-1/2 -translate-y-1/2">
                                <div className="animate-spin h-5 w-5 border-2 border-emerald-500 rounded-full border-t-transparent"></div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Results Grid */}
                <div className="flex-1 overflow-y-auto bg-white rounded-xl shadow-sm border border-slate-200 p-2">
                    {results.length === 0 && query.length < 2 ? (
                        <div className="h-full flex flex-col items-center justify-center text-slate-400">
                            <ArrowDownToLine className="w-16 h-16 mb-2 opacity-20" />
                            <p>Escanea o busca productos para agregar</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 gap-2">
                            {results.map(product => (
                                <button
                                    key={product.id}
                                    onClick={() => addToEntryList(product)}
                                    className="flex items-center justify-between p-4 hover:bg-emerald-50 rounded-lg border border-transparent hover:border-emerald-200 transition-all group text-left"
                                >
                                    <div>
                                        <h3 className="font-bold text-slate-800">{product.name}</h3>
                                        <p className="text-sm text-slate-500">
                                            Code: {product.code || '-'} | Actual: <span className="font-medium text-slate-700">{product.stock}</span>
                                        </p>
                                    </div>
                                    <Plus className="w-6 h-6 text-emerald-400 group-hover:text-emerald-600" />
                                </button>
                            ))}
                            {results.length === 0 && !loading && query.length >= 2 && (
                                <div className="p-8 text-center text-slate-500">
                                    No se encontraron productos
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* Right: Entry List */}
            <div className="w-full md:w-[450px] flex flex-col bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden">
                <div className="p-4 bg-slate-800 text-white flex justify-between items-center">
                    <h2 className="font-bold text-lg flex items-center gap-2">
                        <ArrowDownToLine className="w-5 h-5" />
                        Lista de Ingreso
                    </h2>
                    <span className="bg-slate-700 px-3 py-1 rounded-full text-sm font-medium">
                        {entryList.length} items
                    </span>
                </div>

                <div className="flex-1 overflow-y-auto p-4 content-start space-y-3">
                    {entryList.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center text-slate-400 space-y-4">
                            <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center">
                                <ArrowDownToLine className="w-8 h-8 text-slate-300" />
                            </div>
                            <p className="text-center max-w-[200px]">
                                Selecciona productos de la izquierda para agregarlos aquí
                            </p>
                        </div>
                    ) : (
                        entryList.map(item => (
                            <div key={item.id} className="flex flex-col p-3 rounded-lg border border-slate-200 bg-slate-50">
                                <div className="flex justify-between items-start mb-2">
                                    <span className="font-bold text-slate-700 line-clamp-2 leading-tight">
                                        {item.name}
                                    </span>
                                    <button
                                        onClick={() => removeFromList(item.id)}
                                        className="text-slate-400 hover:text-red-500 p-1"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>

                                <div className="flex items-center justify-between">
                                    <div className="text-sm text-slate-500">
                                        Stock actual: {item.stock}
                                    </div>
                                    <div className="flex items-center bg-white rounded-lg border border-slate-200 shadow-sm">
                                        <button
                                            onClick={() => updateQuantity(item.id, -1)}
                                            className="w-10 h-9 flex items-center justify-center text-slate-500 hover:bg-slate-100 rounded-l-lg border-r border-slate-200 active:bg-slate-200"
                                        >
                                            -
                                        </button>
                                        <input
                                            type="number"
                                            value={item.entryQuantity}
                                            onChange={(e) => {
                                                const val = parseInt(e.target.value) || 0;
                                                setEntryList(prev => prev.map(p => p.id === item.id ? { ...p, entryQuantity: val } : p));
                                            }}
                                            className="w-16 text-center font-bold text-slate-800 border-none focus:ring-0 py-1"
                                        />
                                        <button
                                            onClick={() => updateQuantity(item.id, 1)}
                                            className="w-10 h-9 flex items-center justify-center text-slate-500 hover:bg-slate-100 rounded-r-lg border-l border-slate-200 active:bg-slate-200"
                                        >
                                            +
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                <div className="p-4 bg-slate-50 border-t border-slate-200">
                    <button
                        onClick={handleSubmit}
                        disabled={entryList.length === 0 || submitting}
                        className="w-full py-4 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white rounded-xl font-bold text-lg shadow-lg shadow-emerald-600/20 active:translate-y-0.5 transition-all flex items-center justify-center gap-2"
                    >
                        {submitting ? (
                            <span className="flex items-center gap-2">
                                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                Procesando...
                            </span>
                        ) : (
                            <>
                                <Save className="w-5 h-5" />
                                CONFIRMAR INGRESO
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}
