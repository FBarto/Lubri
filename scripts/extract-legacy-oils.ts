
import fs from 'fs';
import readline from 'readline';

async function extractSpecifics() {
    const filePath = 'C:/Users/franc/.gemini/antigravity/scratch/Lubri/Base de datos anterior/articulos.sql';
    const fileStream = fs.createReadStream(filePath);

    const rl = readline.createInterface({
        input: fileStream,
        crlfDelay: Infinity
    });

    console.log('--- START SPECIFIC EXTRACTION ---');
    const keywords = ['CASTROL', 'GULF', 'MAGNATEC', 'EDGE', 'FORMULA G'];

    let count = 0;
    for await (const line of rl) {
        const upperLine = line.toUpperCase();
        if (keywords.some(k => upperLine.includes(k))) {
            const matches = line.match(/'([^']+)'/g);
            if (matches && matches.length >= 2) {
                const code = matches[0].replace(/'/g, '');
                const desc = matches[1].replace(/'/g, '');
                console.log(`${code.padEnd(20)} | ${desc}`);
                count++;
            }
        }
    }
    console.log('--- END SPECIFIC EXTRACTION ---');
}

extractSpecifics().catch(console.error);
