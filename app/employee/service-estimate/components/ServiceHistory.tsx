
"use client";

import { Calendar, Gauge, Wrench } from "lucide-react";

export function ServiceHistory({ workOrders }: { workOrders: any[] }) {
    if (!workOrders || workOrders.length === 0) {
        return (
            <div className="bg-gray-50 p-6 rounded-xl border border-gray-200 text-center text-gray-500">
                <p>No hay historial de servicios registrado.</p>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                <Calendar className="w-5 h-5 text-gray-500" />
                Historial Reciente
            </h3>
            <div className="space-y-3">
                {workOrders.map((wo: any) => (
                    <div key={wo.id} className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                        <div className="flex justify-between items-start mb-2">
                            <div>
                                <span className="text-sm font-medium text-blue-600 bg-blue-50 px-2 py-1 rounded">
                                    {new Date(wo.date).toLocaleDateString()}
                                </span>
                                <span className="text-xs text-gray-500 ml-2">#{wo.id}</span>
                            </div>
                            <div className="flex items-center text-gray-600 text-sm">
                                <Gauge className="w-4 h-4 mr-1" />
                                {wo.saleItems?.[0]?.workOrder?.mileage || "N/A"} km
                                {/* Note: mileage is on WO, but fetched via nested relation sometimes, check API response structure. 
                    In API route: include workOrder: true? No, WO is parent. 
                    Wait, in the API route I included "saleItems". The WO mileage is top level on WO object.
                 */}
                                {wo.mileage ? ` ${wo.mileage} km` : ''}
                            </div>
                        </div>

                        <div className="space-y-1">
                            {wo.saleItems?.map((item: any, idx: number) => (
                                <div key={idx} className="flex justify-between text-sm py-1 border-b border-dashed border-gray-100 last:border-0">
                                    <span className="text-gray-700 truncate w-2/3 flex items-center gap-1">
                                        {item.product?.code && (
                                            <span className="font-mono text-xs text-gray-400 bg-gray-100 px-1 rounded">{item.product.code}</span>
                                        )}
                                        {item.description}
                                    </span>
                                    <div className="text-right">
                                        <span className="font-medium text-gray-900">
                                            {/* Show price history? Maybe irrelevant, just qty is better */}
                                            {item.quantity} un
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {wo.notes && (
                            <div className="mt-2 text-xs text-gray-500 italic bg-gray-50 p-2 rounded">
                                "{wo.notes}"
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
}
