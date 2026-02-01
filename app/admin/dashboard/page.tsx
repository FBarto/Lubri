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
            <aside className="w-24 bg-white border-r border-slate-100 flex flex-col items-center py-10 gap-10 shrink-0 shadow-[20px_0_40px_rgba(0,0,0,0.02)] relative z-20">
                <div className="w-14 h-14 brand-gradient-red rounded-[1.5rem] flex items-center justify-center text-white shadow-xl shadow-red-200/50 hover:scale-110 transition-transform cursor-pointer group">
                    <TrendingUp size={28} strokeWidth={3} className="group-hover:rotate-12 transition-transform" />
                </div>

                <nav className="flex flex-col gap-6">
                    <SidebarIcon icon={<LayoutDashboard size={26} />} active label="Dashboard" />
                    <SidebarIcon icon={<Users size={26} />} label="Clientes" />
                    <SidebarIcon icon={<Car size={26} />} label="Vehículos" />
                    <SidebarIcon icon={<Wrench size={26} />} label="Taller" />
                    <SidebarIcon icon={<ShoppingBag size={26} />} label="POS" />
                </nav>

                <div className="mt-auto flex flex-col gap-6 pb-4">
                    <SidebarIcon icon={<Settings size={26} />} label="Ajustes" />
                    <div className="h-12 w-12 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-center overflow-hidden hover:border-red-200 transition-colors cursor-pointer">
                        <img src="https://ui-avatars.com/api/?name=Admin&background=dc2626&color=fff" alt="User" className="w-full h-full object-cover" />
                    </div>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 p-10 overflow-y-auto relative bg-[#f8fafc]">
                {/* Background decorative elements */}
                <div className="absolute top-0 right-0 w-[50%] h-[30%] bg-red-500/[0.02] blur-[120px] rounded-full pointer-events-none"></div>

                <header className="mb-12 flex justify-between items-end">
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <span className="px-3 py-1 bg-red-600 text-white text-[10px] font-black uppercase tracking-[0.2em] rounded-full">System Active</span>
                            <span className="h-[1px] w-12 bg-slate-200"></span>
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic">{new Date().toLocaleTimeString()} • Buenos Aires</span>
                        </div>
                        <h1 className="text-5xl font-black tracking-tighter text-slate-900 italic uppercase">Control <span className="text-red-600">Tower</span></h1>
                        <p className="text-slate-500 font-bold flex items-center gap-2 mt-2 italic">
                            <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_10px_rgba(16,185,129,0.5)]"></span>
                            Smart Operations Hub • {new Date().toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long' })}
                        </p>
                    </div>

                    <div className="flex items-center gap-6">
                        <div className="flex flex-col items-end mr-2">
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Status</span>
                            <span className="text-sm font-bold text-slate-900 tracking-tight">Optimal Performance</span>
                        </div>
                        <NotificationCenter />
                    </div>
                </header>

                {/* KPI Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
                    <StatCard
                        title="Ventas Hoy"
                        value={new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(data?.kpi?.salesToday || 0)}
                        icon={<DollarSign />}
                        trend="+12% hoy"
                        trendUp={true}
                    />
                    <StatCard
                        title="Canal Inbox"
                        value={data?.kpi?.pendingInbox || 0}
                        icon={<Inbox />}
                        trend="En espera"
                        trendUp={true}
                    />
                    <StatCard
                        title="Work Orders"
                        value={data?.kpi?.pendingOrders || 0}
                        icon={<ShoppingBag />}
                        trend="En taller"
                        trendUp={true}
                    />
                    <StatCard
                        title="Estado Stock"
                        value={data?.kpi?.lowStock || 0}
                        icon={<AlertCircle />}
                        trend={data?.kpi?.lowStock > 0 ? "Reponer Stock" : "Nivel Óptimo"}
                        trendUp={data?.kpi?.lowStock === 0}
                    />
                </div>

                <div className="grid grid-cols-1 xl:grid-cols-4 gap-10">
                    {/* Insights & Charts */}
                    <div className="xl:col-span-3 space-y-10">
                        <section className="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-sm relative overflow-hidden group">
                            <div className="absolute top-0 right-0 w-64 h-64 bg-slate-50 rounded-full translate-x-1/2 -translate-y-1/2 group-hover:bg-red-50/50 transition-colors duration-500"></div>

                            <div className="flex justify-between items-center mb-10 relative z-10">
                                <h3 className="text-2xl font-black flex items-center gap-3 italic uppercase tracking-tighter">
                                    <div className="p-2 bg-red-600 rounded-xl text-white">
                                        <TrendingUp size={24} />
                                    </div>
                                    <span className="text-slate-900">Métricas de Rendimiento</span>
                                </h3>
                                <div className="flex gap-2">
                                    {['24h', '7d', '30d'].map(p => (
                                        <button key={p} className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${p === '7d' ? 'bg-red-600 text-white' : 'bg-slate-100 text-slate-400 hover:bg-slate-200'}`}>
                                            {p}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="h-[400px] relative z-10">
                                <SalesChart data={data?.chart || []} />
                            </div>
                        </section>

                        <OpportunitiesWidget />
                    </div>

                    {/* Side Widgets / Gauges */}
                    <div className="xl:col-span-1 space-y-10">
                        {/* Telemetry Section */}
                        <section className="glass-dark p-8 rounded-[3rem] shadow-2xl relative overflow-hidden border border-white/5">
                            <h3 className="text-lg font-black text-white mb-8 flex items-center gap-2 italic uppercase tracking-tight">
                                <Wrench className="text-red-500" size={20} />
                                Telemetría
                            </h3>

                            <div className="space-y-8">
                                <TelemetryGauge label="Eficiencia Taller" value={85} color="red" />
                                <TelemetryGauge label="Conversión Leads" value={62} color="emerald" />
                                <TelemetryGauge label="Stock Salud" value={45} color="orange" />
                            </div>
                        </section>

                        <section className="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-sm">
                            <h3 className="text-xl font-black mb-6 flex items-center gap-2 italic uppercase tracking-tight">
                                <ShoppingBag className="text-red-500" size={24} />
                                Top Ventas
                            </h3>
                            <TopProductsTable products={data?.topProducts || []} />
                            <button className="w-full mt-6 py-3 border border-slate-100 hover:bg-slate-50 rounded-2xl text-[10px] font-black uppercase tracking-widest text-slate-400 transition-all">
                                Ver Reporte Completo
                            </button>
                        </section>

                        <section className="bg-red-600 p-8 rounded-[3rem] shadow-xl shadow-red-200 relative overflow-hidden group cursor-pointer">
                            <div className="relative z-10">
                                <h3 className="text-xl font-black text-white mb-2 flex items-center gap-2 italic uppercase">
                                    <AlertCircle className="text-white" />
                                    Alertas
                                </h3>
                                <p className="text-red-100 text-xs font-bold mb-4 uppercase tracking-wider">Acción requerida inmediata</p>
                                <StockAlertWidget />
                            </div>
                            <div className="absolute -bottom-4 -right-4 text-white opacity-10 group-hover:scale-110 transition-transform">
                                <AlertCircle size={120} />
                            </div>
                        </section>
                    </div>
                </div>
            </main>
        </div>
    );
}

function SidebarIcon({ icon, active = false, label }: { icon: any, active?: boolean, label: string }) {
    return (
        <div className="group relative">
            <div className={`p-4 rounded-3xl transition-all duration-300 cursor-pointer ${active ? 'bg-red-50 text-red-600 shadow-inner' : 'text-slate-300 hover:bg-slate-50 hover:text-slate-600'}`}>
                {icon}
            </div>
            {/* Tooltip */}
            <div className="absolute left-full ml-4 px-3 py-2 bg-slate-900 text-white text-[10px] font-black uppercase tracking-widest rounded-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all whitespace-nowrap z-50 translate-x-[-10px] group-hover:translate-x-0 shadow-xl">
                {label}
                <div className="absolute right-full top-1/2 -translate-y-1/2 border-8 border-transparent border-r-slate-900"></div>
            </div>
        </div>
    );
}

function TelemetryGauge({ label, value, color }: { label: string, value: number, color: string }) {
    const colors = {
        red: 'from-red-600 to-red-400 shadow-red-900/40',
        emerald: 'from-emerald-600 to-emerald-400 shadow-emerald-900/40',
        orange: 'from-orange-600 to-orange-400 shadow-orange-900/40'
    };

    return (
        <div className="space-y-3">
            <div className="flex justify-between items-end">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{label}</span>
                <span className="text-lg font-black text-white italic">{value}%</span>
            </div>
            <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden border border-white/5 p-[1px]">
                <div
                    className={`h-full bg-gradient-to-r rounded-full shadow-lg transition-all duration-1000 ease-out ${colors[color as keyof typeof colors]}`}
                    style={{ width: `${value}%` }}
                ></div>
            </div>
        </div>
    );
}
}
