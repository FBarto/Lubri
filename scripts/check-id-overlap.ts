
import fs from 'fs';

function parseRow(rowStr: string): string[] {
    const result: string[] = [];
    let current = '';
    let inQuote = false;
    for (let i = 0; i < rowStr.length; i++) {
        const char = rowStr[i];
        if (char === "'" && (i === 0 || rowStr[i - 1] !== '\\')) {
            inQuote = !inQuote;
        } else if (char === ',' && !inQuote) {
            result.push(current.trim().replace(/^'|'$/g, ''));
            current = '';
        } else {
            current += char;
        }
    }
    result.push(current.trim().replace(/^'|'$/g, ''));
    return result;
}

function getFirstVals(filePath: string, tableName: string) {
    const content = fs.readFileSync(filePath, 'utf-8');
    const values = [];
    const marker = `INSERT INTO \`${tableName}\``;
    let idx = content.indexOf(marker);
    while (idx !== -1) {
        const valuesIdx = content.indexOf('VALUES', idx);
        let curr = valuesIdx + 6;
        while (curr < content.length && content[curr] !== '(') curr++;

        let depth = 0; let start = 0; let inQuote = false;
        for (let i = curr; i < content.length; i++) {
            if (content[i] === "'" && content[i - 1] !== '\\') inQuote = !inQuote;
            if (!inQuote) {
                if (content[i] === '(') { if (depth === 0) start = i + 1; depth++; }
                else if (content[i] === ')') {
                    depth--;
                    if (depth === 0) {
                        const row = parseRow(content.substring(start, i));
                        values.push(row[0]);
                    }
                } else if (content[i] === ';') { break; }
            }
        }
        idx = content.indexOf(marker, idx + 1);
    }
    return values;
}

const clientIds = new Set(getFirstVals('C:/Users/franc/.gemini/antigravity/scratch/Lubri/Base de datos anterior/cliente.sql', 'clientes'));
const serviceIds = getFirstVals('C:/Users/franc/.gemini/antigravity/scratch/Lubri/Base de datos anterior/srerice.sql', 'servicios');

let overlap = 0;
for (const sid of serviceIds) {
    if (clientIds.has(sid)) overlap++;
}

console.log(`Total services: ${serviceIds.length}`);
console.log(`Total unique clients: ${clientIds.size}`);
console.log(`Services with ID matching a Client ID: ${overlap}`);
