
'use client';

import { useState } from 'react';
import { generatePortalLinkForVehicle } from '../../lib/portal-actions';
import { Send, CheckCircle, Smartphone } from 'lucide-react';

export default function SharePortalButton({ vehicleId, phone }: { vehicleId: number, phone: string }) {
    const [loading, setLoading] = useState(false);
    const [sent, setSent] = useState(false);

    const handleShare = async () => {
        setLoading(true);
        try {
            const res = await generatePortalLinkForVehicle(vehicleId);
            if (res.success && res.url) {
                // Determine base URL (localhost, or production domain)
                // For client side, window.location.origin is best
                const origin = window.location.origin;
                const fullLink = `${origin}${res.url}`;

                // Format message
                const message = `Hola! Aquí tienes tu Libreta Digital de Mantenimiento para tu vehículo: ${fullLink}`;
                const encodedMsg = encodeURIComponent(message);

                // Clean phone
                const cleanPhone = phone.replace(/\D/g, ''); // 5493541...
                const waLink = `https://wa.me/${cleanPhone}?text=${encodedMsg}`;

                // Open WhatsApp
                window.open(waLink, '_blank');
                setSent(true);
            } else {
                alert('Error al generar el link: ' + res.error);
            }
        } catch (error) {
            console.error(error);
            alert('Error inesperado');
        } finally {
            setLoading(false);
        }
    };

    if (sent) {
        return (
            <button className="flex items-center gap-2 text-emerald-600 font-bold text-xs bg-emerald-50 px-3 py-2 rounded-lg transition-all animate-in fade-in">
                <CheckCircle size={14} /> Enviado
            </button>
        );
    }

    return (
        <button
            onClick={handleShare}
            disabled={loading}
            className="flex items-center gap-2 text-indigo-600 font-bold text-xs bg-indigo-50 hover:bg-indigo-100 hover:text-indigo-800 px-3 py-2 rounded-lg transition-all"
        >
            {loading ? <span className="animate-spin">⌛</span> : <Smartphone size={14} />}
            Enviar Libreta
        </button>
    );
}
