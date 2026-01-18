
import { Star } from 'lucide-react';
import { getGoogleReviews } from '@/lib/google-reviews';

export default async function GoogleReviews() {
    const reviews = await getGoogleReviews();

    if (reviews.length === 0) {
        return null;
    }

    return (
        <section className="py-24 bg-neutral-900 text-center">
            <div className="container mx-auto px-6">
                <div className="flex flex-col items-center mb-12">
                    <div className="flex items-center gap-2 mb-2">
                        <span className="text-2xl font-bold text-white">4.9</span>
                        <div className="flex text-yellow-500">
                            {[1, 2, 3, 4, 5].map(i => <Star key={i} className="w-5 h-5 fill-current" />)}
                        </div>
                    </div>
                    <h2 className="text-3xl font-black italic uppercase tracking-tighter mb-2">
                        Opiniones de <span className="text-[#4285F4]">G</span><span className="text-[#EA4335]">o</span><span className="text-[#FBBC05]">o</span><span className="text-[#4285F4]">g</span><span className="text-[#34A853]">l</span><span className="text-[#EA4335]">e</span>
                    </h2>
                    <p className="text-neutral-500 text-sm uppercase tracking-widest font-bold">Clientes reales. Experiencias reales.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl mx-auto">
                    {reviews.map((review, i) => (
                        <div key={i} className="bg-neutral-800 p-6 rounded-2xl border border-neutral-700/50 flex flex-col text-left">
                            <div className="flex items-center gap-3 mb-4">
                                {review.profile_photo_url ? (
                                    <img src={review.profile_photo_url} alt={review.author_name} className="w-10 h-10 rounded-full" />
                                ) : (
                                    <div className="w-10 h-10 rounded-full bg-red-600 flex items-center justify-center font-bold text-white">
                                        {review.author_name[0]}
                                    </div>
                                )}
                                <div>
                                    <h4 className="font-bold text-white text-sm">{review.author_name}</h4>
                                    <div className="flex text-yellow-500">
                                        {[...Array(5)].map((_, starsIndex) => (
                                            <Star key={starsIndex} className={`w-3 h-3 ${starsIndex < review.rating ? 'fill-current' : 'text-neutral-600'}`} />
                                        ))}
                                    </div>
                                </div>
                            </div>
                            <p className="text-neutral-300 text-sm leading-relaxed mb-4 line-clamp-4">
                                "{review.text}"
                            </p>
                            <div className="mt-auto pt-4 border-t border-neutral-700/50 flex justify-between items-center text-xs text-neutral-500">
                                <span>{review.relative_time_description}</span>
                                <img src="https://upload.wikimedia.org/wikipedia/commons/2/2f/Google_2015_logo.svg" alt="Google" className="h-4 opacity-50 grayscale" />
                            </div>
                        </div>
                    ))}
                </div>

                <div className="mt-12">
                    <a
                        href="https://www.google.com/search?q=FB+Lubricentro+y+Bater%C3%ADas+Villa+Carlos+Paz#lrd=0x942d6714e9ed44ed:0x410af4893ace95ba,1,,,"
                        target="_blank"
                        className="inline-flex items-center gap-2 text-white font-bold border-b border-white pb-0.5 hover:text-red-500 hover:border-red-500 transition-colors"
                    >
                        Ver todas las opiniones en Google
                    </a>
                </div>
            </div>
        </section>
    );
}
