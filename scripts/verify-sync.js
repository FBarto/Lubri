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
        console.log('1. Checking initial Firestore state...');
        const initialSnapshot = await db.collection('ventas').get();
        const initialCount = initialSnapshot.size;
        console.log(`Initial sales count: ${initialCount}`);

        // 2. Get Catalog to find a valid product
        console.log('2. Fetching catalog...');
        const catalogRes = await request({
            hostname: 'localhost',
            port: 3000,
            path: '/api/pos/catalog',
            method: 'GET'
        });

        if (catalogRes.statusCode !== 200) {
            throw new Error(`Failed to fetch catalog: ${catalogRes.statusCode}`);
        }

        const catalog = JSON.parse(catalogRes.body);
        const product = catalog.find(i => i.type === 'PRODUCT');

        if (!product) {
            console.warn('No products found in catalog. Creating generic item.');
            // This might fail if DB enforces constraints, but let's try.
        } else {
            console.log(`Found product: ${product.name} (ID: ${product.id})`);
        }

        const saleItem = product ? {
            id: product.id,
            type: 'PRODUCT',
            name: product.name,
            price: product.price,
            quantity: 1
        } : {
            id: 99999, // Risky
            type: 'PRODUCT',
            name: 'Test Product',
            price: 100,
            quantity: 1
        };

        // 3. Create Sale
        const saleData = {
            clientId: null,
            paymentMethod: 'TEST_SYNC',
            total: saleItem.price,
            items: [saleItem]
        };

        console.log('3. Sending POST to /api/sales...');
        const postRes = await request({
            hostname: 'localhost',
            port: 3000,
            path: '/api/sales',
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(JSON.stringify(saleData))
            }
        }, JSON.stringify(saleData));

        console.log(`API Response: ${postRes.statusCode} ${postRes.body}`);

        if (postRes.statusCode < 200 || postRes.statusCode >= 300) {
            throw new Error('Failed to create sale via API');
        }

        // 4. Verify Sync
        console.log('4. Waiting for sync...');
        await new Promise(r => setTimeout(r, 3000)); // Wait 3s

        console.log('5. Checking final Firestore state...');
        const finalSnapshot = await db.collection('ventas').get();
        const finalCount = finalSnapshot.size;
        console.log(`Final sales count: ${finalCount}`);

        if (finalCount > initialCount) {
            console.log('SUCCESS: Sale synced to Firestore!');
            process.exit(0);
        } else {
            console.error('FAILURE: Sales count did not increase.');
            process.exit(1);
        }

    } catch (e) {
        console.error('Test failed:', e);
        process.exit(1);
    }
}

run();
