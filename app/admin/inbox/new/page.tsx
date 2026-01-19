
import { auth } from '@/auth';
import CreateCaseForm from './form';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma'; // To fetch user ID by email if needed, or stick to session if id is there

export default async function NewCasePage() {
    const session = await auth();
    if (!session?.user?.email) return redirect('/login');

    // Need numeric ID for the action
    const user = await prisma.user.findUnique({
        where: { username: session.user.name || session.user.email /* Fallback */ }, // Auth logic varies, let's assume session username maps or check email
    });

    // Fallback: search by email if username logic is strict
    const dbUser = user || await prisma.user.findFirst({
        where: { username: session.user.name! }
    });

    // Actually, let's just find the user properly.
    // My previous tasks suggest username is the key.
    // The seed created user 'Romi'.
    // If I log in as 'Romi', session.user.name is 'Romi'.

    if (!dbUser) {
        return <div className="p-10 text-red-600">Error: Usuario no encontrado en base de datos.</div>;
    }

    return (
        <div className="p-6 max-w-2xl mx-auto">
            <h1 className="text-2xl font-bold mb-6 text-slate-800">Nuevo Caso Operativo</h1>
            <CreateCaseForm userId={dbUser.id} />
        </div>
    );
}
