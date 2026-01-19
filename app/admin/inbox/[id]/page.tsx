
import { prisma } from '@/lib/prisma';
import CaseDetailView from '../../../components/inbox/CaseDetailView';
import { auth } from '@/auth';
import { redirect } from 'next/navigation';

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const session = await auth();

    if (!session?.user?.id) {
        redirect('/login');
    }

    const leadCase = await prisma.leadCase.findUnique({
        where: { id },
        include: {
            checklist: true,
            logs: {
                include: { authorUser: true },
                orderBy: { createdAt: 'desc' }
            },
            client: true,
            vehicle: true
        }
    });

    if (!leadCase) {
        return <div>Caso no encontrado</div>;
    }

    return (
        <CaseDetailView
            leadCase={leadCase as any}
            currentUserId={Number(session.user.id)}
        />
    );
}
