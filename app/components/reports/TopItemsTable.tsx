
interface TopItemsTableProps {
    products: any[];
    services: any[];
}

export default function TopItemsTable({ products, services }: TopItemsTableProps) {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Top Products */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200">
                <h3 className="text-lg font-bold mb-4 tracking-tight">Top Productos</h3>
                <div className="space-y-3">
                    {products.map((item, idx) => (
                        <div key={idx} className="flex justify-between items-center pb-2 border-b border-slate-50 last:border-0 last:pb-0">
                            <div className="flex items-center gap-3">
                                <span className="flex items-center justify-center w-6 h-6 rounded-full bg-blue-100 text-blue-700 text-xs font-bold">
                                    {idx + 1}
                                </span>
                                <span className="font-medium text-sm text-slate-700">{item.name}</span>
                            </div>
                            <div className="text-right">
                                <p className="font-bold text-sm">{item.value} un.</p>
                                <p className="text-xs text-slate-400">${item.revenue.toLocaleString()}</p>
                            </div>
                        </div>
                    ))}
                    {products.length === 0 && <p className="text-sm text-slate-400 italic">Sin datos</p>}
                </div>
            </div>

            {/* Top Services */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200">
                <h3 className="text-lg font-bold mb-4 tracking-tight">Top Servicios</h3>
                <div className="space-y-3">
                    {services.map((item, idx) => (
                        <div key={idx} className="flex justify-between items-center pb-2 border-b border-slate-50 last:border-0 last:pb-0">
                            <div className="flex items-center gap-3">
                                <span className="flex items-center justify-center w-6 h-6 rounded-full bg-purple-100 text-purple-700 text-xs font-bold">
                                    {idx + 1}
                                </span>
                                <span className="font-medium text-sm text-slate-700">{item.name}</span>
                            </div>
                            <div className="text-right">
                                <p className="font-bold text-sm">{item.value} op.</p>
                                <p className="text-xs text-slate-400">${item.revenue.toLocaleString()}</p>
                            </div>
                        </div>
                    ))}
                    {services.length === 0 && <p className="text-sm text-slate-400 italic">Sin datos</p>}
                </div>
            </div>
        </div>
    );
}
