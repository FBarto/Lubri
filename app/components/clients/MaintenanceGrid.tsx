'use client';

import { useEffect, useState } from 'react';
import { getVehicleMaintenanceHistory } from '../../lib/maintenance-actions';
import { MaintenanceStatus } from '../../lib/maintenance-data';
import { CheckCircle, AlertTriangle, AlertOctagon, HelpCircle, Droplet, Wind, Wrench } from 'lucide-react';

export default function MaintenanceGrid({ vehicleId }: { vehicleId: number }) {
    const [data, setData] = useState<{
        filters: (MaintenanceStatus & { key: string })[],
        fluids: (MaintenanceStatus & { key: string })[],
        services: (MaintenanceStatus & { key: string })[]
    } | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function load() {
            setLoading(true);
            const res = await getVehicleMaintenanceHistory(vehicleId);
            if (res.success && res.data) {
                setData(res.data);
            }
            setLoading(false);
        }
        load();
    }, [vehicleId]);

    if (loading) return <div className="text-xs text-slate-400 p-4">Cargando mantenimiento...</div>;
    if (!data) return null;

    const StatusIcon = ({ status }: { status: string }) => {
        if (status === 'OK') return <CheckCircle size={14} className="text-emerald-500" />;
        if (status === 'WARNING') return <AlertTriangle size={14} className="text-amber-500" />;
        if (status === 'DANGER') return <AlertOctagon size={14} className="text-red-500" />;
        return <HelpCircle size={14} className="text-slate-300" />;
    };

    const StatusCard = ({ item }: { item: any }) => (
        <div className="flex items-center justify-between p-2 rounded bg-slate-50 border border-slate-100 mb-1">
            <div className="flex items-center gap-2 overflow-hidden">
                <StatusIcon status={item.status} />
                <div className="truncate">
                    <p className="text-xs font-bold text-slate-700 truncate">{item.label}</p>
                    <p className="text-[10px] text-slate-400 truncate">
                        {item.lastDate ? new Date(item.lastDate).toLocaleDateString() : 'Nunca registrado'}
                    </p>
                </div>
            </div>
            {item.lastMileage && <span className="text-[10px] font-mono text-slate-500 bg-white px-1 rounded border border-slate-100">{item.lastMileage}km</span>}
        </div>
    );

    return (
        <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
                <h4 className="text-xs font-black text-slate-400 uppercase mb-2 flex items-center gap-1"><Wind size={12} /> Filtros</h4>
                {data.filters.map(item => <StatusCard key={item.key} item={item} />)}
            </div>
            <div>
                <h4 className="text-xs font-black text-slate-400 uppercase mb-2 flex items-center gap-1"><Droplet size={12} /> Fluidos</h4>
                {data.fluids.map(item => <StatusCard key={item.key} item={item} />)}
            </div>
            <div>
                <h4 className="text-xs font-black text-slate-400 uppercase mb-2 flex items-center gap-1"><Wrench size={12} /> Servicios</h4>
                {data.services.map(item => <StatusCard key={item.key} item={item} />)}
            </div>
        </div>
    );
}
