import { prisma } from '@/lib/prisma';
import { auth } from '@/auth';
import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default async function AuditPage() {
    const session = await auth();
    // Simple verification (in real app check role === ADMIN)
    if (!session || !session.user) {
        redirect('/login');
    }

    const logs = await prisma.auditLog.findMany({
        orderBy: { timestamp: 'desc' },
        include: { user: true },
        take: 100 // Limit to last 100 events
    });

    return (
        <div className="p-6 md:p-10 space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-black text-slate-800 uppercase tracking-tighter">
                    Auditoría
                </h1>
                <div className="text-sm font-bold text-slate-500">
                    Últimos 100 movimientos
                </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-slate-50 border-b border-slate-200">
                                <th className="px-6 py-4 text-xs font-black text-slate-500 uppercase tracking-widest">Fecha</th>
                                <th className="px-6 py-4 text-xs font-black text-slate-500 uppercase tracking-widest">Usuario</th>
                                <th className="px-6 py-4 text-xs font-black text-slate-500 uppercase tracking-widest">Acción</th>
                                <th className="px-6 py-4 text-xs font-black text-slate-500 uppercase tracking-widest">Detalle</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {logs.map((log) => (
                                <tr key={log.id} className="hover:bg-slate-50 transition-colors">
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-600">
                                        {new Date(log.timestamp).toLocaleString('es-AR')}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex items-center gap-2">
                                            <div className="w-6 h-6 rounded-full bg-slate-200 flex items-center justify-center text-[10px] font-bold text-slate-600">
                                                {log.user.username.substring(0, 2).toUpperCase()}
                                            </div>
                                            <span className="text-sm font-bold text-slate-800">{log.user.username}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className={`px-2 py-1 rounded text-[0.65rem] font-bold uppercase tracking-wider
                                            ${log.action === 'LOGIN' ? 'bg-green-100 text-green-700' :
                                                log.action === 'DELETE' ? 'bg-red-100 text-red-700' :
                                                    log.action === 'UPDATE' ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-700'
                                            }
                                        `}>
                                            {log.action}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-sm text-slate-500 font-mono">
                                        <div className="flex flex-col">
                                            <span className="font-bold text-slate-700">{log.entity} #{log.entityId}</span>
                                            <span className="text-xs opacity-70 truncate max-w-[300px]" title={log.details || ''}>
                                                {log.details}
                                            </span>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {logs.length === 0 && (
                                <tr>
                                    <td colSpan={4} className="px-6 py-12 text-center text-slate-400 font-medium">
                                        No hay registros de actividad aún.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
