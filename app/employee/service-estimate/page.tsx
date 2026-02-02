
"use client";

import { useState } from "react";
import { VehicleLookup } from "./components/VehicleLookup";
import { ServiceHistory } from "./components/ServiceHistory";
import { EstimateBuilder } from "./components/EstimateBuilder";
import { useRouter } from "next/navigation";
import { confirmQuoteAsWorkOrder } from "@/app/actions/maintenance";
import { Loader2 } from "lucide-react";

export default function ServiceEstimatePage() {
    const [vehicle, setVehicle] = useState<any>(null);
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    const handleConfirm = async (items: any[], total: number) => {
        setLoading(true);
        try {
            // Map items to expected format for confirmQuoteAsWorkOrder
            const actionItems = items.map(i => ({
                id: i.productId,
                productId: i.productId,
                name: i.description,
                price: i.unitPrice,
                quantity: i.quantity,
                type: 'PRODUCT', // or SERVICE if manual?
                code: i.code,
                category: i.category || 'OTHER'
            }));

            const res = await confirmQuoteAsWorkOrder({
                vehicleId: vehicle.id,
                clientId: vehicle.clientId,
                items: actionItems,
                userId: 1, // Default user
                mileage: 0 // We should probably ask for mileage in the UI, but for now 0 or undefined
            });

            if (res.success && res.data && res.data.workOrderId) {
                router.push(`/admin/work-orders/${res.data.workOrderId}`);
            } else {
                alert("Error al crear la orden: " + (res.error || "Desconocido"));
            }
        } catch (err) {
            console.error(err);
            alert("Error inesperado al crear la orden.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="p-6 max-w-7xl mx-auto space-y-6">
            <header className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Presupuesto de Service</h1>
                <p className="text-gray-500">Búsqueda rápida y sugerencia inteligente de productos.</p>
            </header>

            {/* Lookup - Always visible or minimized? Let's keep it visible until vehicle found? */}
            <VehicleLookup onVehicleFound={setVehicle} />

            {vehicle && (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-in fade-in slide-in-from-bottom-4 duration-500">

                    {/* Left Column: Context & History */}
                    <div className="lg:col-span-4 space-y-6">
                        <div className="bg-blue-600 text-white p-5 rounded-xl shadow-lg shadow-blue-200">
                            <div className="text-blue-100 text-sm font-medium uppercase tracking-wider mb-1">Vehículo</div>
                            <div className="text-3xl font-mono font-bold">{vehicle.plate}</div>
                            <div className="mt-2 opacity-90">{vehicle.brand} {vehicle.model}</div>
                            {vehicle.client && (
                                <div className="mt-4 pt-4 border-t border-blue-500/50 flex items-center gap-2">
                                    <div className="w-8 h-8 rounded-full bg-blue-800 flex items-center justify-center font-bold">
                                        {vehicle.client.name.charAt(0)}
                                    </div>
                                    <div>
                                        <div className="font-medium">{vehicle.client.name}</div>
                                        <div className="text-xs text-blue-200">Cliente Recurrente</div>
                                    </div>
                                </div>
                            )}
                        </div>

                        <ServiceHistory workOrders={vehicle.workOrders} />
                    </div>

                    {/* Right Column: Builder */}
                    <div className="lg:col-span-8 h-[600px]">
                        {/* Fixed height for scrolling items */}
                        <EstimateBuilder
                            vehicleId={vehicle.id}
                            onConfirm={handleConfirm}
                        />
                    </div>
                </div>
            )}

            {/* Loading Overlay for Create Action */}
            {loading && (
                <div className="fixed inset-0 bg-white/80 backdrop-blur-sm z-50 flex items-center justify-center">
                    <div className="bg-white p-8 rounded-2xl shadow-2xl flex flex-col items-center">
                        <Loader2 className="w-12 h-12 text-blue-600 animate-spin mb-4" />
                        <h3 className="text-xl font-bold text-gray-800">Creando Orden...</h3>
                        <p className="text-gray-500">Asignando stock y generando ticket.</p>
                    </div>
                </div>
            )}
        </div>
    );
}
