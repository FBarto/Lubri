'use client';

import { useSession, signOut } from 'next-auth/react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function EmployeeLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const { data: session } = useSession();
    const pathname = usePathname();

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col">
            {/* Header Simplificado */}
            <header className="bg-slate-900 text-white p-4 shadow-md flex justify-between items-center">
                <div>
                    <h1 className="text-xl font-bold tracking-wider">FB LUBRICENTRO</h1>
                    <p className="text-xs text-slate-400">Panel de Operador</p>
                </div>

                <div className="flex items-center gap-4">
                    <div className="text-right hidden sm:block">
                        <p className="font-medium">{session?.user?.name}</p>
                        <span className="text-xs bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-full border border-emerald-500/30">
                            EMPLEADO
                        </span>
                    </div>
                    <button
                        onClick={async () => {
                            await signOut({ redirect: false });
                            window.location.href = '/login';
                        }}
                        className="bg-slate-800 hover:bg-slate-700 text-slate-300 px-4 py-2 rounded-lg text-sm transition-colors border border-slate-700"
                    >
                        Salir
                    </button>
                </div>
            </header>

            {/* Main Content Area */}
            <main className="flex-1 flex flex-col relative overflow-hidden">
                {children}
            </main>
        </div>
    );
}
