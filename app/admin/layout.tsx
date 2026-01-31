'use client';

import Link from 'next/link';
import { logout } from '@/app/lib/actions';
import { useState } from 'react';
import { Menu, X } from 'lucide-react';
import { useSession } from 'next-auth/react';
import NotificationsWidget from '../components/admin/NotificationsWidget';
import PendingSalesUSD from '../components/pos/PendingSalesUSD';

export default function AdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const { data: session } = useSession();
    const userId = session?.user?.id ? Number(session.user.id) : 0;

    return (
        <div className="flex min-h-screen bg-slate-50 text-slate-900 font-sans">
            {/* Mobile Header */}
            <div className="md:hidden fixed top-0 left-0 right-0 h-16 bg-slate-900 z-50 flex items-center justify-between px-4 shadow-xl">
                <span className="text-xl font-bold bg-gradient-to-r from-blue-400 to-indigo-500 bg-clip-text text-transparent">
                    FB Lubricentro
                </span>
                <div className="flex items-center gap-2">
                    <PendingSalesUSD />
                    {userId > 0 && <NotificationsWidget userId={userId} />}
                    <button
                        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                        className="text-white p-2 hover:bg-slate-800 rounded-lg transition-colors"
                    >
                        {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
                    </button>
                </div>
            </div>

            {/* Overlay */}
            {isMobileMenuOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-40 md:hidden backdrop-blur-sm"
                    onClick={() => setIsMobileMenuOpen(false)}
                />
            )}

            {/* Sidebar */}
            <aside className={`
                fixed md:static inset-y-0 left-0 z-50 w-64 bg-slate-900 text-white p-6 
                transform transition-transform duration-300 ease-in-out shadow-2xl md:shadow-none
                ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
            `}>
                <div className="mb-10 mt-safe md:mt-0">
                    <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-indigo-500 bg-clip-text text-transparent hidden md:block">
                        FB Lubricentro
                    </h1>
                    <p className="text-slate-400 text-xs mt-1 uppercase tracking-widest hidden md:block">Panel de Control</p>
                </div>

                <nav className="space-y-2">
                    <Link
                        href="/admin/dashboard"
                        className="flex items-center space-x-3 p-3 rounded-xl hover:bg-slate-800 transition-all text-sm font-medium text-slate-300 hover:text-white"
                    >
                        <span>🏠</span>
                        <span>Dashboard</span>
                    </Link>

                    <div className="pt-2 pb-1 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Gestión</div>

                    <Link
                        href="/admin/clients"
                        className="flex items-center space-x-3 p-3 rounded-xl hover:bg-slate-800 transition-all text-sm font-medium text-slate-300 hover:text-white"
                    >
                        <span>👥</span>
                        <span>Clientes y Vehículos</span>
                    </Link>

                    <Link
                        href="/admin/inventory"
                        className="flex items-center space-x-3 p-3 rounded-xl hover:bg-slate-800 transition-all text-sm font-medium text-slate-300 hover:text-white"
                    >
                        <span>📦</span>
                        <span>Inventario Unificado</span>
                    </Link>

                    <Link
                        href="/admin/appointments"
                        className="flex items-center space-x-3 p-3 rounded-xl hover:bg-slate-800 transition-all text-sm font-medium text-slate-300 hover:text-white"
                    >
                        <span>📅</span>
                        <span>Turnos</span>
                    </Link>

                    <Link
                        href="/admin/work-orders"
                        className="flex items-center space-x-3 p-3 rounded-xl hover:bg-slate-800 transition-all text-sm font-medium text-slate-300 hover:text-white"
                    >
                        <span>✅</span>
                        <span>Órdenes de Trabajo</span>
                    </Link>

                    <div className="pt-4 pb-1 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Comunicación</div>

                    <Link
                        href="/admin/inbox"
                        className="flex items-center space-x-3 p-3 rounded-xl hover:bg-slate-800 transition-all text-sm font-medium text-slate-300 hover:text-white"
                    >
                        <span>📥</span>
                        <span>Oportunidades</span>
                    </Link>

                    <div className="pt-4 mt-auto">
                        <Link
                            href="/admin/pos"
                            className="flex items-center space-x-3 p-3 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-800 text-white shadow-lg shadow-emerald-900/50 hover:scale-105 transition-all font-bold group"
                        >
                            <span className="group-hover:rotate-12 transition-transform">🛒</span>
                            <span>Punto de Venta</span>
                        </Link>
                    </div>
                </nav>

                <div className="mt-10 pt-10 border-t border-slate-800">
                    <form action={logout}>
                        <button className="flex items-center space-x-3 text-slate-400 hover:text-red-400 text-sm mb-4 w-full text-left transition-colors">
                            <span>🚪</span>
                            <span>Cerrar Sesión</span>
                        </button>
                    </form>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 max-h-screen overflow-hidden flex flex-col bg-slate-50 relative">
                {/* Top Navigation Bar with Search */}
                <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-8 z-20 shrink-0">
                    {/* Global Search - Always Visible */}
                    <div className="flex-1 max-w-lg">
                        <div className="relative group">
                            <input
                                type="text"
                                placeholder="🔍 Buscar Patente o Cliente (Ctrl+K)..."
                                className="w-full bg-slate-50 border border-slate-200 rounded-lg py-2 pl-4 pr-10 text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all group-hover:bg-white group-hover:shadow-sm"
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                        // Simple redirect to clients page with search param
                                        // Ideally this opens a global command palette, but this is a quick win.
                                        window.location.href = `/admin/clients?search=${(e.target as HTMLInputElement).value}`;
                                    }
                                }}
                            />
                            <div className="absolute right-3 top-2.5 text-xs text-slate-400 font-mono hidden md:block">
                                ⌘K
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        <PendingSalesUSD />
                        {userId > 0 && <NotificationsWidget userId={userId} />}
                    </div>
                </header>

                {/* Scrollable Page Content */}
                <div className="flex-1 overflow-auto p-4 md:p-8">
                    {children}
                </div>
            </main>
        </div>
    );
}
