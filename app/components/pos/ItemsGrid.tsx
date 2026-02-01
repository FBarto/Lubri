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
    minStock?: number;
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
        <div className="flex flex-col h-full bg-[#f8fafc] overflow-hidden">
            {/* Header / Search Controls - Glass Style */}
            <div className="p-6 bg-white border-b border-slate-100 shadow-sm shrink-0 z-10 sticky top-0">
                <div className="flex gap-4 items-center">
                    {selectedCategory && (
                        <button
                            onClick={handleBack}
                            className="bg-slate-100 hover:bg-red-600 hover:text-white p-3 rounded-2xl transition-all shadow-sm active:scale-90"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6" /></svg>
                        </button>
                    )}

                    <div className="flex-1 relative group">
                        <input
                            type="text"
                            placeholder={selectedCategory ? `Explorar en ${CATEGORIES.find(c => c.id === selectedCategory)?.label}...` : "Buscar productos o servicios mediante código o nombre..."}
                            className="w-full pl-12 pr-12 py-4 rounded-2xl border-2 border-slate-100 bg-slate-50 focus:bg-white focus:border-red-600 text-slate-900 font-bold placeholder:text-slate-400 placeholder:italic outline-none transition-all shadow-inner"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-red-600 transition-colors">
                            <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
                        </div>
                        {searchTerm && (
                            <button
                                onClick={() => setSearchTerm('')}
                                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300 hover:text-red-600 transition-colors"
                            >
                                <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24"><path d="M18 6L6 18M6 6l12 12"></path></svg>
                            </button>
                        )}
                    </div>
                </div>

                {selectedCategory && (
                    <div className="mt-4 flex items-center gap-2">
                        <span className="text-[10px] font-black text-red-600 bg-red-50 px-3 py-1 rounded-full uppercase tracking-[0.2em] border border-red-100 shadow-sm">
                            {CATEGORIES.find(c => c.id === selectedCategory)?.label}
                        </span>
                        <span className="h-[1px] flex-1 bg-slate-50"></span>
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic">{finalFilteredItems.length} resultados encontrados</span>
                    </div>
                )}
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-y-auto p-8 custom-scrollbar relative">
                {/* Decorative background for grid */}
                <div className="absolute top-0 right-0 w-[40%] h-[40%] bg-slate-200/20 blur-[100px] rounded-full -z-10 pointer-events-none"></div>

                {/* 1. Category View - Premium Square Cards */}
                {!selectedCategory && !searchTerm && (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                        {CATEGORIES.map(cat => (
                            <button
                                key={cat.id}
                                onClick={() => handleCategorySelect(cat.id)}
                                className="flex flex-col items-start justify-between p-8 bg-white border border-slate-100 rounded-[2.5rem] shadow-sm hover:shadow-2xl hover:border-red-500/20 hover:-translate-y-2 transition-all aspect-square group relative overflow-hidden"
                            >
                                <div className="absolute -bottom-4 -right-4 text-slate-50 opacity-0 group-hover:opacity-100 transition-opacity scale-150 rotate-12">
                                    <cat.icon />
                                </div>

                                <div className={`p-4 rounded-3xl bg-slate-50 group-hover:bg-red-600 text-slate-400 group-hover:text-white transition-all shadow-inner group-hover:rotate-12 group-hover:scale-110`}>
                                    <cat.icon />
                                </div>

                                <div className="relative z-10 w-full">
                                    <span className="block font-black text-xl text-slate-900 uppercase italic tracking-tighter group-hover:text-red-600 transition-colors leading-tight mb-1">{cat.label}</span>
                                    <div className="flex items-center gap-1.5 font-bold text-[10px] text-slate-400 uppercase tracking-widest">
                                        <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></span>
                                        {itemsByCategory[cat.id]?.length || 0} items
                                    </div>
                                </div>
                            </button>
                        ))}
                    </div>
                )}

                {/* 2. Items View - Modern Grid Cards */}
                {(selectedCategory || searchTerm) && (
                    <>
                        {paginatedItems.length === 0 ? (
                            <div className="h-64 flex flex-col items-center justify-center text-slate-300">
                                <svg width="64" height="64" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24" className="mb-4 opacity-20"><path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
                                <p className="font-black uppercase tracking-[0.2em] italic">No results found</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-8">
                                {paginatedItems.map(item => (
                                    <button
                                        key={`${item.type}-${item.id}`}
                                        onClick={() => onAddItem(item)}
                                        className="text-left glass rounded-[2.2rem] p-6 border-white/60 shadow-sm hover:shadow-2xl hover:border-red-600/30 transition-all flex flex-col justify-between group min-h-[180px] hover:-translate-y-1 relative overflow-hidden"
                                    >
                                        <div className="relative z-10">
                                            <div className="flex justify-between items-start mb-4">
                                                <span className={`text-[9px] font-black uppercase tracking-[0.2em] px-2 py-0.5 rounded-full border ${item.type === 'SERVICE' ? 'bg-emerald-50 text-emerald-600 border-emerald-200' : 'bg-blue-50 text-blue-600 border-blue-200'}`}>
                                                    {item.category || (item.type === 'SERVICE' ? 'Service' : 'Product')}
                                                </span>
                                                {item.type === 'PRODUCT' && (
                                                    <div className={`text-[9px] font-black px-2 py-0.5 rounded-full border ${!item.stock || item.stock <= 0 ? 'bg-red-50 text-red-600 border-red-200' : item.stock <= (item.minStock || 0) ? 'bg-amber-50 text-amber-600 border-amber-200' : 'bg-slate-50 text-slate-400 border-slate-200'}`}>
                                                        {!item.stock || item.stock <= 0 ? 'Out' : item.stock <= (item.minStock || 0) ? `Min: ${item.stock}` : `Stock: ${item.stock}`}
                                                    </div>
                                                )}
                                            </div>

                                            {item.code && (
                                                <h3 className="font-black text-slate-900 text-2xl leading-none tracking-tighter mb-2 italic group-hover:text-red-600 transition-colors uppercase">
                                                    {item.code}
                                                </h3>
                                            )}
                                            <p className={`font-bold text-slate-500 leading-tight uppercase tracking-tight line-clamp-2 italic ${item.code ? 'text-[10px]' : 'text-base'}`}>
                                                {item.name}
                                            </p>
                                        </div>

                                        <div className="flex justify-between items-end mt-4 relative z-10">
                                            <div className="flex items-start">
                                                <span className="text-xs font-black text-red-600 mt-1 mr-0.5">$</span>
                                                <span className="text-3xl font-black text-slate-900 tracking-tighter italic leading-none">
                                                    {Math.floor(item.price).toLocaleString()}
                                                </span>
                                            </div>

                                            <div className="w-8 h-8 rounded-full bg-slate-900 text-white flex items-center justify-center opacity-0 translate-x-4 group-hover:opacity-100 group-hover:translate-x-0 transition-all shadow-xl shadow-slate-900/40">
                                                <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="4" viewBox="0 0 24 24"><path d="M12 5v14M5 12h14"></path></svg>
                                            </div>
                                        </div>

                                        {/* Decorative gloss */}
                                        <div className="absolute top-0 left-0 w-full h-1/2 bg-gradient-to-b from-white/30 to-transparent pointer-events-none"></div>
                                    </button>
                                ))}
                            </div>
                        )}

                        {/* Pagination Controls - Premium Styling */}
                        {totalPages > 1 && (
                            <div className="flex justify-center items-center gap-6 py-8 mt-auto border-t border-slate-100">
                                <button
                                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                    disabled={currentPage === 1}
                                    className="px-6 py-2.5 rounded-2xl bg-white border-2 border-slate-100 text-slate-600 font-black text-[10px] uppercase tracking-widest disabled:opacity-20 hover:border-red-600 hover:text-red-600 transition-all shadow-sm active:scale-90"
                                >
                                    Prev
                                </button>
                                <div className="flex items-center gap-2">
                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic">Phase</span>
                                    <span className="w-8 h-8 rounded-full bg-slate-900 text-white flex items-center justify-center font-black text-xs italic">{currentPage}</span>
                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic mx-1">/</span>
                                    <span className="text-sm font-black text-slate-600 italic">{totalPages}</span>
                                </div>
                                <button
                                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                    disabled={currentPage === totalPages}
                                    className="px-6 py-2.5 rounded-2xl bg-white border-2 border-slate-100 text-slate-600 font-black text-[10px] uppercase tracking-widest disabled:opacity-20 hover:border-red-600 hover:text-red-600 transition-all shadow-sm active:scale-90"
                                >
                                    Next
                                </button>
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
}
