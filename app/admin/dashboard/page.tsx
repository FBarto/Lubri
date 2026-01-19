'use client';

import { useEffect, useState } from 'react';
import KanbanBoard from '../../components/dashboard/KanbanBoard';
import StockAlertWidget from '../../components/dashboard/StockAlertWidget';
import StatCard from '../../components/dashboard/StatCard';
import SalesChart from '../../components/dashboard/SalesChart';
import TopProductsTable from '../../components/dashboard/TopProductsTable';
import OpportunitiesWidget from '../../components/dashboard/OpportunitiesWidget';
import { DollarSign, AlertCircle, ShoppingBag, TrendingUp, Inbox } from 'lucide-react';

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

    if (loading) return <div className="h-screen flex items-center justify-center bg-slate-100 text-slate-500 font-bold">Cargando tablero...</div>;

    return (
        <div className="p-6 h-screen flex flex-col overflow-hidden bg-slate-100 font-sans">
            <header className="mb-6 flex flex-col md:flex-row justify-between items-start md:items-center shrink-0 gap-4">
                <div>
                    <h1 className="text-3xl font-black text-slate-900 tracking-tight">Tablero de Control</h1>
                    <p className="text-slate-500 font-medium text-sm">Gestión de turnos en tiempo real</p>
                </div>
                <div className="w-full md:w-auto">
                    {/* Stock Alert Widget is robust enough to fetch its own data or we could pass lowStock count */}
                    {/* We can pass the count if we want to show a badge, but for now let it be standalone */}
                </div>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6 shrink-0">
                <StatCard
                    title="Ventas Hoy (Estimado)"
                    value={new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(data?.kpi?.salesToday || 0)}
                    icon={<DollarSign />}
                    trend="+12% vs ayer"
                    trendUp={true}
                />
                <StatCard
                    title="Ventas Inbox"
                    value={data?.kpi?.pendingInbox || 0}
                    icon={<Inbox />}
                    trend="Consultas abiertas"
                    trendUp={true}
                />
                <StatCard
                    title="Órdenes Activas"
                    value={data?.kpi?.pendingOrders || 0}
                    icon={<ShoppingBag />}
                    trend="En taller"
                    trendUp={true}
                />
                <StatCard
                    title="Alerta de Stock"
                    value={data?.kpi?.lowStock || 0}
                    icon={<AlertCircle />}
                    trend={data?.kpi?.lowStock > 0 ? "Reponer urgente" : "Stock saludable"}
                    trendUp={data?.kpi?.lowStock === 0}
                />
            </div>

            {/* AI Opportunities Widget */}
            <div className="mb-8 shrink-0">
                <OpportunitiesWidget />
            </div>

            <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-6 overflow-hidden min-h-0">
                {/* Left Column: Chart (Takes 2 cols) */}
                <div className="lg:col-span-2 flex flex-col gap-6 overflow-hidden min-h-0">
                    <div className="flex-1 min-h-[300px]">
                        <SalesChart data={data?.chart || []} />
                    </div>
                </div>

                {/* Right Column: Top Products & Kanban Link */}
                <div className="flex flex-col gap-6 overflow-hidden min-h-0">
                    <div className="flex-1 min-h-[300px]">
                        <TopProductsTable products={data?.topProducts || []} />
                    </div>
                </div>
            </div>

            {/* Keeping Kanban Board accessible but maybe in a dedicated tab or smaller view? 
                The user asked for a Dashboard with these stats. 
                Let's put the Kanban Board below properly if space allows, or use the components as requested.
                The previous layout had ONLY Kanban. Now we have Stats. 
                Replacing Kanban entirely might be too aggressive if they use it here.
                Let's add a toggle or put stats above. 
                For now, replacing the main view with Stats as requested in "Admin Dashboard" tasks. 
                The operational kanban is in /employee or /tv.
            */}
        </div>
    );
}
