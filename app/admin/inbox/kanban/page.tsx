import { prisma } from '@/lib/prisma';
import InboxKanbanBoard from '@/app/components/inbox/InboxKanbanBoard';

export default async function InboxKanbanPage() {
    const cases = await prisma.leadCase.findMany({
        where: {
            status: { not: 'CLOSED' }
        },
        include: {
            assignedToUser: true,
            client: true,
            vehicle: true,
            quote: true
        },
        orderBy: {
            updatedAt: 'desc'
        }
    });

    return <InboxKanbanBoard initialCases={cases} />;
}
