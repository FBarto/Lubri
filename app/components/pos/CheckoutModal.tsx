'use client';

import { useState, useEffect } from 'react';

interface CheckoutModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (paymentData: any) => void;
    total: number;
}

interface Payment {
    id: string;
    method: 'CASH' | 'CARD' | 'TRANSFER' | 'OTHER';
    amount: number;
}

const CashIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="12" x="2" y="6" rx="2" /><circle cx="12" cy="12" r="2" /><path d="M6 12h.01M18 12h.01" /></svg>;
const CardIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="14" x="2" y="5" rx="2" /><line x1="2" y1="10" x2="22" y2="10" /></svg>;
const TransferIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m16 6 4 14" /><path d="M12 6v14" /><path d="M8 8v12" /><path d="M4 4v16" /></svg>;

export default function CheckoutModal({
    isOpen,
    onClose,
    onConfirm,
    total
}: CheckoutModalProps) {
    const [currentMethod, setCurrentMethod] = useState<'CASH' | 'CARD' | 'TRANSFER'>('CASH');
    const [currentAmount, setCurrentAmount] = useState('');
    const [payments, setPayments] = useState<Payment[]>([]);
    const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
    const [installmentPlans, setInstallmentPlans] = useState<any[]>([]);

    const paidAmount = payments.reduce((sum, p) => sum + p.amount, 0);
    const remaining = Math.max(0, total - paidAmount);

    useEffect(() => {
        if (isOpen) {
            // Fetch plans when modal opens
            fetch('/api/config/payment-plans')
                .then(res => res.json())
                .then(data => setInstallmentPlans(data))
                .catch(err => console.error("Failed to fetch plans", err));

            if (remaining > 0 && currentAmount === '') {
                setCurrentAmount(remaining.toFixed(2));
            }
        }
    }, [isOpen, remaining, currentAmount]);

    const addPayment = () => {
        const baseVal = parseFloat(currentAmount);
        if (!baseVal || baseVal <= 0) return;

        let finalAmount = baseVal;
        let surchargeInfo = null;

        if (currentMethod === 'CARD' && selectedPlan) {
            const plan = installmentPlans.find(p => p.id.toString() === selectedPlan);
            if (plan) {
                const factor = 1 + (plan.interestRate / 100);
                finalAmount = baseVal * factor;
                surchargeInfo = {
                    plan: plan.name,
                    interestRate: plan.interestRate,
                    surchargeAmount: finalAmount - baseVal
                };
            }
        }

        setPayments([...payments, {
            id: Math.random().toString(),
            method: currentMethod,
            amount: finalAmount,
            baseAmount: baseVal, // Important to track original price
            surcharge: surchargeInfo
        } as any]);

        setCurrentAmount('');
        if (currentMethod !== 'CARD') setSelectedPlan(null);
    };

    const removePayment = (id: string) => {
        setPayments(payments.filter(p => p.id !== id));
    };

    const handleFillRemaining = () => {
        setCurrentAmount(remaining.toFixed(2));
    };

    const isFullyPaid = remaining <= 0.01; // Tolerance for float

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-300">
            <div className="bg-slate-100 rounded-[3rem] shadow-[0_32px_64px_-12px_rgba(0,0,0,0.5)] w-full max-w-2xl overflow-hidden flex flex-col max-h-[95vh] border border-white/20">

                {/* Header - Aggressive Checkout */}
                <div className="bg-neutral-900 text-white p-10 flex justify-between items-end shrink-0 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 blur-[100px] rounded-full translate-x-1/2 -translate-y-1/2"></div>

                    <div className="relative z-10">
                        <span className="block text-[10px] font-black text-emerald-500 uppercase tracking-[0.4em] leading-none mb-2">Checkout Protocol</span>
                        <h2 className="text-4xl font-black italic uppercase tracking-tighter italic">Caja <span className="text-emerald-500">& Cobro</span></h2>
                        <div className="flex items-center gap-2 mt-4">
                            <span className="text-[10px] font-black bg-white/10 px-3 py-1 rounded-full border border-white/5 uppercase tracking-widest italic text-slate-400">POS-TERMINAL-01</span>
                        </div>
                    </div>

                    <div className="text-right relative z-10">
                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 italic">Importe Total</p>
                        <div className="flex items-start justify-end">
                            <span className="text-xl font-black text-emerald-500 mr-1 mt-1">$</span>
                            <span className="text-6xl font-black font-mono tracking-tighter italic leading-none">${total.toLocaleString()}</span>
                        </div>
                    </div>
                </div>

                {/* Body - High Contrast */}
                <div className="flex-1 overflow-y-auto p-8 bg-slate-50 custom-scrollbar">

                    {/* Payment Input Area - Glass Card */}
                    <div className="glass p-8 rounded-[2.5rem] border-white shadow-sm mb-10 relative overflow-hidden group">
                        <div className="absolute top-0 left-0 w-full h-1/2 bg-gradient-to-b from-white/40 to-transparent pointer-events-none"></div>

                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-6 italic ml-2">Seleccionar Método de Pago</label>

                        {/* Method Selector - Premium Buttons */}
                        <div className="grid grid-cols-3 gap-4 mb-8">
                            <button
                                onClick={() => { setCurrentMethod('CASH'); setSelectedPlan(null); }}
                                className={`flex flex-col items-center justify-center gap-3 py-6 rounded-[1.5rem] border-2 transition-all active:scale-95 ${currentMethod === 'CASH' ? 'border-emerald-600 bg-white text-emerald-600 shadow-xl shadow-emerald-500/10' : 'border-slate-100 bg-slate-50 text-slate-400 hover:border-slate-200'}`}
                            >
                                <div className={`p-3 rounded-2xl ${currentMethod === 'CASH' ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-900/40' : 'bg-white'}`}>
                                    <CashIcon />
                                </div>
                                <span className="font-black text-xs uppercase tracking-widest italic">Efectivo</span>
                            </button>
                            <button
                                onClick={() => setCurrentMethod('CARD')}
                                className={`flex flex-col items-center justify-center gap-3 py-6 rounded-[1.5rem] border-2 transition-all active:scale-95 ${currentMethod === 'CARD' ? 'border-purple-600 bg-white text-purple-600 shadow-xl shadow-purple-500/10' : 'border-slate-100 bg-slate-50 text-slate-400 hover:border-slate-200'}`}
                            >
                                <div className={`p-3 rounded-2xl ${currentMethod === 'CARD' ? 'bg-purple-600 text-white shadow-lg shadow-purple-900/40' : 'bg-white'}`}>
                                    <CardIcon />
                                </div>
                                <span className="font-black text-xs uppercase tracking-widest italic">Tarjeta</span>
                            </button>
                            <button
                                onClick={() => { setCurrentMethod('TRANSFER'); setSelectedPlan(null); }}
                                className={`flex flex-col items-center justify-center gap-3 py-6 rounded-[1.5rem] border-2 transition-all active:scale-95 ${currentMethod === 'TRANSFER' ? 'border-blue-600 bg-white text-blue-600 shadow-xl shadow-blue-500/10' : 'border-slate-100 bg-slate-50 text-slate-400 hover:border-slate-200'}`}
                            >
                                <div className={`p-3 rounded-2xl ${currentMethod === 'TRANSFER' ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/40' : 'bg-white'}`}>
                                    <TransferIcon />
                                </div>
                                <span className="font-black text-xs uppercase tracking-widest italic">Transf.</span>
                            </button>
                        </div>

                        {/* Installments Selector - Only for Card */}
                        {currentMethod === 'CARD' && (
                            <div className="mb-8 p-6 bg-slate-50/50 rounded-[1.5rem] border border-slate-100 animate-in slide-in-from-top-4 duration-500">
                                <label className="block text-[8px] font-black text-slate-400 uppercase tracking-[0.3em] mb-4 text-center">Protocolo de Financiación</label>
                                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                                    {installmentPlans.map(plan => (
                                        <button
                                            key={plan.id}
                                            onClick={() => setSelectedPlan(plan.id.toString())}
                                            className={`py-3 px-2 rounded-xl border-2 text-[10px] font-black transition-all active:scale-95 ${selectedPlan === plan.id.toString() ? 'border-purple-600 bg-purple-600 text-white shadow-lg shadow-purple-900/20 italic' : 'border-white bg-white text-slate-400 hover:border-slate-200'}`}
                                        >
                                            {plan.name} <span className="opacity-50">(+{plan.interestRate}%)</span>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Amount Input - Aggressive */}
                        <div className="flex gap-4 items-end relative">
                            <div className="relative flex-1 group/input">
                                <span className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300 font-black text-2xl group-focus-within/input:text-emerald-500 transition-colors">$</span>
                                <input
                                    type="number"
                                    value={currentAmount}
                                    onChange={e => setCurrentAmount(e.target.value)}
                                    placeholder={`Base: ${remaining}`}
                                    className="w-full pl-12 pr-16 py-6 rounded-[1.5rem] text-4xl font-black outline-none border-2 border-slate-100 focus:border-neutral-900 bg-white transition-all shadow-inner tracking-tighter italic"
                                    autoFocus
                                    onKeyDown={(e) => e.key === 'Enter' && addPayment()}
                                />
                                <button
                                    onClick={handleFillRemaining}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] bg-slate-100 hover:bg-neutral-900 hover:text-white px-3 py-1.5 rounded-full font-black uppercase tracking-widest transition-all"
                                >
                                    Faltante
                                </button>
                            </div>
                            <button
                                onClick={addPayment}
                                disabled={!currentAmount || Number(currentAmount) <= 0 || (currentMethod === 'CARD' && !selectedPlan)}
                                className="h-[80px] px-10 bg-neutral-900 text-white rounded-[1.5rem] font-black hover:bg-red-600 active:scale-95 disabled:opacity-10 disabled:grayscale transition-all flex items-center shadow-2xl hover:shadow-red-600/20"
                            >
                                <span className="text-3xl font-black">+</span>
                            </button>
                        </div>

                        {currentMethod === 'CARD' && selectedPlan && currentAmount && (
                            <div className="mt-4 p-4 bg-purple-50 rounded-2xl border border-purple-100 animate-pulse">
                                <p className="text-[10px] font-black text-purple-600 uppercase tracking-widest text-center">
                                    {(() => {
                                        const plan = installmentPlans.find(p => p.id.toString() === selectedPlan);
                                        if (!plan) return null;
                                        const base = parseFloat(currentAmount);
                                        const plusInterest = base * (1 + plan.interestRate / 100);
                                        const surcharge = plusInterest - base;
                                        return `Recargo de financiación: +$${surcharge.toLocaleString()} final`;
                                    })()}
                                </p>
                            </div>
                        )}
                    </div>

                    {/* Payments List - Premium Cards */}
                    <div>
                        <div className="flex justify-between items-center px-4 mb-6">
                            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] italic">Pagos Validados</h4>
                            <div className="h-[1px] flex-1 mx-6 bg-slate-200/50"></div>
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                {payments.length} Registros
                            </span>
                        </div>

                        <div className="space-y-4">
                            {payments.length === 0 && (
                                <div className="text-center py-12 border-4 border-dashed border-slate-100 rounded-[2.5rem] grayscale opacity-30 italic">
                                    <p className="text-slate-400 font-black text-lg uppercase tracking-tighter">Esperando entrada de datos...</p>
                                </div>
                            )}

                            {payments.map(p => (
                                <div key={p.id} className="flex justify-between items-center bg-white border border-slate-100 p-6 rounded-[1.8rem] shadow-sm animate-in zoom-in-95 duration-300 relative overflow-hidden group/pay">
                                    <div className={`absolute left-0 top-0 bottom-0 w-2 ${p.method === 'CASH' ? 'bg-emerald-500' : p.method === 'CARD' ? 'bg-purple-500' : 'bg-blue-500'} opacity-40 group-hover/pay:opacity-100 transition-opacity`}></div>

                                    <div className="flex items-center gap-6 relative z-10">
                                        <div className={`p-3 rounded-2xl ${p.method === 'CASH' ? 'bg-emerald-50 text-emerald-600' : p.method === 'CARD' ? 'bg-purple-50 text-purple-600' : 'bg-blue-50 text-blue-600'}`}>
                                            {p.method === 'CASH' && <CashIcon />}
                                            {p.method === 'CARD' && <CardIcon />}
                                            {p.method === 'TRANSFER' && <TransferIcon />}
                                        </div>
                                        <div>
                                            <div className="flex items-baseline gap-2">
                                                <span className="text-sm font-black text-slate-400">$</span>
                                                <p className="font-black text-slate-900 text-3xl tracking-tighter italic leading-none">${p.amount.toLocaleString()}</p>
                                            </div>
                                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] mt-1">
                                                {p.method === 'CASH' ? 'Valid Cash' : p.method === 'CARD' ? 'Digital Card' : 'Bank Transfer'}
                                                {(p as any).surcharge && ` // ${(p as any).surcharge.plan} (+${(p as any).surcharge.interestRate}%)`}
                                            </p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => removePayment(p.id)}
                                        className="p-3 text-slate-200 hover:text-red-600 hover:bg-red-50 rounded-2xl transition-all active:scale-90"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18" /><path d="m6 6 12 12" /></svg>
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Footer - Final Call to Action */}
                <div className="p-10 bg-white border-t border-slate-100 flex justify-between items-center shrink-0 z-20 relative shadow-[0_-20px_40px_rgba(0,0,0,0.05)]">
                    <div className="absolute bottom-0 right-0 w-64 h-64 bg-slate-50 rounded-full translate-x-1/2 translate-y-1/2 -z-10"></div>

                    <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] mb-2 italic">Balance Pendiente</p>
                        <div className="flex items-start">
                            <span className={`text-xl font-black mr-1 mt-1 ${remaining > 0.01 ? 'text-red-500' : 'text-emerald-500'}`}>$</span>
                            <p className={`text-5xl font-black font-mono tracking-tighter italic leading-none ${remaining > 0.01 ? 'text-red-500' : 'text-emerald-500'}`}>
                                ${remaining.toLocaleString()}
                            </p>
                        </div>
                    </div>

                    <div className="flex gap-6">
                        <button
                            onClick={onClose}
                            className="px-8 py-5 rounded-2xl font-black text-slate-400 hover:text-neutral-900 uppercase tracking-widest text-[10px] italic hover:bg-slate-50 transition-all"
                        >
                            Abortar
                        </button>
                        <button
                            onClick={() => onConfirm(payments)}
                            className={`px-12 py-5 rounded-[2.5rem] font-black text-white shadow-2xl active:scale-[0.97] transition-all flex items-center gap-4 uppercase italic tracking-widest text-lg group relative overflow-hidden ${isFullyPaid
                                ? 'bg-neutral-900 hover:bg-emerald-600 hover:shadow-emerald-600/30'
                                : 'bg-amber-500 hover:bg-amber-600 shadow-amber-500/30'
                                }`}
                        >
                            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
                            {isFullyPaid ? (
                                <>
                                    <span>Ejecutar Cobro</span>
                                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" className="group-hover:scale-125 transition-transform"><path d="M20 6 9 17l-5-5" /></svg>
                                </>
                            ) : (
                                <>
                                    <span>Guardar Saldo</span>
                                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" className="group-hover:translate-y-1 transition-transform"><path d="M12 9v4" /><path d="M12 17h.01" /></svg>
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
