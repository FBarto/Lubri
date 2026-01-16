'use client';

import { useState } from 'react';
import { ShoppingCart, Wrench, Package, ArrowDownToLine, Calendar } from 'lucide-react';
import EmployeeLayout from '../components/employee/EmployeeLayout';

import RestrictedPOS from '../components/employee/RestrictedPOS';
import ServicesWizard from '../components/employee/ServicesWizard';
import StockViewer from '../components/employee/StockViewer';
import StockIngest from '../components/employee/StockIngest';
import KanbanBoard from '../components/dashboard/KanbanBoard';
import OperationalKanban from '../components/employee/OperationalKanban';

export default function EmployeePage() {
    const [activeTab, setActiveTab] = useState<'VENDER' | 'SERVICIOS' | 'STOCK' | 'INGRESAR' | 'TURNOS' | 'TALLER'>('TALLER');
    const [cart, setCart] = useState<any[]>([]);

    const handleAddFromWizard = (newItem: any) => {
        setCart(prev => [...prev, {
            ...newItem,
            uniqueId: Math.random().toString(36).substr(2, 9),
            quantity: 1,
            subtotal: newItem.price // Assuming wizard passes ready-to-sell items
        }]);
    };

    return (
        <EmployeeLayout>
            {/* Tabs Navigation */}
            <div className="bg-white border-b border-slate-200 px-4 pt-4 flex gap-2 overflow-x-auto">
                <button
                    onClick={() => setActiveTab('VENDER')}
                    className={`flex items-center gap-2 px-6 py-3 rounded-t-lg font-bold text-sm transition-all ${activeTab === 'VENDER'
                        ? 'bg-emerald-600 text-white shadow-sm'
                        : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                        }`}
                >
                    <ShoppingCart className="w-4 h-4" />
                    <span className="flex items-center gap-2">
                        VENDER
                        {cart.length > 0 && <span className="bg-white/20 text-white px-1.5 py-0.5 rounded textxs">{cart.length}</span>}
                    </span>
                </button>
                <button
                    onClick={() => setActiveTab('SERVICIOS')}
                    className={`flex items-center gap-2 px-6 py-3 rounded-t-lg font-bold text-sm transition-all ${activeTab === 'SERVICIOS'
                        ? 'bg-blue-600 text-white shadow-sm'
                        : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                        }`}
                >
                    <Wrench className="w-4 h-4" />
                    SERVICIOS
                </button>
                <button
                    onClick={() => setActiveTab('STOCK')}
                    className={`flex items-center gap-2 px-6 py-3 rounded-t-lg font-bold text-sm transition-all ${activeTab === 'STOCK'
                        ? 'bg-amber-600 text-white shadow-sm'
                        : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                        }`}
                >
                    <Package className="w-4 h-4" />
                    STOCK
                </button>
                <button
                    onClick={() => setActiveTab('INGRESAR')}
                    className={`flex items-center gap-2 px-6 py-3 rounded-t-lg font-bold text-sm transition-all ${activeTab === 'INGRESAR'
                        ? 'bg-indigo-600 text-white shadow-sm'
                        : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                        }`}
                >
                    <ArrowDownToLine className="w-4 h-4" />
                    INGRESAR
                </button>
                <button
                    onClick={() => setActiveTab('TURNOS')}
                    className={`flex items-center gap-2 px-6 py-3 rounded-t-lg font-bold text-sm transition-all ${activeTab === 'TURNOS'
                        ? 'bg-purple-600 text-white shadow-sm'
                        : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                        }`}
                >
                    <Calendar className="w-4 h-4" />
                    TURNOS
                </button>
                <button
                    onClick={() => setActiveTab('TALLER')}
                    className={`flex items-center gap-2 px-6 py-3 rounded-t-lg font-bold text-sm transition-all ${activeTab === 'TALLER'
                        ? 'bg-red-600 text-white shadow-sm'
                        : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                        }`}
                >
                    <Wrench className="w-4 h-4" />
                    TALLER
                </button>
            </div>

            {/* Tab Content */}
            <div className="flex-1 bg-slate-50 relative overflow-hidden flex flex-col">
                {activeTab === 'VENDER' && <RestrictedPOS cart={cart} setCart={setCart} />}
                {activeTab === 'SERVICIOS' && <ServicesWizard onAddService={handleAddFromWizard} />}
                {activeTab === 'STOCK' && <StockViewer />}
                {activeTab === 'INGRESAR' && <StockIngest />}
                {activeTab === 'TURNOS' && (
                    <div className="flex-1 overflow-hidden p-4">
                        <KanbanBoard title="Tablero de Turnos" showHeader={true} />
                    </div>
                )}
                {activeTab === 'TALLER' && (
                    <div className="flex-1 overflow-hidden">
                        <OperationalKanban />
                    </div>
                )}
            </div>
        </EmployeeLayout>
    );
}
