
import { Sparkles, Plus } from 'lucide-react';

interface SmartSuggestionsProps {
    cart: any[];
    allItems: any[];
    onAddItem: (item: any) => void;
}

export default function SmartSuggestions({ cart, allItems, onAddItem }: SmartSuggestionsProps) {
    // 1. Analyze Cart Intent
    const hasOil = cart.some(i => i.name.toLowerCase().includes('aceite') || i.name.toLowerCase().includes('sintetico') || i.name.toLowerCase().includes('elaion'));
    const hasFilter = cart.some(i => i.name.toLowerCase().includes('filtro'));
    const hasBattery = cart.some(i => i.name.toLowerCase().includes('bateria') || i.name.toLowerCase().includes('moura'));
    const hasBulb = cart.some(i => i.name.toLowerCase().includes('lampara'));

    // 2. Generate Suggestions
    const suggestions: any[] = [];

    // Rule: Oil -> Suggest Oil Filter + Coolant + Gearbox Oil + Additives
    if (hasOil) {
        // 1. Filters (High Priority)
        if (!hasFilter) {
            const filters = allItems.filter(i => i.name.toLowerCase().includes('filtro aceite') && i.stock > 0).slice(0, 2);
            suggestions.push(...filters);
        }

        // 2. Coolant (Add-on)
        const coolants = allItems.filter(i =>
            (i.name.toLowerCase().includes('glacelf') || i.name.toLowerCase().includes('refrigerante')) && i.stock > 0
        ).slice(0, 1);
        suggestions.push(...coolants);

        // 3. Gearbox Oil specific (75w90 etc)
        const gearOil = allItems.filter(i =>
            (i.name.toLowerCase().includes('75w') || i.name.toLowerCase().includes('caja')) &&
            i.stock > 0
        ).slice(0, 1);
        suggestions.push(...gearOil);
    }

    // Rule: Battery -> Suggest Alternator Check Service?
    if (hasBattery) {
        const check = allItems.find(i => i.type === 'SERVICE' && i.name.toLowerCase().includes('control carga'));
        if (check) suggestions.push(check);
    }

    // General Add-ons (if cart is not empty)
    if (cart.length > 0) {
        // Always good to suggest a windshield fluid or distilled water if not present
        const water = allItems.filter(i => (i.name.toLowerCase().includes('destilada') || i.name.toLowerCase().includes('limpia parabrisas')) && i.stock > 0).slice(0, 1);
        suggestions.push(...water);

        // Suggest Bulb check/replacement if nothing else
        if (!hasBulb && !hasOil) {
            const bulbs = allItems.filter(i => i.name.toLowerCase().includes('lampara') && i.stock > 0).slice(0, 2);
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
