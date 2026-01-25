
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    console.log('🌱 Seeding Comprehensive Product Database...');

    const products = [
        // ACEITES SUELTOS (BULK OILS - 200L)
        { name: 'Aceite Shell Helix HX7 10W-40 Suelto (x Lts)', category: 'ENGINE_OIL', price: 9500, stock: 400, code: 'SHELL-HX7-SUELTO' },
        { name: 'Aceite Elaion F30 10W-40 Suelto (x Lts)', category: 'ENGINE_OIL', price: 9000, stock: 200, code: 'ELAION-F30-SUELTO' },
        { name: 'Aceite Elaion F50 5W-40 Suelto (x Lts)', category: 'ENGINE_OIL', price: 11000, stock: 150, code: 'ELAION-F50-SUELTO' },
        { name: 'Aceite Elaion F10 15W-40 Suelto (x Lts)', category: 'ENGINE_OIL', price: 8000, stock: 300, code: 'ELAION-F10-SUELTO' },
        { name: 'Aceite Castrol Magnatec 10W-40 Suelto (x Lts)', category: 'ENGINE_OIL', price: 11500, stock: 180, code: 'CASTROL-MAGNATEC-SUELTO' },
        { name: 'Aceite Total Quartz 7000 10W-40 Suelto (x Lts)', category: 'ENGINE_OIL', price: 10500, stock: 220, code: 'TOTAL-Q7000-SUELTO' },
        { name: 'Aceite Total Quartz 5000 15W-40 Suelto (x Lts)', category: 'ENGINE_OIL', price: 8500, stock: 150, code: 'TOTAL-Q5000-SUELTO' },
        { name: 'Aceite Total Quartz 25W-60 Suelto (x Lts)', category: 'ENGINE_OIL', price: 9000, stock: 100, code: 'SUEL-25W60' },
        { name: 'Aceite ELF semi-sintetico Suelto (x Lts)', category: 'ENGINE_OIL', price: 8500, stock: 100, code: 'ELF-SEMI-SUELTO' },
        { name: 'Aceite Gulf Sintetico Suelto (x Lts)', category: 'ENGINE_OIL', price: 12000, stock: 80, code: 'GULF-SINT-SUELTO' },
        { name: 'Aceite 15W-40 Suelto (x Lts)', category: 'ENGINE_OIL', price: 7500, stock: 300, code: 'SUEL-1540' },

        // Shell
        { name: 'Shell Helix HX7 10W-40 1L', category: 'ENGINE_OIL', price: 12000, stock: 50, code: 'SHELL-HX7-1L' },
        { name: 'Shell Helix HX7 10W-40 4L', category: 'ENGINE_OIL', price: 42000, stock: 20, code: 'SHELL-HX7-4L' },
        { name: 'Shell Helix Ultra 5W-40 1L', category: 'ENGINE_OIL', price: 18000, stock: 40, code: 'SHELL-ULTRA-1L' },
        { name: 'Shell Helix Ultra 5W-40 4L', category: 'ENGINE_OIL', price: 65000, stock: 15, code: 'SHELL-ULTRA-4L' },
        { name: 'Shell Helix HX5 15W-40 1L', category: 'ENGINE_OIL', price: 9500, stock: 60, code: 'SHELL-HX5-1L' },
        { name: 'Shell Helix HX5 15W-40 4L', category: 'ENGINE_OIL', price: 34000, stock: 30, code: 'SHELL-HX5-4L' },

        // YPF Elaion
        { name: 'Elaion F50 10W-40 1L', category: 'ENGINE_OIL', price: 11500, stock: 50, code: 'ELAION-F50-1L' },
        { name: 'Elaion F50 10W-40 4L', category: 'ENGINE_OIL', price: 40000, stock: 20, code: 'ELAION-F50-4L' },
        { name: 'Elaion F30 10W-40 1L', category: 'ENGINE_OIL', price: 10500, stock: 30, code: 'ELAION-F30-1L' },
        { name: 'Elaion F30 10W-40 4L', category: 'ENGINE_OIL', price: 38000, stock: 15, code: 'ELAION-F30-4L' },
        { name: 'Elaion F10 15W-40 1L', category: 'ENGINE_OIL', price: 9000, stock: 40, code: 'ELAION-F10-1L' },
        { name: 'Elaion F10 15W-40 4L', category: 'ENGINE_OIL', price: 32000, stock: 20, code: 'ELAION-F10-4L' },
        { name: 'Elaion Auro 5W-30 D1 1L', category: 'ENGINE_OIL', price: 19000, stock: 30, code: 'ELAION-AURO-1L' },
        { name: 'Elaion Auro 5W-30 D1 4L', category: 'ENGINE_OIL', price: 68000, stock: 10, code: 'ELAION-AURO-4L' },

        // Total
        { name: 'Total Quartz 7000 10W-40 1L', category: 'ENGINE_OIL', price: 12500, stock: 45, code: 'TOTAL-Q7000-1L' },
        { name: 'Total Quartz 7000 10W-40 4L', category: 'ENGINE_OIL', price: 43000, stock: 18, code: 'TOTAL-Q7000-4L' },
        { name: 'Total Quartz 5000 15W-40 1L', category: 'ENGINE_OIL', price: 10500, stock: 25, code: 'TOTAL-Q5000-1L' },
        { name: 'Total Quartz 5000 15W-40 4L', category: 'ENGINE_OIL', price: 38000, stock: 10, code: 'TOTAL-Q5000-4L' },
        { name: 'Total Quartz 9000 5W-40 1L', category: 'ENGINE_OIL', price: 18500, stock: 35, code: 'TOTAL-Q9000-1L' },
        { name: 'Total Quartz 9000 5W-40 4L', category: 'ENGINE_OIL', price: 66000, stock: 12, code: 'TOTAL-Q9000-4L' },

        // Shell Rimula (Heavy Duty)
        { name: 'Shell Rimula R4 15W-40 1L', category: 'ENGINE_OIL', price: 11000, stock: 50, code: 'RIMULA-R4' },
        { name: 'Shell Rimula R4 15W-40 4L', category: 'ENGINE_OIL', price: 38000, stock: 20, code: 'RIMULA-R4-4L' },
        { name: 'Shell Rimula R5 10W-40 4L', category: 'ENGINE_OIL', price: 45000, stock: 15, code: 'RIMULA-R5' },
        { name: 'Shell Rimula R6 10W-40 4L', category: 'ENGINE_OIL', price: 58000, stock: 10, code: 'RIMULA-R6' },

        // Gulf
        { name: 'Aceite Gulf Ultra 0W-20 1L', category: 'ENGINE_OIL', price: 15000, stock: 30, code: 'GULF-0W20' },

        // Castrol
        { name: 'Castrol Magnatec 10W-40 1L', category: 'ENGINE_OIL', price: 13000, stock: 40, code: 'CASTROL-MAGNATEC-1L' },
        { name: 'Castrol Magnatec 10W-40 4L', category: 'ENGINE_OIL', price: 46000, stock: 15, code: 'CASTROL-MAGNATEC-4L' },
        { name: 'Castrol Edge 5W-30 4L', category: 'ENGINE_OIL', price: 62000, stock: 8, code: 'CASTROL-EDGE' },

        // Motul
        { name: 'Motul 6100 10W-40 4L', category: 'ENGINE_OIL', price: 48000, stock: 12 },
        { name: 'Motul Specific 5W-30 4L', category: 'ENGINE_OIL', price: 65000, stock: 5, code: 'MOTUL-SPECIFIC' },

        // FILTROS (FILTERS)
        // Aceite
        { name: 'Filtro Aceite MAP 182', category: 'OIL_FILTER', price: 8200, stock: 20, code: 'MAP-182' },
        { name: 'Filtro Aceite MAP 192', category: 'OIL_FILTER', price: 8300, stock: 15, code: 'MAP-192' },
        { name: 'Filtro Aceite MAP 213', category: 'OIL_FILTER', price: 8400, stock: 18, code: 'MAP-213' },
        { name: 'Filtro Aceite MAP 179', category: 'OIL_FILTER', price: 8100, stock: 12, code: 'MAP-179' },
        { name: 'Filtro Aceite MAP 3033', category: 'OIL_FILTER', price: 9200, stock: 25, code: 'MAP-3033' },
        { name: 'Filtro Aceite MAP 3013', category: 'OIL_FILTER', price: 8900, stock: 10, code: 'MAP-3013' },
        { name: 'Filtro Aceite MAP 203', category: 'OIL_FILTER', price: 8900, stock: 20, code: 'MAP-203' },
        { name: 'Filtro Aceite MAP 3008', category: 'OIL_FILTER', price: 8700, stock: 10, code: 'MAP-3008' },
        { name: 'Filtro Aceite MAP 3070', category: 'OIL_FILTER', price: 8600, stock: 12, code: 'MAP-3070' },
        { name: 'Filtro Aceite MAP 274', category: 'OIL_FILTER', price: 8800, stock: 8, code: 'MAP-274' },
        { name: 'Filtro Aceite MAP 258', category: 'OIL_FILTER', price: 8600, stock: 10, code: 'MAP-258' },
        { name: 'Filtro Aceite MAP 121', category: 'OIL_FILTER', price: 8300, stock: 12, code: 'MAP-121' },
        { name: 'Filtro Aceite MAP 187', category: 'OIL_FILTER', price: 8400, stock: 15, code: 'MAP-187' },
        { name: 'Filtro Aceite MAP 3042', category: 'OIL_FILTER', price: 9500, stock: 6, code: 'MAP-3042' },
        { name: 'Filtro Aceite MAP 3052', category: 'OIL_FILTER', price: 9200, stock: 10, code: 'MAP-3052' },
        { name: 'Filtro Aceite MAP 172', category: 'OIL_FILTER', price: 8200, stock: 15, code: 'MAP-172' },
        { name: 'Filtro Aceite MAP 193', category: 'OIL_FILTER', price: 8300, stock: 12, code: 'MAP-193' },
        { name: 'Filtro Aceite MAP 144', category: 'OIL_FILTER', price: 8100, stock: 10, code: 'MAP-144' },
        { name: 'Filtro Aceite MAP 106', category: 'OIL_FILTER', price: 8000, stock: 8, code: 'MAP-106' },
        { name: 'Filtro Aceite MAP 206', category: 'OIL_FILTER', price: 8400, stock: 7, code: 'MAP-206' },
        { name: 'Filtro Aceite MAP 200', category: 'OIL_FILTER', price: 8500, stock: 5, code: 'MAP-200' },
        { name: 'Filtro Aceite MAP 209', category: 'OIL_FILTER', price: 8600, stock: 4, code: 'MAP-209' },
        { name: 'Filtro Aceite MAP 123', category: 'OIL_FILTER', price: 8200, stock: 6, code: 'MAP-123' },
        { name: 'Filtro Aceite MAP 141', category: 'OIL_FILTER', price: 8300, stock: 3, code: 'MAP-141' },

        // Aire
        { name: 'Filtro Aire AMPI 1117', category: 'AIR_FILTER', price: 9100, stock: 15, code: 'AMPI-1117' },
        { name: 'Filtro Aire AMPI 1088', category: 'AIR_FILTER', price: 8800, stock: 20, code: 'AMPI-1088' },
        { name: 'Filtro Aire AMPI 1108', category: 'AIR_FILTER', price: 8900, stock: 18, code: 'AMPI-1108' },
        { name: 'Filtro Aire AMPI 1165', category: 'AIR_FILTER', price: 9200, stock: 12, code: 'AMPI-1165' },
        { name: 'Filtro Aire AMPI 1029', category: 'AIR_FILTER', price: 8600, stock: 10, code: 'AMPI-1029' },
        { name: 'Filtro Aire AMPI 1027', category: 'AIR_FILTER', price: 8700, stock: 11, code: 'AMPI-1027' },
        { name: 'Filtro Aire AMPI 1256', category: 'AIR_FILTER', price: 9100, stock: 14, code: 'AMPI-1256' },
        { name: 'Filtro Aire AMPI 1154', category: 'AIR_FILTER', price: 9500, stock: 15, code: 'AMPI-1154' },
        { name: 'Filtro Aire AMPI 1121', category: 'AIR_FILTER', price: 8900, stock: 10, code: 'AMPI-1121' },
        { name: 'Filtro Aire AMPI 1245', category: 'AIR_FILTER', price: 9400, stock: 10, code: 'AMPI-1245' },
        { name: 'Filtro Aire AMPI 150', category: 'AIR_FILTER', price: 9100, stock: 12, code: 'AMPI-150' },
        { name: 'Filtro Aire AMPI 1101', category: 'AIR_FILTER', price: 9200, stock: 8, code: 'AMPI-1101' },
        { name: 'Filtro Aire AMPI 1250', category: 'AIR_FILTER', price: 9600, stock: 10, code: 'AMPI-1250' },
        { name: 'Filtro Aire AMPI 1144', category: 'AIR_FILTER', price: 9400, stock: 5, code: 'AMPI-1144' },
        { name: 'Filtro Aire AMPI 1161', category: 'AIR_FILTER', price: 9300, stock: 6, code: 'AMPI-1161' },
        { name: 'Filtro Aire AMPI 1109', category: 'AIR_FILTER', price: 9100, stock: 4, code: 'AMPI-1109' },
        { name: 'Filtro Aire AMPI 1153', category: 'AIR_FILTER', price: 9500, stock: 7, code: 'AMPI-1153' },
        { name: 'Filtro Aire AMPI 1123', category: 'AIR_FILTER', price: 9000, stock: 8, code: 'AMPI-1123' },
        { name: 'Filtro Aire AMPI 1240', category: 'AIR_FILTER', price: 9700, stock: 5, code: 'AMPI-1240' },
        { name: 'Filtro Aire AMPI 1182', category: 'AIR_FILTER', price: 9200, stock: 10, code: 'AMPI-1182' },
        { name: 'Filtro Aire AMPI 1183', category: 'AIR_FILTER', price: 9300, stock: 12, code: 'AMPI-1183' },
        { name: 'Filtro Aire AMPI 1233', category: 'AIR_FILTER', price: 9100, stock: 8, code: 'AMPI-1233' },
        { name: 'Filtro Aire AMPI 1041', category: 'AIR_FILTER', price: 8900, stock: 5, code: 'AMPI-1041' },
        { name: 'Filtro Aire AMPI 1124', category: 'AIR_FILTER', price: 9400, stock: 6, code: 'AMPI-1124' },
        { name: 'Filtro Aire AMPI 1246', category: 'AIR_FILTER', price: 9500, stock: 4, code: 'AMPI-1246' },
        { name: 'Filtro Aire AMPI 1266', category: 'AIR_FILTER', price: 9600, stock: 3, code: 'AMPI-1266' },
        { name: 'Filtro Aire AMPI 1164', category: 'AIR_FILTER', price: 9300, stock: 5, code: 'AMPI-1164' },
        { name: 'Filtro Aire AMPI 1078', category: 'AIR_FILTER', price: 8800, stock: 4, code: 'AMPI-1078' },
        { name: 'Filtro Aire AMPI 1084', category: 'AIR_FILTER', price: 8700, stock: 3, code: 'AMPI-1084' },
        { name: 'Filtro Aire Tubular AMP 163', category: 'AIR_FILTER', price: 12000, stock: 4, code: 'AMP-163' },
        { name: 'Filtro Aire Tubular AMP 189', category: 'AIR_FILTER', price: 12500, stock: 3, code: 'AMP-189' },

        // Combustible
        { name: 'Filtro Combustible G10230', category: 'FUEL_FILTER', price: 7200, stock: 10, code: 'G10230' },
        { name: 'Filtro Combustible G7729', category: 'FUEL_FILTER', price: 7800, stock: 12, code: 'G7729' },
        { name: 'Filtro Combustible MC 277', category: 'FUEL_FILTER', price: 7500, stock: 8, code: 'MC-277' },
        { name: 'Filtro Combustible MC 301', category: 'FUEL_FILTER', price: 7600, stock: 5, code: 'MC-301' },

        // Habitaculo
        { name: 'Filtro Habitaculo HM 2048', category: 'CABIN_FILTER', price: 9500, stock: 20, code: 'HM-2048' },
        { name: 'Filtro Habitáculo HM 2110', category: 'CABIN_FILTER', price: 9800, stock: 10, code: 'HM-2110' },
        { name: 'Filtro Habitáculo HM 2084', category: 'CABIN_FILTER', price: 9400, stock: 8, code: 'HM-2084' },
        { name: 'Filtro Habitáculo HM 2160', category: 'CABIN_FILTER', price: 9600, stock: 5, code: 'HM-2160' },
        { name: 'Filtro Habitaculo HM 2107', category: 'CABIN_FILTER', price: 9700, stock: 12, code: 'HM-2107' },
        { name: 'Filtro Habitaculo HM 2019', category: 'CABIN_FILTER', price: 9300, stock: 10, code: 'HM-2019' },
        { name: 'Filtro Habitaculo HM 2117', category: 'CABIN_FILTER', price: 9800, stock: 8, code: 'HM-2117' },
        { name: 'Filtro Habitaculo HM 2020', category: 'CABIN_FILTER', price: 9400, stock: 6, code: 'HM-2020' },
        { name: 'Filtro Habitaculo HM 2130', category: 'CABIN_FILTER', price: 9900, stock: 5, code: 'HM-2130' },
        { name: 'Filtro Habitaculo HM 2013', category: 'CABIN_FILTER', price: 9200, stock: 4, code: 'HM-2013' },
        { name: 'Filtro Habitaculo HM 2025', category: 'CABIN_FILTER', price: 9300, stock: 3, code: 'HM-2025' },
        { name: 'Filtro Habitaculo HM 2114', category: 'CABIN_FILTER', price: 9400, stock: 2, code: 'HM-2114' },
        { name: 'Filtro Habitaculo HM 2006', category: 'CABIN_FILTER', price: 9100, stock: 5, code: 'HM-2006' },
        { name: 'Filtro Habitaculo HM 2075', category: 'CABIN_FILTER', price: 9500, stock: 6, code: 'HM-2075' },
        { name: 'Filtro Habitaculo HM 2190', category: 'CABIN_FILTER', price: 9600, stock: 4, code: 'HM-2190' },
        { name: 'Filtro Habitaculo HM 2007', category: 'CABIN_FILTER', price: 9100, stock: 3, code: 'HM-2007' },
        { name: 'Filtro Habitaculo HM 2140', category: 'CABIN_FILTER', price: 9400, stock: 2, code: 'HM-2140' },
        { name: 'Filtro Habitaculo HM 2118', category: 'CABIN_FILTER', price: 9300, stock: 3, code: 'HM-2118' },
        { name: 'Filtro Habitaculo HM 2123', category: 'CABIN_FILTER', price: 9500, stock: 2, code: 'HM-2123' },

        // Generic / Customer Provided
        { name: 'Repuesto Traído por Cliente', category: 'OTHER', price: 0, stock: 999, code: 'TRAJO' },
        { name: 'Kit de Filtros Hilux', category: 'OTHER', price: 35000, stock: 10, code: 'KIT-HILUX' },

        // ADITIVOS & VARIOS
        { name: 'Molykote A2 Turbo Additive', category: 'ADDITIVE', price: 15000, stock: 12, code: 'MOLYKOTE-A2' },
        { name: 'Molykote A4 Turbo Additive', category: 'ADDITIVE', price: 18000, stock: 10, code: 'MOLYKOTE-A4' },
        { name: 'Aditivo Patriot Power', category: 'ADDITIVE', price: 22000, stock: 5, code: 'PATRIOT-POWER' },
        { name: 'Aditivo Liqui Moly Ceratec', category: 'ADDITIVE', price: 25000, stock: 8 },
        { name: 'Limpiainyectores Molykote', category: 'ADDITIVE', price: 8000, stock: 20 },
        { name: 'Agua Destilada 5L', category: 'OTHER', price: 3000, stock: 50 },
        { name: 'Líquido Refrigerante Tir 1L', category: 'COOLANT', price: 5500, stock: 40 },
        { name: 'Refrigerante Glacelf Concentrado 1L', category: 'COOLANT', price: 8500, stock: 25, code: 'GLACELF' },
        { name: 'Refrigerante Raytel Concentrado 1L', category: 'COOLANT', price: 7500, stock: 20, code: 'RAYTEL' },
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
                    category: p.category,
                    code: p.code || null,
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
                    code: p.code || null,
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
