import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import readline from 'readline';

const prisma = new PrismaClient();

async function loadFramAndCastrol() {
    console.log('🔧 Cargando SOLO Filtros FRAM y Aceites CASTROL...\n');

    const filePath = 'C:/Users/franc/.gemini/antigravity/scratch/Lubri/Base de datos anterior/articulos.sql';
    const fileStream = fs.createReadStream(filePath);

    const rl = readline.createInterface({
        input: fileStream,
        crlfDelay: Infinity
    });

    const framFilters: any[] = [];
    const castrolOils: any[] = [];

    // Regex to extract (id, 'code', 'description', 'brand', ...)
    const tupleRegex = /\((\d+),\s*'([^']*)',\s*'([^']*)',\s*'([^']*)'/g;

    for await (const line of rl) {
        let match;
        while ((match = tupleRegex.exec(line)) !== null) {
            const code = match[2];
            const desc = match[3];
            const brand = match[4];

            // FRAM filters (oil filters mostly)
            if (brand === 'FRAM' && (code.startsWith('F') || code.startsWith('PH'))) {
                framFilters.push({ code, desc, brand });
            }

            // CASTROL oils
            if (brand === 'CASTROL' || desc.toUpperCase().includes('CASTROL')) {
                castrolOils.push({ code, desc, brand });
            }
        }
    }

    console.log(`✅ Encontrados ${framFilters.length} filtros FRAM`);
    console.log(`✅ Encontrados ${castrolOils.length} aceites CASTROL\n`);

    // Create products in database
    let createdCount = 0;

    // Load FRAM filters
    for (const item of framFilters.slice(0, 50)) { // Limit to top 50 most common
        const productCode = item.code.replace(/\//g, '-').toUpperCase();

        const existing = await prisma.product.findFirst({
            where: { code: productCode }
        });

        if (!existing) {
            await prisma.product.create({
                data: {
                    name: `Filtro Aceite Fram ${item.code}`,
                    category: 'OIL_FILTER',
                    price: 8500,
                    stock: 10,
                    code: productCode,
                    active: true
                }
            });
            createdCount++;
            console.log(`  ➕ Creado: ${productCode} - ${item.desc.substring(0, 50)}`);
        }
    }

    // Load CASTROL oils
    for (const item of castrolOils.slice(0, 20)) { // Limit to top 20
        const productCode = item.code.replace(/\//g, '-').toUpperCase();

        const existing = await prisma.product.findFirst({
            where: { code: productCode }
        });

        if (!existing) {
            await prisma.product.create({
                data: {
                    name: item.desc.substring(0, 100),
                    category: 'ENGINE_OIL',
                    price: 45000,
                    stock: 15,
                    code: productCode,
                    active: true
                }
            });
            createdCount++;
            console.log(`  ➕ Creado: ${productCode} - ${item.desc.substring(0, 50)}`);
        }
    }

    console.log(`\n✅ Total productos creados: ${createdCount}`);
}

loadFramAndCastrol()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
