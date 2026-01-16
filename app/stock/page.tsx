'use client';

import { useState, useEffect } from 'react';
import { Package, AlertTriangle, CheckCircle, RefreshCw } from 'lucide-react';

interface Product {
    id: number;
    name: string;
    code: string | null;
    category: string;
    price: number;
    stock: number;
}

export default function FullscreenStockPage() {
    const [products, setProducts] = useState<Product[]>([]);
    const [lastUpdate, setLastUpdate] = useState(new Date());
    const [loading, setLoading] = useState(true);

    const fetchProducts = async () => {
        try {
            const res = await fetch('/api/products');
            const data = await res.json();
            setProducts(data || []);
            setLastUpdate(new Date());
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchProducts();
        // Auto refresh every 5 minutes
        const interval = setInterval(fetchProducts, 5 * 60 * 1000);
        return () => clearInterval(interval);
    }, []);

    // Show only products with low stock first, or all? 
    // Usually, a "Stock Cabinet" view wants to see everything or critical items.
    // Let's show all but highlight criticals.
    const sortedProducts = [...products].sort((a, b) => {
        if (a.stock <= 0 && b.stock > 0) return -1;
        if (b.stock <= 0 && a.stock > 0) return 1;
        return a.name.localeCompare(b.name);
    });

    return (
        <div className="min-h-screen bg-slate-950 text-white p-8 font-sans">
            <header className="flex justify-between items-center mb-10 border-b border-white/10 pb-6">
                <div className="flex items-center gap-6">
                    <div className="bg-blue-600 p-4 rounded-3xl shadow-lg shadow-blue-500/20">
                        <Package size={40} className="text-white" />
                    </div>
                    <div>
                        <h1 className="text-5xl font-black tracking-tight uppercase">Estado de Stock</h1>
                        <p className="text-slate-400 text-xl flex items-center gap-2">
                            FB Lubricentro • Villa Carlos Paz
                            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse ml-4"></span>
                            <span className="text-sm">VIVO</span>
                        </p>
                    </div>
                </div>
                <div className="text-right">
                    <p className="text-slate-500 uppercase text-xs font-bold tracking-[0.3em] mb-1">Última Actualización</p>
                    <p className="text-4xl font-mono font-bold text-blue-400">
                        {lastUpdate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                    </p>
                </div>
            </header>

            {loading ? (
                <div className="h-[60vh] flex flex-col items-center justify-center gap-4 text-slate-500">
                    <RefreshCw className="animate-spin" size={64} />
                    <p className="text-2xl font-bold">Sincronizando inventario...</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {sortedProducts.map((product) => (
                        <div
                            key={product.id}
                            className={`relative overflow-hidden rounded-[2rem] border-2 transition-all duration-500 p-6 flex flex-col justify-between h-56
                                ${product.stock <= 0
                                    ? 'bg-red-950/30 border-red-500/50 shadow-[0_0_30px_rgba(239,68,68,0.1)]'
                                    : product.stock < 10
                                        ? 'bg-amber-950/20 border-amber-500/30'
                                        : 'bg-slate-900 border-white/5 hover:border-white/20'}
                            `}
                        >
                            {/* Background Glow for Critical Items */}
                            {product.stock <= 0 && (
                                <div className="absolute -right-10 -top-10 w-40 h-40 bg-red-500/20 blur-[60px] rounded-full"></div>
                            )}

                            <div>
                                <div className="flex justify-between items-start mb-2">
                                    <span className="text-slate-500 font-mono text-xs uppercase tracking-widest">
                                        {product.code || 'S/COD'}
                                    </span>
                                    {product.stock <= 0 ? (
                                        <AlertTriangle className="text-red-500" size={24} />
                                    ) : product.stock < 10 ? (
                                        <AlertTriangle className="text-amber-500" size={24} />
                                    ) : (
                                        <CheckCircle className="text-emerald-500/50" size={20} />
                                    )}
                                </div>
                                <h3 className="text-2xl font-bold leading-tight line-clamp-2">
                                    {product.name}
                                </h3>
                                <p className="text-slate-500 text-sm mt-1 uppercase font-semibold tracking-wider">
                                    {product.category}
                                </p>
                            </div>

                            <div className="flex justify-between items-end mt-4">
                                <div>
                                    <p className="text-slate-500 text-[10px] uppercase font-bold tracking-widest mb-1">Stock Disponible</p>
                                    <p className={`text-5xl font-black ${product.stock <= 0 ? 'text-red-500' : product.stock < 10 ? 'text-amber-400' : 'text-white'}`}>
                                        {product.stock}
                                    </p>
                                </div>
                                <div className="text-right">
                                    <p className="text-slate-500 text-[10px] uppercase font-bold tracking-widest mb-1">Precio</p>
                                    <p className="text-2xl font-bold text-slate-300">
                                        ${product.price.toLocaleString()}
                                    </p>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            <footer className="mt-12 text-center text-slate-600 text-sm border-t border-white/5 pt-6">
                FB Lubricentro Management System • Villa Carlos Paz, Córdoba • Sistema Optimizado para Monitores de Taller
            </footer>
        </div>
    );
}
