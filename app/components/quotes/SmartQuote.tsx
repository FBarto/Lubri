'use client';

import { useState, useEffect } from 'react';
import { Search, History, ArrowRight, Save, Send, AlertTriangle, CheckCircle, Package, Wrench, Droplet, FilePlus, Sparkles, Plus } from 'lucide-react';
import { suggestServiceEstimate, getRecentWorkOrders, saveVehicleLearnedSpecs, confirmQuoteAsWorkOrder, getVehicleAIInsight, getLastServiceItems } from '../../lib/maintenance-actions';
import { searchProductsForQuote } from '../../lib/inbox-actions';

// Component for "Presupuesto Service Fácil"
interface SmartQuoteProps {
    initialClient?: any;
}

export default function SmartQuote({ initialClient }: SmartQuoteProps) {
    // Search State
    const [plate, setPlate] = useState('');
    const [vehicleInfo, setVehicleInfo] = useState<any>(null);
    const [searchLoading, setSearchLoading] = useState(false);
    const [searchResultsVehicles, setSearchResultsVehicles] = useState<any[]>([]);

    // Context Data
    const [history, setHistory] = useState<any[]>([]);
    const [learnedSpecs, setLearnedSpecs] = useState<any>(null); // To store valid specs if needed

    // Quote Builder State
    const [quoteItems, setQuoteItems] = useState<any[]>([]);
    const [saving, setSaving] = useState(false);
    const [successId, setSuccessId] = useState<number | null>(null);

    // Mileage
    const [currentMileage, setCurrentMileage] = useState<string>('');

    // AI Insight
    const [aiInsight, setAiInsight] = useState<string | null>(null);
    const [aiLoading, setAiLoading] = useState(false);

    // Product Search Modal/Input
    const [itemSearch, setItemSearch] = useState('');
    const [searchResults, setSearchResults] = useState<any[]>([]);

    // Analysis
    const [totalOilLiters, setTotalOilLiters] = useState(0);

    // Handle Initial Client Context
    useEffect(() => {
        if (initialClient) {
            // If client has vehicles, try to select one
            if (initialClient.vehicles && initialClient.vehicles.length > 0) {
                if (initialClient.vehicles.length === 1) {
                    // Fetch full vehicle details to be consistent with handleSelectVehicle
                    // But we might only have basic info. Let's trigger search or select directly if we trust the data.
                    // Ideally we need the 'id' to fetch history.
                    handleSelectVehicle(initialClient.vehicles[0]);
                } else {
                    // Multiple vehicles, show them as search results
                    setSearchResultsVehicles(initialClient.vehicles.map((v: any) => ({
                        ...v,
                        client: initialClient // Ensure client info is attached for display
                    })));
                    setPlate(''); // Clear plate input to show we are in "selection" mode? Or set to first?
                }
            } else {
                // Client has no vehicles. 
                // Maybe set user info but we can't do much without a vehicle in this flow yet.
                // Could alert or just focus plate input.
            }
        }
    }, [initialClient]);

    // --- 1. SEARCH VEHICLE ---
    const handleSearch = async () => {
        if (plate.length < 3) return;
        setSearchLoading(true);
        setSearchResultsVehicles([]);
        // setVehicleInfo(null); // Don't clear immediately to keep current view while searching
        setHistory([]);
        setQuoteItems([]);
        setAiInsight(null);

        try {
            const res = await fetch(`/api/vehicles?search=${plate}`);
            const data = await res.json();
            const results = data.data || data.vehicles || data;

            if (results && results.length > 0) {
                if (results.length === 1) {
                    handleSelectVehicle(results[0]);
                } else {
                    setSearchResultsVehicles(results);
                }
            } else {
                alert('Vehículo no encontrado');
                setVehicleInfo(null);
            }
        } catch (e) {
            console.error(e);
            alert('Error buscando vehículo');
        } finally {
            setSearchLoading(false);
        }
    };

    const handleSelectVehicle = async (vehicle: any) => {
        setVehicleInfo(vehicle);
        setPlate(vehicle.plate);
        setSearchResultsVehicles([]);
        if (vehicle.mileage) setCurrentMileage(vehicle.mileage.toString());

        // Load History (Recent 3)
        const histRes = await getRecentWorkOrders(vehicle.id, 3);
        if (histRes.success) setHistory(histRes.data || []);

        // Load AI Insight
        setAiLoading(true);
        const aiRes = await getVehicleAIInsight(vehicle.id);
        if (aiRes.success) setAiInsight(aiRes.insight || null);
        setAiLoading(false);
    };

    // --- 2. GENERATE PRESET ---
    const loadPreset = async (type: 'BASIC' | 'FULL') => {
        if (!vehicleInfo) return;

        const res = await suggestServiceEstimate(vehicleInfo.id, type);
        if (res.success && res.data) {
            // Map items to quote structure
            const newItems = res.data.items.map((item: any) => ({
                id: item.id || Math.random(),
                productId: item.id || null, // Important for stock check
                code: item.code || '---',
                name: item.name,
                price: item.price,
                stock: item.stock,
                minStock: item.minStock,
                quantity: item.quantity || 1,
                type: item.type || 'PRODUCT',
                category: item.determinedCategory
            }));

            // Append Labor (Mano de Obra) placeholder if missing?
            // User requirement: "Mano de Obra - Agregar como item sin productId"
            const hasLabor = newItems.some((i: any) => i.type === 'SERVICE');
            if (!hasLabor) {
                // Add default Labor item
                newItems.push({
                    id: Math.random(),
                    productId: null,
                    code: 'SVC',
                    name: `Mano de Obra - Service ${type === 'BASIC' ? 'Básico' : 'Completo'}`,
                    price: 0,
                    stock: null,
                    minStock: 0,
                    quantity: 1,
                    type: 'SERVICE',
                    category: 'SERVICE'
                });
            }

            setQuoteItems(newItems);
        } else {
            alert('No se pudo generar proyección automática. Historia insuficiente.');
        }
    };

    const loadLastService = async () => {
        if (!vehicleInfo) return;

        const historyRes = await getLastServiceItems(vehicleInfo.id);
        if (historyRes.success && historyRes.data) {
            const newItems = historyRes.data.items.map((item: any) => ({
                id: item.id || Math.random(),
                productId: item.id || null,
                code: item.found ? (item.code || '---') : 'HIST',
                name: item.name,
                price: item.price,
                stock: item.stock || 0,
                minStock: 0,
                quantity: item.quantity || 1,
                type: item.type || 'PRODUCT',
                category: item.category || 'OTHER'
            }));
            setQuoteItems(newItems);
        } else {
            alert('No se pudo cargar el último servicio.');
        }
    };



    const addItemFromHistory = (historyItem: any) => {
        // Use current product data if available (price, stock), otherwise fallback to history
        const productData = historyItem.product ? {
            id: historyItem.product.id,
            productId: historyItem.product.id,
            code: historyItem.product.code,
            name: historyItem.product.name,
            price: historyItem.product.price, // Current price
            stock: historyItem.product.stock,
            type: 'PRODUCT'
        } : {
            id: Math.random(),
            productId: null,
            code: 'MANUAL',
            name: historyItem.description,
            price: historyItem.unitPrice, // Historic price (fallback)
            stock: null,
            type: 'PRODUCT'
        };

        setQuoteItems(prev => [...prev, {
            ...productData,
            quantity: historyItem.quantity || 1
        }]);
    };

    // --- 3. ITEM MANAGEMENT ---
    const updateItem = (idx: number, field: string, val: any) => {
        const copy = [...quoteItems];
        copy[idx] = { ...copy[idx], [field]: val };
        setQuoteItems(copy);
    };

    const removeItem = (idx: number) => {
        setQuoteItems(prev => prev.filter((_, i) => i !== idx));
    };

    const addItem = (product: any) => {
        setQuoteItems(prev => [...prev, {
            id: product.id || Math.random(),
            productId: product.id,
            code: product.code || '---',
            name: product.name,
            price: product.price,
            stock: product.stock,
            quantity: 1,
            type: product.type || 'PRODUCT'
        }]);
        setItemSearch('');
        setSearchResults([]);
    };

    const handleProductSearch = async (q: string) => {
        setItemSearch(q);
        if (q.length < 2) {
            setSearchResults([]);
            return;
        }
        const res = await searchProductsForQuote(q);
        if (res.success) setSearchResults(res.data || []);
    };

    // --- 4. CALCULATIONS ---
    const subtotal = quoteItems.reduce((sum, i) => sum + (Number(i.price) * Number(i.quantity)), 0);

    // Analyze Oil
    useEffect(() => {
        let liters = 0;
        quoteItems.forEach(i => {
            const lower = i.name.toLowerCase();
            // Heuristic for liters. If unit is L or mentioned.
            // But we often sell by unit (1 Bidon, 1 Liter).
            // Assuming quantity is the multiplier.
            // If item name contains "4L" -> qty * 4.
            // If item name contains "1L" -> qty * 1.
            // If item name is "Aceite ... Suelto" -> qty usually is liters?

            // This is tricky without strict product metadata. 
            // We will sum QTY for items categorized as ENGINE_OIL for now if they look like "Suelto".
            // If they look like "Bidon", we guess 4.

            if (i.category === 'ENGINE_OIL' || i.name.toLowerCase().includes('aceite')) {
                if (i.name.toLowerCase().includes('4l') || i.name.toLowerCase().includes('bidon')) {
                    liters += (i.quantity * 4);
                } else if (i.name.toLowerCase().includes('1l')) {
                    liters += (i.quantity * 1);
                } else {
                    // Assume bulk (liters)
                    liters += i.quantity;
                }
            }
        });
        setTotalOilLiters(liters);
    }, [quoteItems]);

    // --- ACTIONS ---
    const handleWhatsApp = () => {
        if (!vehicleInfo) return;
        let msg = `*Presupuesto Service - ${vehicleInfo.plate}*\n`;
        msg += `${vehicleInfo.brand} ${vehicleInfo.model}\n\n`;

        quoteItems.forEach(i => {
            msg += `- ${i.name}`;
            if (i.code && i.code !== '---') msg += ` (${i.code})`;
            msg += ` x${i.quantity}: $${(i.price * i.quantity).toLocaleString()}\n`;
        });

        msg += `\n*TOTAL ESTIMADO: $${subtotal.toLocaleString()}*`;

        const phone = vehicleInfo.client?.phone?.replace(/\D/g, '');
        const url = `https://wa.me/${phone || ''}?text=${encodeURIComponent(msg)}`;
        window.open(url, '_blank');
    };

    const handleConfirm = async () => {
        if (!vehicleInfo) return;
        setSaving(true);
        try {
            const res = await confirmQuoteAsWorkOrder({
                vehicleId: vehicleInfo.id,
                clientId: vehicleInfo.clientId,
                items: quoteItems,
                mileage: currentMileage ? Number(currentMileage) : undefined,
                userId: 1 // Default to admin or context user if available
            });

            if (res.success) {
                setSuccessId(res.workOrderId as number);
                // alert(`Orden de Trabajo #${res.workOrderId} creada con éxito.`);
            } else {
                alert('Error al confirmar: ' + res.error);
            }
        } catch (e) {
            console.error(e);
            alert('Error inesperado al confirmar');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="flex flex-col h-full space-y-6">

            {/* SEARCH HEADER */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex gap-4 items-end">
                <div className="flex-1">
                    <label className="block text-sm font-bold text-slate-500 mb-2">Patente del Vehículo</label>
                    <div className="relative">
                        <input
                            type="text"
                            value={plate}
                            onChange={(e) => setPlate(e.target.value.toUpperCase())}
                            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                            className="w-full text-3xl font-black font-mono tracking-widest p-3 border-2 border-slate-200 rounded-xl uppercase outline-none focus:border-blue-500 transition-colors"
                            placeholder="ABC 123 / CLIENTE"
                        />
                        {searchLoading && <div className="absolute right-4 top-4 animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500" />}

                        {/* Multiple Search Results Dropdown */}
                        {searchResultsVehicles.length > 0 && (
                            <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-slate-200 shadow-2xl rounded-xl z-[110] max-h-60 overflow-y-auto">
                                <div className="p-2 bg-slate-50 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">
                                    Resultados Encontrados ({searchResultsVehicles.length})
                                </div>
                                {searchResultsVehicles.map((v) => (
                                    <button
                                        key={v.id}
                                        onClick={() => handleSelectVehicle(v)}
                                        className="w-full text-left p-4 hover:bg-blue-50 border-b last:border-0 border-slate-100 flex justify-between items-center transition-colors"
                                    >
                                        <div>
                                            <div className="font-black font-mono text-slate-800 tracking-wider uppercase">{v.plate}</div>
                                            <div className="text-sm text-slate-500">{v.brand} {v.model}</div>
                                        </div>
                                        <div className="text-right">
                                            <div className="font-bold text-blue-600">{v.client?.name}</div>
                                            <div className="text-xs text-slate-400">{v.client?.phone}</div>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
                {vehicleInfo && (
                    <div className="px-6 py-2 bg-slate-50 rounded-xl border border-slate-200">
                        <p className="text-xs font-bold text-slate-400 uppercase">Cliente</p>
                        <p className="font-bold text-slate-800">{vehicleInfo.client?.name}</p>
                        <p className="text-xs text-slate-500">{vehicleInfo.brand} {vehicleInfo.model}</p>
                    </div>
                )}
                <div className="w-40">
                    <label className="block text-sm font-bold text-slate-500 mb-2">KM Actual</label>
                    <input
                        type="number"
                        value={currentMileage}
                        onChange={(e) => setCurrentMileage(e.target.value)}
                        className="w-full p-3 border border-slate-200 rounded-xl bg-slate-50 font-mono"
                        placeholder="Ej: 54000"
                    />
                </div>
                <button
                    onClick={handleSearch}
                    className="h-[58px] px-6 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-lg shadow-blue-200 transition-all"
                >
                    BUSCAR
                </button>
            </div>

            {vehicleInfo ? (
                <div className="grid grid-cols-12 gap-6 flex-1 min-h-0 relative">
                    {/* SUCCESS OVERLAY */}
                    {successId && (
                        <div className="absolute inset-0 bg-white/90 backdrop-blur-sm z-[100] flex flex-col items-center justify-center animate-in fade-in duration-300">
                            <div className="bg-white p-10 rounded-3xl shadow-2xl border border-slate-100 flex flex-col items-center text-center max-w-md">
                                <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-6">
                                    <CheckCircle size={48} />
                                </div>
                                <h3 className="text-2xl font-black text-slate-800 mb-2">¡Orden Creada!</h3>
                                <p className="text-slate-500 mb-8">
                                    Se ha generado la Orden de Trabajo <span className="font-bold text-slate-800">#{successId}</span> correctamente.
                                </p>
                                <div className="flex gap-3 w-full">
                                    <button
                                        onClick={() => {
                                            setSuccessId(null);
                                            setPlate('');
                                            setVehicleInfo(null);
                                            setQuoteItems([]);
                                        }}
                                        className="flex-1 py-3 px-4 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold rounded-xl transition-colors"
                                    >
                                        Nuevo Presupuesto
                                    </button>
                                    <button
                                        onClick={() => window.location.href = '/employee'} // Or detail page if exists
                                        className="flex-1 py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-lg shadow-blue-100 transition-colors"
                                    >
                                        Ir al Kanban
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* LEFT: HISTORY & AI */}
                    <div className="col-span-4 flex flex-col gap-6 overflow-hidden">

                        {/* AI INSIGHT BOX */}
                        {(aiLoading || aiInsight) && (
                            <div className="bg-violet-50 border border-violet-100 p-4 rounded-2xl relative overflow-hidden group">
                                <div className="absolute top-0 right-0 p-2 opacity-10 group-hover:opacity-20 transition-opacity">
                                    <Sparkles className="w-12 h-12 text-violet-600" />
                                </div>
                                <div className="flex items-center gap-2 mb-2">
                                    <div className="bg-violet-600 p-1 rounded-md">
                                        <Sparkles className="w-3.5 h-3.5 text-white" />
                                    </div>
                                    <span className="text-xs font-black text-violet-700 uppercase tracking-tighter">Sugerencia AI</span>
                                </div>
                                {aiLoading ? (
                                    <div className="space-y-2 animate-pulse">
                                        <div className="h-3 bg-violet-200 rounded w-full"></div>
                                        <div className="h-3 bg-violet-200 rounded w-3/4"></div>
                                    </div>
                                ) : (
                                    <p className="text-sm font-semibold text-violet-800 leading-tight">
                                        {aiInsight}
                                    </p>
                                )}
                            </div>
                        )}

                        <div className="flex items-center gap-2 text-slate-400 font-bold uppercase text-xs tracking-wider">
                            <History size={14} /> Historial Reciente
                        </div>
                        <div className="flex-1 overflow-y-auto space-y-3 pr-2">
                            {history.length === 0 && <div className="text-slate-400 italic text-sm">Sin historial reciente.</div>}
                            {history.map((wo: any) => (
                                <div key={wo.id} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm hover:border-blue-300 transition-colors group">
                                    <div className="flex justify-between items-start mb-2">
                                        <div>
                                            <span className="font-bold text-slate-700 block">{new Date(wo.date).toLocaleDateString()}</span>
                                            <span className="text-xs text-slate-400 font-mono">{wo.mileage?.toLocaleString()} km</span>
                                        </div>
                                        <div className="text-[10px] bg-slate-100 px-2 py-1 rounded text-slate-500">
                                            #{wo.id}
                                        </div>
                                    </div>
                                    <div className="space-y-1">
                                        {wo.saleItems.filter((i: any) => i.type === 'PRODUCT').map((item: any, idx: number) => (
                                            <div key={idx} className="text-xs flex justify-between items-center border-t border-slate-50 pt-1 group/item">
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-slate-600 truncate font-medium">{item.description}</span>
                                                        {item.product?.code && (
                                                            <span className="text-[10px] font-mono text-slate-400 bg-slate-100 px-1 rounded">{item.product.code}</span>
                                                        )}
                                                    </div>
                                                    <div className="flex gap-2 text-[10px] text-slate-400">
                                                        <span className="font-mono">x{item.quantity}</span>
                                                        {item.product && <span className="text-slate-300">• Stock: {item.product.stock}</span>}
                                                    </div>
                                                </div>
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation(); // Prevent card expansion if we add that later
                                                        addItemFromHistory(item);
                                                    }}
                                                    className="p-1.5 bg-slate-50 text-blue-600 rounded-lg hover:bg-blue-600 hover:text-white transition-colors opacity-0 group-hover/item:opacity-100 focus:opacity-100 shadow-sm"
                                                    title="Agregar al Presupuesto"
                                                >
                                                    <Plus size={14} strokeWidth={3} />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* RIGHT: BUILDER */}
                    <div className="col-span-8 bg-white rounded-2xl shadow-xl border border-slate-200 flex flex-col overflow-hidden">

                        {/* TOOLBAR */}
                        <div className="p-4 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
                            <div className="flex gap-2">
                                {/* Presets moved to empty state cards */}
                            </div>
                            <div className="relative w-64">
                                <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                                <input
                                    type="text"
                                    value={itemSearch}
                                    onChange={(e) => handleProductSearch(e.target.value)}
                                    placeholder="Agregar ítem manual..."
                                    className="w-full pl-9 pr-4 py-2 text-sm border border-slate-200 rounded-lg outline-none focus:border-blue-500"
                                />
                                {searchResults.length > 0 && (
                                    <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 shadow-xl rounded-lg max-h-48 overflow-y-auto z-50">
                                        {searchResults.map((res: any) => (
                                            <button
                                                key={res.type + res.id}
                                                onClick={() => addItem(res)}
                                                className="w-full text-left px-4 py-2 hover:bg-slate-50 text-xs flex justify-between items-center bg-white"
                                            >
                                                <span className="font-bold text-slate-700">{res.name}</span>
                                                <span className="text-slate-500">${res.price}</span>
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* ITEMS TABLE */}
                        <div className="flex-1 overflow-y-auto p-4">
                            <table className="w-full text-sm">
                                <thead className="bg-slate-50 text-slate-400 text-xs uppercase font-bold text-left">
                                    <tr>
                                        <th className="p-3 rounded-l-lg">Código</th>
                                        <th className="p-3">Detalle</th>
                                        <th className="p-3 text-center">Cant</th>
                                        <th className="p-3 text-right">Precio</th>
                                        <th className="p-3 text-right rounded-r-lg">Total</th>
                                        <th className="w-10"></th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {quoteItems.length === 0 && (
                                        <tr>
                                            <td colSpan={6} className="p-0">
                                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-8 bg-slate-50/50">
                                                    <button
                                                        onClick={() => loadPreset('BASIC')}
                                                        className="group flex flex-col items-center justify-center p-8 bg-white border-2 border-blue-50 hover:border-blue-500 rounded-3xl shadow-sm hover:shadow-xl transition-all duration-200 text-center space-y-4"
                                                    >
                                                        <div className="w-20 h-20 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                                                            <Droplet size={40} strokeWidth={2} />
                                                        </div>
                                                        <div>
                                                            <h3 className="font-black text-xl text-slate-800 group-hover:text-blue-600">Service Básico</h3>
                                                            <p className="text-slate-400 text-sm font-medium mt-1">Aceite + Filtro de Aceite</p>
                                                        </div>
                                                    </button>

                                                    <button
                                                        onClick={() => loadPreset('FULL')}
                                                        className="group flex flex-col items-center justify-center p-8 bg-white border-2 border-purple-50 hover:border-purple-500 rounded-3xl shadow-sm hover:shadow-xl transition-all duration-200 text-center space-y-4"
                                                    >
                                                        <div className="w-20 h-20 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                                                            <Wrench size={40} strokeWidth={2} />
                                                        </div>
                                                        <div>
                                                            <h3 className="font-black text-xl text-slate-800 group-hover:text-purple-600">Service Completo</h3>
                                                            <p className="text-slate-400 text-sm font-medium mt-1">Aceite + Todos los Filtros</p>
                                                        </div>
                                                    </button>

                                                    {history.length > 0 ? (
                                                        <button
                                                            onClick={loadLastService}
                                                            className="group flex flex-col items-center justify-center p-8 bg-white border-2 border-emerald-50 hover:border-emerald-500 rounded-3xl shadow-sm hover:shadow-xl transition-all duration-200 text-center space-y-4"
                                                        >
                                                            <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                                                                <History size={40} strokeWidth={2} />
                                                            </div>
                                                            <div>
                                                                <h3 className="font-black text-xl text-slate-800 group-hover:text-emerald-600">Repetir Último</h3>
                                                                <p className="text-slate-400 text-sm font-medium mt-1">Cargar ítems del historial</p>
                                                            </div>
                                                        </button>
                                                    ) : (
                                                        <div className="flex flex-col items-center justify-center p-8 border-2 border-slate-100 border-dashed rounded-3xl text-center space-y-4 opacity-70">
                                                            <div className="w-20 h-20 bg-slate-100 text-slate-400 rounded-full flex items-center justify-center">
                                                                <History size={40} strokeWidth={2} />
                                                            </div>
                                                            <div>
                                                                <h3 className="font-black text-xl text-slate-400">Sin Historial</h3>
                                                                <p className="text-slate-400 text-sm font-medium mt-1">No hay servicios previos</p>
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    )}
                                    {quoteItems.map((item, idx) => (
                                        <tr key={idx} className="group hover:bg-slate-50">
                                            <td className="p-3 font-mono text-slate-500 text-xs">
                                                {item.type === 'PRODUCT' ? (
                                                    item.code ? item.code : '---'
                                                ) : <span className="bg-blue-100 text-blue-700 px-1 rounded text-[10px]">SVC</span>}
                                            </td>
                                            <td className="p-3">
                                                <input
                                                    type="text"
                                                    value={item.name}
                                                    onChange={(e) => updateItem(idx, 'name', e.target.value)}
                                                    className="w-full bg-transparent font-bold text-slate-700 outline-none"
                                                />
                                                {item.stock !== null && item.stock <= 0 && (
                                                    <div className="flex items-center gap-1 text-[10px] text-red-500 font-bold mt-1">
                                                        <AlertTriangle size={10} /> SIN STOCK (0)
                                                    </div>
                                                )}
                                            </td>
                                            <td className="p-3 text-center">
                                                <input
                                                    type="number"
                                                    value={item.quantity}
                                                    onChange={(e) => updateItem(idx, 'quantity', Number(e.target.value))}
                                                    className="w-12 text-center bg-white border border-slate-200 rounded p-1 font-bold"
                                                />
                                            </td>
                                            <td className="p-3 text-right text-slate-500">
                                                ${item.price.toLocaleString()}
                                            </td>
                                            <td className="p-3 text-right font-bold text-slate-700">
                                                ${(item.price * item.quantity).toLocaleString()}
                                            </td>
                                            <td className="p-3 text-right">
                                                <button onClick={() => removeItem(idx)} className="text-slate-300 hover:text-red-500">
                                                    &times;
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* FOOTER ANALYSIS */}
                        <div className="bg-slate-50 border-t border-slate-200 p-4">
                            <div className="flex justify-between items-start mb-4">
                                <div className="space-y-2">
                                    <div className="flex items-center gap-2 text-xs font-bold text-slate-500 uppercase tracking-widest">
                                        Análisis
                                    </div>
                                    <div className={`text-sm font-medium flex items-center gap-2 ${totalOilLiters > 5 ? 'text-amber-600' : 'text-slate-600'}`}>
                                        <Droplet size={16} /> Aceite Total Estimado: <span className="font-bold">{totalOilLiters.toFixed(1)} L</span>
                                        {totalOilLiters > 5 && <span className="text-[10px] bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">¿Posible Exceso?</span>}
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="text-slate-400 text-sm font-medium">Total Estimado</p>
                                    <p className="text-3xl font-black text-slate-800">${subtotal.toLocaleString()}</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <button
                                    onClick={handleWhatsApp}
                                    disabled={quoteItems.length === 0}
                                    className="py-3 rounded-xl font-bold bg-green-500 text-white hover:bg-green-600 transition-colors flex justify-center items-center gap-2 disabled:opacity-50"
                                >
                                    <Send size={18} /> Enviar WhatsApp
                                </button>
                                <button
                                    onClick={handleConfirm}
                                    disabled={quoteItems.length === 0 || quoteItems.some(i => i.stock !== null && i.stock <= 0)}
                                    className="py-3 rounded-xl font-bold bg-slate-800 text-white hover:bg-slate-900 transition-colors flex justify-center items-center gap-2 disabled:opacity-50"
                                >
                                    <FilePlus size={18} /> Confirmar (Orden Trabajo)
                                </button>
                            </div>
                            {quoteItems.some(i => i.stock !== null && i.stock <= 0) && (
                                <p className="text-center text-xs text-red-500 mt-2 font-bold">
                                    * No se puede confirmar con ítems sin stock.
                                </p>
                            )}
                        </div>

                    </div>
                </div>
            ) : (
                <div className="flex-1 flex flex-col items-center justify-center text-slate-300">
                    <Package size={64} className="mb-4 opacity-20" />
                    <p className="font-medium">Ingresa una patente para comenzar</p>
                </div>
            )}
        </div>
    );
}
