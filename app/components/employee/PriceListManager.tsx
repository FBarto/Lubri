'use client';

import { useState, useEffect } from 'react';
import { Search, Save, Filter, DollarSign, Package, Percent, RefreshCw } from 'lucide-react';
import { updateProductPricing, bulkUpdateMarkup, getUniqueSuppliers, searchProductsExtended } from '../../lib/pricing-actions';

interface Product {
    id: number;
    name: string;
    code: string | null;
    price: number;
    cost: number;
    markup: number;
    supplier: string | null;
    stock: number;
}

export default function PriceListManager() {
    // State
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(false);
    const [search, setSearch] = useState('');
    const [suppliers, setSuppliers] = useState<string[]>([]);
    const [selectedSupplier, setSelectedSupplier] = useState<string>('ALL');

    // Bulk Actions
    const [bulkMarkup, setBulkMarkup] = useState<string>('30');
    const [bulkLoading, setBulkLoading] = useState(false);

    // Initial Load
    useEffect(() => {
        loadSuppliers();
        handleSearch();
    }, []);

    const loadSuppliers = async () => {
        const res = await getUniqueSuppliers();
        if (res.success && res.daa) setSuppliers(res.daa);
    };

    const handleSearch = async () => {
        setLoading(true);
        const res = await searchProductsExtended(search);
        if (res.success && res.data) {
            setProducts(res.data.map((p: any) => ({
                ...p,
                cost: p.cost || 0,
                markup: p.markup || 0,
                supplier: p.supplier || ''
            })));
        }
        setLoading(false);
    };

    // --- ROW EDITING ---
    const handleRowChange = (id: number, field: keyof Product, value: any) => {
        setProducts(prev => prev.map(p => {
            if (p.id !== id) return p;

            const updated = { ...p, [field]: value };

            // Auto-calculate Price if Cost or Markup changes (Strategy A)
            if (field === 'cost' || field === 'markup') {
                const c = field === 'cost' ? Number(value) : p.cost;
                const m = field === 'markup' ? Number(value) : p.markup;
                updated.price = Math.round(c * (1 + m / 100));
            }

            // Auto-calculate Markup if Price changes (Strategy B - Optional)
            // If user sets Final Price manually, we could adjust markup.
            if (field === 'price') {
                const pr = Number(value);
                if (p.cost > 0) {
                    updated.markup = parseFloat(((pr / p.cost - 1) * 100).toFixed(1));
                }
            }

            return updated;
        }));
    };

    const saveRow = async (product: Product) => {
        try {
            const res = await updateProductPricing(product.id, {
                cost: Number(product.cost),
                markup: Number(product.markup),
                price: Number(product.price),
                supplier: product.supplier || undefined
            });
            if (res.success) {
                // Flash success visual?
                loadSuppliers(); // Refresh suppliers list in case new one added
            } else {
                alert('Error al guardar');
            }
        } catch (e) {
            console.error(e);
            alert('Error al guardar');
        }
    };

    // --- BULK UPDATES ---
    const applyBulkMarkup = async () => {
        if (selectedSupplier === 'ALL') {
            alert('Por seguridad, selecciona un proveedor específico para aplicar cambios masivos.');
            return;
        }
        if (!confirm(`⚠️ ¿ESTAS SEGURO?\n\nEsto actualizará el margen al ${bulkMarkup}% para TODOS los productos de "${selectedSupplier}".\nLos precios finales se recalcularán.`)) {
            return;
        }

        setBulkLoading(true);
        const res = await bulkUpdateMarkup(selectedSupplier, Number(bulkMarkup));
        setBulkLoading(false);

        if (res.success) {
            alert(`✅ Se actualizaron precios para ${res.count} productos de ${selectedSupplier}.`);
            handleSearch(); // Refresh list
        } else {
            alert('Error en actualización masiva');
        }
    };

    const filteredProducts = selectedSupplier === 'ALL'
        ? products
        : products.filter(p => p.supplier === selectedSupplier);

    return (
        <div className="flex flex-col h-full bg-slate-50">
            {/* Header / Toolbar */}
            <div className="bg-white p-6 shadow-sm border-b border-slate-200 space-y-4">
                <div className="flex justify-between items-center">
                    <h1 className="text-2xl font-black text-slate-800 flex items-center gap-2">
                        <DollarSign className="text-emerald-600" size={28} />
                        Gestor de Precios
                    </h1>

                    {/* Bulk Tool */}
                    <div className="flex items-center gap-2 bg-slate-100 p-2 rounded-xl border border-slate-200">
                        <span className="text-xs font-bold text-slate-500 uppercase px-2">Estrategia Masiva:</span>
                        <select
                            value={selectedSupplier}
                            onChange={(e) => setSelectedSupplier(e.target.value)}
                            className="bg-white border text-sm font-bold border-slate-300 rounded-lg py-1 px-2 outline-none focus:border-indigo-500"
                        >
                            <option value="ALL">-- Seleccionar Proveedor --</option>
                            {suppliers.map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                        <div className="flex items-center gap-1 bg-white border border-slate-300 rounded-lg px-2 py-1">
                            <span className="text-slate-400 text-xs font-bold">Ganancia %</span>
                            <input
                                type="number"
                                value={bulkMarkup}
                                onChange={(e) => setBulkMarkup(e.target.value)}
                                className="w-12 text-center font-bold outline-none text-emerald-600"
                            />
                        </div>
                        <button
                            onClick={applyBulkMarkup}
                            disabled={selectedSupplier === 'ALL' || bulkLoading}
                            className="bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 text-white px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 transition-colors"
                        >
                            {bulkLoading ? 'Aplicando...' : 'Aplicar a Todos'}
                        </button>
                    </div>
                </div>

                <div className="flex gap-4">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-2.5 text-slate-400 w-5 h-5" />
                        <input
                            type="text"
                            placeholder="Buscar producto por nombre, código o proveedor..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                            className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none font-medium"
                        />
                    </div>
                    <button
                        onClick={handleSearch}
                        className="px-6 bg-slate-800 text-white font-bold rounded-xl hover:bg-black transition-colors"
                    >
                        Buscar
                    </button>
                </div>
            </div>

            {/* Table */}
            <div className="flex-1 overflow-y-auto p-6">
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-slate-50 text-slate-500 font-bold uppercase text-xs">
                            <tr>
                                <th className="p-4">Producto</th>
                                <th className="p-4 w-40">Proveedor</th>
                                <th className="p-4 w-32 text-right text-indigo-600">Costo ($)</th>
                                <th className="p-4 w-24 text-right text-emerald-600">Margen %</th>
                                <th className="p-4 w-32 text-right text-slate-800">Precio Final</th>
                                <th className="p-4 w-20"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {filteredProducts.map(p => (
                                <tr key={p.id} className="hover:bg-slate-50 group">
                                    <td className="p-4">
                                        <div className="font-bold text-slate-700">{p.name}</div>
                                        <div className="text-xs text-slate-400 font-mono">{p.code || 'S/C'}</div>
                                    </td>
                                    <td className="p-4">
                                        <input
                                            type="text"
                                            value={p.supplier || ''}
                                            onChange={(e) => handleRowChange(p.id, 'supplier', e.target.value)}
                                            placeholder="Proveedor..."
                                            className="w-full bg-transparent border-b border-transparent focus:border-indigo-300 outline-none text-slate-600 placeholder:text-slate-300"
                                        />
                                    </td>
                                    <td className="p-4 text-right bg-indigo-50/30">
                                        <input
                                            type="number"
                                            value={p.cost}
                                            onChange={(e) => handleRowChange(p.id, 'cost', e.target.value)}
                                            className="w-full text-right bg-transparent border-b border-transparent focus:border-indigo-500 outline-none font-bold text-indigo-700"
                                        />
                                    </td>
                                    <td className="p-4 text-right bg-emerald-50/30">
                                        <input
                                            type="number"
                                            value={p.markup}
                                            onChange={(e) => handleRowChange(p.id, 'markup', e.target.value)}
                                            className="w-full text-right bg-transparent border-b border-transparent focus:border-emerald-500 outline-none font-bold text-emerald-600"
                                        />
                                    </td>
                                    <td className="p-4 text-right bg-slate-50">
                                        <div className="flex items-center justify-end gap-1">
                                            <span className="text-slate-400">$</span>
                                            <input
                                                type="number"
                                                value={p.price}
                                                onChange={(e) => handleRowChange(p.id, 'price', e.target.value)}
                                                className="w-24 text-right bg-transparent border-b border-transparent focus:border-slate-800 outline-none font-black text-slate-800"
                                            />
                                        </div>
                                    </td>
                                    <td className="p-4 text-right">
                                        <button
                                            onClick={() => saveRow(p)}
                                            className="p-2 text-slate-300 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                                            title="Guardar Cambios"
                                        >
                                            <Save size={18} />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                            {filteredProducts.length === 0 && (
                                <tr>
                                    <td colSpan={6} className="p-12 text-center text-slate-400">
                                        {loading ? 'Cargando...' : 'No se encontraron productos.'}
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
