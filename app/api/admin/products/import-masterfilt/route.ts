import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import * as XLSX from 'xlsx';

export async function POST(request: Request) {
    try {
        const formData = await request.formData();
        const file = formData.get('file') as File;

        if (!file) {
            return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
        }

        const buffer = await file.arrayBuffer();
        const workbook = XLSX.read(buffer, { type: 'buffer' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];

        // Use header: 1 to get array of arrays
        const data: any[][] = XLSX.utils.sheet_to_json(worksheet, { header: 1, range: 0, defval: null });

        let createdCount = 0;
        let updatedCount = 0;
        let skippedCount = 0;

        // Start processing. Assuming same format as verified:
        // Col 0: Code, Col 5: Name, Col 9: List Price

        for (let i = 0; i < data.length; i++) {
            const row = data[i];
            const code = row[0] ? String(row[0]).trim() : null;
            const description = row[5] ? String(row[5]).trim() : null;
            const priceRaw = row[9];

            if (!code || !description || !priceRaw || typeof priceRaw !== 'number') {
                skippedCount++;
                continue;
            }

            const listPrice = typeof priceRaw === 'number' ? priceRaw : parseFloat(String(priceRaw));
            const cost = listPrice * 0.55; // 45% discount

            // Categorization logic
            let category = "GENERAL";
            if (code.startsWith("AMP") || description.toUpperCase().includes("AIRE")) category = "FILTRO DE AIRE";
            if (code.startsWith("MAP") || description.toUpperCase().includes("ACEITE")) category = "FILTRO DE ACEITE";
            if (code.startsWith("ECO")) category = "FILTRO ECOLOGICO";
            if (code.startsWith("ACP")) category = "FILTRO HABITACULO";
            if (code.startsWith("HM")) category = "FILTRO DE HABITACULO"; // Adding HM based on verification data

            try {
                const existingProduct = await prisma.product.findUnique({
                    where: { code: code }
                });

                if (existingProduct) {
                    await prisma.product.update({
                        where: { id: existingProduct.id },
                        data: {
                            price: listPrice,
                            cost: cost,
                            name: description,
                            category: category,
                            // Maintain active status or ensure it's active? Defaulting to not changing it unless needed.
                        }
                    });
                    updatedCount++;
                } else {
                    await prisma.product.create({
                        data: {
                            code: code,
                            name: description,
                            price: listPrice,
                            cost: cost,
                            markup: 45,
                            category: category,
                            stock: 0,
                            active: true
                        }
                    });
                    createdCount++;
                }
            } catch (err) {
                console.error(`Error processing ${code}:`, err);
                skippedCount++;
            }
        }

        return NextResponse.json({
            success: true,
            stats: {
                created: createdCount,
                updated: updatedCount,
                skipped: skippedCount
            }
        });

    } catch (error: any) {
        console.error('Import error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
