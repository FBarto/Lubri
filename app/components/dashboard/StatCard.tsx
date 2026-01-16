import React from 'react';

interface StatCardProps {
    title: string;
    value: string | number;
    icon?: React.ReactNode;
    trend?: string; // e.g., "+5% vs ayer"
    trendUp?: boolean;
}

export default function StatCard({ title, value, icon, trend, trendUp }: StatCardProps) {
    return (
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all">
            <div className="flex justify-between items-start mb-2">
                <span className="text-sm font-bold text-slate-500 uppercase tracking-wider">{title}</span>
                {icon && <span className="text-slate-400 text-xl">{icon}</span>}
            </div>
            <div className="flex items-end gap-3">
                <span className="text-3xl font-black text-slate-800 tracking-tight">{value}</span>
                {trend && (
                    <span className={`text-xs font-bold px-2 py-1 rounded-full mb-1 ${trendUp ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                        {trend}
                    </span>
                )}
            </div>
        </div>
    );
}
