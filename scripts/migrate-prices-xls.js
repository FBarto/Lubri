
const XLSX = require('xlsx');
const path = require('path');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
    const excelPath = path.join(__dirname, '../../Base de datos anterior/MASTERFILT-CLIENTES-2025-10-06-2.xls');

    console.log(`Reading Excel file from: ${excelPath}`);
    const workbook = XLSX.readFile(excelPath);
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];

    // Read row by row. Based on analysis:
    // Column 0 (A): Code (e.g. AMP 1001)
    // Column 5 (F): Description
    // Column 9 (J): Price (List Price)

    const data = XLSX.utils.sheet_to_json(worksheet, { header: 1, range: 0, defval: null });

    console.log(`Found ${data.length} rows.`);

    let createdCount = 0;
    let updatedCount = 0;
    let skippedCount = 0;

    for (let i = 0; i < data.length; i++) {
        const row = data[i];
        const code = row[0] ? String(row[0]).trim() : null;
        const description = row[5] ? String(row[5]).trim() : null;
        const priceRaw = row[9]; // Column J seems to be the price based on preview (71572...)

        if (!code || !description || !priceRaw || typeof priceRaw !== 'number') {
            // console.log(`Skipping row ${i}: Missing data or invalid price. Code: ${code}`);
            skippedCount++;
            continue;
        }

        const listPrice = parseFloat(priceRaw);
        const cost = listPrice * 0.55; // Cost is List Price - 45%

        // Determine category based on Code prefix or Description
        let category = "GENERAL";
        if (code.startsWith("AMP") || description.toUpperCase().includes("AIRE")) category = "FILTRO DE AIRE";
        if (code.startsWith("MAP") || description.toUpperCase().includes("ACEITE")) category = "FILTRO DE ACEITE";
        if (code.startsWith("ECO")) category = "FILTRO ECOLOGICO";
        if (code.startsWith("ACP")) category = "FILTRO HABITACULO";

        try {
            // Check if product exists
            const existingProduct = await prisma.product.findUnique({
                where: { code: code }
            });

            if (existingProduct) {
                // Update existing
                await prisma.product.update({
                    where: { id: existingProduct.id },
                    data: {
                        price: listPrice,
                        cost: cost,
                        name: description,
                        category: category
                        // We don't overwrite stock or other fields aimed to be persistent
                    }
                });
                updatedCount++;
                // console.log(`Updated: ${code} - $${listPrice}`);
            } else {
                // Create new
                await prisma.product.create({
                    data: {
                        code: code,
                        name: description,
                        price: listPrice,
                        cost: cost,
                        markup: 45, // Suggested markup to return to list price roughly? Or store margin. 
                        // If Cost is 55% of Price, Margin is (Price - Cost) / Cost = (1 - 0.55)/0.55 = 0.45/0.55 = 81% markup on cost?
                        // Let's stick to simple logic: Price is set, Cost is set. Markup field is informational.
                        category: category,
                        stock: 0,
                        active: true
                    }
                });
                createdCount++;
                // console.log(`Created: ${code} - $${listPrice}`);
            }
        } catch (err) {
            console.error(`Error processing ${code}:`, err);
        }
    }

    console.log("Migration Complete.");
    console.log(`Created: ${createdCount}`);
    console.log(`Updated: ${updatedCount}`);
    console.log(`Skipped: ${skippedCount} (Empty or Header rows)`);
}

main()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
