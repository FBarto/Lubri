
'use client';

import { useState, useEffect, useRef } from 'react';
import { Star, ChevronLeft, ChevronRight, Quote } from 'lucide-react';
import type { GoogleReview } from '@/lib/google-reviews';

export default function ReviewsCarousel({ reviews }: { reviews: GoogleReview[] }) {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isPaused, setIsPaused] = useState(false);
    const timeoutRef = useRef<any>(null);

    const nextSlide = () => {
        setCurrentIndex((prev) => (prev + 1) % reviews.length);
    };

    const prevSlide = () => {
        setCurrentIndex((prev) => (prev - 1 + reviews.length) % reviews.length);
    };

    useEffect(() => {
        if (!isPaused) {
            timeoutRef.current = setTimeout(nextSlide, 5000); // Auto-advance every 5s
        }
        return () => {
            if (timeoutRef.current) clearTimeout(timeoutRef.current);
        };
    }, [currentIndex, isPaused]);

    return (
        <section className="py-24 bg-neutral-900 overflow-hidden relative">
            {/* Background decoration */}
            <div className="absolute top-0 left-0 w-32 h-full bg-gradient-to-r from-neutral-900 to-transparent z-10 pointer-events-none"></div>
            <div className="absolute top-0 right-0 w-32 h-full bg-gradient-to-l from-neutral-900 to-transparent z-10 pointer-events-none"></div>

            <div className="container mx-auto px-6 relative z-20">
                <div className="flex flex-col items-center mb-16 text-center">
                    <div className="flex items-center gap-2 mb-4 bg-white/5 px-4 py-2 rounded-full border border-white/10 backdrop-blur-sm">
                        <span className="text-2xl font-black text-white">4.9</span>
                        <div className="flex text-yellow-500">
                            {[1, 2, 3, 4, 5].map(i => <Star key={i} className="w-5 h-5 fill-current" />)}
                        </div>
                    </div>
                    <h2 className="text-4xl md:text-5xl font-black italic uppercase tracking-tighter mb-4 text-white">
                        Voces de <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#4285F4] via-[#EA4335] to-[#FBBC05]">Google</span>
                    </h2>
                    <p className="text-neutral-400 font-medium max-w-xl">
                        Nuestros clientes hablan por nosotros. Experiencias reales en Villa Carlos Paz.
                    </p>
                </div>

                <div
                    className="relative max-w-4xl mx-auto"
                    onMouseEnter={() => setIsPaused(true)}
                    onMouseLeave={() => setIsPaused(false)}
                >
                    {/* Carousel Track */}
                    <div className="overflow-hidden rounded-3xl bg-neutral-800 border border-neutral-700/50 shadow-2xl relative min-h-[300px]">
                        <div
                            className="flex transition-transform duration-700 ease-[cubic-bezier(0.25,0.1,0.25,1)]"
                            style={{ transform: `translateX(-${currentIndex * 100}%)` }}
                        >
                            {reviews.map((review, i) => (
                                <div key={i} className="w-full flex-shrink-0 p-8 md:p-12 flex flex-col md:flex-row gap-8 items-center md:items-start text-center md:text-left box-border">
                                    <div className="flex-shrink-0">
                                        {review.profile_photo_url ? (
                                            <img src={review.profile_photo_url} alt={review.author_name} className="w-20 h-20 rounded-full border-4 border-neutral-700 shadow-lg" />
                                        ) : (
                                            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-red-600 to-red-800 flex items-center justify-center font-bold text-3xl text-white border-4 border-neutral-700 shadow-lg">
                                                {review.author_name ? review.author_name[0] : 'C'}
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex-1">
                                        <div className="mb-6 opacity-30 text-white">
                                            <Quote size={48} className="fill-current mx-auto md:mx-0" />
                                        </div>
                                        <p className="text-xl md:text-2xl text-neutral-200 leading-relaxed font-light italic mb-6">
                                            "{review.text}"
                                        </p>
                                        <div className="flex flex-col md:flex-row items-center md:items-end justify-between gap-4">
                                            <div>
                                                <h4 className="font-bold text-white text-lg">{review.author_name}</h4>
                                                <div className="flex justify-center md:justify-start text-yellow-500 mt-1">
                                                    {[...Array(5)].map((_, starsIndex) => (
                                                        <Star key={starsIndex} className={`w-4 h-4 ${starsIndex < review.rating ? 'fill-current' : 'text-neutral-600'}`} />
                                                    ))}
                                                </div>
                                            </div>
                                            <span className="text-neutral-500 text-sm font-medium bg-neutral-900/50 px-3 py-1 rounded-lg">
                                                {review.relative_time_description}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Controls */}
                    <button
                        onClick={prevSlide}
                        className="absolute top-1/2 -left-4 md:-left-12 -translate-y-1/2 bg-neutral-800 text-white p-3 rounded-full shadow-lg hover:bg-neutral-700 hover:scale-110 transition-all border border-neutral-700 group z-30"
                        aria-label="Anterior"
                    >
                        <ChevronLeft className="w-6 h-6 group-hover:-translate-x-0.5 transition-transform" />
                    </button>
                    <button
                        onClick={nextSlide}
                        className="absolute top-1/2 -right-4 md:-right-12 -translate-y-1/2 bg-neutral-800 text-white p-3 rounded-full shadow-lg hover:bg-neutral-700 hover:scale-110 transition-all border border-neutral-700 group z-30"
                        aria-label="Siguiente"
                    >
                        <ChevronRight className="w-6 h-6 group-hover:translate-x-0.5 transition-transform" />
                    </button>

                    {/* Indicators */}
                    <div className="flex justify-center gap-2 mt-8">
                        {reviews.map((_, i) => (
                            <button
                                key={i}
                                onClick={() => setCurrentIndex(i)}
                                className={`h-1.5 rounded-full transition-all duration-300 ${i === currentIndex ? 'w-8 bg-red-600' : 'w-2 bg-neutral-700 hover:bg-neutral-600'
                                    }`}
                                aria-label={`Ir a reseña ${i + 1}`}
                            />
                        ))}
                    </div>
                </div>

                <div className="mt-16 text-center">
                    <a
                        href="https://www.google.com/search?q=FB+Lubricentro+y+Bater%C3%ADas+Villa+Carlos+Paz#lrd=0x942d6714e9ed44ed:0x410af4893ace95ba,1,,,"
                        target="_blank"
                        className="inline-flex items-center gap-2 text-neutral-400 font-bold hover:text-white transition-colors text-sm uppercase tracking-widest group"
                    >
                        Ver todas las opiniones
                        <span className="border-b border-red-600 group-hover:border-white transition-colors">en Google</span>
                    </a>
                </div>
            </div>
        </section>
    );
}
