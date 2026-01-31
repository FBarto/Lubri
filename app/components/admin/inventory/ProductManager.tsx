'use client';

import { useState, useEffect, useRef } from 'react';
import { Search, Plus, Edit, Trash2, AlertTriangle, CheckCircle, Package, FileUp, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';

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

export default function ProductManager() {
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);
    const [showModal, setShowModal] = useState(false);
    const [editingProduct, setEditingProduct] = useState<Product | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

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
        if (currentPage > 1) fetchProducts(currentPage, search);
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
                fetchStats();
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

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files || e.target.files.length === 0) return;

        const file = e.target.files[0];
        const formData = new FormData();
        formData.append('file', file);

        setUploading(true);
        try {
            const res = await fetch('/api/admin/products/import-masterfilt', {
                method: 'POST',
                body: formData
            });
            const data = await res.json();

            if (res.ok) {
                alert(`Importación exitosa!\nCreados: ${data.stats.created}\nActualizados: ${data.stats.updated}\nOmitidos: ${data.stats.skipped}`);
                fetchProducts(1, '');
                fetchStats();
            } else {
                alert('Error al importar: ' + data.error);
            }
        } catch (error) {
            console.error(error);
            alert('Error al subir el archivo');
        } finally {
            setUploading(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    return (
        <div className="fade-in">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                <div>
                    {/* Header removed or simplified since parent tab context exists? No, keep context. */}
                    <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                        <Package className="text-blue-600" /> Stock Físico
                    </h2>
                    <p className="text-slate-500 text-sm">Gestiona productos, stock y alertas.</p>
                </div>
                <div className="flex gap-2">
                    <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleFileUpload}
                        accept=".xls,.xlsx"
                        className="hidden"
                    />
                    <button
                        onClick={() => fileInputRef.current?.click()}
                        disabled={uploading}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-xl font-bold transition-all flex items-center gap-2 shrink-0 border border-emerald-500 text-sm shadow-md disabled:opacity-70 disabled:cursor-not-allowed"
                    >
                        {uploading ? <Loader2 className="animate-spin" size={16} /> : <FileUp size={16} />}
                        {uploading ? 'Importando...' : 'Importar Lista Masterfilt'}
                    </button>
                    <button
                        onClick={() => { setShowModal(true); setEditingProduct(null); setFormData({ name: '', code: '', category: '', price: '', stock: '0', minStock: '0', barcode: '' }); }}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl font-bold transition-all shadow-lg hover:shadow-blue-200 active:scale-95 flex items-center gap-2 shrink-0 text-sm"
                    >
                        <Plus size={16} /> Nuevo
                    </button>
                </div>
            </div>

            {/* Top Stock Widget */}
            {topProducts.length > 0 && (
                <div className="mb-6">
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 ml-1">Mayor Stock</h3>
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
                        {topProducts.map((p, idx) => (
                            <div key={idx} className="bg-white p-2 rounded-xl border border-slate-100 shadow-sm flex items-center justify-between group hover:shadow-md transition-all">
                                <div className="min-w-0">
                                    <div className="font-bold text-slate-700 truncate text-xs" title={p.name}>{p.name}</div>
                                    <div className="text-[10px] text-slate-400 font-medium truncate">{p.category}</div>
                                </div>
                                <div className="ml-2 px-1.5 py-0.5 bg-green-50 text-green-700 rounded-lg text-[10px] font-bold">
                                    {p.stock}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            <div className="mb-4">
                <div className="relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                    <input
                        type="text"
                        placeholder="Buscar por nombre, código o categoría..."
                        className="w-full pl-10 pr-4 py-3 rounded-xl bg-white border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none transition-all shadow-sm text-sm"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden flex flex-col">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-slate-50 border-b border-slate-100">
                            <tr>
                                <th className="px-6 py-3 font-bold text-slate-500 text-xs uppercase">Código</th>
                                <th className="px-6 py-3 font-bold text-slate-500 text-xs uppercase">Producto</th>
                                <th className="px-6 py-3 font-bold text-slate-500 text-xs uppercase">Categoría</th>
                                <th className="px-6 py-3 font-bold text-slate-500 text-xs uppercase text-right">Precio</th>
                                <th className="px-6 py-3 font-bold text-slate-500 text-xs uppercase text-center">Stock</th>
                                <th className="px-6 py-3 font-bold text-slate-500 text-xs uppercase text-right">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50 text-sm">
                            {loading ? (
                                <tr><td colSpan={6} className="p-12 text-center text-slate-400">Cargando productos...</td></tr>
                            ) : products.length > 0 ? (
                                products.map((product) => (
                                    <tr key={product.id} className="hover:bg-slate-50/50 transition-colors group">
                                        <td className="px-6 py-3 font-mono text-xs text-slate-500">{product.code || '-'}</td>
                                        <td className="px-6 py-3">
                                            <div className="font-bold text-slate-700">{product.name}</div>
                                            {product.barcode && <div className="text-[10px] text-slate-400">EAN: {product.barcode}</div>}
                                        </td>
                                        <td className="px-6 py-3">
                                            <span className="bg-slate-100 text-slate-600 text-[10px] px-2 py-1 rounded-lg font-bold uppercase tracking-wider">
                                                {product.category}
                                            </span>
                                        </td>
                                        <td className="px-6 py-3 font-bold text-slate-800 text-right">${product.price.toLocaleString()}</td>
                                        <td className="px-6 py-3">
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
                                        <td className="px-6 py-3 text-right space-x-2">
                                            <button onClick={() => handleEdit(product)} className="text-blue-500 hover:text-blue-700 p-1.5 rounded-lg hover:bg-blue-50 transition-colors">
                                                <Edit size={16} />
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={6} className="p-12 text-center text-slate-300 italic">No se encontraron productos</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination Controls */}
                <div className="p-4 border-t border-slate-100 flex justify-between items-center bg-slate-50/50">
                    <span className="text-xs text-slate-500 font-medium">
                        Página <b>{currentPage}</b> de <b>{totalPages}</b>
                    </span>
                    <div className="flex gap-2">
                        <button
                            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                            disabled={currentPage === 1 || loading}
                            className="px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-slate-600 font-bold disabled:opacity-50 hover:bg-slate-50 transition-colors text-xs"
                        >
                            Anterior
                        </button>
                        <button
                            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                            disabled={currentPage === totalPages || loading}
                            className="px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-slate-600 font-bold disabled:opacity-50 hover:bg-slate-50 transition-colors text-xs"
                        >
                            Siguiente
                        </button>
                    </div>
                </div>
            </div>

            {showModal && (
                <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-[200]">
                    <div className="bg-white rounded-[2rem] w-full max-w-md p-6 shadow-2xl scale-in max-h-[90vh] overflow-y-auto">
                        <h2 className="text-xl font-bold mb-4 text-slate-800">
                            {editingProduct ? 'Editar Producto' : 'Nuevo Producto'}
                        </h2>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-500 mb-1 ml-1 uppercase">Nombre</label>
                                <input
                                    required
                                    type="text"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    className="w-full bg-slate-50 border-0 rounded-xl p-3 focus:ring-2 focus:ring-blue-500 outline-none transition-all font-bold text-slate-700"
                                    placeholder="Ej: Filtro de Aceite PH4722"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 mb-1 ml-1 uppercase">Código</label>
                                    <input
                                        type="text"
                                        value={formData.code}
                                        onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                                        className="w-full bg-slate-50 border-0 rounded-xl p-3 focus:ring-2 focus:ring-blue-500 outline-none transition-all font-mono text-sm"
                                        placeholder="FIL-123"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 mb-1 ml-1 uppercase">Categoría</label>
                                    <input
                                        required
                                        type="text"
                                        list="categories"
                                        value={formData.category}
                                        onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                                        className="w-full bg-slate-50 border-0 rounded-xl p-3 focus:ring-2 focus:ring-blue-500 outline-none transition-all text-sm"
                                        placeholder="Filtros"
                                    />
                                    <datalist id="categories">
                                        {allCategories.map(cat => <option key={cat} value={cat} />)}
                                    </datalist>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 mb-1 ml-1 uppercase">Precio ($)</label>
                                    <input
                                        required
                                        type="number"
                                        step="0.01"
                                        value={formData.price}
                                        onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                                        className="w-full bg-slate-50 border-0 rounded-xl p-3 focus:ring-2 focus:ring-blue-500 outline-none transition-all font-bold text-slate-800"
                                        placeholder="0.00"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 mb-1 ml-1 uppercase">Stock Actual</label>
                                    <input
                                        required
                                        type="number"
                                        value={formData.stock}
                                        onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                                        className="w-full bg-slate-50 border-0 rounded-xl p-3 focus:ring-2 focus:ring-blue-500 outline-none transition-all font-bold"
                                        placeholder="0"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 mb-1 ml-1 uppercase">Mínimo</label>
                                    <input
                                        required
                                        type="number"
                                        value={formData.minStock}
                                        onChange={(e) => setFormData({ ...formData, minStock: e.target.value })}
                                        className="w-full bg-slate-50 border-0 rounded-xl p-3 focus:ring-2 focus:ring-blue-500 outline-none transition-all text-sm"
                                        placeholder="0"
                                    />
                                </div>
                            </div>

                            <div className="flex space-x-3 pt-2">
                                <button
                                    type="button"
                                    onClick={() => setShowModal(false)}
                                    className="flex-1 bg-slate-100 text-slate-600 py-3 rounded-xl font-bold hover:bg-slate-200 transition-colors text-sm"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 bg-blue-600 text-white py-3 rounded-xl font-bold hover:bg-blue-700 shadow-lg shadow-blue-200 transition-all active:scale-95 text-sm"
                                >
                                    {editingProduct ? 'Guardar' : 'Crear'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
