
const admin = require('firebase-admin');

try {
    console.log('Attempting to load credentials...');
    const serviceAccount = require('../firebase-service-account.json');
    console.log('Credentials loaded.');

    console.log('Initializing app...');
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
    });
    console.log('App initialized.');

    const db = admin.firestore();
    console.log('Firestore client created.');

    db.collection('test').add({
        timestamp: new Date(),
        msg: 'Hello from script'
    }).then(ref => {
        console.log('Document written with ID: ', ref.id);
        process.exit(0);
    }).catch(e => {
        console.error('Error writing document:', e);
        process.exit(1);
    });

} catch (e) {
    console.error('CRITICAL FAILURE:', e);
    process.exit(1);
}
