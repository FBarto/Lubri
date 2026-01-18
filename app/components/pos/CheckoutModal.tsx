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
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-md p-4 animate-in fade-in duration-200">
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">

                {/* Header */}
                <div className="bg-slate-900 text-white p-6 flex justify-between items-center shrink-0">
                    <div>
                        <h2 className="text-2xl font-black tracking-tight">Caja y Cobro</h2>
                        <div className="flex items-center gap-2 mt-1 opacity-80">
                            <span className="text-xs font-bold bg-white/20 px-2 py-0.5 rounded">POS-01</span>
                            <span className="text-sm">Venta mostrador</span>
                        </div>
                    </div>
                    <div className="text-right">
                        <p className="text-xs opacity-60 uppercase font-bold tracking-widest mb-1">Total a Cubrir</p>
                        <p className="text-4xl font-black font-mono tracking-tighter">${total.toLocaleString()}</p>
                    </div>
                </div>

                {/* Body */}
                <div className="flex-1 overflow-y-auto p-8 bg-slate-50">

                    {/* Payment Input Area */}
                    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm mb-8">
                        <label className="block text-sm font-bold text-slate-500 mb-3 uppercase tracking-wider">Agregar Pago</label>

                        {/* Method Selector */}
                        <div className="grid grid-cols-3 gap-3 mb-4">
                            <button onClick={() => { setCurrentMethod('CASH'); setSelectedPlan(null); }} className={`flex flex-col items-center justify-center gap-2 py-4 rounded-xl border-2 transition-all ${currentMethod === 'CASH' ? 'border-blue-600 bg-blue-50 text-blue-700' : 'border-slate-100 bg-white text-slate-400 hover:border-slate-300'}`}>
                                <CashIcon />
                                <span className="font-bold text-sm">Efectivo</span>
                            </button>
                            <button onClick={() => setCurrentMethod('CARD')} className={`flex flex-col items-center justify-center gap-2 py-4 rounded-xl border-2 transition-all ${currentMethod === 'CARD' ? 'border-purple-600 bg-purple-50 text-purple-700' : 'border-slate-100 bg-white text-slate-400 hover:border-slate-300'}`}>
                                <CardIcon />
                                <span className="font-bold text-sm">Tarjeta</span>
                            </button>
                            <button onClick={() => { setCurrentMethod('TRANSFER'); setSelectedPlan(null); }} className={`flex flex-col items-center justify-center gap-2 py-4 rounded-xl border-2 transition-all ${currentMethod === 'TRANSFER' ? 'border-emerald-600 bg-emerald-50 text-emerald-700' : 'border-slate-100 bg-white text-slate-400 hover:border-slate-300'}`}>
                                <TransferIcon />
                                <span className="font-bold text-sm">Transf.</span>
                            </button>
                        </div>

                        {/* Installments Selector - Only for Card */}
                        {currentMethod === 'CARD' && (
                            <div className="mb-6 animate-in slide-in-from-top-2 duration-300">
                                <label className="block text-[0.65rem] font-black text-slate-400 uppercase tracking-[0.2em] mb-3">Planes de Financiación</label>
                                <div className="grid grid-cols-3 gap-2">
                                    {installmentPlans.map(plan => (
                                        <button
                                            key={plan.id}
                                            onClick={() => setSelectedPlan(plan.id.toString())}
                                            className={`py-2 px-3 rounded-lg border-2 text-xs font-black transition-all ${selectedPlan === plan.id.toString() ? 'border-purple-600 bg-purple-600 text-white shadow-lg shadow-purple-200' : 'border-slate-100 text-slate-400 hover:border-slate-200'}`}
                                        >
                                            {plan.name} (+{plan.interestRate}%)
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Amount Input */}
                        <div className="flex gap-4 items-end">
                            <div className="relative flex-1 group">
                                <span className="absolute left-4 bottom-4 text-slate-400 font-bold text-xl">$</span>
                                <input
                                    type="number"
                                    value={currentAmount}
                                    onChange={e => setCurrentAmount(e.target.value)}
                                    placeholder={`Base: ${remaining}`}
                                    className="w-full pl-8 pr-16 py-3 rounded-xl text-3xl font-black outline-none border-b-4 border-slate-200 focus:border-slate-900 bg-slate-50 focus:bg-white transition-all placeholder:text-slate-300"
                                    autoFocus
                                    onKeyDown={(e) => e.key === 'Enter' && addPayment()}
                                />
                                <button
                                    onClick={handleFillRemaining}
                                    className="absolute right-2 bottom-3 text-[0.65rem] bg-slate-200 hover:bg-slate-300 px-2 py-1 rounded font-bold text-slate-600 uppercase tracking-wide"
                                >
                                    Faltante
                                </button>
                            </div>
                            <button
                                onClick={addPayment}
                                disabled={!currentAmount || Number(currentAmount) <= 0 || (currentMethod === 'CARD' && !selectedPlan)}
                                className="h-[60px] px-8 bg-slate-900 text-white rounded-xl font-bold hover:bg-black active:scale-95 disabled:opacity-30 disabled:active:scale-100 transition-all flex items-center gap-2"
                            >
                                <span className="text-2xl">+</span>
                            </button>
                        </div>
                        {currentMethod === 'CARD' && selectedPlan && currentAmount && (
                            <p className="mt-3 text-xs font-bold text-purple-600 animate-pulse">
                                {(() => {
                                    const plan = installmentPlans.find(p => p.id.toString() === selectedPlan);
                                    if (!plan) return null;
                                    const base = parseFloat(currentAmount);
                                    const total = base * (1 + plan.interestRate / 100);
                                    const surcharge = total - base;
                                    return `Se cargarán $${total.toLocaleString()} final (+$${surcharge.toLocaleString()} recargo)`;
                                })()}
                            </p>
                        )}
                    </div>

                    {/* Payments List */}
                    <div>
                        <div className="flex justify-between items-end mb-3">
                            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Pagos Registrados</h4>
                            <span className="text-xs font-bold text-slate-400">
                                {payments.length} Pagos
                            </span>
                        </div>

                        <div className="space-y-3">
                            {payments.length === 0 && (
                                <div className="text-center py-8 border-2 border-dashed border-slate-200 rounded-xl">
                                    <p className="text-slate-400 font-medium">Aún no se han registrado pagos</p>
                                </div>
                            )}

                            {payments.map(p => (
                                <div key={p.id} className="flex justify-between items-center bg-white border border-slate-100 p-4 rounded-xl shadow-sm animate-in slide-in-from-bottom-2">
                                    <div className="flex items-center gap-4">
                                        <div className={`p-2 rounded-lg ${p.method === 'CASH' ? 'bg-blue-100 text-blue-600' : p.method === 'CARD' ? 'bg-purple-100 text-purple-600' : 'bg-emerald-100 text-emerald-600'}`}>
                                            {p.method === 'CASH' && <CashIcon />}
                                            {p.method === 'CARD' && <CardIcon />}
                                            {p.method === 'TRANSFER' && <TransferIcon />}
                                        </div>
                                        <div>
                                            <p className="font-bold text-slate-800 text-lg">${p.amount.toLocaleString()}</p>
                                            <p className="text-[0.6rem] font-black text-slate-400 uppercase">
                                                {p.method === 'CASH' ? 'Efectivo' : p.method === 'CARD' ? 'Tarjeta' : 'Transferencia'}
                                                {(p as any).surcharge && ` • ${(p as any).surcharge.plan} (+${(p as any).surcharge.interestRate}%)`}
                                            </p>
                                        </div>
                                    </div>
                                    <button onClick={() => removePayment(p.id)} className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18" /><path d="m6 6 12 12" /></svg>
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="p-6 bg-white border-t border-slate-100 flex justify-between items-center shrink-0 z-10 relative shadow-[0_-10px_40px_rgba(0,0,0,0.05)]">
                    <div>
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Restante</p>
                        <p className={`text-3xl font-black font-mono ${remaining > 0 ? 'text-red-500' : 'text-emerald-500'}`}>
                            ${remaining.toLocaleString()}
                        </p>
                    </div>

                    <div className="flex gap-4">
                        <button onClick={onClose} className="px-6 py-4 rounded-xl font-bold text-slate-500 hover:bg-slate-100 transition-colors">
                            Volver
                        </button>
                        <button
                            onClick={() => onConfirm(payments)}
                            className={`px-10 py-4 rounded-xl font-bold text-white shadow-xl active:scale-95 transition-all flex items-center gap-2 ${isFullyPaid
                                    ? 'bg-slate-900 hover:bg-emerald-600 hover:shadow-emerald-500/30'
                                    : 'bg-amber-500 hover:bg-amber-600 text-white shadow-amber-500/30'
                                }`}
                        >
                            {isFullyPaid ? (
                                <>
                                    <span>CONFIRMAR</span>
                                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5" /></svg>
                                </>
                            ) : (
                                <>
                                    <span>DEJAR SALDO</span>
                                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M12 9v4" /><path d="M12 17h.01" /></svg>
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
