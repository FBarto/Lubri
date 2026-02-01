'use client';

import { useState } from 'react';
import { ShoppingCart, Wrench, Package, ArrowDownToLine, Calendar, Inbox, FilePlus, TrendingUp, Users } from 'lucide-react';
import EmployeeLayout from '../components/employee/EmployeeLayout';

import RestrictedPOS from '../components/employee/RestrictedPOS';
import ServicesWizard from '../components/employee/ServicesWizard';
import StockViewer from '../components/employee/StockViewer';
import StockIngest from '../components/employee/StockIngest';
import UnifiedKanban from '../components/dashboard/UnifiedKanban';
import EmployeeInbox from '../components/employee/EmployeeInbox';
import SmartQuote from '../components/quotes/SmartQuote';
import EmployeeDashboard from '../components/employee/EmployeeDashboard';
import EmployeeClientList from '../components/employee/EmployeeClientList';
import EmployeeCheckout from '../components/employee/EmployeeCheckout';

export default function EmployeePage() {
    const [activeTab, setActiveTab] = useState<'DASHBOARD' | 'VENTA' | 'SERVICIOS' | 'STOCK' | 'INGRESAR' | 'TURNOS' | 'TALLER' | 'INBOX' | 'COTIZAR' | 'CLIENTES' | 'COBRAR'>('TALLER');
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
            <div className="bg-white border-b border-slate-200 px-4 pt-4 flex gap-4 overflow-x-auto justify-center md:justify-start">
                <button
                    onClick={() => setActiveTab('TALLER')}
                    className={`flex items-center gap-2 px-6 py-4 rounded-t-2xl font-black text-sm tracking-wider transition-all border-t-2 border-x-2 ${activeTab === 'TALLER'
                        ? 'bg-slate-900 border-slate-900 text-white shadow-lg -mb-[1px] z-10'
                        : 'bg-white border-transparent text-slate-400 hover:bg-slate-50 hover:text-slate-600'
                        }`}
                >
                    <Wrench className="w-5 h-5" />
                    TABLERO
                </button>
                <button
                    onClick={() => setActiveTab('COBRAR')}
                    className={`flex items-center gap-2 px-6 py-4 rounded-t-2xl font-black text-sm tracking-wider transition-all border-t-2 border-x-2 ${activeTab === 'COBRAR'
                        ? 'bg-emerald-600 border-emerald-600 text-white shadow-lg -mb-[1px] z-10'
                        : 'bg-white border-transparent text-slate-400 hover:bg-slate-50 hover:text-slate-600'
                        }`}
                >
                    <TrendingUp className="w-5 h-5" />
                    COBRAR
                </button>
                <button
                    onClick={() => setActiveTab('VENTA')}
                    className={`flex items-center gap-2 px-6 py-4 rounded-t-2xl font-black text-sm tracking-wider transition-all border-t-2 border-x-2 ${activeTab === 'VENTA'
                        ? 'bg-blue-600 border-blue-600 text-white shadow-lg -mb-[1px] z-10'
                        : 'bg-white border-transparent text-slate-400 hover:bg-slate-50 hover:text-slate-600'
                        }`}
                >
                    <ShoppingCart className="w-5 h-5" />
                    <span className="flex items-center gap-2">
                        COMPRA
                        {cart.length > 0 && <span className="bg-white text-blue-600 px-1.5 py-0.5 rounded-md text-xs">{cart.length}</span>}
                    </span>
                </button>
                <button
                    onClick={() => setActiveTab('STOCK')}
                    className={`flex items-center gap-2 px-6 py-4 rounded-t-2xl font-black text-sm tracking-wider transition-all border-t-2 border-x-2 ${activeTab === 'STOCK'
                        ? 'bg-amber-600 border-amber-600 text-white shadow-lg -mb-[1px] z-10'
                        : 'bg-white border-transparent text-slate-400 hover:bg-slate-50 hover:text-slate-600'
                        }`}
                >
                    <Package className="w-5 h-5" />
                    STOCK
                </button>
                <button
                    onClick={() => setActiveTab('INGRESAR')}
                    className={`flex items-center gap-2 px-6 py-4 rounded-t-2xl font-black text-sm tracking-wider transition-all border-t-2 border-x-2 ${activeTab === 'INGRESAR'
                        ? 'bg-purple-600 border-purple-600 text-white shadow-lg -mb-[1px] z-10'
                        : 'bg-white border-transparent text-slate-400 hover:bg-slate-50 hover:text-slate-600'
                        }`}
                >
                    <ArrowDownToLine className="w-5 h-5" />
                    INGRESAR
                </button>
                <button
                    onClick={() => setActiveTab('CLIENTES')}
                    className={`flex items-center gap-2 px-6 py-4 rounded-t-2xl font-black text-sm tracking-wider transition-all border-t-2 border-x-2 ${activeTab === 'CLIENTES'
                        ? 'bg-indigo-600 border-indigo-600 text-white shadow-lg -mb-[1px] z-10'
                        : 'bg-white border-transparent text-slate-400 hover:bg-slate-50 hover:text-slate-600'
                        }`}
                >
                    <Users className="w-5 h-5" />
                    CLIENTES
                </button>
            </div>

            {/* Tab Content */}
            <div className="flex-1 bg-slate-50 relative overflow-hidden flex flex-col">
                {activeTab === 'DASHBOARD' && <EmployeeDashboard onNavigate={(tab) => setActiveTab(tab)} />}

                {activeTab === 'COBRAR' && <EmployeeCheckout />}

                {activeTab === 'VENTA' && (
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
                {activeTab === 'INBOX' && (
                    <div className="flex-1 overflow-hidden">
                        <EmployeeInbox />
                    </div>
                )}
                {activeTab === 'TALLER' && (
                    <div className="flex-1 overflow-hidden">
                        <UnifiedKanban onPassToCheckout={(wo) => {
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
                            setActiveTab('VENTA');
                        }} />
                    </div>
                )}
                {activeTab === 'CLIENTES' && (
                    <div className="flex-1 overflow-hidden">
                        <EmployeeClientList
                            onClientAction={(client, action) => {
                                setSelectedClientForAction(client);
                                if (action === 'SERVICE') setActiveTab('SERVICIOS');
                                if (action === 'POS') setActiveTab('VENTA');
                                if (action === 'QUOTE') setActiveTab('COTIZAR');
                            }}
                        />
                    </div>
                )}
            </div>
        </EmployeeLayout>
    );
}
