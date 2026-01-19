
import { getLeadCases } from '@/app/lib/actions/inbox-actions';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';

export default async function InboxPage() {
    const cases = await getLeadCases({ status: undefined }); // Fetch all or filter by 'OPEN' logic later

    return (
        <div className="p-6 space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold text-slate-800">Inbox Operativo (Romi)</h1>
                <Link href="/admin/inbox/new" className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
                    + Nuevo Caso
                </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {cases.length === 0 && (
                    <div className="text-slate-500 col-span-full text-center py-10">
                        No hay casos activos.
                    </div>
                )}
                {cases.map((c) => (
                    <Link key={c.id} href={`/admin/inbox/${c.id}`} className="block">
                        <div className={`border rounded-lg p-4 bg-white shadow-sm hover:shadow-md transition-shadow relative overflow-hidden`}>
                            {/* SLA Indicator Line */}
                            <div className={`absolute left-0 top-0 bottom-0 w-1 ${new Date() > c.slaDueAt ? 'bg-red-500' : 'bg-green-500'
                                }`} />

                            <div className="flex justify-between items-start mb-2 pl-3">
                                <span className={`px-2 py-0.5 text-xs rounded-full font-bold ${c.priority === 'HIGH' ? 'bg-red-100 text-red-700' :
                                        c.priority === 'MEDIUM' ? 'bg-yellow-100 text-yellow-800' :
                                            'bg-green-100 text-green-800'
                                    }`}>
                                    {c.priority}
                                </span>
                                <span className="text-xs text-slate-500 max-w-[100px] truncate text-right">
                                    {formatDistanceToNow(c.createdAt, { addSuffix: true, locale: es })}
                                </span>
                            </div>

                            <h3 className="font-semibold text-slate-900 pl-3 mb-1 truncate">{c.summary}</h3>
                            <p className="text-sm text-slate-500 pl-3 mb-3 uppercase tracking-wider text-xs">{c.serviceCategory}</p>

                            <div className="pl-3 border-t pt-2 mt-2 text-sm text-slate-600 space-y-1">
                                <div className="flex items-center gap-2">
                                    <span className="w-4 h-4 flex items-center justify-center bg-slate-100 rounded-full text-xs">👤</span>
                                    <span>{c.client?.name || 'Prospecto'}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="w-4 h-4 flex items-center justify-center bg-slate-100 rounded-full text-xs">🚗</span>
                                    <span>{c.vehicle?.plate || '-'}</span>
                                </div>
                            </div>

                            <div className="pl-3 mt-3 flex gap-2">
                                <span className={`text-xs px-2 py-1 rounded bg-slate-100 text-slate-600`}>
                                    {c.status}
                                </span>
                                {c.assignedToUser && (
                                    <span className="text-xs px-2 py-1 rounded bg-blue-50 text-blue-700">
                                        @{c.assignedToUser.username}
                                    </span>
                                )}
                            </div>
                        </div>
                    </Link>
                ))}
            </div>
        </div>
    );
}
