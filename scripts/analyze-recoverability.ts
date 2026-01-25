
import fs from 'fs';

function parseRow(rowStr: string): string[] {
    const result: string[] = [];
    let current = '';
    let inQuote = false;
    for (let i = 0; i < rowStr.length; i++) {
        const char = rowStr[i];
        if (char === "'" && (i === 0 || rowStr[i - 1] !== '\\')) inQuote = !inQuote;
        else if (char === ',' && !inQuote) { result.push(current.trim().replace(/^'|'$/g, '')); current = ''; }
        else current += char;
    }
    result.push(current.trim().replace(/^'|'$/g, ''));
    return result;
}

function parseValuesFromContent(content: string, tableName: string): string[][] {
    const values: string[][] = [];
    const markers = [`INSERT INTO \`${tableName}\``, `INSERT INTO ${tableName}`];
    let lastIndex = 0;
    while (true) {
        let startIndex = -1;
        for (const marker of markers) {
            const idx = content.indexOf(marker, lastIndex);
            if (idx !== -1 && (startIndex === -1 || idx < startIndex)) startIndex = idx;
        }
        if (startIndex === -1) break;
        const valuesIndex = content.indexOf('VALUES', startIndex);
        if (valuesIndex === -1) { lastIndex = startIndex + 1; continue; }
        let currentIndex = valuesIndex + 'VALUES'.length;
        while (currentIndex < content.length && content[currentIndex] !== '(') currentIndex++;
        let depth = 0; let start = 0; let inQuote = false;
        for (let i = currentIndex; i < content.length; i++) {
            const char = content[i];
            if (char === "'" && content[i - 1] !== '\\') inQuote = !inQuote;
            if (!inQuote) {
                if (char === '(') { if (depth === 0) start = i + 1; depth++; }
                else if (char === ')') {
                    depth--;
                    if (depth === 0) values.push(parseRow(content.substring(start, i)));
                } else if (char === ';') { lastIndex = i + 1; break; }
            }
        }
    }
    return values;
}

const clientIds = new Set(fs.readFileSync('C:/Users/franc/.gemini/antigravity/scratch/Lubri/Base de datos anterior/cliente.sql', 'utf-8')
    .match(/\('\d+',/g)?.map(m => m.replace(/\D/g, '')) || []);

const serviceRows = parseValuesFromContent(fs.readFileSync('C:/Users/franc/.gemini/antigravity/scratch/Lubri/Base de datos anterior/srerice.sql', 'utf-8'), 'servicios');

// Map plate -> Set of IDs found in its rows
const plateToIds = new Map<string, Set<string>>();

for (const row of serviceRows) {
    if (row.length < 2 || !row[1] || row[1] === 'NULL') continue;
    const plate = row[1].toUpperCase();
    const id = row[0];
    if (!plateToIds.has(plate)) plateToIds.set(plate, new Set());
    plateToIds.get(plate)!.add(id);
}

let recoverable = 0;
let recoverableRecords = 0;

console.log("Checking orphan recoverability...");

for (const [plate, ids] of plateToIds.entries()) {
    // If a plate has ONLY ONE ID in all its records, and that ID is a Valid Client ID
    if (ids.size === 1) {
        const singleId = Array.from(ids)[0];
        if (clientIds.has(singleId)) {
            recoverable++;
            // Count rows for this plate
            const count = serviceRows.filter(r => r[1] && r[1].toUpperCase() === plate).length;
            recoverableRecords += count;
        }
    }
}

console.log(`\nRecoverability Analysis:`);
console.log(`Total unique plates in history: ${plateToIds.size}`);
console.log(`Plates with a single consistent Client ID: ${recoverable}`);
console.log(`Historical records that could be recovered: ${recoverableRecords}`);
