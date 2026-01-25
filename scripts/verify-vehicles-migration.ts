
import fs from 'fs';
import path from 'path';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const VEHICLE_REGEX = /\('([^']*)', '([^']*)', '([^']*)', '([^']*)', '([^']*)'\)/g;

async function verifyVehicles() {
    console.log('🔍 Starting Vehicle Verification...');

    const patenteSqlPath = 'C:/Users/franc/.gemini/antigravity/scratch/Lubri/Base de datos anterior/patente.sql';
    const patenteSql = fs.readFileSync(patenteSqlPath, 'utf8');

    let match;
    const legacyVehicles: { clientId: string, plate: string, brand: string, model: string }[] = [];

    VEHICLE_REGEX.lastIndex = 0;
    while ((match = VEHICLE_REGEX.exec(patenteSql)) !== null) {
        legacyVehicles.push({ clientId: match[1], plate: match[2], brand: match[3], model: match[4] });
    }

    console.log(`Found ${legacyVehicles.length} vehicle entries in legacy SQL.`);

    const currentVehicles = await prisma.vehicle.findMany({
        select: { plate: true }
    });

    const currentPlates = new Set(currentVehicles.map(v => v.plate.toUpperCase()));

    const missing = [];
    const validLegacy = legacyVehicles.filter(v => v.plate && v.plate.trim() !== '' && v.plate.toLowerCase() !== 'x');

    for (const legacy of validLegacy) {
        const cleanPlate = legacy.plate.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
        if (!currentPlates.has(cleanPlate)) {
            missing.push(legacy);
        }
    }

    console.log(`\nVerification Results:`);
    console.log(`Total valid legacy vehicles: ${validLegacy.length}`);
    console.log(`Vehicles found in current DB: ${validLegacy.length - missing.length}`);
    console.log(`Missing vehicles: ${missing.length}`);

    if (missing.length > 0) {
        console.log(`\nSample missing vehicles:`);
        missing.slice(0, 10).forEach(m => console.log(` - ${m.plate} (${m.brand} ${m.model}) - Client Legacy ID: ${m.clientId}`));
    }
}

verifyVehicles()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
