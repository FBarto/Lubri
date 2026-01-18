
import { getGoogleReviews } from '@/lib/google-reviews';
import ReviewsCarousel from './ReviewsCarousel';

export default async function GoogleReviews() {
    const reviews = await getGoogleReviews();

    if (reviews.length === 0) {
        return null;
    }

    return <ReviewsCarousel reviews={reviews} />;
}
