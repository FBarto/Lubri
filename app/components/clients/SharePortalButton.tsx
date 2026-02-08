
'use client';

import { useState } from 'react';
import { generatePortalLinkForVehicle } from '@/app/actions/portal';
import { Send, CheckCircle, Smartphone } from 'lucide-react';

interface SharePortalButtonProps {
    vehicleId: number;
    phone: string;
    clientName?: string;
    vehicleBrand?: string | null;
    vehicleModel?: string | null;
}

export default function SharePortalButton({
    vehicleId,
    phone,
    clientName = 'Cliente',
    vehicleBrand,
    vehicleModel
}: SharePortalButtonProps) {
    const [loading, setLoading] = useState(false);
    const [sent, setSent] = useState(false);

    const handleShare = async () => {
        setLoading(true);
        try {
            const res = await generatePortalLinkForVehicle(vehicleId);
            if (res.success && res.data?.url) {
                const origin = window.location.origin;
                const fullLink = `${origin}${res.data.url}`;

                // Construct vehicle string (e.g., "Toyota Corolla" or just "Vehículo")
                const carName = [vehicleBrand, vehicleModel].filter(Boolean).join(' ') || 'vehículo';

                // personalized message
                const message = `¡Hola ${clientName}! 👋 Te paso la Libreta Digital de tu ${carName} para que lleves el control de tus services en FB Lubricentro 🛠️.\n\nAcá tenés el link: ${fullLink}\n\nGuardalo para tu próximo service. ¡Te esperamos! 🚗`;

                const encodedMsg = encodeURIComponent(message);
                const cleanPhone = phone.replace(/\D/g, '');
                const waLink = `https://wa.me/${cleanPhone}?text=${encodedMsg}`;

                window.open(waLink, '_blank');
                setSent(true);

                // Optional: Save to localStorage if we want persistence across reloads
                // localStorage.setItem(`sent_book_${vehicleId}`, 'true');
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
            <button
                onClick={handleShare} // Allow re-sending if needed? Or just show status.
                className="flex items-center gap-2 text-emerald-700 font-bold text-xs bg-emerald-100 border border-emerald-200 px-3 py-2 rounded-lg transition-all animate-in fade-in"
            >
                <CheckCircle size={14} /> Enviado
            </button>
        );
    }

    return (
        <button
            onClick={handleShare}
            disabled={loading}
            className="flex items-center gap-2 text-indigo-600 font-bold text-xs bg-indigo-50 hover:bg-indigo-100 hover:text-indigo-800 px-3 py-2 rounded-lg transition-all"
            title="Enviar Libreta Digital por WhatsApp"
        >
            {loading ? <span className="animate-spin">⌛</span> : <Smartphone size={14} />}
            Enviar Libreta
        </button>
    );
}
