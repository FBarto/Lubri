
'use client';

import { useState, useEffect } from 'react';
import SalesChart from '@/app/components/reports/SalesChart';
import TopItemsTable from '@/app/components/reports/TopItemsTable';

export default function ReportsPage() {
    const [stats, setStats] = useState<any>(null);
    const [topItems, setTopItems] = useState<any>(null);
    const [payments, setPayments] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const [filterDate, setFilterDate] = useState(new Date().toISOString().slice(0, 7)); // YYYY-MM

    useEffect(() => {
        async function fetchReports() {
            setLoading(true);
            try {
                const [year, month] = filterDate.split('-');

                const [salesRes, itemsRes, paymentsRes] = await Promise.all([
                    fetch(`/api/admin/stats/sales?year=${year}&month=${month}`),
                    fetch(`/api/admin/stats/top-items`), // Allow filtering later
                    fetch(`/api/admin/stats/payments`)   // Allow filtering later
                ]);

                const salesData = await salesRes.json();
                const itemsData = await itemsRes.json();
                const paymentsData = await paymentsRes.json();

                setStats(salesData);
                setTopItems(itemsData);
                setPayments(paymentsData);
            } catch (e) {
                console.error(e);
            } finally {
                setLoading(false);
            }
        }

        fetchReports();
    }, [filterDate]);

    if (loading) return <div className="p-8 text-slate-500 font-bold">Cargando reportes...</div>;

    return (
        <div className="p-6 md:p-10 max-w-7xl mx-auto space-y-8">
            <header className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-black text-slate-900 tracking-tighter">Reportes</h1>
                    <p className="text-slate-500">Vista general del rendimiento del negocio</p>
                </div>
                <div>
                    <input
                        type="month"
                        value={filterDate}
                        onChange={(e) => setFilterDate(e.target.value)}
                        className="bg-white border border-slate-200 rounded-lg px-4 py-2 font-bold text-slate-700 shadow-sm"
                    />
                </div>
            </header>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-slate-900 text-white p-6 rounded-2xl shadow-xl">
                    <p className="text-xs uppercase font-bold opacity-60 mb-2">Ingresos Totales (Mes)</p>
                    <p className="text-4xl font-black tracking-tighter">
                        ${stats?.summary?.totalRevenue?.toLocaleString() || 0}
                    </p>
                </div>
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                    <p className="text-xs uppercase font-bold text-slate-400 mb-2">Operaciones (Mes)</p>
                    <p className="text-4xl font-black text-slate-800 tracking-tighter">
                        {stats?.summary?.totalSales || 0}
                    </p>
                </div>
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                    <p className="text-xs uppercase font-bold text-slate-400 mb-2">Método Favorito</p>
                    <p className="text-2xl font-bold text-slate-800">
                        {payments.length > 0 ? payments.sort((a, b) => b.value - a.value)[0].name : '-'}
                    </p>
                    <p className="text-sm text-slate-500">
                        {payments.length > 0 ? `${(payments.sort((a, b) => b.value - a.value)[0].value / (stats?.summary?.totalRevenue || 1) * 100).toFixed(0)}% del total` : ''}
                    </p>
                </div>
            </div>

            {/* Main Chart */}
            <section className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                <h2 className="text-xl font-bold mb-6 tracking-tight">Evolución de Ventas</h2>
                <SalesChart data={stats?.chartData || []} />
            </section>

            {/* Top Tables */}
            <section>
                <TopItemsTable
                    products={topItems?.products || []}
                    services={topItems?.services || []}
                />
            </section>
        </div>
    );
}
