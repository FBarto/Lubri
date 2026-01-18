
import fs from 'fs';
import path from 'path';

const LEGACY_PATH = path.join(process.cwd(), '../Base de datos anterior/srerice.sql');

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

function parseValues(content: string, tableName: string) {
    console.log(`Analyzing content for table ${tableName}...`);

    // Find start of relevant insert
    const insertStartMarker = `INSERT INTO \`${tableName}\``;
    const insertStartMarker2 = `INSERT INTO ${tableName}`;

    let startIndex = content.indexOf(insertStartMarker);
    if (startIndex === -1) startIndex = content.indexOf(insertStartMarker2);
    if (startIndex === -1) {
        console.log('Insert start not found');
        return [];
    }
    console.log(`Found INSERT at index ${startIndex}`);

    // Find VALUES after table name
    const valuesIndex = content.indexOf('VALUES', startIndex);
    if (valuesIndex === -1) {
        console.log('VALUES not found');
        return [];
    }
    console.log(`Found VALUES at index ${valuesIndex}`);

    let currentIndex = valuesIndex + 'VALUES'.length;

    // Scan until we find the first '('
    while (currentIndex < content.length && content[currentIndex] !== '(') {
        currentIndex++;
    }
    console.log(`First '(' at index ${currentIndex}`);

    const values = [];
    let depth = 0;
    let start = 0;
    let inQuote = false;
    let isEscaping = false;

    // State machine
    for (let i = currentIndex; i < content.length; i++) {
        const char = content[i];

        if (isEscaping) {
            isEscaping = false;
            continue;
        }
        if (char === '\\') {
            isEscaping = true;
            continue;
        }
        if (char === "'" && !isEscaping) {
            inQuote = !inQuote;
            continue;
        }

        if (!inQuote) {
            if (char === '(') {
                if (depth === 0) start = i + 1;
                depth++;
            } else if (char === ')') {
                depth--;
                if (depth === 0) {
                    const rowStr = content.substring(start, i);
                    values.push(parseRow(rowStr));
                    if (values.length <= 3) console.log(`Parsed Row ${values.length}:`, rowStr);
                }
            } else if (char === ';') {
                console.log(`Found semicolon at ${i}. Stopping.`);
                break;
            }
        }
    }
    return values;
}

// Main execution
try {
    const content = fs.readFileSync(LEGACY_PATH, 'utf-8');
    const rows = parseValues(content, 'servicios');
    console.log(`Total parsed rows: ${rows.length}`);
} catch (e) {
    console.error(e);
}
