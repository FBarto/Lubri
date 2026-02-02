'use client';

import { useState, useEffect } from 'react';
import { Search, AlertTriangle, CheckCircle, Edit2, Save, X, TrendingDown, Clock } from 'lucide-react';
import { updateProductMinStock, getStockStats } from '../../actions/business';

export default function StockViewer() {
    const [products, setProducts] = useState<any[]>([]);
    const [stats, setStats] = useState<Record<number, { weeklyRate: number }>>({});
    const [search, setSearch] = useState('');
    const [loading, setLoading] = useState(true);
    const [editingId, setEditingId] = useState<number | null>(null);
    const [editValue, setEditValue] = useState('');

    const startEdit = (product: any) => {
        setEditingId(product.id);
        setEditValue(String(product.minStock || 0));
    };

    const saveEdit = async (productId: number) => {
        const val = parseFloat(editValue);
        if (isNaN(val)) return;

        await updateProductMinStock(productId, val);

        // Optimistic update
        setProducts(products.map(p => p.id === productId ? { ...p, minStock: val } : p));
        setEditingId(null);
    };

    useEffect(() => {
        const p1 = fetch('/api/products?limit=1000')
            .then(res => res.json())
            .then(data => {
                const list = Array.isArray(data) ? data : (data.data || []);
                setProducts(list);
            });

        const p2 = getStockStats().then(res => {
            if (res.success && res.data) setStats(res.data);
        });

        Promise.all([p1, p2])
            .catch(err => console.error('Error fetching data:', err))
            .finally(() => setLoading(false));
    }, []);

    const filtered = Array.isArray(products) ? products.filter(p =>
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        (p.code && p.code.toLowerCase().includes(search.toLowerCase()))
    ) : [];

    return (
        <div className="p-6 h-[calc(100vh-140px)] flex flex-col">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-slate-800">Consulta de Stock</h2>
                <div className="relative w-96">
                    <Search className="absolute left-3 top-2.5 text-slate-400 w-5 h-5" />
                    <input
                        type="text"
                        placeholder="Buscar producto por nombre o código..."
                        className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-slate-900 outline-none"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
            </div>

            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex-1 relative">
                <div className="overflow-y-auto absolute inset-0">
                    <table className="w-full text-left">
                        <thead className="bg-slate-50 border-b border-slate-200 sticky top-0 z-10 shadow-sm">
                            <tr>
                                <th className="p-4 font-bold text-slate-500 text-xs uppercase tracking-wider">Código</th>
                                <th className="p-4 font-bold text-slate-500 text-xs uppercase tracking-wider">Producto</th>
                                <th className="p-4 font-bold text-slate-500 text-xs uppercase tracking-wider text-right">Precio</th>
                                <th className="p-4 font-bold text-slate-500 text-xs uppercase tracking-wider text-center">Consumo (30d)</th>
                                <th className="p-4 font-bold text-slate-500 text-xs uppercase tracking-wider text-center">Estado</th>
                                <th className="p-4 font-bold text-slate-500 text-xs uppercase tracking-wider text-right">Mínimo</th>
                                <th className="p-4 font-bold text-slate-500 text-xs uppercase tracking-wider text-right">Stock</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {filtered.map(product => (
                                <tr key={product.id} className="hover:bg-slate-50 transition-colors">
                                    <td className="p-4 font-mono text-slate-500 text-sm">{product.code || '-'}</td>
                                    <td className="p-4 font-medium text-slate-800">{product.name}</td>
                                    <td className="p-4 font-bold text-slate-600 text-right">${product.price}</td>
                                    <td className="p-4 text-center">
                                        {stats[product.id] ? (
                                            <div className="flex flex-col items-center">
                                                <span className="text-xs font-bold text-slate-700 flex items-center gap-1">
                                                    <TrendingDown className="w-3 h-3 text-slate-400" />
                                                    {stats[product.id].weeklyRate}/sem
                                                </span>
                                                {product.stock > 0 && stats[product.id].weeklyRate > 0 && (
                                                    <span className={`text-[10px] px-1.5 py-0.5 rounded-full mt-1 font-bold ${(product.stock / (stats[product.id].weeklyRate / 7)) < 7 ? 'bg-red-100 text-red-600' : 'bg-slate-100 text-slate-500'
                                                        }`}>
                                                        {Math.round(product.stock / (stats[product.id].weeklyRate / 7))} días
                                                    </span>
                                                )}
                                            </div>
                                        ) : (
                                            <span className="text-xs text-slate-300">-</span>
                                        )}
                                    </td>
                                    <td className="p-4 text-center">
                                        {product.stock <= 0 ? (
                                            <span className="inline-flex items-center gap-1 bg-red-100 text-red-700 px-2 py-1 rounded text-xs font-bold uppercase">
                                                <AlertTriangle size={12} /> Sin Stock
                                            </span>
                                        ) : product.stock <= (product.minStock || 0) ? (
                                            <span className="inline-flex items-center gap-1 bg-amber-100 text-amber-700 px-2 py-1 rounded text-xs font-bold uppercase">
                                                <AlertTriangle size={12} /> Bajo
                                            </span>
                                        ) : (
                                            <span className="inline-flex items-center gap-1 bg-emerald-100 text-emerald-700 px-2 py-1 rounded text-xs font-bold uppercase">
                                                <CheckCircle size={12} /> Ok
                                            </span>
                                        )}
                                    </td>
                                    <td className="p-4 text-right">
                                        {editingId === product.id ? (
                                            <div className="flex items-center justify-end gap-2">
                                                <input
                                                    type="number"
                                                    className="w-16 border rounded p-1 text-sm bg-white"
                                                    value={editValue}
                                                    onChange={e => setEditValue(e.target.value)}
                                                />
                                                <button onClick={() => saveEdit(product.id)} className="text-green-600"><Save size={16} /></button>
                                                <button onClick={() => setEditingId(null)} className="text-red-500"><X size={16} /></button>
                                            </div>
                                        ) : (
                                            <div className="flex items-center justify-end gap-2 group">
                                                <span className="text-slate-500">{product.minStock || 0}</span>
                                                <button onClick={() => startEdit(product)} className="text-slate-300 hover:text-blue-600 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <Edit2 size={14} />
                                                </button>
                                            </div>
                                        )}
                                    </td>
                                    <td className={`p-4 font-bold text-right ${product.stock <= 0 ? 'text-red-500' : 'text-slate-700'}`}>
                                        {product.stock}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
