
import * as admin from 'firebase-admin';

const getFirebase = () => {
    if (!admin.apps.length) {
        try {
            const serviceAccountStr = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;

            if (!serviceAccountStr) {
                // During build time, this might be missing. 
                // We shouldn't crash unless we actually try to use it.
                // console.warn('FIREBASE_SERVICE_ACCOUNT_KEY missing, skipping init');
                return null;
            }

            // Handle potential escaped newlines in env vars
            const serviceAccount = JSON.parse(serviceAccountStr);

            admin.initializeApp({
                credential: admin.credential.cert(serviceAccount)
            });
        } catch (error) {
            console.error('Firebase Admin Init Error:', error);
            return null;
        }
    }
    return admin;
}

// Proxy to ensure we attempt init on access
export const db = new Proxy({} as FirebaseFirestore.Firestore, {
    get: (_target, prop) => {
        const app = getFirebase();
        if (!app) throw new Error('Firebase not initialized (Check env vars)');
        return app.firestore()[prop as keyof FirebaseFirestore.Firestore];
    }
});

export const storage = new Proxy({} as admin.storage.Storage, {
    get: (_target, prop) => {
        const app = getFirebase();
        if (!app) throw new Error('Firebase not initialized (Check env vars)');
        return app.storage()[prop as keyof admin.storage.Storage];
    }
});
