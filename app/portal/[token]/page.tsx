
import { getClientDataByToken } from '@/app/actions/portal';
import PortalClientView from '../../components/portal/PortalClientView';
import { notFound } from 'next/navigation';

export const dynamic = 'force-dynamic';

interface PageProps {
    params: Promise<{
        token: string;
    }>;
}

export default async function PortalPage({ params }: PageProps) {
    const { token } = await params;

    if (!token) return notFound();

    const data = await getClientDataByToken(token);

    if (!data.success || !data.data?.client) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
                <div className="text-center">
                    <h1 className="text-2xl font-bold text-slate-800 mb-2">Enlace expirado o inválido</h1>
                    <p className="text-slate-500">Por favor, solicita un nuevo enlace a nuestro WhatsApp.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 max-w-md mx-auto shadow-2xl overflow-hidden">
            <PortalClientView data={data.data.client} />
        </div>
    );
}
