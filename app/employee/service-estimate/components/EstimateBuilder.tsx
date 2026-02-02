"use client";

import { useState, useEffect } from "react";
import { Calculator, CheckCircle, AlertTriangle, RefreshCw, Save } from "lucide-react";
import { suggestServiceEstimate } from "@/app/actions/maintenance";

interface EstimateItem {
    productId?: number;
    description: string;
    code?: string;
    quantity: number;
    unitPrice: number;
    stockAvailable?: number;
    status: "OK" | "OOS" | "MANUAL";
    autoSuggested: boolean;
}

interface EstimateBuilderProps {
    vehicleId: number;
    onConfirm: (items: EstimateItem[], total: number) => void;
}

export function EstimateBuilder({ vehicleId, onConfirm }: EstimateBuilderProps) {
    const [items, setItems] = useState<EstimateItem[]>([]);
    const [loading, setLoading] = useState(false);
    const [preset, setPreset] = useState<"BASIC" | "FULL">("BASIC");
    const [learnedData, setLearnedData] = useState<any>(null);

    // Fetch suggestions when preset or vehicle changes
    useEffect(() => {
        if (vehicleId) fetchSuggestions();
    }, [vehicleId, preset]);

    const fetchSuggestions = async () => {
        setLoading(true);
        try {
            const res = await suggestServiceEstimate(vehicleId, preset);
            if (res.success && res.data && res.data.items) {
                const mappedItems: EstimateItem[] = res.data.items.map((i: any) => ({
                    productId: i.id || undefined,
                    description: i.name,
                    code: i.code || (i.found ? '' : '---'),
                    quantity: i.quantity || 1,
                    unitPrice: i.price || 0,
                    stockAvailable: i.stock,
                    status: (i.stock !== null && i.stock <= 0) ? "OOS" : (i.id ? "OK" : "MANUAL"),
                    autoSuggested: true
                }));
                setItems(mappedItems);
                // setLearnedData(res.data.learnedData); // Action doesnt return learnedData explicitely yet
            }
        } catch (e) {
            console.error("Failed to fetch suggestions", e);
        } finally {
            setLoading(false);
        }
    };

    const updateItem = (index: number, changes: Partial<EstimateItem>) => {
        const newItems = [...items];
        newItems[index] = { ...newItems[index], ...changes };
        setItems(newItems);
    };

    const removeItem = (index: number) => {
        setItems(items.filter((_, i) => i !== index));
    };

    const calculateTotal = () => {
        return items.reduce((acc, item) => acc + (item.quantity * item.unitPrice), 0);
    };

    const total = calculateTotal();
    const hasOOS = items.some(i => i.status === "OOS");

    // Calculate Oil Liters for Warning
    const totalOilLiters = items
        .filter(i => i.description.toLowerCase().includes("aceite") || i.description.toLowerCase().includes("litros") || i.description.toLowerCase().includes("lts"))
        .reduce((acc, i) => acc + Number(i.quantity), 0);

    const typicalOil = learnedData?.oilTypicalLiters || 0;
    const oilWarning = typicalOil > 0 && Math.abs(totalOilLiters - typicalOil) > 0.5;

    return (
        <div className="bg-white p-6 rounded-xl shadow border border-gray-200 flex flex-col h-full">
            <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                    <Calculator className="w-6 h-6 text-blue-600" />
                    Presupuesto
                </h3>
                <div className="flex bg-gray-100 p-1 rounded-lg">
                    <button
                        onClick={() => setPreset("BASIC")}
                        className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${preset === "BASIC" ? "bg-white shadow text-blue-600" : "text-gray-500 hover:text-gray-700"
                            }`}
                    >
                        Básico
                    </button>
                    <button
                        onClick={() => setPreset("FULL")}
                        className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${preset === "FULL" ? "bg-white shadow text-blue-600" : "text-gray-500 hover:text-gray-700"
                            }`}
                    >
                        Completo
                    </button>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto space-y-3 pr-2">
                {loading ? (
                    <div className="text-center py-10 text-gray-400 animate-pulse">Generando sugerencias...</div>
                ) : (
                    items.map((item, idx) => (
                        <div key={idx} className={`p-3 rounded-lg border flex gap-3 items-start group ${item.status === "OOS" ? "bg-red-50 border-red-200" : "bg-white border-gray-200"
                            }`}>
                            <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                    {item.code && <span className="text-xs font-mono bg-gray-100 px-1.5 py-0.5 rounded text-gray-600">{item.code}</span>}
                                    <input
                                        type="text"
                                        value={item.description}
                                        onChange={(e) => updateItem(idx, { description: e.target.value })}
                                        className="font-medium text-gray-900 bg-transparent border-none p-0 focus:ring-0 w-full"
                                    />
                                </div>
                                <div className="flex items-center gap-4 text-sm text-gray-500">
                                    <div className="flex items-center gap-1">
                                        <span>Cant:</span>
                                        <input
                                            type="number"
                                            value={item.quantity}
                                            onChange={(e) => updateItem(idx, { quantity: parseFloat(e.target.value) || 0 })}
                                            className="w-16 p-1 border rounded text-center bg-white"
                                            step="0.5"
                                        />
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <span>$ Unit:</span>
                                        <input
                                            type="number"
                                            value={item.unitPrice}
                                            onChange={(e) => updateItem(idx, { unitPrice: parseFloat(e.target.value) || 0 })}
                                            className="w-20 p-1 border rounded text-right bg-white"
                                        />
                                    </div>
                                </div>
                                {item.status === "OOS" && (
                                    <div className="text-xs text-red-600 font-bold flex items-center gap-1 mt-1">
                                        <AlertTriangle className="w-3 h-3" /> SIN STOCK (Disp: {item.stockAvailable})
                                    </div>
                                )}
                            </div>
                            <div className="flex flex-col items-end justify-between self-stretch">
                                <span className="font-bold text-gray-900">
                                    ${(item.quantity * item.unitPrice).toLocaleString()}
                                </span>
                                <button onClick={() => removeItem(idx)} className="text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity">
                                    &times;
                                </button>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {oilWarning && (
                <div className="mt-4 p-3 bg-yellow-50 text-yellow-800 text-sm rounded-lg flex items-start gap-2 border border-yellow-200">
                    <AlertTriangle className="w-5 h-5 shrink-0" />
                    <div>
                        <strong>Atención Litros:</strong> Seleccionados {totalOilLiters}L, pero el vehículo suele usar {typicalOil}L. Verifica si es correcto.
                    </div>
                </div>
            )}

            <div className="mt-6 pt-4 border-t border-gray-100">
                <div className="flex justify-between items-end mb-4">
                    <span className="text-gray-500">Total Estimado</span>
                    <span className="text-3xl font-bold text-gray-900">${total.toLocaleString()}</span>
                </div>

                <div className="grid grid-cols-2 gap-3">
                    <button
                        onClick={fetchSuggestions}
                        className="px-4 py-3 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium flex items-center justify-center gap-2"
                    >
                        <RefreshCw className="w-5 h-5" /> Reinciar
                    </button>
                    <button
                        onClick={() => onConfirm(items, total)}
                        disabled={hasOOS || items.length === 0}
                        className="px-4 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-bold shadow-lg shadow-green-200 disabled:opacity-50 disabled:shadow-none flex items-center justify-center gap-2"
                    >
                        <CheckCircle className="w-5 h-5" />
                        {hasOOS ? "Stock Insuficiente" : "Confirmar Orden"}
                    </button>
                </div>
            </div>
        </div>
    );
}
