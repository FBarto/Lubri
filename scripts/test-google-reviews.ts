
import fs from 'fs';
import path from 'path';

// Manual .env loading
try {
    const envPath = path.resolve(process.cwd(), '.env');
    const envFile = fs.readFileSync(envPath, 'utf8');
    envFile.split('\n').forEach(line => {
        const [key, value] = line.split('=');
        if (key && value) {
            process.env[key.trim()] = value.trim().replace(/^"|"$/g, '');
        }
    });
    console.log("Loaded .env manually. API Key present:", !!process.env.GOOGLE_MAPS_API_KEY);
} catch (e) {
    console.error("Could not load .env", e);
}

// import { getGoogleReviews } from '../lib/google-reviews'; // Removed static import

async function main() {
    console.log("Testing Google Reviews API...");
    try {
        const { getGoogleReviews } = await import('../lib/google-reviews');
        const reviews = await getGoogleReviews();
        console.log(`Fetched ${reviews.length} reviews.`);
        if (reviews.length > 0) {
            console.log("First review author:", reviews[0].author_name);
            console.log("First review text:", reviews[0].text.substring(0, 50) + "...");
        } else {
            console.log("No reviews found (or filtered out). Check Place ID/API Key or filter logic.");
        }
    } catch (e) {
        console.error("Error testing reviews:", e);
    }
}

main();
