
'use client';

import { useState } from 'react';
import Papa from 'papaparse'; // Using raw import, assuming installed
import { Upload, FileUp, Save, AlertTriangle, CheckCircle, ArrowRight } from 'lucide-react';
import Link from 'next/link';

interface CSVRow {
    [key: string]: any;
}

export default function ProductImportPage() {
    const [file, setFile] = useState<File | null>(null);
    const [preview, setPreview] = useState<CSVRow[]>([]);
    const [headers, setHeaders] = useState<string[]>([]);
    const [mapping, setMapping] = useState({
        name: '',
        code: '',
        category: '',
        price: '',
        stock: ''
    });
    const [step, setStep] = useState<1 | 2 | 3>(1); // 1: Upload, 2: Map, 3: Review/Import
    const [importing, setImporting] = useState(false);
    const [result, setResult] = useState<any>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const f = e.target.files?.[0];
        if (f) {
            setFile(f);
            parseFile(f);
        }
    };

    const parseFile = (f: File) => {
        Papa.parse(f, {
            header: true,
            skipEmptyLines: true,
            preview: 5, // Only preview first 5 for mapping
            complete: (results: any) => {
                if (results.meta && results.meta.fields) {
                    setHeaders(results.meta.fields);
                    // Auto-guess mapping
                    const fields = results.meta.fields.map((h: string) => h.toLowerCase());
                    const newMap = { ...mapping };

                    results.meta.fields.forEach((h: string) => {
                        const low = h.toLowerCase();
                        if (low.includes('nom') || low.includes('prod') || low.includes('desc')) newMap.name = h;
                        if (low.includes('cod') || low.includes('sku')) newMap.code = h;
                        if (low.includes('cat') || low.includes('rubro')) newMap.category = h;
                        if (low.includes('prec') || low.includes('cost') || low.includes('venta')) newMap.price = h;
                        if (low.includes('stock') || low.includes('cant') || low.includes('exis')) newMap.stock = h;
                    });
                    setMapping(newMap);
                }
                setPreview(results.data);
                setStep(2);
            }
        });
    };

    const handleImport = async () => {
        if (!file) return;
        setImporting(true);

        Papa.parse(file, {
            header: true,
            skipEmptyLines: true,
            complete: async (results: any) => {
                const payload = results.data.map((row: any) => ({
                    name: row[mapping.name] || 'Sin Nombre',
                    code: row[mapping.code] || null,
                    category: row[mapping.category] || 'GENERAL',
                    price: parseFloat((row[mapping.price] || '0').replace('$', '').replace(',', '.')) || 0,
                    stock: parseInt(row[mapping.stock] || '0') || 0
                })).filter((p: any) => p.name && p.name !== 'Sin Nombre'); // Basic filter

                try {
                    const res = await fetch('/api/products/batch', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ products: payload })
                    });
                    const data = await res.json();
                    setResult(data);
                    setStep(3);
                } catch (e) {
                    console.error(e);
                    alert('Error al importar');
                } finally {
                    setImporting(false);
                }
            }
        });
    };

    return (
        <div className="p-6 max-w-4xl mx-auto">
            <div className="flex items-center gap-4 mb-8">
                <Link href="/admin/products" className="p-2 hover:bg-slate-100 rounded-full text-slate-500">
                    ← Volver
                </Link>
                <h1 className="text-2xl font-black text-slate-800">Importación Masiva de Productos</h1>
            </div>

            {/* Stepper */}
            <div className="flex items-center mb-8 text-sm font-bold text-slate-400">
                <div className={`flex items-center gap-2 ${step >= 1 ? 'text-blue-600' : ''}`}>
                    <span className="w-8 h-8 rounded-full border-2 flex items-center justify-center border-current">1</span>
                    Subir Archivo
                </div>
                <div className="w-12 h-0.5 bg-slate-200 mx-4" />
                <div className={`flex items-center gap-2 ${step >= 2 ? 'text-blue-600' : ''}`}>
                    <span className="w-8 h-8 rounded-full border-2 flex items-center justify-center border-current">2</span>
                    Mapear Columnas
                </div>
                <div className="w-12 h-0.5 bg-slate-200 mx-4" />
                <div className={`flex items-center gap-2 ${step >= 3 ? 'text-blue-600' : ''}`}>
                    <span className="w-8 h-8 rounded-full border-2 flex items-center justify-center border-current">3</span>
                    Resultado
                </div>
            </div>

            <div className="bg-white rounded-2xl shadow-lg border border-slate-100 p-8 min-h-[400px]">
                {step === 1 && (
                    <div className="h-full flex flex-col items-center justify-center py-12 border-2 border-dashed border-slate-200 rounded-xl bg-slate-50 hover:bg-slate-100 transition-colors cursor-pointer relative">
                        <input
                            type="file"
                            accept=".csv"
                            onChange={handleFileChange}
                            className="absolute inset-0 opacity-0 cursor-pointer"
                        />
                        <Upload className="w-16 h-16 text-slate-300 mb-4" />
                        <h3 className="text-xl font-bold text-slate-700">Arrastra tu archivo CSV aquí</h3>
                        <p className="text-slate-400 mt-2">o haz clic para seleccionar</p>
                        <p className="text-xs text-slate-400 mt-8 bg-white px-3 py-1 rounded-full border">Soporta .csv</p>
                    </div>
                )}

                {step === 2 && (
                    <div>
                        <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
                            <FileUp className="text-blue-500" />
                            Configura las columnas
                        </h3>

                        <div className="grid grid-cols-2 gap-8">
                            <div className="space-y-4">
                                <p className="text-sm text-slate-500 mb-4">Selecciona qué columna de tu archivo corresponde a cada dato:</p>

                                <div className="space-y-3">
                                    {[
                                        { key: 'name', label: 'Nombre del Producto *' },
                                        { key: 'code', label: 'Código / SKU' },
                                        { key: 'category', label: 'Categoría' },
                                        { key: 'price', label: 'Precio Total ($)' },
                                        { key: 'stock', label: 'Stock Inicial' },
                                    ].map(field => (
                                        <div key={field.key} className="flex flex-col">
                                            <label className="text-xs font-bold text-slate-600 mb-1">{field.label}</label>
                                            <select
                                                value={(mapping as any)[field.key]}
                                                onChange={e => setMapping({ ...mapping, [field.key]: e.target.value })}
                                                className="p-3 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 ring-blue-500 outline-none"
                                            >
                                                <option value="">-- Ignorar --</option>
                                                {headers.map(h => (
                                                    <option key={h} value={h}>{h}</option>
                                                ))}
                                            </select>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
                                <h4 className="font-bold text-slate-600 text-sm mb-3">Vista Previa (Primeras 5 filas)</h4>
                                <div className="overflow-x-auto text-xs">
                                    <table className="w-full text-left">
                                        <thead>
                                            <tr className="border-b border-slate-200">
                                                {headers.map(h => (
                                                    <th key={h} className="p-2 whitespace-nowrap text-slate-400 font-mono">{h}</th>
                                                ))}
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {preview.map((row, i) => (
                                                <tr key={i} className="border-b border-slate-100 last:border-0 hover:bg-white">
                                                    {headers.map(h => (
                                                        <td key={h} className="p-2 whitespace-nowrap text-slate-600">{row[h]}</td>
                                                    ))}
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>

                        <div className="mt-8 flex justify-end gap-3">
                            <button
                                onClick={() => { setStep(1); setFile(null); }}
                                className="px-6 py-3 font-bold text-slate-500 hover:bg-slate-100 rounded-xl"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleImport}
                                disabled={importing || !mapping.name || !mapping.price} // Validar minimos
                                className="px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-lg flex items-center gap-2 disabled:opacity-50"
                            >
                                {importing ? 'Importando...' : (
                                    <>
                                        Confirmar Importación <ArrowRight size={18} />
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                )}

                {step === 3 && result && (
                    <div className="flex flex-col items-center justify-center py-8 text-center">
                        <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-6">
                            <CheckCircle size={40} />
                        </div>
                        <h2 className="text-3xl font-black text-slate-800 mb-2">¡Importación Completada!</h2>
                        <p className="text-slate-500 text-lg mb-8">Se procesaron {result.summary?.total || 0} productos.</p>

                        <div className="grid grid-cols-2 gap-4 w-full max-w-md mb-8">
                            <div className="bg-emerald-50 p-4 rounded-xl border border-emerald-100">
                                <div className="text-2xl font-black text-emerald-600">{result.summary?.created || 0}</div>
                                <div className="text-sm font-bold text-emerald-800">Nuevos Creados</div>
                            </div>
                            <div className="bg-blue-50 p-4 rounded-xl border border-blue-100">
                                <div className="text-2xl font-black text-blue-600">{result.summary?.updated || 0}</div>
                                <div className="text-sm font-bold text-blue-800">Actualizados</div>
                            </div>
                        </div>

                        {result.summary?.errors?.length > 0 && (
                            <div className="bg-red-50 p-4 rounded-xl border border-red-100 w-full max-w-2xl mb-8 text-left">
                                <h4 className="font-bold text-red-800 flex items-center gap-2 mb-2">
                                    <AlertTriangle size={16} /> Errores detectados ({result.summary.errors.length})
                                </h4>
                                <ul className="text-xs text-red-700 max-h-32 overflow-y-auto list-disc list-inside">
                                    {result.summary.errors.map((e: string, i: number) => <li key={i}>{e}</li>)}
                                </ul>
                            </div>
                        )}

                        <div className="flex gap-4">
                            <button
                                onClick={() => { setStep(1); setFile(null); setMapping({ name: '', code: '', category: '', price: '', stock: '' }); }}
                                className="px-6 py-3 font-bold text-slate-500 hover:bg-slate-100 rounded-xl"
                            >
                                Importar Otro Archivo
                            </button>
                            <Link href="/admin/products" className="px-8 py-3 bg-slate-900 text-white font-bold rounded-xl shadow-lg hover:bg-black transition-colors">
                                Ver Catálogo
                            </Link>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
