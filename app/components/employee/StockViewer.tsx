'use client';

import { useState, useEffect } from 'react';
import { Search, AlertTriangle, CheckCircle } from 'lucide-react';

export default function StockViewer() {
    const [products, setProducts] = useState<any[]>([]);
    const [search, setSearch] = useState('');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch('/api/products')
            .then(res => res.json())
            .then(data => {
                if (Array.isArray(data)) {
                    setProducts(data);
                } else if (data && Array.isArray(data.data)) {
                    setProducts(data.data);
                } else {
                    console.error('API did not return a list:', data);
                    setProducts([]);
                }
                setLoading(false);
            })
            .catch(err => console.error(err));
    }, []);

    const filtered = Array.isArray(products) ? products.filter(p =>
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        (p.code && p.code.toLowerCase().includes(search.toLowerCase()))
    ) : [];

    return (
        <div className="p-6 h-full flex flex-col">
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
                                <th className="p-4 font-bold text-slate-500 text-xs uppercase tracking-wider text-center">Estado</th>
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
                                        {product.stock <= 0 ? (
                                            <span className="inline-flex items-center gap-1 bg-red-100 text-red-700 px-2 py-1 rounded text-xs font-bold uppercase">
                                                <AlertTriangle size={12} /> Sin Stock
                                            </span>
                                        ) : product.stock < 5 ? (
                                            <span className="inline-flex items-center gap-1 bg-amber-100 text-amber-700 px-2 py-1 rounded text-xs font-bold uppercase">
                                                <AlertTriangle size={12} /> Bajo
                                            </span>
                                        ) : (
                                            <span className="inline-flex items-center gap-1 bg-emerald-100 text-emerald-700 px-2 py-1 rounded text-xs font-bold uppercase">
                                                <CheckCircle size={12} /> Ok
                                            </span>
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
