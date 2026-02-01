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
        <div className="glass p-6 rounded-[2rem] border border-white/40 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group relative overflow-hidden">
            <div className="flex justify-between items-start mb-4 relative z-10">
                <div className={`p-3 rounded-2xl transition-all duration-500 ${trendUp ? 'bg-red-50 text-red-600 group-hover:bg-red-600 group-hover:text-white group-hover:rotate-12' : 'bg-rose-50 text-rose-500 group-hover:bg-rose-500 group-hover:text-white group-hover:-rotate-12'}`}>
                    {icon && React.cloneElement(icon as React.ReactElement<any>, { size: 24, strokeWidth: 2.5 })}
                </div>
                {trend && (
                    <span className={`text-[10px] font-black px-2.5 py-1 rounded-full uppercase tracking-wider ${trendUp ? 'bg-red-500/10 text-red-600 border border-red-200' : 'bg-rose-500/10 text-rose-600 border border-rose-200'}`}>
                        {trend}
                    </span>
                )}
            </div>
            <div className="relative z-10">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">{title}</p>
                <h4 className="text-3xl font-black text-slate-900 tracking-tight group-hover:text-red-600 transition-colors duration-300">{value}</h4>
            </div>

            {/* Subtle background decoration */}
            <div className="absolute -bottom-4 -right-4 opacity-[0.03] group-hover:opacity-[0.08] group-hover:scale-110 transition-all duration-500">
                {icon && React.cloneElement(icon as React.ReactElement<any>, { size: 100 })}
            </div>

            {/* Glossy overlay effect */}
            <div className="absolute top-0 left-0 w-full h-1/2 bg-gradient-to-b from-white/20 to-transparent pointer-events-none"></div>
        </div>
    );
}
