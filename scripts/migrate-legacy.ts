import fs from 'fs';
import path from 'path';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Legacy Interfaces
interface LegacyClient {
    id: string; // IDCLIENTE
    name: string; // NOMBRE
    phone: string; // TELEFONO
}

interface LegacyVehicle {
    clientId: string; // iDCLIENTE
    plate: string; // PATENTE
    brand: string; // MARCA
    model: string; // MODELO
    year: string; // AÑO
}

// Regex to match INSERT VALUES
// VALUES ('100000002', 'JAVIER SISTEMA', '1168564644')
const CLIENT_REGEX = /\('([^']*)', '([^']*)', '([^']*)'\)/g;

// VALUES ('100000002', 'JDN238', 'TOYOTA', 'COROLLA XI', '2010')
const VEHICLE_REGEX = /\('([^']*)', '([^']*)', '([^']*)', '([^']*)', '([^']*)'\)/g;

async function migrate() {
    console.log('🚀 Starting Migration...');

    // --- 1. Migrate Clients ---
    console.log('📖 Reading cliente.sql...');
    const clientSqlPath = path.join(process.cwd(), '../Base de datos anterior', 'cliente.sql');
    const clientSql = fs.readFileSync(clientSqlPath, 'utf8');

    const clientsMap = new Map<string, number>(); // LegacyID -> NewID
    let match;
    let clientCount = 0;

    // Reset Regex state usually not needed with loop but good practice if reused
    CLIENT_REGEX.lastIndex = 0;

    while ((match = CLIENT_REGEX.exec(clientSql)) !== null) {
        const [_, id, name, phone] = match;

        // Skip empty or invalid names if necessary
        if (!name || name.trim() === '') continue;

        const cleanPhone = phone ? phone.replace(/[^0-9]/g, '') : '';

        try {
            // Upsert Client
            // We'll use phone as unique key if present, otherwise just create (or try to find by name)
            // Since phone is not unique in legacy (some are empty), we rely on name + phone combo or just create new.
            // To be safe and avoid duplicates if running multiple times, let's try to find first.

            let client = await prisma.client.findFirst({
                where: {
                    name: name.trim(),
                    // Only check phone if it's substantial
                    ...(cleanPhone.length > 5 ? { phone: cleanPhone } : {})
                }
            });

            if (!client) {
                client = await prisma.client.create({
                    data: {
                        name: name.trim(),
                        phone: cleanPhone
                    }
                });
            }

            clientsMap.set(id, client.id);
            clientCount++;
            if (clientCount % 50 === 0) process.stdout.write('.');

        } catch (e) {
            console.error(`\n❌ Error migrating client ${name}:`, e);
        }
    }
    console.log(`\n✅ Processed ${clientCount} clients.`);


    // --- 2. Migrate Vehicles ---
    console.log('📖 Reading patente.sql...');
    const vehicleSqlPath = path.join(process.cwd(), '../Base de datos anterior', 'patente.sql');
    const vehicleSql = fs.readFileSync(vehicleSqlPath, 'utf8');

    let vehicleCount = 0;
    VEHICLE_REGEX.lastIndex = 0;

    while ((match = VEHICLE_REGEX.exec(vehicleSql)) !== null) {
        const [_, clientId, plate, brand, model, yearStr] = match;

        if (!plate || plate.trim() === '' || plate === 'x') continue; // Skip invalid plates

        const newClientId = clientsMap.get(clientId);

        if (!newClientId) {
            // console.warn(`\n⚠️ Vehicle ${plate} skipped: Legacy Client ID ${clientId} not found.`);
            continue;
        }

        const cleanPlate = plate.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
        const cleanYear = parseInt(yearStr) || null;

        try {
            const vehicle = await prisma.vehicle.upsert({
                where: { plate: cleanPlate },
                update: {
                    clientId: newClientId, // Link to found client
                    brand: brand || undefined,
                    model: model || undefined,
                    year: cleanYear || undefined
                },
                create: {
                    plate: cleanPlate,
                    brand: brand || 'Desconocido',
                    model: model || 'Desconocido',
                    year: cleanYear,
                    clientId: newClientId
                }
            });
            vehicleCount++;
            if (vehicleCount % 50 === 0) process.stdout.write('.');
        } catch (e) {
            console.error(`\n❌ Error migrating vehicle ${cleanPlate}:`, e);
        }
    }

    console.log(`\n✅ Processed ${vehicleCount} vehicles.`);
    console.log('🎉 Migration Complete!');
}

migrate()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
