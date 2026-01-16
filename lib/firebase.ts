
import * as admin from 'firebase-admin';

// Check if already initialized to avoid hot-reload errors
if (!admin.apps.length) {
    try {
        // import serviceAccount from '../firebase-service-account.json';
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        const serviceAccount = require('../firebase-service-account.json');

        admin.initializeApp({
            credential: admin.credential.cert(serviceAccount)
        });
        console.log('Firebase Admin Initialized');
    } catch (error) {
        console.error('Firebase Admin Init Error:', error);
    }
}

export const db = admin.firestore();
