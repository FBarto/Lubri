'use client';

import { useState } from 'react';
import { Package, Wrench, DollarSign, LayoutGrid } from 'lucide-react';
import ProductManager from '../../components/admin/inventory/ProductManager';
import ServiceManager from '../../components/admin/inventory/ServiceManager';
import PriceListManager from '../../components/employee/PriceListManager';

export default function InventoryPage() {
    const [activeTab, setActiveTab] = useState<'PRODUCTS' | 'SERVICES' | 'PRICING'>('PRODUCTS');

    return (
        <div className="flex flex-col h-screen max-h-screen bg-slate-50 overflow-hidden">
            {/* Header / Tabs */}
            <div className="bg-white border-b border-slate-200 flex-none px-6 pt-6 pb-0">
                <div className="flex justify-between items-center mb-6">
                    <div>
                        <h1 className="text-2xl font-black text-slate-800 flex items-center gap-2">
                            <LayoutGrid className="text-indigo-600" />
                            Inventario Unificado
                        </h1>
                        <p className="text-slate-500 text-sm font-medium">Gestiona productos, servicios y precios en un solo lugar.</p>
                    </div>
                </div>

                <div className="flex space-x-6">
                    <button
                        onClick={() => setActiveTab('PRODUCTS')}
                        className={`pb-4 px-2 font-bold text-sm flex items-center gap-2 border-b-2 transition-all ${activeTab === 'PRODUCTS'
                                ? 'border-blue-600 text-blue-600'
                                : 'border-transparent text-slate-400 hover:text-slate-600 hover:border-slate-300'
                            }`}
                    >
                        <Package size={18} />
                        Stock Físico
                    </button>
                    <button
                        onClick={() => setActiveTab('SERVICES')}
                        className={`pb-4 px-2 font-bold text-sm flex items-center gap-2 border-b-2 transition-all ${activeTab === 'SERVICES'
                                ? 'border-emerald-600 text-emerald-600'
                                : 'border-transparent text-slate-400 hover:text-slate-600 hover:border-slate-300'
                            }`}
                    >
                        <Wrench size={18} />
                        Servicios y Mano de Obra
                    </button>
                    <button
                        onClick={() => setActiveTab('PRICING')}
                        className={`pb-4 px-2 font-bold text-sm flex items-center gap-2 border-b-2 transition-all ${activeTab === 'PRICING'
                                ? 'border-indigo-600 text-indigo-600'
                                : 'border-transparent text-slate-400 hover:text-slate-600 hover:border-slate-300'
                            }`}
                    >
                        <DollarSign size={18} />
                        Gestor de Precios
                    </button>
                </div>
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-y-auto p-6 md:p-8 bg-slate-50 min-h-0">
                <div className="max-w-7xl mx-auto h-full flex flex-col">
                    {activeTab === 'PRODUCTS' && <ProductManager />}
                    {activeTab === 'SERVICES' && <ServiceManager />}
                    {activeTab === 'PRICING' && <PriceListManager />}
                </div>
            </div>
        </div>
    );
}
