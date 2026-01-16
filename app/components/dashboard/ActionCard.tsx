import Link from 'next/link';
import React from 'react';

interface ActionCardProps {
    title: string;
    description: string;
    icon: React.ReactNode;
    href: string;
    color?: string; // e.g., 'blue', 'emerald', 'purple'
}

export default function ActionCard({ title, description, icon, href, color = 'blue' }: ActionCardProps) {
    const colorClasses = {
        blue: 'bg-blue-50 border-blue-200 text-blue-700 hover:border-blue-400 hover:shadow-blue-100',
        emerald: 'bg-emerald-50 border-emerald-200 text-emerald-700 hover:border-emerald-400 hover:shadow-emerald-100',
        purple: 'bg-purple-50 border-purple-200 text-purple-700 hover:border-purple-400 hover:shadow-purple-100',
        amber: 'bg-amber-50 border-amber-200 text-amber-700 hover:border-amber-400 hover:shadow-amber-100',
        slate: 'bg-slate-50 border-slate-200 text-slate-700 hover:border-slate-400 hover:shadow-slate-100',
    };

    const activeClass = colorClasses[color as keyof typeof colorClasses] || colorClasses.blue;

    return (
        <Link href={href} className={`
            block p-6 rounded-2xl border transition-all duration-200 hover:shadow-lg hover:-translate-y-1 group
            ${activeClass}
        `}>
            <div className="flex items-center gap-4 mb-3">
                <div className="p-3 bg-white rounded-xl shadow-sm group-hover:scale-110 transition-transform text-2xl">
                    {icon}
                </div>
                <h3 className="font-bold text-xl">{title}</h3>
            </div>
            <p className="text-sm font-medium opacity-80 leading-relaxed">
                {description}
            </p>
        </Link>
    );
}
