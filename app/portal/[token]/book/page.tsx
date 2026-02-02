import { getClientDataByToken } from '@/app/actions/portal';
import PublicServiceBook from '../../../components/portal/PublicServiceBook';
import { notFound } from 'next/navigation';

interface PageProps {
    params: Promise<{
        token: string;
    }>;
}

export default async function ServiceBookPage({ params }: PageProps) {
    const { token } = await params;

    if (!token) return notFound();

    const data = await getClientDataByToken(token);

    if (!data.success || !data.client) {
        return notFound();
    }

    return (
        <div className="min-h-screen bg-slate-50 max-w-lg mx-auto shadow-2xl overflow-hidden">
            <PublicServiceBook data={data.client} />
        </div>
    );
}
