
const GOOGLE_API_KEY = process.env.GOOGLE_MAPS_API_KEY;
const PLACE_ID = process.env.GOOGLE_PLACE_ID;

export interface GoogleReview {
    author_name: string;
    author_url: string;
    language: string;
    original_language: string;
    profile_photo_url: string;
    rating: number;
    relative_time_description: string;
    text: string;
    time: number;
    translated: boolean;
}

let cachedReviews: GoogleReview[] | null = null;
let lastFetchTime = 0;
const CACHE_DURATION = 1000 * 60 * 60; // 1 hour

export async function getGoogleReviews(): Promise<GoogleReview[]> {
    if (!GOOGLE_API_KEY || !PLACE_ID) {
        console.error("Missing Google API Key or Place ID");
        return [];
    }

    // Return cached if valid
    if (cachedReviews && (Date.now() - lastFetchTime < CACHE_DURATION)) {
        return cachedReviews;
    }

    try {
        // Use Places API (New) details endpoint
        const url = `https://places.googleapis.com/v1/places/${PLACE_ID}`;

        const response = await fetch(url, {
            headers: {
                'Content-Type': 'application/json',
                'X-Goog-Api-Key': GOOGLE_API_KEY,
                'X-Goog-FieldMask': 'reviews'
            }
        });

        if (!response.ok) {
            throw new Error(`Failed to fetch reviews: ${response.statusText}`);
        }

        const data = await response.json();

        // Transform V1 structure to our interface
        // The V1 API returns object { reviews: [...] }
        // We filter for 4+ stars and with text
        const reviews = (data.reviews || [])
            .map((r: any) => ({
                author_name: r.authorAttribution?.displayName || 'Cliente',
                author_url: r.authorAttribution?.uri || '#',
                profile_photo_url: r.authorAttribution?.photoUri || '',
                rating: r.rating,
                relative_time_description: r.relativePublishTimeDescription,
                text: r.text?.text || r.originalText?.text || '',
                time: new Date(r.publishTime).getTime()
            }))
            .filter((r: GoogleReview) => r.rating >= 4 && r.text.length > 10)
            .slice(0, 6); // Top 6

        cachedReviews = reviews;
        lastFetchTime = Date.now();

        return reviews;
    } catch (error) {
        console.error("Error fetching Google Reviews:", error);
        return [];
    }
}
