'use client';

import { useState, useEffect } from 'react';
import ItemsGrid from '@/app/components/pos/ItemsGrid';
import Cart from '@/app/components/pos/Cart';
import ServiceModal from '@/app/components/pos/ServiceModal';
import CheckoutModal from '@/app/components/pos/CheckoutModal';
import PriceReasonModal from './PriceReasonModal';
import CancellationModal from './CancellationModal';
import DailyCloseModal from '@/app/components/pos/DailyCloseModal';
import { useSession } from 'next-auth/react';

interface RestrictedPOSProps {
    cart: any[];
    setCart: React.Dispatch<React.SetStateAction<any[]>>;
}

export default function RestrictedPOS({ cart, setCart }: RestrictedPOSProps) {
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

    const addToCart = (item: any, serviceData: any = {}) => {
        setCart(prev => {
            const existing = prev.find(i => i.id === item.id && i.type === item.type && item.type === 'PRODUCT');

            // Stock Check for Existing Item
            if (existing && item.type === 'PRODUCT') {
                const newQty = existing.quantity + 1;
                if (existing.stock !== undefined && newQty > existing.stock) {
                    if (!confirm(`⚠️ STOCK BAJO: Solo quedan ${existing.stock} unidades de "${existing.name}".\n\n¿Agregar igual y dejar stock negativo?`)) {
                        return prev; // User cancelled
                    }
                }
                return prev.map(i => i.uniqueId === existing.uniqueId ? { ...i, quantity: newQty, subtotal: newQty * i.price } : i);
            }

            // Stock Check for New Item
            if (item.type === 'PRODUCT' && item.stock !== undefined && 1 > item.stock) {
                if (!confirm(`⚠️ STOCK BAJO: Solo quedan ${item.stock} unidades de "${item.name}".\n\n¿Agregar igual y dejar stock negativo?`)) {
                    return prev;
                }
            }

            return [...prev, {
                ...item,
                uniqueId: Math.random().toString(36).substr(2, 9),
                quantity: 1,
                subtotal: item.price,
                ...serviceData // Include client/vehicle info
            }];
        });
    }

    const handleServiceConfirm = (data: any) => {
        addToCart(selectedServiceForModal, data);
    };

    const handleUpdateQuantity = (uniqueId: string, q: number) => {
        setCart(prev => prev.map(item => {
            if (item.uniqueId === uniqueId) {
                // Stock Check
                if (item.type === 'PRODUCT' && item.stock !== undefined && q > item.stock) {
                    // Only warn if increasing (to avoid annoying loops when decreasing)
                    if (q > item.quantity) {
                        if (!confirm(`⚠️ STOCK BAJO: Solo quedan ${item.stock} unidades.\n\n¿Cambiar a ${q} y dejar stock negativo?`)) {
                            return item; // Keep old quantity
                        }
                    }
                }
                return { ...item, quantity: q, subtotal: q * item.price };
            }
            return item;
        }));
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
        setIsCheckoutOpen(true);
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

    const handleFinalizeSale = async (payments: any[]) => {
        // Prepare base items from cart
        const baseItems = cart.map(i => ({
            type: i.type,
            id: i.id,
            name: i.name,
            price: i.price,
            quantity: i.quantity,
            clientId: i.clientId,
            vehicleId: i.vehicleId,
            notes: i.notes ? `${i.notes} ${i.priceReason ? `(Cambio Precio: ${i.priceReason})` : ''}` : (i.priceReason ? `Cambio Precio: ${i.priceReason}` : undefined)
        }));

        // Extract surcharges from payments and create virtual items for them
        const surchargeItems = payments
            .filter(p => p.surcharge)
            .map(p => ({
                type: 'SERVICE',
                id: undefined,
                name: `Recargo Financiación (${p.surcharge.plan})`,
                price: p.surcharge.surchargeAmount,
                quantity: 1,
                notes: `Aplicado sobre base de $${p.baseAmount}`
            }));

        const finalItems = [...baseItems, ...surchargeItems];

        const payload = {
            total: finalItems.reduce((sum, i) => sum + (i.price * i.quantity), 0),
            paymentMethod: payments.map(p => {
                const detail = p.surcharge ? ` (${p.surcharge.plan})` : '';
                return `${p.method}${detail}: $${p.amount.toLocaleString()}`;
            }).join(' | '),
            items: finalItems
        };

        try {
            const res = await fetch('/api/sales', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (res.ok) {
                setCart([]);
                setIsCheckoutOpen(false);
                alert('Venta Exitosa!');
            } else {
                alert('Error al guardar venta');
            }
        } catch (e) {
            console.error(e);
            alert('Error de conexión');
        }
    };

    if (loading) return <div className="h-full flex items-center justify-center font-bold text-slate-500">Cargando Catálogo...</div>;

    const allItems = [...services, ...products];
    const total = cart.reduce((sum, i) => sum + i.subtotal, 0);

    return (
        <div className="h-full w-full bg-slate-50 box-border overflow-hidden relative">
            <div className="grid grid-cols-12 gap-4 h-full p-4">
                {/* Left: Cart (5 cols for easier touch) */}
                <div className="col-span-12 md:col-span-5 h-full overflow-hidden">
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

                {/* Right: Grid (7 cols) */}
                <div className="col-span-12 md:col-span-7 h-full overflow-hidden bg-white rounded-xl border border-slate-200">
                    <ItemsGrid items={allItems} onAddItem={handleAddItem} />
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
        </div>
    );
}
