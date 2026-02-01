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
        <div className="bg-white/80 backdrop-blur-sm p-6 rounded-3xl border border-white shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group">
            <div className="flex justify-between items-start mb-4">
                <div className={`p-3 rounded-2xl transition-colors duration-300 ${trendUp ? 'bg-red-50 text-red-600 group-hover:bg-red-600 group-hover:text-white' : 'bg-rose-50 text-rose-500 group-hover:bg-rose-500 group-hover:text-white'}`}>
                    {icon && React.cloneElement(icon as React.ReactElement<any>, { size: 20 })}
                </div>
                {trend && (
                    <span className={`text-[10px] font-black px-2 py-1 rounded-lg uppercase tracking-wider ${trendUp ? 'bg-red-100 text-red-700' : 'bg-rose-100 text-rose-700'}`}>
                        {trend}
                    </span>
                )}
            </div>
            <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">{title}</p>
                <h4 className="text-3xl font-black text-slate-900 tracking-tight group-hover:text-red-600 transition-colors">{value}</h4>
            </div>

            {/* Subtle background decoration */}
            <div className="absolute -bottom-2 -right-2 opacity-[0.03] group-hover:opacity-[0.07] transition-opacity">
                {icon && React.cloneElement(icon as React.ReactElement<any>, { size: 80 })}
            </div>
        </div>
    );
}
