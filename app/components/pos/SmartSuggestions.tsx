
import { Sparkles, Plus } from 'lucide-react';

interface SmartSuggestionsProps {
    cart: any[];
    allItems: any[];
    onAddItem: (item: any) => void;
}

export default function SmartSuggestions({ cart, allItems, onAddItem }: SmartSuggestionsProps) {
    // 1. Analyze Cart Intent
    const lowerCartNames = cart.map(i => i.name.toLowerCase());

    const hasOil = lowerCartNames.some(n => n.includes('aceite') || n.includes('sintetico') || n.includes('elaion') || n.includes('mobil') || n.includes('shell'));

    const filterDetections = {
        oil: lowerCartNames.some(n => n.includes('filtro aceite') || n.includes('unidad sellada')),
        air: lowerCartNames.some(n => n.includes('filtro aire') || n.includes('fap')),
        fuel: lowerCartNames.some(n => n.includes('filtro combustible') || n.includes('filtro nafta') || n.includes('filtro gasoil')),
        cabin: lowerCartNames.some(n => n.includes('filtro habitaculo') || n.includes('filtro polen') || n.includes('filtro aire acondicionado')),
    };

    const hasBattery = lowerCartNames.some(n => n.includes('bateria') || n.includes('moura') || n.includes('willard'));
    const hasBulb = lowerCartNames.some(n => n.includes('lampara') || n.includes('h7') || n.includes('h4'));

    // 2. Generate Suggestions
    const suggestions: any[] = [];

    // Rule: Oil -> Suggest ALL missing filters + Coolant + Additives
    if (hasOil) {
        // Oil Filter if missing
        if (!filterDetections.oil) {
            const oilFilters = allItems.filter(i =>
                (i.name.toLowerCase().includes('filtro aceite') || i.name.toLowerCase().includes('unidad sellada')) &&
                i.stock > 0
            ).slice(0, 2);
            suggestions.push(...oilFilters);
        }

        // Air Filter if missing
        if (!filterDetections.air) {
            const airFilters = allItems.filter(i =>
                i.name.toLowerCase().includes('filtro aire') &&
                i.stock > 0
            ).slice(0, 1);
            suggestions.push(...airFilters);
        }

        // Fuel Filter if missing
        if (!filterDetections.fuel) {
            const fuelFilters = allItems.filter(i =>
                (i.name.toLowerCase().includes('filtro combustible') || i.name.toLowerCase().includes('filtro nafta')) &&
                i.stock > 0
            ).slice(0, 1);
            suggestions.push(...fuelFilters);
        }

        // Cabin Filter if missing
        if (!filterDetections.cabin) {
            const cabinFilters = allItems.filter(i =>
                (i.name.toLowerCase().includes('filtro habitaculo') || i.name.toLowerCase().includes('filtro polen')) &&
                i.stock > 0
            ).slice(0, 1);
            suggestions.push(...cabinFilters);
        }

        // Coolant (Add-on)
        const coolants = allItems.filter(i =>
            (i.name.toLowerCase().includes('glacelf') || i.name.toLowerCase().includes('refrigerante') || i.name.toLowerCase().includes('tir')) &&
            i.stock > 0
        ).slice(0, 1);
        suggestions.push(...coolants);
    }

    // Rule: Battery -> Suggest Alternator Check Service
    if (hasBattery) {
        const check = allItems.find(i => i.type === 'SERVICE' && (i.name.toLowerCase().includes('control carga') || i.name.toLowerCase().includes('alternador')));
        if (check) suggestions.push(check);
    }

    // General Add-ons (if cart is not empty)
    if (cart.length > 0) {
        const water = allItems.filter(i =>
            (i.name.toLowerCase().includes('destilada') || i.name.toLowerCase().includes('limpia parabrisas')) &&
            i.stock > 0
        ).slice(0, 1);
        suggestions.push(...water);

        if (!hasBulb && !hasOil) {
            const bulbs = allItems.filter(i => (i.name.toLowerCase().includes('lampara') || i.name.toLowerCase().includes('h7')) && i.stock > 0).slice(0, 1);
            suggestions.push(...bulbs);
        }
    }

    if (suggestions.length === 0) return null;

    // Deduplicate
    const uniqueSuggestions = Array.from(new Set(suggestions.map(s => s.id)))
        .map(id => suggestions.find(s => s.id === id));

    return (
        <div className="bg-neutral-900 border border-white/5 p-4 rounded-[1.8rem] mb-6 animate-in fade-in slide-in-from-top-4 duration-500 relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-red-600/10 blur-[60px] rounded-full translate-x-1/2 -translate-y-1/2"></div>

            <div className="flex items-center gap-2 mb-4 relative z-10">
                <div className="p-1.5 rounded-lg bg-red-600 text-white shadow-lg shadow-red-900/40 animate-pulse">
                    <Sparkles className="w-3.5 h-3.5" />
                </div>
                <span className="text-[10px] font-black italic text-slate-100 uppercase tracking-[0.3em]">IA: Recomendaciones Estratégicas</span>
            </div>

            <div className="flex gap-3 overflow-x-auto pb-2 custom-scrollbar relative z-10">
                {uniqueSuggestions.map((item: any) => (
                    <button
                        key={`${item.type}-${item.id}`}
                        onClick={() => onAddItem(item)}
                        className="flex items-center gap-4 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-red-600/30 shadow-2xl rounded-[1.2rem] pl-4 pr-3 py-2.5 transition-all active:scale-95 shrink-0 group/pill"
                    >
                        <div className="text-left">
                            <div className="font-black italic text-slate-200 text-[11px] uppercase tracking-tight leading-none mb-1 group-hover/pill:text-red-500 transition-colors">{item.name}</div>
                            <div className="flex items-baseline gap-1">
                                <span className="text-[9px] font-black text-slate-500">$</span>
                                <span className="text-sm font-black text-slate-100 italic tracking-tighter">{item.price.toLocaleString()}</span>
                            </div>
                        </div>
                        <div className="p-2 rounded-xl bg-neutral-800 text-slate-400 group-hover/pill:bg-red-600 group-hover/pill:text-white transition-all shadow-inner">
                            <Plus className="w-4 h-4" />
                        </div>
                    </button>
                ))}
            </div>
        </div>
    );
}
