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
                    {/* Mobile only title in sidebar top if needed, or just keep the menu items */}
                    <div className="md:hidden mb-6">
                        <p className="text-slate-400 text-xs uppercase tracking-widest">Menú de Navegación</p>
                    </div>
                </div>

                <nav className="space-y-4">
                    <Link
                        href="/admin/dashboard"
                        onClick={() => setIsMobileMenuOpen(false)}
                        className="flex items-center space-x-3 p-3 rounded-xl hover:bg-slate-800 transition-all border border-transparent hover:border-slate-700"
                    >
                        <span>🏠</span>
                        <span>Dashboard</span>
                    </Link>
                    <Link
                        href="/admin/inbox"
                        onClick={() => setIsMobileMenuOpen(false)}
                        className="flex items-center space-x-3 p-3 rounded-xl hover:bg-slate-800 transition-all border border-transparent hover:border-slate-700"
                    >
                        <span>📥</span>
                        <span>Inbox Romi</span>
                    </Link>
                    <Link
                        href="/admin/reports"
                        onClick={() => setIsMobileMenuOpen(false)}
                        className="flex items-center space-x-3 p-3 rounded-xl hover:bg-slate-800 transition-all border border-transparent hover:border-slate-700"
                    >
                        <span>📊</span>
                        <span>Reportes</span>
                    </Link>
                    <Link
                        href="/admin/clients"
                        onClick={() => setIsMobileMenuOpen(false)}
                        className="flex items-center space-x-3 p-3 rounded-xl hover:bg-slate-800 transition-all border border-transparent hover:border-slate-700"
                    >
                        <span>👥</span>
                        <span>Clientes</span>
                    </Link>
                    <Link
                        href="/admin/vehicles"
                        onClick={() => setIsMobileMenuOpen(false)}
                        className="flex items-center space-x-3 p-3 rounded-xl hover:bg-slate-800 transition-all border border-transparent hover:border-slate-700"
                    >
                        <span>🚗</span>
                        <span>Vehículos</span>
                    </Link>
                    <Link
                        href="/admin/services"
                        onClick={() => setIsMobileMenuOpen(false)}
                        className="flex items-center space-x-3 p-3 rounded-xl hover:bg-slate-800 transition-all border border-transparent hover:border-slate-700"
                    >
                        <span>🛠️</span>
                        <span>Servicios</span>
                    </Link>
                    <Link
                        href="/admin/products"
                        onClick={() => setIsMobileMenuOpen(false)}
                        className="flex items-center space-x-3 p-3 rounded-xl hover:bg-slate-800 transition-all border border-transparent hover:border-slate-700"
                    >
                        <span>📦</span>
                        <span>Stock</span>
                    </Link>
                    <Link
                        href="/admin/whatsapp"
                        onClick={() => setIsMobileMenuOpen(false)}
                        className="flex items-center space-x-3 p-3 rounded-xl hover:bg-slate-800 transition-all border border-transparent hover:border-slate-700"
                    >
                        <span>💬</span>
                        <span>WhatsApp</span>
                    </Link>
                    <Link
                        href="/admin/appointments"
                        onClick={() => setIsMobileMenuOpen(false)}
                        className="flex items-center space-x-3 p-3 rounded-xl hover:bg-slate-800 transition-all border border-transparent hover:border-slate-700"
                    >
                        <span>📅</span>
                        <span>Turnos</span>
                    </Link>
                    <Link
                        href="/admin/work-orders"
                        onClick={() => setIsMobileMenuOpen(false)}
                        className="flex items-center space-x-3 p-3 rounded-xl hover:bg-slate-800 transition-all border border-transparent hover:border-slate-700"
                    >
                        <span>✅</span>
                        <span>Órdenes</span>
                    </Link>
                    <div className="pt-4 mt-4 border-t border-slate-800">
                        <Link
                            href="/admin/pos"
                            onClick={() => setIsMobileMenuOpen(false)}
                            className="flex items-center space-x-3 p-3 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-800 text-white shadow-lg shadow-emerald-900/50 hover:scale-105 transition-all font-bold"
                        >
                            <span>🛒</span>
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
                    <Link href="/" className="text-slate-400 hover:text-white text-sm">
                        ← Ver sitio público
                    </Link>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 p-4 md:p-8 max-w-7xl mx-auto w-full pt-20 md:pt-8 bg-slate-50 min-h-screen relative">
                {/* Desktop Top Bar (Hidden on Mobile) */}
                <div className="absolute top-4 right-8 hidden md:flex items-center gap-3 z-20">
                    <PendingSalesUSD />
                    {userId > 0 && <NotificationsWidget userId={userId} />}
                </div>
                {children}
            </main>
        </div >
    );
}
