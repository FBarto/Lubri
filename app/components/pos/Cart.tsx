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
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18" /><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" /><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" /></svg>
);

const ShoppingCartIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="8" cy="21" r="1" /><circle cx="19" cy="21" r="1" /><path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12" /></svg>
);

export default function Cart({ items, onUpdateQuantity, onUpdatePrice, onRemoveItem, onClearCart, onCheckout, restrictedMode, onRequestPriceEdit, onCancelSale, onShowDailyClose }: CartProps) {
    const total = items.reduce((sum, item) => sum + item.subtotal, 0);

    return (
        <div className="flex flex-col h-full bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden">
            {/* Header */}
            <div className="p-4 bg-slate-50 border-b border-slate-200 flex justify-between items-center shrink-0">
                <div className="flex items-center gap-2 text-slate-700">
                    <div className="p-2 bg-white rounded-lg border border-slate-200 shadow-sm">
                        <ShoppingCartIcon />
                    </div>
                    <span className="font-extrabold text-lg tracking-tight">Venta Actual</span>
                </div>
                <div className="flex gap-2">
                    {restrictedMode && onShowDailyClose && (
                        <button
                            onClick={onShowDailyClose}
                            className="text-xs font-bold text-slate-500 hover:text-slate-900 hover:bg-slate-200 px-3 py-1.5 rounded-lg transition-colors border border-transparent hover:border-slate-300 flex items-center gap-1"
                            title="Ver Cierre de Caja"
                        >
                            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                            </svg>
                            CIERRE
                        </button>
                    )}
                    {restrictedMode && items.length > 0 && onCancelSale && (
                        <button
                            onClick={onCancelSale}
                            className="text-xs font-bold text-slate-500 hover:text-red-600 hover:bg-red-50 px-3 py-1.5 rounded-lg transition-colors border border-transparent hover:border-red-100 flex items-center gap-1"
                            title="Cancelar venta (Requiere motivo)"
                        >
                            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                            CANCELAR
                        </button>
                    )}
                    {items.length > 0 && (
                        <button
                            onClick={onClearCart}
                            className="text-xs font-bold text-red-500 hover:text-red-700 hover:bg-red-50 px-3 py-1.5 rounded-lg transition-colors uppercase tracking-wider border border-transparent hover:border-red-100"
                        >
                            Vaciar
                        </button>
                    )}
                </div>
            </div>

            {/* Cart Items List */}
            <div className="flex-1 overflow-y-auto p-4 bg-slate-50/50">
                {items.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-slate-400 select-none">
                        <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4 text-slate-300">
                            <ShoppingCartIcon />
                        </div>
                        <p className="font-bold text-lg text-slate-500">Carrito Vacío</p>
                        <p className="text-sm">Escanea o selecciona items</p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {items.map((item) => (
                            <div key={item.uniqueId} className="bg-white p-3 rounded-xl border border-slate-200 shadow-sm group">
                                {/* Top Row: Name + Delete */}
                                <div className="flex justify-between items-start mb-2">
                                    <div className="flex-1 pr-2">
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className={`text-[0.6rem] font-black uppercase tracking-wider px-1.5 py-0.5 rounded ${item.type === 'SERVICE' ? 'bg-emerald-100 text-emerald-800' : 'bg-blue-100 text-blue-800'}`}>
                                                {item.type === 'SERVICE' ? 'SRV' : 'PRD'}
                                            </span>
                                            <h4 className="font-bold text-slate-800 text-sm leading-tight line-clamp-2">{item.name}</h4>
                                        </div>
                                        {(item.clientName || item.vehiclePlate) && (
                                            <div className="text-[0.65rem] font-mono text-slate-500 bg-slate-50 border border-slate-100 px-2 py-1 rounded inline-block">
                                                {item.vehiclePlate && <span className="font-bold text-slate-700 mr-2">{item.vehiclePlate}</span>}
                                                {item.clientName}
                                            </div>
                                        )}
                                    </div>
                                    <button
                                        onClick={() => onRemoveItem(item.uniqueId)}
                                        className="text-slate-300 hover:text-red-500 p-1.5 hover:bg-red-50 rounded-lg transition-all"
                                    >
                                        <TrashIcon />
                                    </button>
                                </div>

                                {/* Bottom Row: Controls */}
                                <div className="flex items-center justify-between gap-3 bg-slate-50 p-2 rounded-lg border border-slate-100/50">
                                    {/* Qty Controls */}
                                    <div className="flex items-center gap-1">
                                        <button
                                            className="w-7 h-7 flex items-center justify-center bg-white border border-slate-200 rounded-lg shadow-sm hover:border-slate-300 font-bold text-slate-600 transition-colors active:scale-95"
                                            onClick={() => onUpdateQuantity(item.uniqueId, Math.max(0, Number((item.quantity - 0.5).toFixed(2))))}
                                        >
                                            -
                                        </button>
                                        <input
                                            type="number"
                                            step="any"
                                            className="w-12 text-center bg-transparent font-bold text-slate-800 outline-none text-sm"
                                            value={item.quantity}
                                            onChange={(e) => onUpdateQuantity(item.uniqueId, parseFloat(e.target.value) || 0)}
                                        />
                                        <button
                                            className="w-7 h-7 flex items-center justify-center bg-white border border-slate-200 rounded-lg shadow-sm hover:border-slate-300 font-bold text-slate-600 transition-colors active:scale-95"
                                            onClick={() => onUpdateQuantity(item.uniqueId, Number((item.quantity + 0.5).toFixed(2)))}
                                        >
                                            +
                                        </button>
                                    </div>

                                    {/* Price Display/Input */}
                                    <div className="flex items-center justify-end min-w-[80px]">
                                        {restrictedMode ? (
                                            <button
                                                onClick={() => onRequestPriceEdit?.(item.uniqueId, item.price)}
                                                className="flex items-center gap-1 group/price hover:bg-slate-100 px-2 py-1 rounded transition-colors"
                                                title="Modificar precio (requiere motivo)"
                                            >
                                                <span className="text-slate-900 font-black text-sm">${item.price.toLocaleString()}</span>
                                                <svg className="w-3 h-3 text-slate-400 group-hover/price:text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                                                </svg>
                                            </button>
                                        ) : (
                                            <div className="flex items-center gap-1">
                                                <span className="text-slate-400 text-xs font-bold">$</span>
                                                <input
                                                    type="number"
                                                    className="w-20 text-right font-bold text-slate-800 bg-transparent border-b border-transparent hover:border-slate-300 focus:border-blue-500 outline-none p-0 transition-colors"
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

            {/* Footer */}
            <div className="p-4 bg-white border-t border-slate-200 shadow-[0_-4px_20px_rgba(0,0,0,0.05)] z-10 shrink-0">
                <div className="flex justify-between items-end mb-4">
                    <span className="text-slate-500 font-bold text-xs uppercase tracking-wider">Total</span>
                    <span className="text-3xl font-black text-slate-900 tracking-tighter">${total.toLocaleString()}</span>
                </div>

                <button
                    onClick={onCheckout}
                    disabled={items.length === 0}
                    className="w-full bg-slate-900 hover:bg-black text-white py-4 rounded-xl font-bold text-lg shadow-xl shadow-slate-900/10 active:scale-[0.98] transition-all disabled:opacity-50 disabled:grayscale disabled:shadow-none flex items-center justify-center gap-2"
                >
                    <span>COBRAR</span>
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                    </svg>
                </button>
            </div>
        </div>
    );
}
