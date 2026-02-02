
"use client";

import { useState } from "react";
import { Search, Loader2 } from "lucide-react";

interface VehicleLookupProps {
    onVehicleFound: (vehicle: any) => void;
}

export function VehicleLookup({ onVehicleFound }: VehicleLookupProps) {
    const [plate, setPlate] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const handleSearch = async () => {
        if (!plate) return;
        setLoading(true);
        setError("");

        try {
            const res = await fetch(`/api/vehicles/by-plate?plate=${plate}`);
            if (!res.ok) {
                if (res.status === 404) {
                    setError("Vehículo no encontrado");
                } else {
                    setError("Error al buscar");
                }
                return;
            }
            const data = await res.json();
            onVehicleFound(data);
        } catch (err) {
            setError("Error de red");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-white p-4 rounded-xl shadow border border-gray-100 mb-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <Search className="w-5 h-5 text-blue-600" />
                Buscar Vehículo
            </h2>
            <div className="flex gap-4">
                <div className="flex-1">
                    <input
                        type="text"
                        className="w-full px-4 py-3 text-lg font-mono uppercase border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                        placeholder="ABC 123"
                        value={plate}
                        onChange={(e) => setPlate(e.target.value.toUpperCase())}
                        onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                    />
                </div>
                <button
                    onClick={handleSearch}
                    disabled={loading || !plate}
                    className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition-colors"
                >
                    {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Buscar"}
                </button>
            </div>
            {error && <p className="mt-2 text-red-500 text-sm font-medium">{error}</p>}
        </div>
    );
}
