'use client';

import { useState, useEffect, Suspense } from 'react';
import ItemsGrid from '@/app/components/pos/ItemsGrid';
import Cart from '@/app/components/pos/Cart';
import ServiceModal from '@/app/components/pos/ServiceModal';
import CheckoutModal from '@/app/components/pos/CheckoutModal';
import { useRouter, useSearchParams } from 'next/navigation';
import PendingSalesSlider from '@/app/components/pos/PendingSalesSlider';
import { ShoppingBag } from 'lucide-react';

import { useSession } from 'next-auth/react';
import { usePOS } from '@/app/hooks/usePOS';

function POSContent() {
    const { data: session } = useSession();
    const router = useRouter();
    const [products, setProducts] = useState<any[]>([]);
    const [services, setServices] = useState<any[]>([]);
    const [loadingData, setLoadingData] = useState(true);

    // Unified POS Logic
    const pos = usePOS(session?.user?.id ? Number(session.user.id) : 0, 'ADMIN');

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
                setLoadingData(false);
            }
        }
        fetchData();
    }, []);

    const handleAddItem = (item: any) => {
        if (item.type === 'SERVICE') {
            setSelectedServiceForModal(item);
            setIsServiceModalOpen(true);
        } else {
            pos.addItem({
                ...item,
                quantity: 1,
                type: item.type || 'PRODUCT'
            });
        }
    };

    const handleServiceConfirm = (data: any) => {
        pos.addItem({
            ...selectedServiceForModal,
            quantity: 1,
            type: 'SERVICE',
            ...data
        });
    };

    const handleUpdateQuantity = (uniqueId: string, q: number) => {
        pos.updateQuantity(uniqueId, q);
    };

    const handleUpdatePrice = (uniqueId: string, p: number) => {
        pos.updatePrice(uniqueId, p);
    };

    const handleRemoveItem = (uniqueId: string) => {
        pos.removeItem(uniqueId);
    };

    const handleClearCart = () => pos.clearCart();
    const handleCheckoutClick = () => {
        setIsCheckoutOpen(true);
    };

    const handleFinalizeSale = async (payments: any[]) => {
        // Construct payment string
        const methodStr = payments.map(p => `${p.method}: ${p.amount}`).join(' | ');

        const res = await pos.confirmSale(methodStr);

        if (res.success) {
            setIsCheckoutOpen(false);
            alert('Venta Exitosa!');
        } else {
            alert(`Error al guardar venta: ${res.error || 'Error desconocido'}`);
        }
    };

    if (loadingData || pos.isLoading) return <div className="h-screen flex items-center justify-center font-bold text-slate-500">Cargando POS...</div>;

    const allItems = [...services, ...products];
    const total = pos.items.reduce((sum, i) => sum + i.subtotal, 0);

    return (
        <div className="h-[calc(100vh-64px)] w-full bg-slate-100 p-4 box-border overflow-hidden">
            <div className="grid grid-cols-12 gap-4 h-full">
                {/* Left: Cart (4 cols) */}
                <div className="col-span-12 md:col-span-5 lg:col-span-4 h-full overflow-hidden">
                    <Cart
                        items={pos.items.map(i => ({ ...i, id: i.productId || 0 })) as any}
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
