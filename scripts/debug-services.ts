
import fs from 'fs';
import path from 'path';

const LEGACY_DIR = path.join(process.cwd(), '../Base de datos anterior');

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

function parseValuesFromContent(content: string, tableName: string): string[][] {
    console.log('Regex matching...');
    const values: string[][] = [];
    // Simplified regex just to find VALUES (...)
    const regex = new RegExp(`INSERT INTO \`?${tableName}\`?[\\s\\S]*?VALUES\\s*([\\s\\S]*?);`, 'gi');

    let match;
    while ((match = regex.exec(content)) !== null) {
        console.log('Match found! Parsing block...');
        const valuesBlock = match[1];
        let depth = 0;
        let start = 0;
        let inQuote = false;

        for (let i = 0; i < valuesBlock.length; i++) {
            const char = valuesBlock[i];
            if (char === "'" && (i === 0 || valuesBlock[i - 1] !== '\\')) inQuote = !inQuote;
            if (!inQuote) {
                if (char === '(') {
                    if (depth === 0) start = i + 1;
                    depth++;
                } else if (char === ')') {
                    depth--;
                    if (depth === 0) {
                        const rowStr = valuesBlock.substring(start, i);
                        values.push(parseRow(rowStr));
                        if(values.length % 500 === 0) process.stdout.write('.');
                    }
                }
            }
        }
    }
    return values;
}

async function verify() {
    console.log('Reading file...');
    try {
        const content = fs.readFileSync(path.join(LEGACY_DIR, 'srerice.sql'), 'utf-8');
        console.log(`File read. Size: ${content.length} chars.`);
        
        const rows = parseValuesFromContent(content, 'servicios');
        console.log(`\nParsed ${rows.length} rows.`);
        
        if (rows.length > 0) {
           console.log('Sample row:', rows[0]);
        }
    } catch (e) {
        console.error(e);
    }
}

verify();
