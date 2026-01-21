
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    console.log('🌱 Seeding Comprehensive Product Database...');

    const products = [
        // ACEITES (OILS)
        // Shell
        { name: 'Shell Helix HX7 10W-40 1L', category: 'ENGINE_OIL', price: 12000, stock: 50 },
        { name: 'Shell Helix HX7 10W-40 4L', category: 'ENGINE_OIL', price: 42000, stock: 20 },
        { name: 'Shell Helix Ultra 5W-40 1L', category: 'ENGINE_OIL', price: 18000, stock: 40 },
        { name: 'Shell Helix Ultra 5W-40 4L', category: 'ENGINE_OIL', price: 65000, stock: 15 },
        { name: 'Shell Helix HX5 15W-40 1L', category: 'ENGINE_OIL', price: 9500, stock: 60 },
        { name: 'Shell Helix HX5 15W-40 4L', category: 'ENGINE_OIL', price: 34000, stock: 30 },

        // YPF Elaion
        { name: 'Elaion F50 10W-40 1L', category: 'ENGINE_OIL', price: 11500, stock: 50 },
        { name: 'Elaion F50 10W-40 4L', category: 'ENGINE_OIL', price: 40000, stock: 20 },
        { name: 'Elaion Auro 5W-30 D1 1L', category: 'ENGINE_OIL', price: 19000, stock: 30 },
        { name: 'Elaion Auro 5W-30 D1 4L', category: 'ENGINE_OIL', price: 68000, stock: 10 },

        // Total
        { name: 'Total Quartz 7000 10W-40 1L', category: 'ENGINE_OIL', price: 12500, stock: 45 },
        { name: 'Total Quartz 7000 10W-40 4L', category: 'ENGINE_OIL', price: 43000, stock: 18 },
        { name: 'Total Quartz 9000 5W-40 1L', category: 'ENGINE_OIL', price: 18500, stock: 35 },
        { name: 'Total Quartz 9000 5W-40 4L', category: 'ENGINE_OIL', price: 66000, stock: 12 },

        // Castrol
        { name: 'Castrol Magnatec 10W-40 1L', category: 'ENGINE_OIL', price: 13000, stock: 40 },
        { name: 'Castrol Magnatec 10W-40 4L', category: 'ENGINE_OIL', price: 46000, stock: 15 },

        // FILTROS (FILTERS)
        // Aceite
        { name: 'Filtro Aceite Fram PH5949', category: 'OIL_FILTER', price: 8500, stock: 25 },
        { name: 'Filtro Aceite Fram PH3593A', category: 'OIL_FILTER', price: 8200, stock: 20 },
        { name: 'Filtro Aceite Mann W712/75', category: 'OIL_FILTER', price: 12000, stock: 15 },
        { name: 'Filtro Aceite Mann W914/2', category: 'OIL_FILTER', price: 11500, stock: 18 },
        { name: 'Filtro Aceite Wega WO-200', category: 'OIL_FILTER', price: 7800, stock: 30 },
        { name: 'Filtro Aceite Wega WO-120', category: 'OIL_FILTER', price: 7500, stock: 25 },

        // Aire
        { name: 'Filtro Aire Fram CA9999', category: 'AIR_FILTER', price: 9200, stock: 20 },
        { name: 'Filtro Aire Mann C 29 108', category: 'AIR_FILTER', price: 14000, stock: 10 },
        { name: 'Filtro Aire Wega FAP-4043', category: 'AIR_FILTER', price: 8500, stock: 22 },

        // Combustible
        { name: 'Filtro Combustible Fram G5900', category: 'FUEL_FILTER', price: 6500, stock: 30 },
        { name: 'Filtro Combustible Mann WK 512/1', category: 'FUEL_FILTER', price: 9500, stock: 15 },

        // Habitaculo
        { name: 'Filtro Habitaculo Fram CF10285', category: 'CABIN_FILTER', price: 10500, stock: 12 },
        { name: 'Filtro Habitaculo Wega AKX-35323', category: 'CABIN_FILTER', price: 9000, stock: 18 },

        // ADITIVOS & VARIOS
        { name: 'Aditivo Liqui Moly Ceratec', category: 'ADDITIVE', price: 25000, stock: 8 },
        { name: 'Limpiainyectores Molykote', category: 'ADDITIVE', price: 8000, stock: 20 },
        { name: 'Agua Destilada 5L', category: 'OTHER', price: 3000, stock: 50 },
        { name: 'Líquido Refrigerante Tir 1L', category: 'COOLANT', price: 5500, stock: 40 },
        { name: 'Lámpara H7 Osram', category: 'LIGHTING', price: 4500, stock: 60 }
    ];

    let createdCount = 0;
    for (const p of products) {
        // Upsert to avoid duplicates but update prices/stock
        const existing = await prisma.product.findFirst({ where: { name: p.name } });
        if (existing) {
            await prisma.product.update({
                where: { id: existing.id },
                data: {
                    price: p.price,
                    stock: p.stock,
                    category: p.category, // Update category to enum likely
                    active: true
                }
            });
        } else {
            await prisma.product.create({
                data: {
                    name: p.name,
                    category: p.category,
                    price: p.price,
                    stock: p.stock,
                    active: true
                }
            });
            createdCount++;
        }
    }
    console.log(`✅ Database Seeded! Created ${createdCount} new products. Updated ${products.length - createdCount}.`);
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
