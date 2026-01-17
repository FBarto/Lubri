'use client';

import { useState, useEffect } from 'react';
import { AlertTriangle, Package } from 'lucide-react';

export default function StockAlertWidget() {
    const [alerts, setAlerts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch('/api/reports/stock-alerts')
            .then(res => res.json())
            .then(data => {
                if (Array.isArray(data)) {
                    setAlerts(data);
                }
                setLoading(false);
            })
            .catch(err => {
                console.error(err);
                setLoading(false);
            });
    }, []);

    if (loading) return <div className="h-32 bg-white rounded-xl shadow-sm animate-pulse"></div>;

    if (alerts.length === 0) return (
        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex items-center gap-3">
            <div className="bg-emerald-100 p-2 rounded-lg text-emerald-600">
                <Package size={24} />
            </div>
            <div>
                <h3 className="font-bold text-slate-700">Stock OK</h3>
                <p className="text-xs text-slate-500">Ningún producto crítico</p>
            </div>
        </div>
    );

    return (
        <div className="bg-white p-4 rounded-xl shadow-sm border border-red-100 flex flex-col gap-3">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <div className="bg-red-100 p-2 rounded-lg text-red-600">
                        <AlertTriangle size={24} />
                    </div>
                    <div>
                        <h3 className="font-bold text-slate-900">Alertas de Stock</h3>
                        <p className="text-xs text-slate-500">{alerts.length} productos críticos</p>
                    </div>
                </div>
            </div>

            <div className="max-h-48 overflow-y-auto space-y-2">
                {alerts.map(item => (
                    <div key={item.id} className="flex justify-between items-center text-sm p-2 bg-red-50 rounded-lg">
                        <span className="font-medium text-slate-700 truncate max-w-[150px]">{item.name}</span>
                        <div className="flex items-center gap-2">
                            <span className="text-red-600 font-bold">{item.stock}</span>
                            <span className="text-xs text-slate-400">/ {item.minStock}</span>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
