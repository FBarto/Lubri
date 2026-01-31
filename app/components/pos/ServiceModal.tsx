'use client';

import { useState, useEffect } from 'react';

import UploadComponent from '../dvi/UploadComponent';

// Interfaces simplificadas para manejo local
interface Client { id: number; name: string; phone: string; vehicles?: Vehicle[] }
interface Vehicle { id: number; plate: string; model: string; clientId: number; client?: Client }

interface ServiceModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (data: any) => void;
    service: any;
    initialClient?: Client | null;
}

export default function ServiceModal({ isOpen, onClose, onConfirm, service, initialClient }: ServiceModalProps) {
    // Removed early return to comply with Rules of Hooks

    const [phoneSearch, setPhoneSearch] = useState('');
    const [plateSearch, setPlateSearch] = useState('');

    // Selection State
    const [selectedClient, setSelectedClient] = useState<Client | null>(null);
    const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
    const [mileage, setMileage] = useState('');
    const [notes, setNotes] = useState('');
    const [attachments, setAttachments] = useState<any[]>([]);

    // Search Results
    const [clientResults, setClientResults] = useState<Client[]>([]);
    const [vehicleResults, setVehicleResults] = useState<Vehicle[]>([]);

    useEffect(() => {
        // Reset when opening new service
        if (initialClient) {
            setSelectedClient(initialClient);
            setPhoneSearch(`${initialClient.name} (${initialClient.phone})`);
        } else {
            setSelectedClient(null);
            setPhoneSearch('');
        }

        setSelectedVehicle(null);
        setPlateSearch('');
        setMileage('');
        setNotes('');
        setAttachments([]);
        setClientResults([]);
        setVehicleResults([]);
    }, [service, isOpen, initialClient]);

    // Search Functions
    const searchClient = async (val: string) => {
        setPhoneSearch(val);
        // Clear selection if user edits text
        if (selectedClient && val !== `${selectedClient.name} (${selectedClient.phone})`) {
            setSelectedClient(null);
        }

        if (val.length > 2) {
            try {
                const res = await fetch(`/api/clients?search=${val}`);
                const data = await res.json();
                const results = Array.isArray(data.data) ? data.data : (Array.isArray(data) ? data : []);
                setClientResults(results);
            } catch (e) {
                console.error("Error searching client", e);
                setClientResults([]);
            }
        } else {
            setClientResults([]);
        }
    };

    const searchVehicle = async (val: string) => {
        setPlateSearch(val);
        // Clear selection if user edits text
        if (selectedVehicle && val !== `${selectedVehicle.plate} - ${selectedVehicle.model || ''}`) {
            setSelectedVehicle(null);
        }

        if (val.length > 2) {
            try {
                const res = await fetch(`/api/vehicles?search=${val}`);
                const data = await res.json();
                const results = Array.isArray(data.data) ? data.data : (Array.isArray(data) ? data : []);
                setVehicleResults(results);
            } catch (e) {
                console.error("Error searching vehicle", e);
                setVehicleResults([]);
            }
        } else {
            setVehicleResults([]);
        }
    };

    // Selection Handlers
    const selectClient = (c: Client) => {
        setSelectedClient(c);
        setPhoneSearch(`${c.name} (${c.phone})`);
        setClientResults([]);

        // Auto-select vehicle if only one exists
        if (c.vehicles && c.vehicles.length === 1) {
            // Need to cast or ensure structure matches
            const v = c.vehicles[0];
            // The vehicles in client include usually don't have deep client info, but we have the ID.
            // We can just set it.
            setSelectedVehicle(v as Vehicle);
            setPlateSearch(`${v.plate} - ${v.model || ''}`);
        }
    }

    const selectVehicle = (v: Vehicle) => {
        setSelectedVehicle(v);
        setPlateSearch(`${v.plate} - ${v.model || ''}`);
        setVehicleResults([]);

        // Auto-select client if linked and included in response
        if (v.client && !selectedClient) {
            selectClient(v.client);
        }
    }

    // Confirm Handler
    const handleConfirm = () => {
        onConfirm({
            clientId: selectedClient?.id,
            vehicleId: selectedVehicle?.id,
            mileage: mileage,
            notes: notes,
            clientName: selectedClient?.name,
            vehiclePlate: selectedVehicle?.plate,
            attachments: attachments
        });
        onClose();
    };

    if (!isOpen || !service) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
                <div className="bg-slate-900 p-4 text-white flex justify-between items-center shrink-0">
                    <div>
                        <h2 className="text-xl font-bold">Configurar Servicio</h2>
                        <p className="text-slate-400 text-sm">{service.name}</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full">✕</button>
                </div>

                <div className="p-6 overflow-y-auto flex-1 space-y-6">
                    {/* Client Search */}
                    <div className="relative">
                        <label className="block text-sm font-bold text-slate-700 mb-1">Cliente</label>
                        <input
                            type="text"
                            className="w-full p-3 border rounded-xl bg-slate-50 focus:ring-2 ring-blue-500 outline-none font-medium"
                            placeholder="Buscar por nombre o teléfono..."
                            value={phoneSearch}
                            onChange={(e) => searchClient(e.target.value)}
                        />
                        {clientResults.length > 0 && (
                            <ul className="absolute z-10 w-full bg-white border rounded-xl mt-1 shadow-xl max-h-48 overflow-y-auto">
                                {clientResults.map((c) => (
                                    <li key={c.id} onClick={() => selectClient(c)} className="p-3 hover:bg-blue-50 cursor-pointer border-b last:border-0 border-slate-100">
                                        <div className="font-bold text-slate-800">{c.name}</div>
                                        <div className="text-xs text-slate-500">{c.phone}</div>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>

                    {/* Vehicle Search */}
                    <div className="relative">
                        <label className="block text-sm font-bold text-slate-700 mb-1">Vehículo / Patente</label>
                        <input
                            type="text"
                            className="w-full p-3 border rounded-xl bg-slate-50 focus:ring-2 ring-blue-500 outline-none font-medium uppercase"
                            placeholder="AAA 123"
                            value={plateSearch}
                            onChange={(e) => searchVehicle(e.target.value)}
                        />
                        {vehicleResults.length > 0 && (
                            <ul className="absolute z-10 w-full bg-white border rounded-xl mt-1 shadow-xl max-h-48 overflow-y-auto">
                                {vehicleResults.map((v) => (
                                    <li key={v.id} onClick={() => selectVehicle(v)} className="p-3 hover:bg-blue-50 cursor-pointer border-b last:border-0 border-slate-100">
                                        <div className="font-bold text-slate-800">{v.plate}</div>
                                        <div className="text-xs text-slate-500">{v.model}</div>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>

                    <div className="grid grid-cols-1 gap-4">
                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-1">Notas (Opcional)</label>
                            <input
                                type="text"
                                className="w-full p-3 border rounded-xl bg-slate-50 outline-none focus:ring-2 ring-blue-500"
                                placeholder="..."
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                            />
                        </div>
                    </div>
                    {/* DVI Upload */}
                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-2">Evidencia Digital (DVI)</label>
                        <UploadComponent onUploadComplete={setAttachments} />
                    </div>
                </div>

            </div>

            <div className="p-4 border-t border-slate-100 flex justify-end gap-3 bg-slate-50 shrink-0">
                <button onClick={onClose} className="px-6 py-3 rounded-xl font-bold text-slate-600 hover:bg-slate-200">Cancelar</button>
                <button
                    onClick={handleConfirm}
                    className="px-8 py-3 rounded-xl font-bold bg-slate-900 text-white hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl transition-all"
                >
                    Confirmar y Agregar
                </button>
            </div>
        </div>
    );
}
