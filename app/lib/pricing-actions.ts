'use server';

import { prisma } from '../../lib/prisma';
import { revalidatePath } from "next/cache";

export async function getUniqueSuppliers() {
    try {
        const suppliers = await prisma.product.findMany({
            select: { supplier: true },
            distinct: ['supplier'],
            where: { supplier: { not: null } }
        });
        return { success: true, daa: suppliers.map(s => s.supplier).filter(Boolean) as string[] };
    } catch (error) {
        return { success: false, error: 'Failed to fetch suppliers' };
    }
}

export async function updateProductPricing(id: number, data: {
    cost?: number,
    markup?: number,
    price?: number,
    supplier?: string
}) {
    try {
        // Validation: If price is not provided, calculate it from cost + markup
        let finalPrice = data.price;

        if (finalPrice === undefined && data.cost !== undefined && data.markup !== undefined) {
            finalPrice = data.cost * (1 + (data.markup / 100));
        }

        // If generic "price" update (Option B), we might want to keep markup consistent or just let it drift.
        // For Option B (Set Price), we usually don't change cost, just price. Markup becomes implied.
        // Let's just update what is sent.

        await prisma.product.update({
            where: { id },
            data: {
                ...(data.cost !== undefined && { cost: data.cost }),
                ...(data.markup !== undefined && { markup: data.markup }),
                ...(data.supplier !== undefined && { supplier: data.supplier }),
                ...(finalPrice !== undefined && { price: finalPrice }),
            }
        });

        revalidatePath('/employee');
        return { success: true };
    } catch (error) {
        console.error("Error updating price:", error);
        return { success: false, error: 'Database update failed' };
    }
}

export async function bulkUpdateMarkup(supplier: string, newMarkup: number) {
    try {
        if (!supplier) return { success: false, error: 'Supplier required' };

        // 1. Find all products by supplier
        const products = await prisma.product.findMany({
            where: { supplier }
        });

        // 2. Client-side loop equivalent (Prisma doesn't support computed updates easily in updateMany without raw SQL)
        // We want Price = Cost * (1 + newMarkup/100)
        // updateMany can update 'markup' but can't reference 'cost' column to set 'price' in one go easily safely across DBs in Prisma.
        // We will execute a raw query or loop. Loop is safer for small catalogs (<10k items).

        // Let's try raw query for performance if PostgreSQL
        // "UPDATE Product SET markup = $1, price = cost * (1 + $1/100) WHERE supplier = $2"

        // Safe approach: Loop (we likely have < 5000 products)
        const updates = products.map(p => prisma.product.update({
            where: { id: p.id },
            data: {
                markup: newMarkup,
                price: p.cost * (1 + (newMarkup / 100))
            }
        }));

        await prisma.$transaction(updates);

        revalidatePath('/employee');
        return { success: true, count: updates.length };

    } catch (error) {
        console.error("Error bulk updating:", error);
        return { success: false, error: 'Bulk update failed' };
    }
}

export async function searchProductsExtended(query: string = '') {
    try {
        const where: any = { active: true };
        if (query) {
            where.OR = [
                { name: { contains: query, mode: 'insensitive' } },
                { code: { contains: query, mode: 'insensitive' } },
                { supplier: { contains: query, mode: 'insensitive' } }
            ];
        }

        const products = await prisma.product.findMany({
            where,
            orderBy: { name: 'asc' },
            take: 100
        });

        return { success: true, data: products };
    } catch (error) {
        return { success: false, error: 'Search failed' };
    }
}
