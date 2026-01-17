'use client';

import KanbanBoard from '../../components/dashboard/KanbanBoard';
import StockAlertWidget from '../../components/dashboard/StockAlertWidget';

export default function KanbanDashboard() {
    return (
        <div className="p-6 h-screen flex flex-col overflow-hidden bg-slate-100 font-sans">
            <header className="mb-6 flex flex-col md:flex-row justify-between items-start md:items-center shrink-0 gap-4">
                <div>
                    <h1 className="text-3xl font-black text-slate-900 tracking-tight">Tablero de Control</h1>
                    <p className="text-slate-500 font-medium text-sm">Gestión de turnos en tiempo real</p>
                </div>
                <div className="w-full md:w-auto">
                    <StockAlertWidget />
                </div>
            </header>

            <div className="flex-1 overflow-hidden">
                <KanbanBoard showHeader={false} />
            </div>
        </div>
    );
}
