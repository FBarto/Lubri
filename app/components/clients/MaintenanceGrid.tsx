import { useEffect, useState } from 'react';
import { getVehicleMaintenanceHistory } from '../../actions/maintenance';
import { MaintenanceStatus } from '../../lib/maintenance-data';
import { CheckCircle, AlertTriangle, AlertOctagon, HelpCircle, Droplet, Wind, Wrench, Info } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';

export default function MaintenanceGrid({ vehicleId }: { vehicleId: number }) {
    const [data, setData] = useState<{
        filters: (MaintenanceStatus & { key: string })[],
        fluids: (MaintenanceStatus & { key: string })[],
        services: (MaintenanceStatus & { key: string })[],
        oilCapacity: string | null
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

    if (loading) return <div className="text-xs text-slate-400 p-4 animate-pulse">Cargando historial de mantenimiento...</div>;
    if (!data) return null;

    const StatusIcon = ({ status }: { status: string }) => {
        if (status === 'OK') return <CheckCircle size={16} className="text-emerald-500" />;
        if (status === 'WARNING') return <AlertTriangle size={16} className="text-amber-500" />;
        if (status === 'DANGER') return <AlertOctagon size={16} className="text-red-500" />;
        return <HelpCircle size={16} className="text-slate-300" />;
    };

    const StatusCard = ({ item }: { item: any }) => {
        const timeAgo = item.lastDate
            ? formatDistanceToNow(new Date(item.lastDate), { addSuffix: true, locale: es })
            : 'Nunca registrado';

        return (
            <div className={`
                flex flex-col p-3 rounded-lg border mb-2 transition-all hover:shadow-sm
                ${item.status === 'DANGER' ? 'bg-red-50 border-red-100' :
                    item.status === 'WARNING' ? 'bg-amber-50 border-amber-100' : 'bg-slate-50 border-slate-100'}
            `}>
                <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2 overflow-hidden">
                        <StatusIcon status={item.status} />
                        <div className="truncate">
                            <p className="text-sm font-bold text-slate-700 truncate">{item.label}</p>
                            <p className="text-xs text-slate-500 truncate first-letter:uppercase">
                                {timeAgo}
                            </p>
                        </div>
                    </div>
                    {item.lastMileage && (
                        <span className="text-[10px] font-mono font-bold text-slate-500 bg-white px-1.5 py-0.5 rounded border border-slate-200">
                            {item.lastMileage} km
                        </span>
                    )}
                </div>

                {/* Detail Section (Specific Item Name) */}
                {item.detail && (
                    <div className="mt-2 pt-2 border-t border-black/5 flex items-start gap-1.5">
                        <Info size={12} className="text-slate-400 mt-0.5 flex-shrink-0" />
                        <p className="text-xs text-slate-600 font-medium leading-tight line-clamp-2">
                            {item.detail}
                        </p>
                    </div>
                )}
            </div>
        );
    };

    return (
        <div className="mt-4">
            {data.oilCapacity && (
                <div className="mb-4 inline-flex items-center gap-2 px-3 py-1.5 bg-slate-900 text-white rounded-lg shadow-sm border border-slate-700 animate-in fade-in slide-in-from-top-2 duration-500">
                    <Droplet size={14} className="text-blue-400" />
                    <span className="text-[10px] uppercase font-black tracking-widest text-slate-400">Capacidad Aceite</span>
                    <span className="text-sm font-black text-white ml-1">{data.oilCapacity} L</span>
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                    <h4 className="text-xs font-black text-slate-400 uppercase mb-3 flex items-center gap-2 pb-1 border-b border-slate-100">
                        <Wind size={14} /> Filtros
                    </h4>
                    {data.filters.map(item => <StatusCard key={item.key} item={item} />)}
                </div>
                <div>
                    <h4 className="text-xs font-black text-slate-400 uppercase mb-3 flex items-center gap-2 pb-1 border-b border-slate-100">
                        <Droplet size={14} /> Fluidos
                    </h4>
                    {data.fluids.map(item => <StatusCard key={item.key} item={item} />)}
                </div>
                <div>
                    <h4 className="text-xs font-black text-slate-400 uppercase mb-3 flex items-center gap-2 pb-1 border-b border-slate-100">
                        <Wrench size={14} /> Servicios
                    </h4>
                    {data.services.map(item => <StatusCard key={item.key} item={item} />)}
                </div>
            </div>
        </div>
    );
}
