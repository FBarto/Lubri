import SmartQuote from '../../components/quotes/SmartQuote';

export const metadata = {
    title: 'Presupuesto Rápido - Admin',
};

export default function SmartQuotePage() {
    return (
        <div className="h-full flex flex-col p-6 bg-slate-50">
            <div className="mb-6 flex justify-between items-end">
                <div>
                    <h1 className="text-3xl font-black text-slate-800 tracking-tight">Presupuesto Inteligente</h1>
                    <p className="text-slate-500 font-medium">Genera cotizaciones basadas en el historial del servicio.</p>
                </div>
            </div>

            <div className="flex-1 min-h-0">
                <SmartQuote />
            </div>
        </div>
    );
}
