'use client';

import { useState, useEffect, useRef } from 'react';
import { Search, Sparkles, Loader2 } from 'lucide-react';
import { searchVehicleModels, searchProducts, getVehicleInsights, SearchResult } from '../../actions/smart';

// Simple debounce impl if not exists
function useLocalDebounce<T>(value: T, delay: number): T {
    const [debouncedValue, setDebouncedValue] = useState<T>(value);
    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedValue(value);
        }, delay);
        return () => {
            clearTimeout(handler);
        };
    }, [value, delay]);
    return debouncedValue;
}

interface SmartInputProps {
    value: string;
    onChange: (val: string) => void;
    type: 'VEHICLE' | 'PRODUCT_OIL' | 'PRODUCT_FILTER' | 'TEXT';
    placeholder?: string;
    onInsightsFound?: (insights: any) => void;
}

export default function SmartInput({ value, onChange, type, placeholder, onInsightsFound }: SmartInputProps) {
    const [inputValue, setInputValue] = useState(value || '');
    const [suggestions, setSuggestions] = useState<SearchResult[]>([]);
    const [isOpen, setIsOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    const debouncedSearch = useLocalDebounce(inputValue, 400);
    const containerRef = useRef<HTMLDivElement>(null);

    // Sync external value
    useEffect(() => {
        if (value !== inputValue) {
            setInputValue(value || '');
        }
    }, [value]);

    useEffect(() => {
        const fetchSuggestions = async () => {
            if (debouncedSearch.length < 2) {
                setSuggestions([]);
                return;
            }

            setIsLoading(true);
            let results: SearchResult[] = [];

            if (type === 'VEHICLE') {
                results = await searchVehicleModels(debouncedSearch);
            } else if (type === 'PRODUCT_OIL') {
                results = await searchProducts(debouncedSearch, 'ACEITE');
            } else if (type === 'PRODUCT_FILTER') {
                results = await searchProducts(debouncedSearch, 'FILTRO');
            }

            setSuggestions(results);
            setIsLoading(false);
            if (results.length > 0) setIsOpen(true);
        };

        if (isOpen || document.activeElement === containerRef.current?.querySelector('input')) {
            fetchSuggestions();
        }
    }, [debouncedSearch, type]);

    // Close on click outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleSelect = async (item: SearchResult) => {
        setInputValue(item.value);
        onChange(item.value);
        setIsOpen(false);
        setSuggestions([]);

        if (type === 'VEHICLE' && onInsightsFound) {
            // Trigger insights fetch
            const insights = await getVehicleInsights(item.data?.brand || '', item.data?.model || '');
            if (insights && insights.topProducts.length > 0) {
                onInsightsFound(insights);
            }
        }
    };

    return (
        <div className="relative w-full" ref={containerRef}>
            <div className="relative">
                <input
                    type="text"
                    value={inputValue}
                    onChange={(e) => {
                        setInputValue(e.target.value);
                        setIsOpen(true);
                    }}
                    onBlur={() => {
                        // Delay hide to allow click
                        setTimeout(() => {
                            if (!isOpen) onChange(inputValue);
                        }, 200);
                    }}
                    placeholder={placeholder}
                    className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 pl-9 text-sm focus:border-blue-500 outline-none transition-shadow focus:shadow-sm"
                />
                {isLoading ? (
                    <Loader2 className="absolute left-3 top-2.5 w-4 h-4 text-slate-400 animate-spin" />
                ) : (type === 'VEHICLE' || type.startsWith('PRODUCT')) ? (
                    <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                ) : (
                    <span className="absolute left-3 top-2.5 w-4 h-4"></span>
                )}
            </div>

            {isOpen && suggestions.length > 0 && (
                <div className="absolute z-50 left-0 right-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-xl max-h-60 overflow-y-auto">
                    {suggestions.map(item => (
                        <button
                            key={item.id}
                            onClick={() => handleSelect(item)}
                            className="w-full text-left px-4 py-3 hover:bg-slate-50 border-b border-slate-50 last:border-none transition-colors"
                        >
                            <p className="text-sm font-bold text-slate-800">{item.label}</p>
                            {item.subLabel && <p className="text-xs text-slate-500">{item.subLabel}</p>}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}
