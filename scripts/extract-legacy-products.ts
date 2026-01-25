
import fs from 'fs';
import readline from 'readline';

async function extractProducts() {
    const filePath = 'C:/Users/franc/.gemini/antigravity/scratch/Lubri/Base de datos anterior/articulos.sql';
    const fileStream = fs.createReadStream(filePath);

    const rl = readline.createInterface({
        input: fileStream,
        crlfDelay: Infinity
    });

    console.log('--- START EXTRACTION ---');
    const keywords = ['FRAM', 'CASTROL', 'TOTAL', 'GULF', 'MOLYKOTE', 'PATRIOT', 'GLACELF', 'RAYTEL', 'Q7000', 'Q5000', 'Q9000'];

    let count = 0;
    for await (const line of rl) {
        const upperLine = line.toUpperCase();
        if (keywords.some(k => upperLine.includes(k))) {
            // Try to extract the description part. 
            // In the SQL, it's the 3rd field: (id, 'code', 'desc', ...)
            const matches = line.match(/'([^']+)'/g);
            if (matches && matches.length >= 2) {
                const code = matches[0].replace(/'/g, '');
                const desc = matches[1].replace(/'/g, '');
                console.log(`${code.padEnd(20)} | ${desc}`);
                count++;
            }
        }
        if (count > 500) break; // Limit for now
    }
    console.log('--- END EXTRACTION ---');
}

extractProducts().catch(console.error);
