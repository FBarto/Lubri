
import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import { Badge } from 'lucide-react'; // Placeholder - using generic or custom badge
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';

// Simple Badge component since we don't have a UI lib installed
const StatusBadge = ({ status }: { status: string }) => {
    const colors: any = {
        NEW: 'bg-blue-100 text-blue-700',
        IN_PROGRESS: 'bg-amber-100 text-amber-700',
        WAITING_CUSTOMER: 'bg-purple-100 text-purple-700',
        READY_TO_SCHEDULE: 'bg-emerald-100 text-emerald-700',
        SCHEDULED: 'bg-green-100 text-green-700',
        QUOTED: 'bg-indigo-100 text-indigo-700',
        WON: 'bg-teal-100 text-teal-700',
        LOST: 'bg-red-100 text-red-700',
        CLOSED: 'bg-gray-100 text-gray-700',
    };
    return (
        <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${colors[status] || 'bg-gray-100'}`}>
            {status.replace(/_/g, ' ')}
        </span>
    );
};

export default async function InboxPage() {
    const cases = await prisma.leadCase.findMany({
        where: {
            status: { not: 'CLOSED' } // Default filter
        },
        include: {
            assignedToUser: true,
            client: true,
            vehicle: true
        },
        orderBy: {
            slaDueAt: 'asc' // Urgent first
        }
    });

    return (
        <div className="p-6 max-w-7xl mx-auto">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-black text-slate-900 tracking-tight">Inbox Operativo</h1>
                    <p className="text-slate-500">Gestión de Turnos y Presupuestos (Romi)</p>
                </div>
                <Link
                    href="/admin/inbox/new"
                    className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-xl shadow-lg transition-all active:scale-95"
                >
                    + Nuevo Caso
                </Link>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                <table className="w-full text-left">
                    <thead className="bg-slate-50 border-b border-slate-200">
                        <tr>
                            <th className="p-4 font-bold text-slate-500 text-xs uppercase tracking-wider">Estado</th>
                            <th className="p-4 font-bold text-slate-500 text-xs uppercase tracking-wider">SLA</th>
                            <th className="p-4 font-bold text-slate-500 text-xs uppercase tracking-wider">Resumen / Cliente</th>
                            <th className="p-4 font-bold text-slate-500 text-xs uppercase tracking-wider">Categoría</th>
                            <th className="p-4 font-bold text-slate-500 text-xs uppercase tracking-wider">Asignado</th>
                            <th className="p-4 font-bold text-slate-500 text-xs uppercase tracking-wider">Acción</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {cases.length === 0 && (
                            <tr>
                                <td colSpan={6} className="p-8 text-center text-slate-400">
                                    No hay casos activos. ¡Buen trabajo! 💪
                                </td>
                            </tr>
                        )}
                        {cases.map(c => {
                            const isOverdue = new Date() > c.slaDueAt;
                            return (
                                <tr key={c.id} className="hover:bg-slate-50 transition-colors group">
                                    <td className="p-4">
                                        <StatusBadge status={c.status} />
                                    </td>
                                    <td className="p-4">
                                        <span className={`font-mono font-bold text-xs ${isOverdue ? 'text-red-600 animate-pulse' : 'text-slate-500'}`}>
                                            {formatDistanceToNow(c.slaDueAt, { addSuffix: true, locale: es })}
                                        </span>
                                    </td>
                                    <td className="p-4">
                                        <p className="font-bold text-slate-800">{c.summary}</p>
                                        <p className="text-xs text-slate-400">
                                            {c.client ? c.client.name : 'Sin cliente'} • {c.vehicle ? `${c.vehicle.brand} ${c.vehicle.model}` : 'Sin vehículo'}
                                        </p>
                                    </td>
                                    <td className="p-4">
                                        <span className="text-xs font-bold text-slate-600 bg-slate-100 px-2 py-1 rounded">
                                            {c.serviceCategory}
                                        </span>
                                    </td>
                                    <td className="p-4">
                                        {c.assignedToUser ? (
                                            <div className="flex items-center gap-2">
                                                <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xs font-bold border border-blue-200">
                                                    {c.assignedToUser.username[0].toUpperCase()}
                                                </div>
                                                <span className="text-sm font-medium">{c.assignedToUser.username}</span>
                                            </div>
                                        ) : (
                                            <span className="text-slate-300 text-xs italic">Sin asignar</span>
                                        )}
                                    </td>
                                    <td className="p-4">
                                        <Link
                                            href={`/admin/inbox/${c.id}`}
                                            className="text-blue-600 font-bold text-sm hover:underline opacity-0 group-hover:opacity-100 transition-opacity"
                                        >
                                            Ver Detalle →
                                        </Link>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
