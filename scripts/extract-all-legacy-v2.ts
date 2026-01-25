
import fs from 'fs';
import readline from 'readline';

async function extractAllFixed() {
    const filePath = 'C:/Users/franc/.gemini/antigravity/scratch/Lubri/Base de datos anterior/articulos.sql';
    const fileStream = fs.createReadStream(filePath);

    const rl = readline.createInterface({
        input: fileStream,
        crlfDelay: Infinity
    });

    const products = [];
    console.log('--- EXTRACTING ALL (FIXED) ---');

    // Pattern: (id, 'code', 'desc', 'brand', ...
    const tupleRegex = /\((\d+),\s*'([^']*)',\s*'([^']*)'/g;

    for await (const line of rl) {
        let match;
        while ((match = tupleRegex.exec(line)) !== null) {
            products.push({
                id: match[1],
                code: match[2],
                desc: match[3]
            });
        }
    }

    fs.writeFileSync('legacy-products.json', JSON.stringify(products, null, 2));
    console.log(`Extracted ${products.length} products to legacy-products.json`);
}

extractAllFixed().catch(console.error);
