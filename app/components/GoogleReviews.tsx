
import { getGoogleReviews } from '@/lib/google-reviews';
import ReviewsCarousel from './ReviewsCarousel';

export default async function GoogleReviews() {
    try {
        const reviews = await getGoogleReviews();

        if (!reviews || reviews.length === 0) {
            return null;
        }

        return <ReviewsCarousel reviews={reviews} />;
    } catch (error) {
        console.error("Critical error in GoogleReviews component:", error);
        return null;
    }
}
