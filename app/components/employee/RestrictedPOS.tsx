'use client';

import { useState, useEffect } from 'react';
import ItemsGrid from '@/app/components/pos/ItemsGrid';
import Cart from '@/app/components/pos/Cart';
import ServiceModal from '@/app/components/pos/ServiceModal';
import SmartSuggestions from '@/app/components/pos/SmartSuggestions';
import CheckoutModal from '@/app/components/pos/CheckoutModal';
import PriceReasonModal from './PriceReasonModal';
import CancellationModal from './CancellationModal';
import DailyCloseModal from '@/app/components/pos/DailyCloseModal';
import StockAlertModal from './StockAlertModal';
import { useSession } from 'next-auth/react';

interface RestrictedPOSProps {
    cart: any[];
    setCart: React.Dispatch<React.SetStateAction<any[]>>;
    initialClient?: any;
}

export default function RestrictedPOS({ cart, setCart, initialClient }: RestrictedPOSProps) {
    const { data: session } = useSession();
    const [products, setProducts] = useState<any[]>([]);
    const [services, setServices] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    // Local cart removed in favor of props

    // Modals
    const [isServiceModalOpen, setIsServiceModalOpen] = useState(false);
    const [selectedServiceForModal, setSelectedServiceForModal] = useState<any>(null);
    const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
    const [isPriceModalOpen, setIsPriceModalOpen] = useState(false);
    const [isCancellationModalOpen, setIsCancellationModalOpen] = useState(false);
    const [isDailyCloseOpen, setIsDailyCloseOpen] = useState(false);
    const [priceEditTargetId, setPriceEditTargetId] = useState<string | null>(null);
    const [priceEditCurrentPrice, setPriceEditCurrentPrice] = useState(0);

    const [isStockModalOpen, setIsStockModalOpen] = useState(false);
    const [pendingStockAction, setPendingStockAction] = useState<{
        type: 'ADD' | 'UPDATE',
        item: any,
        quantity?: number,
        uniqueId?: string
    } | null>(null);

    useEffect(() => {
        async function fetchData() {
            try {
                const [prodRes, servRes] = await Promise.all([
                    fetch('/api/products?limit=1000'),
                    fetch('/api/services')
                ]);
                const prodData = await prodRes.json();
                const servData = await servRes.json();

                // Safely extract product array from paginated response
                const productsArray = Array.isArray(prodData) ? prodData : (prodData.data || []);
                const normProds = productsArray.map((p: any) => ({ ...p, type: 'PRODUCT' }));
                const normServs = servData.map((s: any) => ({ ...s, type: 'SERVICE' }));

                setProducts(normProds);
                setServices(normServs);
            } catch (e) {
                console.error(e);
            } finally {
                setLoading(false);
            }
        }
        fetchData();
    }, []);

    const handleAddItem = (item: any) => {
        if (item.type === 'SERVICE') {
            setSelectedServiceForModal(item);
            setIsServiceModalOpen(true);
        } else {
            addToCart(item);
        }
    };

    const addToCart = (item: any, serviceData: any = {}, force: boolean = false) => {
        const existing = cart.find(i => i.id === item.id && i.type === item.type && item.type === 'PRODUCT');

        // Stock Check
        if (!force && item.type === 'PRODUCT') {
            const currentQty = existing ? existing.quantity : 0;
            const newQty = currentQty + 1;
            if (item.stock !== undefined && newQty > item.stock) {
                setPendingStockAction({ type: 'ADD', item, quantity: newQty });
                setIsStockModalOpen(true);
                return;
            }
        }

        setCart(prev => {
            const existingInPrev = prev.find(i => i.id === item.id && i.type === item.type && item.type === 'PRODUCT');
            if (existingInPrev) {
                return prev.map(i => i.uniqueId === existingInPrev.uniqueId ? { ...i, quantity: i.quantity + 1, subtotal: (i.quantity + 1) * i.price } : i);
            }
            return [...prev, {
                ...item,
                uniqueId: Math.random().toString(36).substr(2, 9),
                quantity: 1,
                subtotal: item.price,
                clientId: item.clientId || initialClient?.id, // Auto-link client
                ...serviceData
            }];
        });
    }

    const handleConfirmStockAction = () => {
        if (!pendingStockAction) return;

        if (pendingStockAction.type === 'ADD') {
            addToCart(pendingStockAction.item, {}, true);
        } else if (pendingStockAction.type === 'UPDATE') {
            handleUpdateQuantity(pendingStockAction.uniqueId!, pendingStockAction.quantity!, true);
        }

        setIsStockModalOpen(false);
        setPendingStockAction(null);
    };

    const handleServiceConfirm = (data: any) => {
        addToCart(selectedServiceForModal, data);
    };

    const handleUpdateQuantity = (uniqueId: string, q: number, force: boolean = false) => {
        const item = cart.find(i => i.uniqueId === uniqueId);
        if (!item) return;

        if (!force && item.type === 'PRODUCT' && item.stock !== undefined && q > item.stock && q > item.quantity) {
            setPendingStockAction({ type: 'UPDATE', item, quantity: q, uniqueId });
            setIsStockModalOpen(true);
            return;
        }

        setCart(prev => prev.map(i => i.uniqueId === uniqueId ? { ...i, quantity: q, subtotal: q * i.price } : i));
    };

    // Restricted Price Update Handler
    const handleRequestPriceEdit = (uniqueId: string, currentPrice: number) => {
        setPriceEditTargetId(uniqueId);
        setPriceEditCurrentPrice(currentPrice);
        setIsPriceModalOpen(true);
    };

    const confirmPriceEdit = (newPrice: number, reason: string) => {
        if (!priceEditTargetId) return;
        setCart(prev => prev.map(item => {
            if (item.uniqueId === priceEditTargetId) {
                return {
                    ...item,
                    price: newPrice,
                    subtotal: item.quantity * newPrice,
                    priceReason: reason // Capture reason
                };
            }
            return item;
        }));
    };

    const handleRemoveItem = (uniqueId: string) => {
        setCart(prev => prev.filter(i => i.uniqueId !== uniqueId));
    };

    const handleClearCart = () => setCart([]);
    const handleCheckoutClick = () => {
        handleFinalizeSale();
    };

    const handleRequestCancellation = () => {
        setIsCancellationModalOpen(true);
    };

    const handleConfirmCancellation = async (reason: string) => {
        const details = {
            carrito_id: Math.random().toString(36).substr(2, 9), // Temporary ID as we don't have DB ID for cart yet
            total: cart.reduce((sum, i) => sum + i.subtotal, 0),
            items: cart.map(i => ({
                type: i.type,
                name_snapshot: i.name,
                quantity: i.quantity,
                precio_unitario: i.price,
                subtotal_linea: i.subtotal
            }))
        };

        try {
            await fetch('/api/audit', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userId: session?.user?.id ? Number(session.user.id) : 0,
                    action: 'CARRITO_CANCELADO',
                    entity: 'CART',
                    details: JSON.stringify(details),
                    reason: reason
                })
            });
            setCart([]);
            alert(`Venta cancelada: ${reason}`);
        } catch (e) {
            console.error('Error logging cancellation', e);
            alert('Error al auditar cancelación, pero el carrito se limpiará.');
            setCart([]);
        }
    };

    const handleFinalizeSale = async () => {
        if (cart.length === 0) return;

        // Prepare items for the pending sale
        const items = cart.map(i => ({
            type: i.type,
            id: i.id,
            description: i.name,
            price: i.price,
            quantity: i.quantity,
            clientId: i.clientId,
            vehicleId: i.vehicleId,
            workOrderId: i.workOrderId,
            notes: i.notes ? `${i.notes} ${i.priceReason ? `(Cambio Precio: ${i.priceReason})` : ''}` : (i.priceReason ? `Cambio Precio: ${i.priceReason}` : undefined)
        }));

        const payload = {
            userId: session?.user?.id ? Number(session.user.id) : 1,
            clientId: items[0]?.clientId || initialClient?.id, // Optional: take from first item if any, or context
            status: 'PENDING' as const,
            items: items.map(i => ({
                type: i.type as 'PRODUCT' | 'SERVICE',
                id: i.id,
                description: i.description,
                quantity: i.quantity,
                unitPrice: i.price,
                workOrderId: i.workOrderId
            }))
        };

        try {
            const res = await fetch('/api/sales', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (res.ok) {
                setCart([]);
                alert('¡Enviado a Caja con éxito!');
            } else {
                const err = await res.json();
                alert(`Error: ${err.error || 'No se pudo enviar to caja'}`);
            }
        } catch (e) {
            console.error(e);
            alert('Error de conexión');
        }
    };

    if (loading) return (
        <div className="h-full flex flex-col items-center justify-center bg-neutral-900 text-white">
            <div className="relative w-24 h-24 mb-8">
                <div className="absolute inset-0 border-4 border-red-600/20 rounded-full"></div>
                <div className="absolute inset-0 border-4 border-t-red-600 rounded-full animate-spin"></div>
                <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-red-500 animate-pulse">
                        <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                            <path d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                    </span>
                </div>
            </div>
            <div className="text-[10px] font-black uppercase tracking-[0.5em] animate-pulse">Desplegando Catálogo...</div>
        </div>
    );

    const allItems = [...services, ...products];
    const total = cart.reduce((sum, i) => sum + i.subtotal, 0);

    return (
        <div className="h-full w-full bg-[#f1f5f9] box-border overflow-hidden relative">
            {/* Background elements */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none opacity-40">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-400/10 blur-[120px] rounded-full"></div>
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-red-400/10 blur-[120px] rounded-full"></div>
            </div>

            <div className="grid grid-cols-12 gap-8 h-full p-8 relative z-10">
                {/* Left: Cart Area */}
                <div className="col-span-12 lg:col-span-5 h-full overflow-hidden">
                    <Cart
                        items={cart}
                        onUpdateQuantity={handleUpdateQuantity}
                        onUpdatePrice={() => { }} // Disabled for restricted mode via props
                        onRemoveItem={handleRemoveItem}
                        onClearCart={handleClearCart}
                        onCheckout={handleCheckoutClick}
                        restrictedMode={true}
                        onRequestPriceEdit={handleRequestPriceEdit}
                        onCancelSale={handleRequestCancellation}
                        onShowDailyClose={() => setIsDailyCloseOpen(true)}
                    />
                </div>

                {/* Right: Catalog Area */}
                <div className="col-span-12 lg:col-span-7 h-full overflow-hidden flex flex-col space-y-6">
                    <SmartSuggestions
                        cart={cart}
                        allItems={allItems}
                        onAddItem={handleAddItem}
                    />
                    <div className="flex-1 overflow-hidden glass rounded-[3rem] border-white/60 shadow-2xl relative">
                        <ItemsGrid items={allItems} onAddItem={handleAddItem} />
                    </div>
                </div>
            </div>

            <ServiceModal
                isOpen={isServiceModalOpen}
                onClose={() => setIsServiceModalOpen(false)}
                onConfirm={handleServiceConfirm}
                service={selectedServiceForModal}
            />

            <CheckoutModal
                isOpen={isCheckoutOpen}
                onClose={() => setIsCheckoutOpen(false)}
                onConfirm={handleFinalizeSale}
                total={total}
            />

            <PriceReasonModal
                isOpen={isPriceModalOpen}
                onClose={() => setIsPriceModalOpen(false)}
                onConfirm={confirmPriceEdit}
                currentPrice={priceEditCurrentPrice}
            />

            <CancellationModal
                isOpen={isCancellationModalOpen}
                onClose={() => setIsCancellationModalOpen(false)}
                onConfirm={handleConfirmCancellation}
            />

            <DailyCloseModal
                isOpen={isDailyCloseOpen}
                onClose={() => setIsDailyCloseOpen(false)}
            />

            <StockAlertModal
                isOpen={isStockModalOpen}
                onClose={() => {
                    setIsStockModalOpen(false);
                    setPendingStockAction(null);
                }}
                onConfirm={handleConfirmStockAction}
                itemName={pendingStockAction?.item?.name || ''}
                availableStock={pendingStockAction?.item?.stock || 0}
            />
        </div>
    );
}
