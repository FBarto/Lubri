
import { auth } from '@/auth';
import NewCaseForm from '../../../components/inbox/NewCaseForm';
import { redirect } from 'next/navigation';

export default async function Page() {
    const session = await auth();

    if (!session?.user?.id) {
        redirect('/login');
    }

    return (
        <div className="p-6 max-w-7xl mx-auto">
            <div className="mb-8">
                <h1 className="text-3xl font-black text-slate-900 tracking-tight">Crear Nuevo Caso</h1>
                <p className="text-slate-500">Ingresa los datos iniciales para generar el checklist.</p>
            </div>

            <NewCaseForm currentUserId={Number(session.user.id)} />
        </div>
    );
}
