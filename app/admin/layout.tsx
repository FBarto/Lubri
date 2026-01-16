import Link from 'next/link';
import { logout } from '@/app/lib/actions';

export default function AdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="flex min-h-screen bg-slate-50 text-slate-900 font-sans">
            {/* Sidebar */}
            <aside className="w-64 bg-slate-900 text-white p-6 hidden md:block">
                <div className="mb-10">
                    <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-indigo-500 bg-clip-text text-transparent">
                        FB Lubricentro
                    </h1>
                    <p className="text-slate-400 text-xs mt-1 uppercase tracking-widest">Panel de Control</p>
                </div>

                <nav className="space-y-4">
                    <Link href="/admin/dashboard" className="flex items-center space-x-3 p-3 rounded-xl hover:bg-slate-800 transition-all border border-transparent hover:border-slate-700">
                        <span>🏠</span>
                        <span>Dashboard</span>
                    </Link>
                    <Link href="/admin/reports" className="flex items-center space-x-3 p-3 rounded-xl hover:bg-slate-800 transition-all border border-transparent hover:border-slate-700">
                        <span>📊</span>
                        <span>Reportes</span>
                    </Link>
                    <Link href="/admin/clients" className="flex items-center space-x-3 p-3 rounded-xl hover:bg-slate-800 transition-all border border-transparent hover:border-slate-700">
                        <span>👥</span>
                        <span>Clientes</span>
                    </Link>
                    <Link href="/admin/vehicles" className="flex items-center space-x-3 p-3 rounded-xl hover:bg-slate-800 transition-all border border-transparent hover:border-slate-700">
                        <span>🚗</span>
                        <span>Vehículos</span>
                    </Link>
                    <Link href="/admin/services" className="flex items-center space-x-3 p-3 rounded-xl hover:bg-slate-800 transition-all border border-transparent hover:border-slate-700">
                        <span>🛠️</span>
                        <span>Servicios</span>
                    </Link>
                    <Link href="/admin/products" className="flex items-center space-x-3 p-3 rounded-xl hover:bg-slate-800 transition-all border border-transparent hover:border-slate-700">
                        <span>📦</span>
                        <span>Stock</span>
                    </Link>
                    <Link href="/admin/whatsapp" className="flex items-center space-x-3 p-3 rounded-xl hover:bg-slate-800 transition-all border border-transparent hover:border-slate-700">
                        <span>💬</span>
                        <span>WhatsApp</span>
                    </Link>
                    <Link href="/admin/appointments" className="flex items-center space-x-3 p-3 rounded-xl hover:bg-slate-800 transition-all border border-transparent hover:border-slate-700">
                        <span>📅</span>
                        <span>Turnos</span>
                    </Link>
                    <Link href="/admin/work-orders" className="flex items-center space-x-3 p-3 rounded-xl hover:bg-slate-800 transition-all border border-transparent hover:border-slate-700">
                        <span>✅</span>
                        <span>Órdenes</span>
                    </Link>
                    <div className="pt-4 mt-4 border-t border-slate-800">
                        <Link href="/admin/pos" className="flex items-center space-x-3 p-3 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-800 text-white shadow-lg shadow-emerald-900/50 hover:scale-105 transition-all font-bold">
                            <span>🛒</span>
                            <span>Punto de Venta</span>
                        </Link>
                    </div>
                </nav>

                <div className="mt-20 pt-10 border-t border-slate-800">
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
            <main className="flex-1 p-4 md:p-8 max-w-7xl mx-auto w-full">
                {children}
            </main>
        </div>
    );
}
