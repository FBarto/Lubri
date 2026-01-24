'use client';

import { useState } from 'react';
import { ShoppingCart, Wrench, Package, ArrowDownToLine, Calendar, Inbox, FilePlus, TrendingUp, Users } from 'lucide-react';
import EmployeeLayout from '../components/employee/EmployeeLayout';

import RestrictedPOS from '../components/employee/RestrictedPOS';
import ServicesWizard from '../components/employee/ServicesWizard';
import StockViewer from '../components/employee/StockViewer';
import StockIngest from '../components/employee/StockIngest';
import KanbanBoard from '../components/dashboard/KanbanBoard';
import OperationalKanban from '../components/employee/OperationalKanban';
import EmployeeInbox from '../components/employee/EmployeeInbox';
import SmartQuote from '../components/quotes/SmartQuote';
import EmployeeDashboard from '../components/employee/EmployeeDashboard';
import EmployeeClientList from '../components/employee/EmployeeClientList';

export default function EmployeePage() {
    const [activeTab, setActiveTab] = useState<'DASHBOARD' | 'VENDER' | 'SERVICIOS' | 'STOCK' | 'INGRESAR' | 'TURNOS' | 'TALLER' | 'INBOX' | 'COTIZAR' | 'CLIENTES'>('DASHBOARD');
    const [cart, setCart] = useState<any[]>([]);

    // Shared Client Context for Actions
    const [selectedClientForAction, setSelectedClientForAction] = useState<any>(null);

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
                    onClick={() => setActiveTab('DASHBOARD')}
                    className={`flex items-center gap-2 px-6 py-3 rounded-t-lg font-bold text-sm transition-all ${activeTab === 'DASHBOARD'
                        ? 'bg-slate-900 text-white shadow-sm'
                        : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                        }`}
                >
                    <TrendingUp className="w-4 h-4" />
                    INICIO
                </button>
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
                    onClick={() => setActiveTab('COTIZAR')}
                    className={`flex items-center gap-2 px-6 py-3 rounded-t-lg font-bold text-sm transition-all ${activeTab === 'COTIZAR'
                        ? 'bg-orange-600 text-white shadow-sm'
                        : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                        }`}
                >
                    <FilePlus className="w-4 h-4" />
                    COTIZAR
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
                    onClick={() => setActiveTab('INBOX')}
                    className={`flex items-center gap-2 px-6 py-3 rounded-t-lg font-bold text-sm transition-all ${activeTab === 'INBOX'
                        ? 'bg-sky-600 text-white shadow-sm'
                        : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                        }`}
                >
                    <Inbox className="w-4 h-4" />
                    INBOX
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
                <button
                    onClick={() => setActiveTab('CLIENTES')}
                    className={`flex items-center gap-2 px-6 py-3 rounded-t-lg font-bold text-sm transition-all ${activeTab === 'CLIENTES'
                        ? 'bg-zinc-800 text-white shadow-sm'
                        : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                        }`}
                >
                    <Users className="w-4 h-4" />
                    CLIENTES
                </button>
            </div>

            {/* Tab Content */}
            <div className="flex-1 bg-slate-50 relative overflow-hidden flex flex-col">
                {activeTab === 'DASHBOARD' && <EmployeeDashboard onNavigate={(tab) => setActiveTab(tab)} />}
                {activeTab === 'VENDER' && (
                    <RestrictedPOS
                        cart={cart}
                        setCart={setCart}
                        initialClient={selectedClientForAction}
                    />
                )}
                {activeTab === 'COTIZAR' && (
                    <div className="flex-1 overflow-y-auto p-6">
                        <SmartQuote initialClient={selectedClientForAction} />
                    </div>
                )}
                {activeTab === 'SERVICIOS' && (
                    <ServicesWizard
                        onAddService={handleAddFromWizard}
                        initialClient={selectedClientForAction}
                    />
                )}
                {activeTab === 'STOCK' && <StockViewer />}
                {activeTab === 'INGRESAR' && <StockIngest />}
                {activeTab === 'TURNOS' && (
                    <div className="flex-1 overflow-hidden p-4">
                        <KanbanBoard title="Tablero de Turnos" showHeader={true} />
                    </div>
                )}
                {activeTab === 'INBOX' && (
                    <div className="flex-1 overflow-hidden">
                        <EmployeeInbox />
                    </div>
                )}
                {activeTab === 'TALLER' && (
                    <div className="flex-1 overflow-hidden">
                        <OperationalKanban onPassToCheckout={(wo) => {
                            // 1. Convert Base Service
                            const baseItem = {
                                type: 'SERVICE',
                                id: wo.service.id,
                                name: wo.service.name + ' - ' + wo.vehicle.plate,
                                price: wo.service.price,
                                quantity: 1,
                                vehicleId: wo.vehicleId,
                                clientId: wo.clientId,
                                workOrderId: wo.id,
                                uniqueId: Math.random().toString(36).substr(2, 9),
                                subtotal: wo.service.price
                            };

                            // 2. Convert Extra Items (from serviceDetails)
                            const extraItems = (wo.serviceDetails as any)?.items?.map((item: any) => ({
                                type: 'PRODUCT',
                                id: item.productId,
                                name: item.name,
                                price: item.unitPrice,
                                quantity: item.quantity,
                                uniqueId: Math.random().toString(36).substr(2, 9),
                                subtotal: item.quantity * item.unitPrice,
                                workOrderId: wo.id
                            })) || [];

                            setCart([baseItem, ...extraItems]);
                            setActiveTab('VENDER');
                        }} />
                    </div>
                )}
                {activeTab === 'CLIENTES' && (
                    <div className="flex-1 overflow-hidden">
                        <EmployeeClientList
                            onClientAction={(client, action) => {
                                setSelectedClientForAction(client);
                                if (action === 'SERVICE') setActiveTab('SERVICIOS');
                                if (action === 'POS') setActiveTab('VENDER');
                                if (action === 'QUOTE') setActiveTab('COTIZAR');
                            }}
                        />
                    </div>
                )}
            </div>
        </EmployeeLayout>
    );
}
