
import { getLeadCaseDetail } from '@/app/lib/actions/inbox-actions';
import { notFound, redirect } from 'next/navigation';
import { auth } from '@/auth';
import ChecklistWidget from '../components/ChecklistWidget';
import TimelineWidget from '../components/TimelineWidget';
import QuickReplies from '../components/QuickReplies';
import QuoteBuilder from '../components/QuoteBuilder';
import { prisma } from '@/lib/prisma';
import Link from 'next/link';

export default async function CaseDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const caseItem = await getLeadCaseDetail(id);

    if (!caseItem) notFound();

    const session = await auth();
    if (!session?.user) redirect('/login');

    // Resolve helper user ID (assuming seed User Romi exists or current user)
    // For simplicity, we fetch the user by username/email from session to pass ID to client components
    const currentUser = await prisma.user.findFirst({
        where: { username: session.user.name || '' }
    });

    if (!currentUser) return <div className="p-10">Error de sesión (Usuario no encontrado)</div>;

    return (
        <div className="p-6 bg-slate-50 min-h-screen">
            {/* HEADER */}
            <div className="flex justify-between items-start mb-6">
                <div>
                    <div className="flex items-center gap-3 mb-1">
                        <Link href="/admin/inbox" className="text-slate-400 hover:text-slate-600">← Volver</Link>
                        <h1 className="text-2xl font-bold text-slate-800">#{caseItem.id.slice(-6).toUpperCase()} - {caseItem.summary}</h1>
                        <span className={`px-2 py-0.5 text-xs rounded-full font-bold ${caseItem.status === 'NEW' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100'
                            }`}>{caseItem.status}</span>
                    </div>
                    <div className="flex gap-4 text-sm text-slate-500">
                        <span>Creado: {caseItem.createdAt.toLocaleDateString()}</span>
                        <span>SLA: {caseItem.slaDueAt.toLocaleTimeString()}</span>
                        <span>Asignado: @{caseItem.assignedToUser?.username || '-'}</span>
                    </div>
                </div>
                <div className="flex gap-2">
                    {/* Actions will go here (Close, Convert, etc) */}
                    <button className="px-4 py-2 bg-slate-800 text-white rounded shadow hover:bg-slate-700">Guardar Cambios</button>
                    {caseItem.type === 'APPOINTMENT' && (
                        <Link
                            href={`/admin/calendar?caseId=${caseItem.id}`} // Mock link
                            className="px-4 py-2 bg-blue-600 text-white rounded shadow hover:bg-blue-700"
                        >
                            Agendar Turno
                        </Link>
                    )}
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* LEFT COL: INFO */}
                <div className="space-y-6">
                    {/* Client Card */}
                    <div className="bg-white p-4 rounded-lg shadow border">
                        <h3 className="font-bold text-slate-700 mb-3 border-b pb-2">Cliente</h3>
                        {caseItem.client ? (
                            <div>
                                <p className="font-semibold">{caseItem.client.name}</p>
                                <p className="text-sm text-slate-500">{caseItem.client.phone}</p>
                            </div>
                        ) : (
                            <div className="text-center py-4 bg-slate-50 rounded border border-dashed text-slate-400 text-sm">
                                <p>Sin cliente asociado</p>
                                <button className="mt-2 text-blue-600 hover:underline">Buscar / Crear</button>
                            </div>
                        )}
                    </div>

                    {/* Vehicle Card */}
                    <div className="bg-white p-4 rounded-lg shadow border">
                        <h3 className="font-bold text-slate-700 mb-3 border-b pb-2">Vehículo</h3>
                        {caseItem.vehicle ? (
                            <div>
                                <p className="font-semibold text-lg">{caseItem.vehicle.plate}</p>
                                <p className="text-sm text-slate-500">{caseItem.vehicle.brand} {caseItem.vehicle.model}</p>
                            </div>
                        ) : (
                            <div className="text-center py-4 bg-slate-50 rounded border border-dashed text-slate-400 text-sm">
                                <p>Sin vehículo asociado</p>
                                <button className="mt-2 text-blue-600 hover:underline">Buscar / Crear</button>
                            </div>
                        )}
                    </div>

                    {/* Original Message */}
                    <div className="bg-white p-4 rounded-lg shadow border">
                        <h3 className="font-bold text-slate-700 mb-2 text-sm border-b pb-1">Mensaje Original</h3>
                        <p className="text-sm text-slate-600 whitespace-pre-wrap bg-gray-50 p-2 rounded">
                            {caseItem.intakeRawText || 'Sin texto original.'}
                        </p>
                    </div>
                </div>

                {/* CENTER COL: ACTION */}
                <div className="space-y-6">
                    <QuickReplies category={caseItem.serviceCategory} />
                    <QuoteBuilder caseId={caseItem.id} initialQuote={caseItem.quote} />
                    <TimelineWidget
                        logs={caseItem.logs}
                        caseId={caseItem.id}
                        userId={currentUser.id}
                    />
                </div>

                {/* RIGHT COL: CHECKLIST */}
                <div>
                    <ChecklistWidget items={caseItem.checklist} />
                </div>

            </div>
        </div>
    );
}
