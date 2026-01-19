
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

interface ProductImport {
    name: string;
    code?: string;
    barcode?: string;
    category?: string;
    price: number;
    stock: number;
    minStock?: number;
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const products: ProductImport[] = body.products;

        if (!Array.isArray(products) || products.length === 0) {
            return NextResponse.json({ error: 'No products provided' }, { status: 400 });
        }

        let createdCount = 0;
        let updatedCount = 0;
        let errors: string[] = [];

        // We process sequentially or in chunks to avoid overwhelming DB or deadlocks if massive
        // For < 1000 items, sequential loop is fine.

        for (const p of products) {
            try {
                // Determine identifier: Code > Barcode > Name
                // We try to find existing product
                let existing = null;

                if (p.code) existing = await prisma.product.findFirst({ where: { code: p.code } });
                if (!existing && p.barcode) existing = await prisma.product.findFirst({ where: { barcode: p.barcode } });
                if (!existing && p.name) existing = await prisma.product.findFirst({ where: { name: p.name } });

                if (existing) {
                    // Update
                    await prisma.product.update({
                        where: { id: existing.id },
                        data: {
                            name: p.name || existing.name, // Keep existing name if input is empty? Usually overwrite.
                            price: p.price ?? existing.price,
                            stock: p.stock ?? existing.stock, // Or should we add? Usually import overwrites current stock or adds? "Initial Load" implies overwrite.
                            category: p.category || existing.category,
                            code: p.code || existing.code,
                            barcode: p.barcode || existing.barcode
                        }
                    });
                    updatedCount++;
                } else {
                    // Create
                    await prisma.product.create({
                        data: {
                            name: p.name,
                            code: p.code || null,
                            barcode: p.barcode || null,
                            category: p.category || 'GENERAL',
                            price: p.price || 0,
                            stock: p.stock || 0,
                            minStock: p.minStock || 0
                        }
                    });
                    createdCount++;
                }
            } catch (e: any) {
                console.error(`Error processing ${p.name}:`, e);
                errors.push(`Error al importar "${p.name}": ${e.message}`);
            }
        }

        return NextResponse.json({
            success: true,
            summary: {
                total: products.length,
                created: createdCount,
                updated: updatedCount,
                errors: errors
            }
        });

    } catch (error) {
        console.error('Batch Import Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
