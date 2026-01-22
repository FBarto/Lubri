'use client';

import { useState, useEffect, Suspense } from 'react';
import ItemsGrid from '@/app/components/pos/ItemsGrid';
import Cart from '@/app/components/pos/Cart';
import ServiceModal from '@/app/components/pos/ServiceModal';
import CheckoutModal from '@/app/components/pos/CheckoutModal';
import { useRouter, useSearchParams } from 'next/navigation';
import PendingSalesSlider from '@/app/components/pos/PendingSalesSlider';
import { ShoppingBag } from 'lucide-react';

function POSContent() {
    const router = useRouter();
    const [products, setProducts] = useState<any[]>([]);
    const [services, setServices] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const [cart, setCart] = useState<any[]>([]);

    // Modals
    const [isServiceModalOpen, setIsServiceModalOpen] = useState(false);
    const [selectedServiceForModal, setSelectedServiceForModal] = useState<any>(null);

    const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);

    // Pending Sales Slider
    const searchParams = useSearchParams();
    const [isPendingSliderOpen, setIsPendingSliderOpen] = useState(false);

    useEffect(() => {
        if (searchParams.get('view') === 'pending') {
            setIsPendingSliderOpen(true);
        }
    }, [searchParams]);

    useEffect(() => {
        async function fetchData() {
            try {
                const [prodRes, servRes] = await Promise.all([
                    fetch('/api/products?limit=100'),
                    fetch('/api/services')
                ]);
                const prodData = await prodRes.json();
                const servData = await servRes.json();

                const productsList = prodData.data || [];
                const normProds = productsList.map((p: any) => ({ ...p, type: 'PRODUCT' }));
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
            const existing = prev.find(i => i.id === item.id && i.type === item.type);

            if (existing && item.type === 'PRODUCT') {
                return prev.map(i => i.uniqueId === existing.uniqueId ? { ...i, quantity: i.quantity + 1, subtotal: (i.quantity + 1) * i.price } : i);
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
                return { ...item, quantity: q, subtotal: q * item.price };
            }
            return item;
        }));
    };

    const handleUpdatePrice = (uniqueId: string, p: number) => {
        setCart(prev => prev.map(item => {
            if (item.uniqueId === uniqueId) {
                return { ...item, price: p, subtotal: item.quantity * p };
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

    const handleFinalizeSale = async (payments: any[]) => {
        const payload = {
            total: cart.reduce((sum, i) => sum + i.subtotal, 0),
            paymentMethod: payments.map(p => `${p.method}: ${p.amount}`).join(' | '),
            items: cart.map(i => ({
                type: i.type,
                id: i.id,
                name: i.name,
                price: i.price,
                quantity: i.quantity,
                clientId: i.clientId,
                vehicleId: i.vehicleId,
                notes: i.notes // Make sure notes are passed if captured
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
                setIsCheckoutOpen(false);
                alert('Venta Exitosa!');
            } else {
                const data = await res.json();
                alert(`Error al guardar venta: ${data.error || 'Error desconocido'}`);
            }
        } catch (e: any) {
            console.error(e);
            alert(`Error de conexión: ${e.message}`);
        }
    };

    if (loading) return <div className="h-screen flex items-center justify-center font-bold text-slate-500">Cargando POS...</div>;

    const allItems = [...services, ...products];
    const total = cart.reduce((sum, i) => sum + i.subtotal, 0);

    return (
        <div className="h-[calc(100vh-64px)] w-full bg-slate-100 p-4 box-border overflow-hidden">
            <div className="grid grid-cols-12 gap-4 h-full">
                {/* Left: Cart (4 cols) */}
                <div className="col-span-12 md:col-span-5 lg:col-span-4 h-full overflow-hidden">
                    <Cart
                        items={cart}
                        onUpdateQuantity={handleUpdateQuantity}
                        onUpdatePrice={handleUpdatePrice}
                        onRemoveItem={handleRemoveItem}
                        onClearCart={handleClearCart}
                        onCheckout={handleCheckoutClick}
                    />
                </div>

                {/* Right: Grid (8 cols) */}
                <div className="col-span-12 md:col-span-7 lg:col-span-8 h-full overflow-hidden bg-white rounded-xl border border-slate-200">
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

            <PendingSalesSlider
                isOpen={isPendingSliderOpen}
                onClose={() => setIsPendingSliderOpen(false)}
                onFinalized={() => {
                    // Optional: refresh any local state if needed
                }}
            />
        </div>
    );
}

export default function POSPage() {
    return (
        <Suspense fallback={<div className="h-screen flex items-center justify-center font-bold text-slate-500">Iniciando Punto de Venta...</div>}>
            <POSContent />
        </Suspense>
    );
}
