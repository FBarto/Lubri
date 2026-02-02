'use client';

import { useEffect, useState } from 'react';
import { getPendingSales } from '../../actions/business';
import { DollarSign } from 'lucide-react';
import Link from 'next/link';

export default function PendingSalesUSD() {
    const [count, setCount] = useState(0);

    useEffect(() => {
        const fetchPending = async () => {
            const res = await getPendingSales();
            if (res.success && res.data) {
                setCount(res.data.length);
            }
        };

        fetchPending();
        const interval = setInterval(fetchPending, 10000); // Polling every 10s
        return () => clearInterval(interval);
    }, []);

    if (count === 0) return null;

    return (
        <Link
            href="/admin/pos?view=pending"
            className="relative p-2 bg-emerald-100 text-emerald-700 rounded-lg hover:bg-emerald-200 transition-colors flex items-center justify-center animate-pulse"
            title={`${count} Cobros Pendientes`}
        >
            <DollarSign size={20} strokeWidth={3} />
            <span className="absolute -top-1 -right-1 bg-red-600 text-white text-[10px] font-black w-4 h-4 rounded-full flex items-center justify-center border-2 border-white shadow-sm">
                {count}
            </span>
        </Link>
    );
}
