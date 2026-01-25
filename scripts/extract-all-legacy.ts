
import fs from 'fs';
import readline from 'readline';

async function extractAll() {
    const filePath = 'C:/Users/franc/.gemini/antigravity/scratch/Lubri/Base de datos anterior/articulos.sql';
    const fileStream = fs.createReadStream(filePath);

    const rl = readline.createInterface({
        input: fileStream,
        crlfDelay: Infinity
    });

    const products = [];
    console.log('--- EXTRACTING ALL ---');

    for await (const line of rl) {
        if (line.includes('INSERT INTO `articulos_precios`')) {
            const parts = line.split('VALUES');
            if (parts.length > 1) {
                const values = parts[1].trim();
                // This is a list of tuples like (id, code, desc, ...), (id, code, desc, ...)
                // We need to parse each tuple. This is tricky but we can use a regex for (..., '...', '...', ...)
                const tupleRegex = /\((\d+),\s*'([^']*)',\s*'([^']*)'/g;
                let match;
                while ((match = tupleRegex.exec(values)) !== null) {
                    products.push({
                        id: match[1],
                        code: match[2],
                        desc: match[3]
                    });
                }
            }
        }
    }

    fs.writeFileSync('legacy-products.json', JSON.stringify(products, null, 2));
    console.log(`Extracted ${products.length} products to legacy-products.json`);
}

extractAll().catch(console.error);
