
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
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100 p-3 rounded-xl mb-4 animate-in fade-in slide-in-from-top-2">
            <div className="flex items-center gap-2 mb-2 text-blue-700 font-bold text-xs uppercase tracking-wide">
                <Sparkles className="w-3 h-3" />
                Sugerencias Inteligentes
            </div>
            <div className="flex gap-2 overflow-x-auto pb-1">
                {uniqueSuggestions.map((item: any) => (
                    <button
                        key={`${item.type}-${item.id}`}
                        onClick={() => onAddItem(item)}
                        className="flex items-center gap-2 bg-white border border-blue-200 hover:border-blue-400 shadow-sm rounded-lg px-3 py-2 transition-all active:scale-95 shrink-0"
                    >
                        <div className="text-left">
                            <div className="font-bold text-slate-700 text-xs">{item.name}</div>
                            <div className="text-[10px] text-slate-500 font-bold">${item.price}</div>
                        </div>
                        <Plus className="w-4 h-4 text-blue-500" />
                    </button>
                ))}
            </div>
        </div>
    );
}
