
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

async function migrateServices() {
    console.log('🚀 Starting Optimized Service Migration...');

    // 0. Clean previous historical services to avoid duplicates
    console.log('🧹 Cleaning previous historical services...');
    await prisma.workOrder.deleteMany({
        where: { service: { name: 'Servicio Histórico' } }
    });

    // 1. Parse File
    console.log('📖 Reading srerice.sql...');
    if (!fs.existsSync(path.join(LEGACY_DIR, 'srerice.sql'))) {
        console.error(`❌ File not found: ${path.join(LEGACY_DIR, 'srerice.sql')}`);
        process.exit(1);
    }
    const content = fs.readFileSync(path.join(LEGACY_DIR, 'srerice.sql'), 'utf-8');
    const rows = parseValuesFromContent(content, 'servicios');
    console.log(`✅ Parsed ${rows.length} rows from SQL.`);

    // 2. Fetch Master Data (Vehicles) for fast lookup
    console.log('🚙 Fetching Vehicle cache...');
    const allVehicles = await prisma.vehicle.findMany({
        select: { id: true, plate: true, clientId: true }
    });
    const vehicleMap = new Map<string, { id: number, clientId: number }>();
    for (const v of allVehicles) {
        if (v.plate) {
            vehicleMap.set(v.plate, v);
            const clean = v.plate.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
            if (clean !== v.plate) vehicleMap.set(clean, v);
        }
    }
    console.log(`✅ Cached ${allVehicles.length} vehicles.`);

    // 3. Get/Create Service Ref
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

    const workOrdersPayload: any[] = [];
    const vehicleSpecsMap = new Map<string, any>();

    console.log('⚙️  Processing rows...');
    for (const row of rows) {
        if (row.length < 5) continue;
        const patenteRaw = row[1];
        if (!patenteRaw) continue;

        // Clean plate for lookup
        const cleanPatente = patenteRaw.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();

        // Fast Lookup
        const vehicle = vehicleMap.get(patenteRaw) || vehicleMap.get(cleanPatente);
        if (!vehicle) continue;

        const dateStr = row[2];
        const date = new Date(dateStr);
        if (isNaN(date.getTime())) continue;

        const mileageStr = (row[3] || '0').replace(/[^0-9]/g, '');
        const mileage = parseInt(mileageStr) || 0;

        // Parse Details
        const getVal = (idx: number) => (row[idx] && row[idx] !== 'NULL' && row[idx].trim() !== '') ? row[idx].trim() : null;

        const details: any = {};
        const filters: any = {};
        const fluids: any = {};

        const fAire = getVal(5); if (fAire) filters.air = fAire;
        const fAceite = getVal(6); if (fAceite) filters.oil = fAceite;
        const fComb = getVal(7); if (fComb) filters.fuel = fComb;
        const fHab = getVal(8); if (fHab) filters.cabin = fHab;

        const oilType = getVal(9);
        const oilLiters = getVal(10);
        if (oilType || oilLiters) details.oil = { type: oilType || '', liters: oilLiters || '' };

        const grasaCaja = getVal(11); if (grasaCaja) fluids.gearbox = grasaCaja;
        const grasaDif = getVal(12); if (grasaDif) fluids.differential = grasaDif;
        const hidraulico = getVal(13); if (hidraulico) fluids.steering = hidraulico;

        if (Object.keys(filters).length > 0) details.filters = filters;
        if (Object.keys(fluids).length > 0) details.fluids = fluids;

        const notas = [getVal(14), getVal(15)].filter(Boolean).join('. ');

        // Specs Logic
        if (filters.oil || filters.air) {
            const existing = vehicleSpecsMap.get(cleanPatente);
            if (!existing || existing.date < date) {
                vehicleSpecsMap.set(cleanPatente, {
                    date: date,
                    specs: { filters, oil: details.oil }
                });
            }
        }

        // Push to payload
        workOrdersPayload.push({
            date: date,
            finishedAt: date,
            mileage: mileage,
            price: 0,
            notes: notas,
            status: 'COMPLETED',
            clientId: vehicle.clientId,
            vehicleId: vehicle.id,
            serviceId: serviceRef.id,
            serviceDetails: details
        });
    }

    // 4. Batch Insert WorkOrders
    console.log(`\n💾 Inserting ${workOrdersPayload.length} WorkOrders...`);
    const CHUNK_SIZE = 500;
    for (let i = 0; i < workOrdersPayload.length; i += CHUNK_SIZE) {
        const chunk = workOrdersPayload.slice(i, i + CHUNK_SIZE);
        try {
            // @ts-ignore
            await prisma.workOrder.createMany({
                data: chunk
            });
            process.stdout.write('.');
        } catch (e) {
            console.error(`Error inserting chunk ${i}:`, e);
        }
    }
    console.log('\n✅ WorkOrders Inserted.');

    // 5. Update Specs (Concurrency controlled)
    console.log(`\n🧠 Updating Specs for ${vehicleSpecsMap.size} vehicles...`);
    const specs = Array.from(vehicleSpecsMap.entries());
    const UPDATE_CONCURRENCY = 20;

    for (let i = 0; i < specs.length; i += UPDATE_CONCURRENCY) {
        const batch = specs.slice(i, i + UPDATE_CONCURRENCY);
        await Promise.all(batch.map(async ([plate, data]) => {
            try {
                // @ts-ignore
                await prisma.vehicle.update({
                    where: { plate },
                    data: { specifications: data.specs }
                });
            } catch (e) { }
        }));
        process.stdout.write('.');
    }
    console.log('\n✅ Specifications Updated.');
}

migrateServices()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
