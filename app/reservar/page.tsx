'use client';
import { useState } from 'react';
import StepService from '../components/booking/StepService';
import StepDate from '../components/booking/StepDate';
import StepForm from '../components/booking/StepForm';
import { useRouter } from 'next/navigation';

export default function BookingPage() {
    const router = useRouter();
    const [step, setStep] = useState(1);
    const [bookingData, setBookingData] = useState({
        service: null as any,
        date: null as Date | null,
        client: {
            name: '',
            phone: '',
            plate: '',
            model: '',
            notes: ''
        }
    });
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleServiceSelect = (service: any) => {
        setBookingData(prev => ({ ...prev, service }));
        setStep(2);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleDateSelect = (date: Date) => {
        setBookingData(prev => ({ ...prev, date }));
        setStep(3);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleFormChange = (clientData: any) => {
        setBookingData(prev => ({ ...prev, client: clientData }));
    };

    const handleSubmit = async () => {
        if (!bookingData.service || !bookingData.date || !bookingData.client.name || !bookingData.client.phone || !bookingData.client.plate) {
            alert('Por favor completa todos los campos obligatorios');
            return;
        }

        setIsSubmitting(true);
        try {
            // NOTE: We are sending raw data, backend must handle "Guest" logic or findOrcreate
            const res = await fetch('/api/appointments', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    date: bookingData.date,
                    serviceId: bookingData.service.id,
                    notes: bookingData.client.notes,
                    // Sending extra guest fields that we added to the requirement
                    guestData: {
                        name: bookingData.client.name,
                        phone: bookingData.client.phone,
                        plate: bookingData.client.plate,
                        model: bookingData.client.model
                    }
                })
            });

            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.error || 'Error al reservar');
            }

            alert('¡Turno reservado con éxito! Te esperamos.');
            router.push('/'); // Or success page
        } catch (error: any) {
            alert(error.message);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col items-center py-10 px-4">
            <div className="max-w-xl w-full">
                {/* Header */}
                <div className="text-center mb-10">
                    <h1 className="text-xl font-black text-slate-900 uppercase tracking-widest mb-1">FB Lubricentro</h1>
                    <p className="text-slate-400 text-sm font-bold">Reserva de Turnos Online</p>
                </div>

                {/* Progress Bar */}
                <div className="flex justify-between items-center mb-10 px-4 relative">
                    <div className="absolute top-1/2 left-0 w-full h-1 bg-slate-200 -z-10 rounded-full" />
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-black transition-all ${step >= 1 ? 'bg-slate-900 text-white' : 'bg-slate-200 text-slate-400'}`}>1</div>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-black transition-all ${step >= 2 ? 'bg-slate-900 text-white' : 'bg-slate-200 text-slate-400'}`}>2</div>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-black transition-all ${step >= 3 ? 'bg-slate-900 text-white' : 'bg-slate-200 text-slate-400'}`}>3</div>
                </div>

                {/* Content */}
                <div className="mb-10 min-h-[400px]">
                    {step === 1 && (
                        <StepService
                            onSelect={handleServiceSelect}
                            selectedId={bookingData.service?.id}
                        />
                    )}
                    {step === 2 && (
                        <StepDate
                            onSelect={handleDateSelect}
                            selectedDate={bookingData.date || undefined}
                            serviceDuration={bookingData.service?.duration || 30}
                        />
                    )}
                    {step === 3 && (
                        <StepForm
                            data={bookingData.client}
                            onChange={handleFormChange}
                        />
                    )}
                </div>

                {/* Footer Controls */}
                <div className="flex justify-between items-center pt-6 border-t border-slate-200">
                    {step > 1 ? (
                        <button
                            onClick={() => setStep(s => s - 1)}
                            className="font-bold text-slate-500 hover:text-slate-800 transition-colors"
                        >
                            ← Volver
                        </button>
                    ) : (
                        <div />
                    )}

                    {step === 3 && (
                        <button
                            onClick={handleSubmit}
                            disabled={isSubmitting}
                            className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-full font-black text-lg shadow-lg shadow-blue-600/30 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isSubmitting ? 'Confirmando...' : 'CONFIRMAR TURNO'}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}
