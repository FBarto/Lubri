
import fs from 'fs';
import path from 'path';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
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
    const values: string[][] = [];
    const markers = [`INSERT INTO \`${tableName}\``, `INSERT INTO ${tableName}`];

    let lastIndex = 0;
    while (true) {
        let startIndex = -1;
        for (const marker of markers) {
            const idx = content.indexOf(marker, lastIndex);
            if (idx !== -1 && (startIndex === -1 || idx < startIndex)) {
                startIndex = idx;
            }
        }

        if (startIndex === -1) break;

        const valuesIndex = content.indexOf('VALUES', startIndex);
        if (valuesIndex === -1) {
            lastIndex = startIndex + 1;
            continue;
        }

        let currentIndex = valuesIndex + 'VALUES'.length;
        while (currentIndex < content.length && content[currentIndex] !== '(') {
            currentIndex++;
        }

        let depth = 0;
        let start = 0;
        let inQuote = false;
        let isEscaping = false;

        for (let i = currentIndex; i < content.length; i++) {
            const char = content[i];
            if (isEscaping) { isEscaping = false; continue; }
            if (char === '\\') { isEscaping = true; continue; }
            if (char === "'" && !isEscaping) { inQuote = !inQuote; continue; }

            if (!inQuote) {
                if (char === '(') {
                    if (depth === 0) start = i + 1;
                    depth++;
                } else if (char === ')') {
                    depth--;
                    if (depth === 0) {
                        const rowStr = content.substring(start, i);
                        values.push(parseRow(rowStr));
                    }
                } else if (char === ';') {
                    lastIndex = i + 1;
                    break;
                }
            }
            if (i === content.length - 1) lastIndex = content.length;
        }
    }
    return values;
}

async function findMissingVehicles() {
    const content = fs.readFileSync(path.join(LEGACY_DIR, 'srerice.sql'), 'utf-8');
    const rows = parseValuesFromContent(content, 'servicios');

    const allVehicles = await prisma.vehicle.findMany({ select: { plate: true } });
    const vehicleSet = new Set(allVehicles.map(v => v.plate.toUpperCase()));

    const missingPlates = new Set<string>();
    for (const row of rows) {
        if (row.length < 2) continue;
        const plate = row[1];
        if (!plate) continue;
        const cleanPlate = plate.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
        if (!vehicleSet.has(cleanPlate)) {
            missingPlates.add(cleanPlate);
        }
    }

    console.log(`Total rows: ${rows.length}`);
    console.log(`Missing Plates: ${missingPlates.size}`);
    console.log("\nSome missing plates:");
    Array.from(missingPlates).slice(0, 20).forEach(p => console.log(` - ${p}`));
}

findMissingVehicles().catch(console.error);
