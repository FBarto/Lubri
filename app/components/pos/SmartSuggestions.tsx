
import { Sparkles, Plus } from 'lucide-react';

interface SmartSuggestionsProps {
    cart: any[];
    allItems: any[];
    onAddItem: (item: any) => void;
}

export default function SmartSuggestions({ cart, allItems, onAddItem }: SmartSuggestionsProps) {
    // 1. Analyze Cart Intent
    const hasOil = cart.some(i => i.name.toLowerCase().includes('aceite') || i.name.toLowerCase().includes('sintetico'));
    const hasFilter = cart.some(i => i.name.toLowerCase().includes('filtro'));
    const hasBattery = cart.some(i => i.name.toLowerCase().includes('bateria') || i.name.toLowerCase().includes('moura'));
    const hasBulb = cart.some(i => i.name.toLowerCase().includes('lampara'));

    // 2. Generate Suggestions
    const suggestions: any[] = [];

    // Rule: Oil -> Suggest Oil Filter (if not present)
    if (hasOil && !hasFilter) {
        // Find generic or common filters
        const filters = allItems.filter(i => i.name.toLowerCase().includes('filtro aceite') && i.stock > 0).slice(0, 2);
        suggestions.push(...filters);
    }

    // Rule: Battery -> Suggest Alternator Check Service?
    if (hasBattery) {
        // Find existing service or generic check
        const check = allItems.find(i => i.type === 'SERVICE' && i.name.toLowerCase().includes('control carga'));
        if (check) suggestions.push(check);
    }

    // Rule: Bulb -> Suggest another one (pair)?
    // Simple logic: Cross-sell windshield fluid if cart value > X?

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
