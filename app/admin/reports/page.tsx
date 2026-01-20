'use client';

import { useState, useEffect } from 'react';
import SalesChart from '@/app/components/reports/SalesChart';
import TopItemsTable from '@/app/components/reports/TopItemsTable';
import { getInboxStats } from '../../lib/inbox-actions';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

export default function ReportsPage() {
    const [stats, setStats] = useState<any>(null);
    const [topItems, setTopItems] = useState<any>(null);
    const [payments, setPayments] = useState<any[]>([]);
    const [inboxStats, setInboxStats] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    const [filterDate, setFilterDate] = useState(new Date().toISOString().slice(0, 7)); // YYYY-MM

    useEffect(() => {
        async function fetchReports() {
            setLoading(true);
            try {
                const [year, month] = filterDate.split('-');

                const [salesRes, itemsRes, paymentsRes] = await Promise.all([
                    fetch(`/api/admin/stats/sales?year=${year}&month=${month}`),
                    fetch(`/api/admin/stats/top-items`),
                    fetch(`/api/admin/stats/payments`)
                ]);

                const salesData = await salesRes.json();
                const itemsData = await itemsRes.json();
                const paymentsData = await paymentsRes.json();
                const inboxRes = await getInboxStats(Number(year), Number(month));

                setStats(salesData);
                setTopItems(itemsData);
                setPayments(paymentsData);
                if (inboxRes.success) setInboxStats(inboxRes.data);

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

            {/* Inbox Section */}
            {inboxStats && (
                <section className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                    <h2 className="text-xl font-bold mb-6 tracking-tight flex items-center gap-2">
                        <span>📥 Métricas Inbox</span>
                    </h2>

                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                        <div className="bg-blue-50 p-4 rounded-xl border border-blue-100">
                            <p className="text-xs uppercase font-bold text-blue-500 mb-1">Casos Nuevos</p>
                            <p className="text-3xl font-black text-slate-800">{inboxStats.total}</p>
                        </div>
                        <div className="bg-emerald-50 p-4 rounded-xl border border-emerald-100">
                            <p className="text-xs uppercase font-bold text-emerald-500 mb-1">Conversión</p>
                            <p className="text-3xl font-black text-slate-800">{inboxStats.conversionRate.toFixed(1)}%</p>
                        </div>
                        <div className="bg-amber-50 p-4 rounded-xl border border-amber-100">
                            <p className="text-xs uppercase font-bold text-amber-500 mb-1">Ganados</p>
                            <p className="text-3xl font-black text-slate-800">{inboxStats.won}</p>
                        </div>
                        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                            <p className="text-xs uppercase font-bold text-slate-500 mb-1">Perdidos</p>
                            <p className="text-3xl font-black text-slate-800">{inboxStats.lost}</p>
                        </div>
                    </div>

                    <div className="h-64 mt-4">
                        <h3 className="text-sm font-bold text-slate-500 mb-4">Distribución por Estado</h3>
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={Object.entries(inboxStats.distribution).map(([k, v]) => ({ name: k, value: v }))}>
                                <XAxis dataKey="name" fontSize={10} tickFormatter={(val) => val.substring(0, 10)} />
                                <YAxis />
                                <Tooltip />
                                <Bar dataKey="value" fill="#3b82f6" radius={[4, 4, 0, 0]}>
                                    {Object.entries(inboxStats.distribution).map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry[0] === 'WON' ? '#10b981' : entry[0] === 'LOST' ? '#ef4444' : '#3b82f6'} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </section>
            )}

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
