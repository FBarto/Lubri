'use client';

import { CaseChecklistItem, InputType } from '@prisma/client';
import { updateChecklistItem } from '@/app/lib/actions/inbox-actions';
import { useState } from 'react';
import { debounce } from '@/lib/utils'; // Assuming generic utils or I'll implement local debounce

export default function ChecklistWidget({ items }: { items: CaseChecklistItem[] }) {

    const handleUpdate = async (id: string, value: string, isDone: boolean) => {
        // Optimistic UI could go here, but for now simple async
        await updateChecklistItem(id, value, isDone);
    };

    return (
        <div className="bg-white rounded-lg shadow border p-4">
            <h3 className="font-bold text-slate-800 mb-4 border-b pb-2">Checklist Operativo</h3>
            <div className="space-y-4">
                {items.map((item) => (
                    <ChecklistItemRow key={item.id} item={item} onUpdate={handleUpdate} />
                ))}
            </div>
        </div>
    );
}

function ChecklistItemRow({ item, onUpdate }: { item: CaseChecklistItem, onUpdate: (id: string, v: string, d: boolean) => void }) {
    const [val, setVal] = useState(item.value || '');
    const [done, setDone] = useState(item.isDone);
    const [isSaving, setIsSaving] = useState(false);

    const handleChange = (newVal: string, newDone: boolean) => {
        setVal(newVal);
        setDone(newDone);
        setIsSaving(true);
        // Debounce actual save if needed, but for simple form onBlur is better usually. 
        // Or just trigger save on specific events.
        // For inputs, onBlur. For checkbox/select, onChange.
    };

    const flushSave = async () => {
        await onUpdate(item.id, val, done);
        setIsSaving(false);
    };

    return (
        <div className={`flex flex-col gap-1 p-2 rounded ${done ? 'bg-green-50' : 'bg-gray-50'}`}>
            <div className="flex items-start justify-between">
                <label className="text-sm font-medium text-slate-700 w-full cursor-pointer flex items-center gap-2">
                    <input
                        type="checkbox"
                        checked={done}
                        onChange={(e) => {
                            const d = e.target.checked;
                            setDone(d);
                            onUpdate(item.id, val, d);
                        }}
                        className="rounded accent-blue-600 w-4 h-4 cursor-pointer"
                    />
                    <span className={done ? 'line-through text-slate-400' : ''}>{item.label}</span>
                    {item.isRequired && <span className="text-red-500 text-xs ml-1">*</span>}
                </label>
            </div>

            <div className="pl-6">
                {renderInput(item.inputType, val, (v) => handleChange(v, done), flushSave, item.options as string[] | null)}
            </div>
        </div>
    );
}

function renderInput(
    type: InputType,
    value: string,
    onChange: (v: string) => void,
    onBlur: () => void,
    options: string[] | null
) {
    const baseClass = "w-full text-sm border-gray-300 rounded focus:ring-1 focus:ring-blue-500 py-1 px-2";

    switch (type) {
        case 'TEXT':
        case 'NUMBER': // HTML5 type number
        case 'MONEY':
            return (
                <input
                    type={type === 'NUMBER' || type === 'MONEY' ? 'number' : 'text'}
                    value={value}
                    onChange={e => onChange(e.target.value)}
                    onBlur={onBlur}
                    className={`${baseClass} border`}
                    placeholder="Completar..."
                />
            );
        case 'SELECT':
            return (
                <select
                    value={value}
                    onChange={(e) => { onChange(e.target.value); onBlur(); /* Select updates immediately usually */ }}
                    className={`${baseClass} border bg-white`}
                >
                    <option value="">Seleccionar...</option>
                    {options?.map(o => <option key={o} value={o}>{o}</option>)}
                </select>
            );
        case 'BOOLEAN':
            return (
                <div className="flex gap-4 text-sm mt-1">
                    <label className="flex items-center gap-1">
                        <input
                            type="radio"
                            name={`bool-${value}-${Math.random()}`} // tricky with random, usually ok for this scope
                            checked={value === 'SI'}
                            onChange={() => { onChange('SI'); onBlur(); }}
                        /> Si
                    </label>
                    <label className="flex items-center gap-1">
                        <input
                            type="radio"
                            checked={value === 'NO'}
                            onChange={() => { onChange('NO'); onBlur(); }}
                        /> No
                    </label>
                </div>
            );
        case 'MULTISELECT':
            // Simplest multiselect: JSON string or comma separated? 
            // We store string. Let's assume comma separated for now.
            return (
                <input
                    type="text"
                    value={value}
                    onChange={e => onChange(e.target.value)}
                    onBlur={onBlur}
                    className={`${baseClass} border`}
                    placeholder="Opcion 1, Opcion 2..."
                />
            );
        default:
            return null;
    }
}
