'use client';

import { useEffect, useState } from 'react';
import StockAlertWidget from '../../components/dashboard/StockAlertWidget';
import StatCard from '../../components/dashboard/StatCard';
import SalesChart from '../../components/dashboard/SalesChart';
import TopProductsTable from '../../components/dashboard/TopProductsTable';
import OpportunitiesWidget from '../../components/dashboard/OpportunitiesWidget';
import NotificationCenter from '../../components/dashboard/NotificationCenter';
import { DollarSign, AlertCircle, ShoppingBag, TrendingUp, Inbox, LayoutDashboard, Settings, Users, Car, Scissors, Wrench } from 'lucide-react';

export default function KanbanDashboard() {
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch('/api/reports/dashboard')
            .then(res => res.json())
            .then(setData)
            .catch(err => console.error(err))
            .finally(() => setLoading(false));
    }, []);

    if (loading) return <div className="h-screen flex items-center justify-center bg-slate-50 text-red-600 font-black text-2xl animate-pulse italic">FB LUBRICENTRO CLOUD...</div>;

    return (
        <div className="min-h-screen flex bg-slate-50 font-sans text-slate-900">
            {/* Sidebar Slim */}
            <aside className="w-20 bg-white border-r border-slate-200 flex flex-col items-center py-8 gap-8 shrink-0">
                <div className="w-12 h-12 brand-gradient-red rounded-2xl flex items-center justify-center text-white shadow-lg shadow-red-200">
                    <TrendingUp size={24} strokeWidth={3} />
                </div>

                <nav className="flex flex-col gap-4">
                    <div className="p-3 bg-red-50 text-red-600 rounded-2xl cursor-pointer">
                        <LayoutDashboard size={24} />
                    </div>
                    <div className="p-3 text-slate-400 hover:bg-slate-50 hover:text-slate-600 rounded-2xl transition-all cursor-pointer">
                        <Users size={24} />
                    </div>
                    <div className="p-3 text-slate-400 hover:bg-slate-50 hover:text-slate-600 rounded-2xl transition-all cursor-pointer">
                        <Car size={24} />
                    </div>
                    <div className="p-3 text-slate-400 hover:bg-slate-50 hover:text-slate-600 rounded-2xl transition-all cursor-pointer">
                        <Wrench size={24} />
                    </div>
                </nav>

                <div className="mt-auto p-3 text-slate-400 hover:text-slate-600 cursor-pointer">
                    <Settings size={24} />
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 p-8 overflow-y-auto">
                <header className="mb-10 flex justify-between items-center">
                    <div>
                        <h1 className="text-4xl font-black tracking-tight text-slate-900">Control Tower</h1>
                        <p className="text-slate-500 font-bold flex items-center gap-2 mt-1 italic">
                            <span className="w-2 h-2 bg-red-600 rounded-full animate-ping"></span>
                            Operativa en tiempo real • {new Date().toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long' })}
                        </p>
                    </div>

                    <div className="flex items-center gap-4">
                        <NotificationCenter />
                        <div className="h-12 w-12 bg-white rounded-2xl border border-slate-200 shadow-sm flex items-center justify-center overflow-hidden">
                            <img src="https://ui-avatars.com/api/?name=Admin&background=dc2626&color=fff" alt="User" />
                        </div>
                    </div>
                </header>

                {/* KPI Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
                    <StatCard
                        title="Ventas Hoy"
                        value={new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(data?.kpi?.salesToday || 0)}
                        icon={<DollarSign />}
                        trend="+12% hoy"
                        trendUp={true}
                    />
                    <StatCard
                        title="Consultas Inbox"
                        value={data?.kpi?.pendingInbox || 0}
                        icon={<Inbox />}
                        trend="Nuevos leads"
                        trendUp={true}
                    />
                    <StatCard
                        title="Ordenes Activas"
                        value={data?.kpi?.pendingOrders || 0}
                        icon={<ShoppingBag />}
                        trend="En proceso"
                        trendUp={true}
                    />
                    <StatCard
                        title="Alerta de Stock"
                        value={data?.kpi?.lowStock || 0}
                        icon={<AlertCircle />}
                        trend={data?.kpi?.lowStock > 0 ? "Reponer YA" : "OK"}
                        trendUp={data?.kpi?.lowStock === 0}
                    />
                </div>

                <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
                    {/* Insights & Charts */}
                    <div className="xl:col-span-2 space-y-8">
                        <section className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
                            <h3 className="text-xl font-black mb-6 flex items-center gap-2 italic uppercase">
                                <TrendingUp className="text-red-500" />
                                <span className="text-slate-900 leading-none pt-1">Rendimiento de Ventas</span>
                            </h3>
                            <div className="h-[350px]">
                                <SalesChart data={data?.chart || []} />
                            </div>
                        </section>

                        <OpportunitiesWidget />
                    </div>

                    {/* Side Widgets */}
                    <div className="space-y-8">
                        <section className="bg-neutral-900 text-white p-8 rounded-[2.5rem] shadow-2xl relative overflow-hidden">
                            <div className="relative z-10">
                                <h3 className="text-xl font-black mb-2 flex items-center gap-2 italic uppercase">
                                    <ShoppingBag className="text-red-500" />
                                    Top Productos
                                </h3>
                                <p className="text-red-400 text-xs font-bold mb-6 uppercase tracking-wider">Últimos 30 días</p>
                                <TopProductsTable products={data?.topProducts || []} />
                            </div>
                            {/* Decorative element */}
                            <div className="absolute top-0 right-0 w-32 h-32 bg-red-600/10 blur-3xl rounded-full translate-x-1/2 -translate-y-1/2"></div>
                        </section>

                        <section className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
                            <h3 className="text-xl font-black mb-4 flex items-center gap-2 italic uppercase">
                                <AlertCircle className="text-red-500" />
                                Stock Crítico
                            </h3>
                            <StockAlertWidget />
                        </section>
                    </div>
                </div>
            </main>
        </div>
    );
}
