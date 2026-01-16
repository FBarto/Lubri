'use client';

import { useState, useMemo, useEffect } from 'react';

type ItemType = 'PRODUCT' | 'SERVICE';

interface Item {
    id: number;
    name: string;
    type: ItemType;
    price: number;
    category?: string;
    stock?: number;
    code?: string;
}

interface ItemsGridProps {
    items: Item[];
    onAddItem: (item: Item) => void;
}

// Icons
const ServiceIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" /></svg>;
const OilIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6V4H6v2c0 2 2 2 2 4v10a2 2 0 0 0 2 2h4a2 2 0 0 0 2-2V10c0-2 2-2 2-4Z" /><line x1="12" x2="12" y1="2" y2="4" /></svg>; // Abstract canister
const FilterIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><path d="m8 12 4 4 4-4" /></svg>; // Abstract filter
const BatteryIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="16" height="10" x="4" y="7" rx="2" /><line x1="8" x2="8" y1="7" y2="17" /><line x1="16" x2="16" y1="7" y2="17" /><line x1="7" x2="7" y1="4" y2="7" /><line x1="17" x2="17" y1="4" y2="7" /></svg>;
const TireIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="9" /><circle cx="12" cy="12" r="3" /><path d="M12 3v2" /><path d="M12 19v2" /><path d="M3 12h2" /><path d="M19 12h2" /></svg>;
const DefaultIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="3" rx="2" ry="2" /><line x1="3" x2="21" y1="9" y2="9" /><path d="m9 16 3-3 3 3" /></svg>;

// Categories Setup
const CATEGORIES = [
    { id: 'SERVICE', label: 'Servicios', icon: ServiceIcon, type: 'SERVICE' },
    { id: 'ACEITES', label: 'Aceites', icon: OilIcon, type: 'PRODUCT' },
    { id: 'FILTROS_AIRE', label: 'Filtros Aire', icon: FilterIcon, type: 'PRODUCT' },
    { id: 'FILTROS_ACEITE', label: 'Filtros Aceite', icon: FilterIcon, type: 'PRODUCT' },
    { id: 'FILTROS_COMB', label: 'Filtros Comb.', icon: FilterIcon, type: 'PRODUCT' },
    { id: 'FILTROS_OTROS', label: 'Otros Filtros', icon: FilterIcon, type: 'PRODUCT' },
    { id: 'BATERIAS', label: 'Baterías', icon: BatteryIcon, type: 'PRODUCT' },
    { id: 'GOMERIA', label: 'Gomería', icon: TireIcon, type: 'SERVICE' },
    { id: 'OTROS', label: 'Otros', icon: DefaultIcon, type: 'BOTH' }
];

export default function ItemsGrid({ items, onAddItem }: ItemsGridProps) {
    const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const ITEMS_PER_PAGE = 20;

    // Pre-process items to check availability in categories
    const itemsByCategory = useMemo(() => {
        const mapping: Record<string, Item[]> = {};
        CATEGORIES.forEach(c => mapping[c.id] = []);

        items.forEach(item => {
            const cat = item.category?.toUpperCase() || 'OTROS';
            const type = item.type;
            const code = item.code?.toUpperCase() || '';

            // Heuristic matching
            if (type === 'SERVICE') {
                if (cat.includes('GOMERIA')) mapping['GOMERIA'].push(item);
                else mapping['SERVICE'].push(item); // Default service
            } else {
                // Product Classification by Code Prefix
                if (code.startsWith('AMPI')) {
                    mapping['FILTROS_AIRE'].push(item);
                } else if (code.startsWith('AMP')) {
                    mapping['FILTROS_AIRE'].push(item);
                } else if (code.startsWith('MAP')) {
                    mapping['FILTROS_ACEITE'].push(item);
                } else if (code.startsWith('GS') || code.startsWith('ECOGS')) {
                    mapping['FILTROS_COMB'].push(item);
                } else if (code.startsWith('F')) {
                    mapping['FILTROS_OTROS'].push(item);
                } else if (cat.includes('ACEITE')) {
                    mapping['ACEITES'].push(item);
                } else if (cat.includes('FILTRO')) {
                    // Fallback for filters without matching content
                    mapping['FILTROS_OTROS'].push(item);
                } else if (cat.includes('BATERIA')) {
                    mapping['BATERIAS'].push(item);
                } else {
                    mapping['OTROS'].push(item);
                }
            }
        });

        return mapping;
    }, [items]);

    const filteredItems = useMemo(() => {
        let currentItems: Item[] = [];
        if (!selectedCategory) return [];

        currentItems = itemsByCategory[selectedCategory] || [];

        if (searchTerm) {
            const term = searchTerm.toLowerCase();
            currentItems = currentItems.filter(item =>
                item.name.toLowerCase().includes(term) ||
                (item.code && item.code.toLowerCase().includes(term))
            );
        }
        return currentItems;
    }, [selectedCategory, itemsByCategory, searchTerm]);

    // Pagination Logic
    const finalFilteredItems = selectedCategory ? filteredItems : (searchTerm ? items.filter(i => i.name.toLowerCase().includes(searchTerm.toLowerCase())) : []);

    // Reset page when filter changes
    useEffect(() => {
        setCurrentPage(1);
    }, [selectedCategory, searchTerm]);

    const totalPages = Math.ceil(finalFilteredItems.length / ITEMS_PER_PAGE);
    const paginatedItems = finalFilteredItems.slice(
        (currentPage - 1) * ITEMS_PER_PAGE,
        currentPage * ITEMS_PER_PAGE
    );


    // Handlers
    const handleCategorySelect = (catId: string) => {
        setSelectedCategory(catId);
        setSearchTerm('');
    };

    const handleBack = () => {
        setSelectedCategory(null);
        setSearchTerm('');
    };

    return (
        <div className="flex flex-col h-full bg-slate-50">
            {/* Header / Search Controls */}
            <div className="p-4 bg-white border-b border-slate-200 shadow-sm shrink-0 z-10 sticky top-0">
                <div className="flex gap-4 items-center">
                    {selectedCategory && (
                        <button
                            onClick={handleBack}
                            className="bg-slate-100 hover:bg-slate-200 p-2.5 rounded-xl transition-colors text-slate-600"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6" /></svg>
                        </button>
                    )}

                    <div className="flex-1 relative">
                        <input
                            type="text"
                            placeholder={selectedCategory ? "Buscar item..." : "Buscar en todo..."}
                            className="w-full pl-4 pr-10 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:ring-2 focus:ring-slate-900 outline-none transition-all"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                        <svg className="absolute right-3 top-3 text-slate-400" width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
                    </div>
                </div>

                {selectedCategory && (
                    <div className="mt-2 text-xs font-bold text-slate-400 uppercase tracking-widest pl-2">
                        {CATEGORIES.find(c => c.id === selectedCategory)?.label}
                    </div>
                )}
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">

                {/* 1. Category View */}
                {!selectedCategory && !searchTerm && (
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        {CATEGORIES.map(cat => (
                            <button
                                key={cat.id}
                                onClick={() => handleCategorySelect(cat.id)}
                                className="flex flex-col items-center justify-center gap-3 p-6 bg-white border border-slate-200 rounded-2xl shadow-sm hover:shadow-lg hover:border-slate-300 hover:-translate-y-1 transition-all aspect-square group"
                            >
                                <div className={`p-4 rounded-full bg-slate-50 group-hover:bg-slate-100 text-slate-600 group-hover:text-slate-900 transition-colors`}>
                                    <cat.icon />
                                </div>
                                <span className="font-bold text-lg text-slate-700">{cat.label}</span>
                                <span className="text-xs font-medium text-slate-400">
                                    {itemsByCategory[cat.id]?.length || 0} items
                                </span>
                            </button>
                        ))}
                    </div>
                )}

                {/* 2. Items View */}
                {(selectedCategory || searchTerm) && (
                    <>
                        <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 mb-4">
                            {paginatedItems.map(item => (
                                <button
                                    key={`${item.type}-${item.id}`}
                                    onClick={() => onAddItem(item)}
                                    className="text-left bg-white rounded-xl p-0 border border-slate-200 shadow-sm hover:shadow-md hover:border-blue-400 transition-all flex flex-col items-stretch overflow-hidden group min-h-[140px]"
                                >
                                    <div className={`p-1.5 text-[0.6rem] font-black uppercase tracking-wider text-center ${item.type === 'SERVICE' ? 'bg-emerald-50 text-emerald-700' : 'bg-blue-50 text-blue-700'}`}>
                                        {item.category || (item.type === 'SERVICE' ? 'SERVICIO' : 'PRODUCTO')}
                                    </div>

                                    <div className="p-3 flex-1 flex flex-col justify-between items-start w-full">
                                        <div className="w-full mb-2">
                                            {item.code && (
                                                <h3 className="font-black text-slate-800 text-lg leading-tight mb-1 break-words w-full">
                                                    {item.code}
                                                </h3>
                                            )}
                                            <p className={`font-medium text-slate-600 leading-snug break-words w-full ${item.code ? 'text-xs opacity-80' : 'text-sm font-bold'}`}>
                                                {item.name}
                                            </p>
                                        </div>

                                        <div className="flex justify-between items-end w-full border-t border-slate-50 pt-2 mt-1">
                                            <span className="text-lg font-black text-slate-900 shrink-0">
                                                ${item.price.toLocaleString()}
                                            </span>

                                            {item.type === 'PRODUCT' && (
                                                <div className={`text-[0.65rem] font-bold px-1.5 py-0.5 rounded ml-2 shrink-0 ${!item.stock || item.stock <= 0 ? 'bg-red-100 text-red-600' : item.stock < 5 ? 'bg-amber-100 text-amber-700' : 'text-slate-400'}`}>
                                                    {!item.stock || item.stock <= 0 ? 'Sin Stock' : `Stock: ${item.stock}`}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </button>
                            ))}
                        </div>

                        {/* Pagination Controls */}
                        {totalPages > 1 && (
                            <div className="flex justify-center items-center gap-4 py-4 mt-auto">
                                <button
                                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                    disabled={currentPage === 1}
                                    className="px-4 py-2 rounded-lg bg-white border border-slate-200 text-slate-600 font-bold disabled:opacity-50 hover:bg-slate-50"
                                >
                                    Anterior
                                </button>
                                <span className="text-sm font-bold text-slate-500">
                                    Página {currentPage} de {totalPages}
                                </span>
                                <button
                                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                    disabled={currentPage === totalPages}
                                    className="px-4 py-2 rounded-lg bg-white border border-slate-200 text-slate-600 font-bold disabled:opacity-50 hover:bg-slate-50"
                                >
                                    Siguiente
                                </button>
                            </div>
                        )}
                    </>
                )}

                {(selectedCategory || searchTerm) && filteredItems.length === 0 && (
                    <div className="h-full flex flex-col items-center justify-center text-slate-400 py-12">
                        <p className="font-medium">No se encontraron resultados</p>
                    </div>
                )}
            </div>
        </div>
    );
}
