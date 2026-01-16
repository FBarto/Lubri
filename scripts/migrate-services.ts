import fs from 'fs';
import path from 'path';
import { PrismaClient } from '@prisma/client';
import { SyncService } from '@/lib/syncService';

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
    const regex = new RegExp(`INSERT INTO \`?${tableName}\`?[\\s\\S]*?VALUES\\s*([\\s\\S]*?);`, 'gi');
    let match;
    while ((match = regex.exec(content)) !== null) {
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
                    }
                }
            }
        }
    }
    return values;
}

async function migrateServices() {
    console.log('Migrating History (Services) with Batching...');
    const content = fs.readFileSync(path.join(LEGACY_DIR, 'srerice.sql'), 'utf-8');
    const rows = parseValuesFromContent(content, 'servicios');

    let serviceRef = await prisma.service.findFirst({ where: { name: 'Servicio Histórico' } });
    if (!serviceRef) {
        serviceRef = await prisma.service.create({
            data: {
                name: 'Servicio Histórico',
                category: 'General',
                duration: 0,
                price: 0,
                active: true
            }
        });
    }

    let count = 0;
    const batchSize = 50;
    let batchPromises: Promise<any>[] = [];

    for (const row of rows) {
        if (row.length < 5) continue;
        const patente = row[1];
        if (!patente) continue;

        const dateStr = row[2];
        const mileage = parseInt(row[3]) || 0;

        // details
        let notes = '';
        const fields = ['Faire', 'Faceite', 'Fcombustible', 'Fhabitaculo', 'Aceite', 'Aceite2', 'GrasaCaja', 'GrasaDif', 'hidraulico', 'Varios', 'observaciones', 'Varios2', 'Varios3'];
        // Indices 5 to 17
        for (let i = 0; i < fields.length; i++) {
            const valIndex = i + 5;
            if (valIndex < row.length) {
                const val = row[valIndex];
                if (val && val !== 'NULL' && val.trim() !== '') {
                    notes += `${fields[i]}: ${val}\n`;
                }
            }
        }

        const vehicle = await prisma.vehicle.findUnique({ where: { plate: patente } });
        if (vehicle) {
            const date = new Date(dateStr);
            if (isNaN(date.getTime())) continue;

            try {
                // Create locally 
                const wo = await prisma.workOrder.create({
                    data: {
                        date: date,
                        finishedAt: date,
                        mileage: mileage,
                        price: 0,
                        notes: notes,

                        clientId: vehicle.clientId,
                        vehicleId: vehicle.id,
                        serviceId: serviceRef.id
                    }
                });

                // Add sync to batch
                batchPromises.push(SyncService.syncWorkOrder(wo));
                count++;

                if (batchPromises.length >= batchSize) {
                    await Promise.all(batchPromises);
                    batchPromises = [];
                    console.log(`Synced batch up to ${count}`);
                }
            } catch (e) {
                // console.error(e);
            }
        }
    }
    // Final batch
    if (batchPromises.length > 0) {
        await Promise.all(batchPromises);
    }
    console.log(`Migrated ${count} service history records.`);
}

migrateServices()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
