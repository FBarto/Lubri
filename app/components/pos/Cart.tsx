'use client';

// Interfaces
interface CartItem {
    id: number;
    uniqueId: string;
    name: string;
    type: 'PRODUCT' | 'SERVICE';
    price: number;
    quantity: number;
    subtotal: number;
    clientName?: string;
    vehiclePlate?: string;
    notes?: string;
    priceReason?: string;
}

interface CartProps {
    items: CartItem[];
    onUpdateQuantity: (uniqueId: string, quantity: number) => void;
    onUpdatePrice: (uniqueId: string, price: number) => void;
    onRemoveItem: (uniqueId: string) => void;
    onClearCart: () => void;
    onCheckout: () => void;
    restrictedMode?: boolean;
    onRequestPriceEdit?: (uniqueId: string, currentPrice: number) => void;
    onCancelSale?: () => void;
    onShowDailyClose?: () => void;
}

// Icons
const TrashIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18" /><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" /><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" /></svg>
);

const ShoppingCartIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><circle cx="8" cy="21" r="1" /><circle cx="19" cy="21" r="1" /><path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12" /></svg>
);

export default function Cart({ items, onUpdateQuantity, onUpdatePrice, onRemoveItem, onClearCart, onCheckout, restrictedMode, onRequestPriceEdit, onCancelSale, onShowDailyClose }: CartProps) {
    const total = items.reduce((sum, item) => sum + item.subtotal, 0);

    return (
        <div className="flex flex-col h-full bg-slate-100 rounded-[2.5rem] shadow-2xl border border-slate-200 overflow-hidden">
            {/* Header - Dark & Aggressive */}
            <div className="p-8 bg-neutral-900 border-b border-white/5 flex justify-between items-center shrink-0 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-red-600/10 blur-[60px] rounded-full translate-x-1/2 -translate-y-1/2"></div>

                <div className="flex items-center gap-3 relative z-10">
                    <div className="p-3 bg-red-600 rounded-[1.2rem] text-white shadow-lg shadow-red-900/40">
                        <ShoppingCartIcon />
                    </div>
                    <div>
                        <span className="block text-[10px] font-black text-red-500 uppercase tracking-[0.2em] leading-none mb-1">Session Active</span>
                        <span className="font-black text-2xl tracking-tighter text-white italic uppercase italic">Venta <span className="text-red-600">Actual</span></span>
                    </div>
                </div>

                <div className="flex gap-3 relative z-10">
                    {restrictedMode && onShowDailyClose && (
                        <button
                            onClick={onShowDailyClose}
                            className="bg-white/5 hover:bg-white/10 border border-white/10 p-3 rounded-2xl text-slate-400 hover:text-white transition-all group"
                            title="Ver Cierre de Caja"
                        >
                            <svg className="w-5 h-5 group-hover:scale-110 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                            </svg>
                        </button>
                    )}
                    {restrictedMode && items.length > 0 && onCancelSale && (
                        <button
                            onClick={onCancelSale}
                            className="bg-rose-600/10 hover:bg-rose-600 border border-rose-600/20 p-3 rounded-2xl text-rose-500 hover:text-white transition-all group"
                            title="Abortar Misión (Requiere motivo)"
                        >
                            <svg className="w-5 h-5 group-hover:rotate-12 transition-all" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    )}
                </div>
            </div>

            {/* Cart Items List - Glass Cards Area */}
            <div className="flex-1 overflow-y-auto p-6 bg-[#f8fafc] custom-scrollbar">
                {items.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-slate-300 select-none grayscale opacity-30 italic">
                        <div className="w-24 h-24 bg-slate-200/50 rounded-full flex items-center justify-center mb-6 border-4 border-dashed border-slate-300">
                            <ShoppingCartIcon />
                        </div>
                        <p className="font-black text-2xl uppercase tracking-tighter">Ready for Input</p>
                        <p className="text-sm font-bold uppercase tracking-widest mt-2">Standby mode...</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        <div className="flex justify-between items-center px-2 mb-2">
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{items.length} Items registrados</span>
                            <button
                                onClick={onClearCart}
                                className="text-[10px] font-black text-red-500 hover:text-red-700 uppercase tracking-widest border-b-2 border-red-500/20 hover:border-red-500 transition-all"
                            >
                                Vaciar Carrito
                            </button>
                        </div>

                        {items.map((item) => (
                            <div key={item.uniqueId} className="glass p-5 rounded-[2rem] border-white/60 shadow-sm group relative overflow-hidden transition-all hover:shadow-xl hover:-translate-y-1">
                                {/* Left indicator */}
                                <div className={`absolute left-0 top-1/4 bottom-1/4 w-1.5 rounded-r-full ${item.type === 'SERVICE' ? 'bg-emerald-500' : 'bg-red-600'} opacity-40 group-hover:opacity-100 transition-opacity`}></div>

                                <div className="flex justify-between items-start mb-4 relative z-10">
                                    <div className="flex-1 pr-6">
                                        <div className="flex items-center gap-2 mb-2">
                                            <span className={`text-[9px] font-black uppercase tracking-[0.2em] px-2 py-0.5 rounded-full border ${item.type === 'SERVICE' ? 'bg-emerald-50 text-emerald-600 border-emerald-200' : 'bg-red-50 text-red-600 border-red-200'}`}>
                                                {item.type === 'SERVICE' ? 'Service' : 'Product'}
                                            </span>
                                            {item.vehiclePlate && (
                                                <span className="text-[10px] font-black text-slate-900 bg-white px-2 py-0.5 rounded-full border border-slate-200 shadow-sm uppercase italic">
                                                    {item.vehiclePlate}
                                                </span>
                                            )}
                                        </div>
                                        <h4 className="font-black text-slate-900 text-lg leading-[1.1] tracking-tight group-hover:text-red-600 transition-colors uppercase italic">{item.name}</h4>
                                        {item.clientName && (
                                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1 italic">Client: {item.clientName}</p>
                                        )}
                                    </div>
                                    <button
                                        onClick={() => onRemoveItem(item.uniqueId)}
                                        className="text-slate-300 hover:text-red-600 p-2 hover:bg-red-50 rounded-2xl transition-all active:scale-90"
                                    >
                                        <TrashIcon />
                                    </button>
                                </div>

                                <div className="flex items-center justify-between gap-4 bg-white/50 backdrop-blur-sm p-3 rounded-2xl border border-white/40 relative z-10">
                                    <div className="flex items-center gap-1">
                                        <button
                                            className="w-10 h-10 flex items-center justify-center bg-white border border-slate-200 rounded-[1rem] shadow-sm hover:border-red-500 hover:text-red-600 font-black transition-all active:scale-90"
                                            onClick={() => onUpdateQuantity(item.uniqueId, Math.max(0, Number((item.quantity - 0.5).toFixed(2))))}
                                        >
                                            <span className="text-xl leading-none">-</span>
                                        </button>
                                        <div className="px-4 text-center">
                                            <input
                                                type="number"
                                                step="any"
                                                className="w-14 text-center bg-transparent font-black text-slate-900 outline-none text-xl tracking-tighter"
                                                value={item.quantity}
                                                onChange={(e) => onUpdateQuantity(item.uniqueId, parseFloat(e.target.value) || 0)}
                                            />
                                            <div className="text-[8px] font-black text-slate-400 uppercase tracking-widest leading-none mt-1">Qty</div>
                                        </div>
                                        <button
                                            className="w-10 h-10 flex items-center justify-center bg-white border border-slate-200 rounded-[1rem] shadow-sm hover:border-emerald-500 hover:text-emerald-600 font-black transition-all active:scale-90"
                                            onClick={() => onUpdateQuantity(item.uniqueId, Number((item.quantity + 0.5).toFixed(2)))}
                                        >
                                            <span className="text-xl leading-none">+</span>
                                        </button>
                                    </div>

                                    <div className="text-right">
                                        <div className="text-[8px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Unit Price</div>
                                        {restrictedMode ? (
                                            <button
                                                onClick={() => onRequestPriceEdit?.(item.uniqueId, item.price)}
                                                className="flex items-center justify-end gap-1 group/price hover:scale-105 transition-transform origin-right"
                                            >
                                                <span className="text-slate-900 font-black text-xl tracking-tighter">${item.price.toLocaleString()}</span>
                                                <svg className="w-3 h-3 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                                                </svg>
                                            </button>
                                        ) : (
                                            <div className="flex items-center justify-end">
                                                <span className="text-red-600 font-black text-lg mr-1">$</span>
                                                <input
                                                    type="number"
                                                    className="w-24 text-right font-black text-slate-900 bg-transparent border-b-2 border-transparent focus:border-red-500 outline-none p-0 transition-all text-xl tracking-tighter"
                                                    value={item.price}
                                                    onChange={(e) => onUpdatePrice(item.uniqueId, Number(e.target.value))}
                                                />
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Footer - Aggressive Summary */}
            <div className="p-8 bg-white border-t border-slate-200 shadow-[0_-20px_40px_rgba(0,0,0,0.04)] z-10 shrink-0 relative overflow-hidden">
                <div className="absolute bottom-0 right-0 w-64 h-64 bg-slate-50 rounded-full translate-x-1/2 translate-y-1/2 -z-10"></div>

                <div className="flex justify-between items-end mb-8 relative">
                    <div>
                        <span className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-1">Total a Liquidar</span>
                        <div className="flex items-start">
                            <span className="text-xl font-black text-red-600 mr-1 mt-1">$</span>
                            <span className="text-5xl font-black text-slate-900 tracking-tighter italic">{total.toLocaleString()}</span>
                        </div>
                    </div>
                    <div className="text-right">
                        <span className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">Efficiency Status</span>
                        <span className="text-emerald-500 font-black text-sm uppercase tracking-tighter">Optimal Flow</span>
                    </div>
                </div>

                <button
                    onClick={onCheckout}
                    disabled={items.length === 0}
                    className="w-full bg-neutral-900 hover:bg-red-600 text-white py-6 rounded-[2rem] font-black text-xl italic uppercase tracking-widest shadow-2xl shadow-neutral-900/20 active:scale-[0.97] transition-all disabled:opacity-20 disabled:grayscale disabled:shadow-none flex items-center justify-center gap-4 group relative overflow-hidden"
                >
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
                    <span className="relative z-10">{restrictedMode ? 'Mandar a Caja' : 'Finalizar Venta'}</span>
                    <svg className="w-6 h-6 relative z-10 group-hover:translate-x-2 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={4}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                </button>
            </div>
        </div>
    );
}
