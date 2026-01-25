
import fs from 'fs';
import path from 'path';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const CLIENT_REGEX = /\('([^']*)', '([^']*)', '([^']*)'\)/g;

async function verifyClients() {
    console.log('🔍 Starting Client Verification...');

    const clientSqlPath = 'C:/Users/franc/.gemini/antigravity/scratch/Lubri/Base de datos anterior/cliente.sql';
    const clientSql = fs.readFileSync(clientSqlPath, 'utf8');

    let match;
    const legacyClients: { id: string, name: string, phone: string }[] = [];

    CLIENT_REGEX.lastIndex = 0;
    while ((match = CLIENT_REGEX.exec(clientSql)) !== null) {
        legacyClients.push({ id: match[1], name: match[2], phone: match[3] });
    }

    console.log(`Found ${legacyClients.length} clients in legacy SQL.`);

    const currentClients = await prisma.client.findMany({
        select: { name: true, phone: true }
    });

    const currentNames = new Set(currentClients.map(c => c.name.trim().toLowerCase()));
    const currentPhones = new Set(currentClients.map(c => c.phone.replace(/[^0-9]/g, '')));

    const missing = [];
    const validLegacy = legacyClients.filter(c => c.name.trim() !== '');

    for (const legacy of validLegacy) {
        const cleanPhone = legacy.phone.replace(/[^0-9]/g, '');
        const nameLower = legacy.name.trim().toLowerCase();

        let found = false;

        // Match by phone (if valid)
        if (cleanPhone.length > 6 && currentPhones.has(cleanPhone)) {
            found = true;
        }

        // Match by name
        if (!found && currentNames.has(nameLower)) {
            found = true;
        }

        if (!found) {
            missing.push(legacy);
        }
    }

    console.log(`\nVerification Results:`);
    console.log(`Total legacy records (non-empty): ${validLegacy.length}`);
    console.log(`Clients found in current DB: ${validLegacy.length - missing.length}`);
    console.log(`Missing clients: ${missing.length}`);

    if (missing.length > 0) {
        console.log(`\nSample missing clients:`);
        missing.slice(0, 10).forEach(m => console.log(` - [${m.id}] ${m.name} (${m.phone})`));
    }
}

verifyClients()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
