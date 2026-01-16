
'use client';

interface TopProduct {
    id: number;
    name: string;
    quantity: number;
    revenue: number;
}

interface TopProductsTableProps {
    products: TopProduct[];
}

export default function TopProductsTable({ products }: TopProductsTableProps) {
    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('es-AR', {
            style: 'currency',
            currency: 'ARS',
            maximumFractionDigits: 0
        }).format(value);
    };

    return (
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 h-full">
            <h3 className="text-lg font-bold text-slate-700 mb-6">Productos Más Vendidos</h3>
            <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                    <thead>
                        <tr className="border-b border-slate-100 text-slate-500">
                            <th className="pb-3 font-medium text-left bg-gray-50/50 p-2 rounded-l-lg">Producto</th>
                            <th className="pb-3 font-medium text-right bg-gray-50/50 p-2">Cant.</th>
                            <th className="pb-3 font-medium text-right bg-gray-50/50 p-2 rounded-r-lg">Ingresos</th>
                        </tr>
                    </thead>
                    <tbody>
                        {products.map((product, index) => (
                            <tr key={`${product.id}-${index}`} className="group hover:bg-slate-50 transition-colors">
                                <td className="py-3 pr-4 p-2 text-slate-800 font-medium truncate max-w-[150px]" title={product.name}>
                                    {product.name}
                                </td>
                                <td className="py-3 text-right p-2 text-slate-600">
                                    {product.quantity}
                                </td>
                                <td className="py-3 text-right p-2 text-slate-900 font-bold">
                                    {formatCurrency(product.revenue)}
                                </td>
                            </tr>
                        ))}
                        {products.length === 0 && (
                            <tr>
                                <td colSpan={3} className="py-6 text-center text-slate-400">
                                    No hay datos disponibles
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
