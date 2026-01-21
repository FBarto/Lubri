'use client';

import { useState, useEffect } from 'react';
import { Search, Plus, Edit, Trash2, AlertTriangle, CheckCircle, Package, FileUp } from 'lucide-react';
import Link from 'next/link';

interface Product {
    id: number;
    name: string;
    code: string | null;
    barcode: string | null;
    category: string;
    price: number;
    stock: number;
    minStock: number;
    active: boolean;
}

export default function AdminProductsPage() {
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingProduct, setEditingProduct] = useState<Product | null>(null);

    // Stats
    const [topProducts, setTopProducts] = useState<Product[]>([]);

    // Pagination & Search
    const [search, setSearch] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalRecords, setTotalRecords] = useState(0);

    const [formData, setFormData] = useState({
        name: '',
        code: '',
        category: '',
        price: '',
        stock: '0',
        minStock: '0',
        barcode: ''
    });

    const [allCategories, setAllCategories] = useState<string[]>([]);

    // Debounce search
    useEffect(() => {
        const timer = setTimeout(() => {
            setCurrentPage(1);
            fetchProducts(1, search);
        }, 300);
        return () => clearTimeout(timer);
    }, [search]);

    // Handle page changes
    useEffect(() => {
        fetchProducts(currentPage, search);
    }, [currentPage]);

    // Fetch Stats & Categories (initial load)
    useEffect(() => {
        fetchStats();
    }, []);

    const fetchStats = async () => {
        try {
            const res = await fetch('/api/stats/top-products');
            const data = await res.json();
            if (Array.isArray(data)) setTopProducts(data);
        } catch (err) {
            console.error(err);
        }
    };

    const fetchProducts = async (page = 1, searchTerm = '') => {
        setLoading(true);
        try {
            const params = new URLSearchParams({
                page: page.toString(),
                limit: '10',
                search: searchTerm
            });

            const res = await fetch(`/api/products?${params.toString()}`);
            const data = await res.json();

            if (data.data) {
                setProducts(data.data);
                setTotalPages(data.meta.totalPages);
                setTotalRecords(data.meta.total);

                // Extract categories from current page (simplified for now, ideally strictly from DB or separate endpoint)
                // Let's just accumulate known categories or use what we see. 
                // Creating a set from CURRENT products is okay for the datalist as user types.
                const cats = new Set<string>(allCategories);
                data.data.forEach((p: Product) => cats.add(p.category));
                setAllCategories(Array.from(cats));
            } else {
                setProducts([]);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const url = editingProduct ? `/api/products/${editingProduct.id}` : '/api/products';
        const method = editingProduct ? 'PUT' : 'POST';

        try {
            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...formData,
                    price: parseFloat(formData.price),
                    stock: parseInt(formData.stock)
                }),
            });

            if (res.ok) {
                setShowModal(false);
                setEditingProduct(null);
                setFormData({ name: '', code: '', category: '', price: '', stock: '0', minStock: '0', barcode: '' });
                fetchProducts(currentPage, search);
                fetchStats(); // Update stats in case stock changed
            }
        } catch (err) {
            console.error(err);
        }
    };

    const handleEdit = (product: Product) => {
        setEditingProduct(product);
        setFormData({
            name: product.name,
            code: product.code || '',
            category: product.category,
            price: product.price.toString(),
            stock: product.stock.toString(),
            minStock: product.minStock.toString(),
            barcode: product.barcode || ''
        });
        setShowModal(true);
    };

    return (
        <div className="fade-in">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                <div>
                    <h1 className="text-3xl font-extrabold text-slate-800 flex items-center gap-3">
                        <Package className="text-blue-600" /> Gestión de Stock
                    </h1>
                    <p className="text-slate-500">Administra tus productos ({totalRecords} total)</p>
                </div>
                <Link
                    href="/admin/products/import"
                    className="bg-slate-100 hover:bg-slate-200 text-slate-600 px-6 py-3 rounded-2xl font-bold transition-all flex items-center gap-2 shrink-0 border border-slate-200"
                >
                    <FileUp size={20} /> Importar CSV
                </Link>
                <button
                    onClick={() => { setShowModal(true); setEditingProduct(null); setFormData({ name: '', code: '', category: '', price: '', stock: '0', minStock: '0', barcode: '' }); }}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-2xl font-bold transition-all shadow-lg hover:shadow-blue-200 active:scale-95 flex items-center gap-2 shrink-0"
                >
                    <Plus size={20} /> Nuevo Producto
                </button>
            </div>

            {/* Top Stock Widget */}
            {topProducts.length > 0 && (
                <div className="mb-8">
                    <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-3 ml-1">Mayor Stock Disponible</h3>
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                        {topProducts.map((p, idx) => (
                            <div key={idx} className="bg-white p-3 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between group hover:shadow-md transition-all">
                                <div className="min-w-0">
                                    <div className="font-bold text-slate-700 truncate text-sm" title={p.name}>{p.name}</div>
                                    <div className="text-xs text-slate-400 font-medium truncate">{p.category}</div>
                                </div>
                                <div className="ml-2 px-2 py-1 bg-green-50 text-green-700 rounded-lg text-xs font-bold">
                                    {p.stock}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            <div className="mb-6">
                <div className="relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                    <input
                        type="text"
                        placeholder="Buscar por nombre, código o categoría..."
                        className="w-full pl-12 pr-4 py-4 rounded-2xl bg-white border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none transition-all shadow-sm"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
            </div>

            <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden flex flex-col h-full">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-slate-50 border-b border-slate-100">
                            <tr>
                                <th className="px-6 py-4 font-semibold text-slate-600">Código</th>
                                <th className="px-6 py-4 font-semibold text-slate-600">Producto</th>
                                <th className="px-6 py-4 font-semibold text-slate-600">Categoría</th>
                                <th className="px-6 py-4 font-semibold text-slate-600 text-right">Precio</th>
                                <th className="px-6 py-4 font-semibold text-slate-600 text-center">Stock</th>
                                <th className="px-6 py-4 font-semibold text-slate-600 text-right">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {loading ? (
                                <tr><td colSpan={6} className="p-20 text-center text-slate-400">Cargando productos...</td></tr>
                            ) : products.length > 0 ? (
                                products.map((product) => (
                                    <tr key={product.id} className="hover:bg-slate-50/50 transition-colors group">
                                        <td className="px-6 py-5 font-mono text-sm text-slate-500">{product.code || '-'}</td>
                                        <td className="px-6 py-5">
                                            <div className="font-medium text-slate-800">{product.name}</div>
                                            {product.barcode && <div className="text-[10px] text-slate-400">EAN: {product.barcode}</div>}
                                        </td>
                                        <td className="px-6 py-5">
                                            <span className="bg-slate-100 text-slate-600 text-xs px-2 py-1 rounded-lg font-bold">
                                                {product.category}
                                            </span>
                                        </td>
                                        <td className="px-6 py-5 font-bold text-slate-800 text-right">${product.price.toLocaleString()}</td>
                                        <td className="px-6 py-5">
                                            <div className="flex flex-col items-center gap-1">
                                                <div className="flex items-center gap-2">
                                                    <span className={`font-bold ${product.stock <= (product.minStock || 0) ? 'text-red-500' : 'text-slate-700'}`}>
                                                        {product.stock}
                                                    </span>
                                                    <span className="text-[10px] text-slate-400 font-medium">/ mín: {product.minStock || 0}</span>
                                                </div>
                                                {product.stock <= 0 ? (
                                                    <span className="text-[10px] font-black text-red-500 uppercase flex items-center gap-1">
                                                        <AlertTriangle size={10} /> Sin Stock
                                                    </span>
                                                ) : product.stock <= (product.minStock || 0) ? (
                                                    <span className="text-[10px] font-black text-amber-500 uppercase flex items-center gap-1">
                                                        <AlertTriangle size={10} /> Bajo
                                                    </span>
                                                ) : null}
                                            </div>
                                        </td>
                                        <td className="px-6 py-5 text-right space-x-2">
                                            <button onClick={() => handleEdit(product)} className="text-blue-500 hover:text-blue-700 p-2 rounded-lg hover:bg-blue-50 transition-colors">
                                                <Edit size={18} />
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={6} className="p-20 text-center text-slate-300 italic">No se encontraron productos</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination Controls */}
                <div className="p-4 border-t border-slate-100 flex justify-between items-center bg-slate-50/50">
                    <span className="text-sm text-slate-500">
                        Página <b>{currentPage}</b> de <b>{totalPages}</b>
                    </span>
                    <div className="flex gap-2">
                        <button
                            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                            disabled={currentPage === 1 || loading}
                            className="px-4 py-2 rounded-lg bg-white border border-slate-200 text-slate-600 font-bold disabled:opacity-50 hover:bg-slate-50 transition-colors text-sm"
                        >
                            Anterior
                        </button>
                        <button
                            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                            disabled={currentPage === totalPages || loading}
                            className="px-4 py-2 rounded-lg bg-white border border-slate-200 text-slate-600 font-bold disabled:opacity-50 hover:bg-slate-50 transition-colors text-sm"
                        >
                            Siguiente
                        </button>
                    </div>
                </div>
            </div>

            {showModal && (
                <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-[2.5rem] w-full max-w-md p-8 shadow-2xl scale-in max-h-[90vh] overflow-y-auto">
                        <h2 className="text-2xl font-bold mb-6 text-slate-800">
                            {editingProduct ? 'Editar Producto' : 'Nuevo Producto'}
                        </h2>
                        <form onSubmit={handleSubmit} className="space-y-5">
                            <div>
                                <label className="block text-sm font-semibold text-slate-600 mb-2 ml-1">Nombre del Producto</label>
                                <input
                                    required
                                    type="text"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    className="w-full bg-slate-50 border-0 rounded-2xl p-4 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                                    placeholder="Ej: Filtro de Aceite PH4722"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-semibold text-slate-600 mb-2 ml-1">Código</label>
                                    <input
                                        type="text"
                                        value={formData.code}
                                        onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                                        className="w-full bg-slate-50 border-0 rounded-2xl p-4 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                                        placeholder="FIL-123"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-slate-600 mb-2 ml-1">Categoría</label>
                                    <input
                                        required
                                        type="text"
                                        list="categories"
                                        value={formData.category}
                                        onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                                        className="w-full bg-slate-50 border-0 rounded-2xl p-4 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                                        placeholder="Filtros"
                                    />
                                    <datalist id="categories">
                                        {allCategories.map(cat => <option key={cat} value={cat} />)}
                                    </datalist>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-semibold text-slate-600 mb-2 ml-1">Precio ($)</label>
                                    <input
                                        required
                                        type="number"
                                        step="0.01"
                                        value={formData.price}
                                        onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                                        className="w-full bg-slate-50 border-0 rounded-2xl p-4 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                                        placeholder="0.00"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-slate-600 mb-2 ml-1">Stock Actual</label>
                                    <input
                                        required
                                        type="number"
                                        value={formData.stock}
                                        onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                                        className="w-full bg-slate-50 border-0 rounded-2xl p-4 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                                        placeholder="0"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-slate-600 mb-2 ml-1">Stock Mínimo</label>
                                    <input
                                        required
                                        type="number"
                                        value={formData.minStock}
                                        onChange={(e) => setFormData({ ...formData, minStock: e.target.value })}
                                        className="w-full bg-slate-50 border-0 rounded-2xl p-4 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                                        placeholder="0"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-slate-600 mb-2 ml-1">Código de Barras</label>
                                <input
                                    type="text"
                                    value={formData.barcode}
                                    onChange={(e) => setFormData({ ...formData, barcode: e.target.value })}
                                    className="w-full bg-slate-50 border-0 rounded-2xl p-4 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                                    placeholder="EAN-13"
                                />
                            </div>
                            <div className="flex space-x-3 pt-4">
                                <button
                                    type="button"
                                    onClick={() => setShowModal(false)}
                                    className="flex-1 bg-slate-100 text-slate-600 py-4 rounded-2xl font-bold hover:bg-slate-200 transition-colors"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 bg-blue-600 text-white py-4 rounded-2xl font-bold hover:bg-blue-700 shadow-lg shadow-blue-200 transition-all active:scale-95"
                                >
                                    {editingProduct ? 'Guardar Cambios' : 'Crear Producto'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
