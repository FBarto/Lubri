const admin = require('firebase-admin');
const http = require('http');

// Init Firebase
const serviceAccount = require('../firebase-service-account.json');
if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
    });
}
const db = admin.firestore();

function request(options, data) {
    return new Promise((resolve, reject) => {
        const req = http.request(options, (res) => {
            let body = '';
            res.on('data', chunk => body += chunk);
            res.on('end', () => resolve({ statusCode: res.statusCode, body }));
        });
        req.on('error', reject);
        if (data) req.write(data);
        req.end();
    });
}

async function run() {
    try {
        console.log('1. Checking initial Firestore state (Work Orders)...');
        const initialSnapshot = await db.collection('ordenes_trabajo').get();
        const initialCount = initialSnapshot.size;
        console.log(`Initial W/O count: ${initialCount}`);

        // 2. Get Prerequisites (Service, Client, Vehicle)
        // We'll assume some existence or try to find them.

        // Find Service
        const catalogRes = await request({
            hostname: 'localhost',
            port: 3000,
            path: '/api/pos/catalog',
            method: 'GET'
        });
        const catalog = JSON.parse(catalogRes.body);
        const service = catalog.find(i => i.type === 'SERVICE');
        if (!service) {
            console.warn('No service found. Skipping test.');
            return;
        }

        // Find Client (Need one with vehicle)
        // We might not have an easy way to verify client existence without searching.
        // Let's create a dummy WO with arbitrary IDs if DB constraints allow, 
        // OR try to fetch clients.

        // Assuming IDs 1 exist for seed data if verify-sync found product 1.
        const clientId = 1;
        const vehicleId = 1;

        // 3. Create Work Order
        const woData = {
            clientId,
            vehicleId,
            serviceId: service.id,
            price: service.price,
            notes: 'Test Sync WO'
        };

        console.log('3. Sending POST to /api/work-orders...');
        const postRes = await request({
            hostname: 'localhost',
            port: 3000,
            path: '/api/work-orders',
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(JSON.stringify(woData))
            }
        }, JSON.stringify(woData));

        console.log(`API Response: ${postRes.statusCode} ${postRes.body}`);

        if (postRes.statusCode >= 400) {
            // It might fail if client/vehicle 1 don't exist.
            // If so, we can't easily verify without seeding.
            // But let's see.
            console.error('API Failed');
            process.exit(1);
        }

        const wo = JSON.parse(postRes.body);

        // 4. Verify Sync
        console.log('4. Waiting for sync...');
        await new Promise(r => setTimeout(r, 3000));

        console.log('5. Checking final Firestore state...');
        // Check specifically for the new ID
        const doc = await db.collection('ordenes_trabajo').doc(wo.id.toString()).get();

        if (doc.exists) {
            console.log('SUCCESS: WorkOrder synced to Firestore!');
            console.log('Data:', doc.data());
            process.exit(0);
        } else {
            console.error('FAILURE: WorkOrder not found in Firestore.');
            process.exit(1);
        }

    } catch (e) {
        console.error('Test failed:', e);
        process.exit(1);
    }
}

run();
