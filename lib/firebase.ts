
import * as admin from 'firebase-admin';

// Check if already initialized to avoid hot-reload errors
if (!admin.apps.length) {
    try {
        // Initialize with environment variable (Best for Vercel)
        const serviceAccountStr = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;

        if (!serviceAccountStr) {
            throw new Error('FIREBASE_SERVICE_ACCOUNT_KEY is missing');
        }

        // Handle potential escaped newlines in env vars
        const serviceAccount = JSON.parse(serviceAccountStr);

        admin.initializeApp({
            credential: admin.credential.cert(serviceAccount)
        });
        console.log('Firebase Admin Initialized');
    } catch (error) {
        console.error('Firebase Admin Init Error:', error);
    }
}

export const db = admin.firestore();
export const storage = admin.storage();
