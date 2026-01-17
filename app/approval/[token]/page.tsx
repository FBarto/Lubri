
import { notFound } from 'next/navigation';
import { getBudgetDetails } from '../../lib/approval-actions'; // Adjust path if needed
import ApprovalClientView from '../../components/approval/ApprovalClientView';

interface PageProps {
    params: Promise<{
        token: string;
    }>;
}

export default async function ApprovalPage({ params }: PageProps) {
    const { token } = await params;

    if (!token) return notFound();

    const result = await getBudgetDetails(token);

    if (!result.success || !result.data) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
                <div className="text-center">
                    <h1 className="text-2xl font-bold text-slate-800 mb-2">Presupuesto no encontrado</h1>
                    <p className="text-slate-500">El enlace puede haber expirado o es inválido.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 py-8 px-4 flex justify-center">
            <div className="w-full max-w-md">
                <ApprovalClientView data={result.data as any} token={token} />
            </div>
        </div>
    );
}
