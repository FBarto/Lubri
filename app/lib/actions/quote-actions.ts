'use server';

import { prisma } from '@/lib/prisma';
import { QuoteStatus, Quote, QuoteItem } from '@prisma/client';
import { revalidatePath } from 'next/cache';

export async function searchQuoteItems(query: string) {
    if (!query || query.length < 2) return [];

    const products = await prisma.product.findMany({
        where: {
            OR: [
                { name: { contains: query, mode: 'insensitive' } },
                { code: { contains: query, mode: 'insensitive' } },
                { barcode: { contains: query, mode: 'insensitive' } },
            ],
            active: true
        },
        take: 10
    });

    const services = await prisma.service.findMany({
        where: {
            name: { contains: query, mode: 'insensitive' },
            active: true
        },
        take: 10
    });

    return [
        ...products.map(p => ({
            id: `p-${p.id}`,
            description: p.name,
            unitPrice: p.price,
            kind: 'PRODUCT',
            originalId: p.id
        })),
        ...services.map(s => ({
            id: `s-${s.id}`,
            description: s.name,
            unitPrice: s.price,
            kind: 'LABOR',
            originalId: s.id
        }))
    ];
}

interface QuoteUpdateData {
    items: {
        description: string;
        quantity: number;
        unitPrice: number;
        kind: string;
    }[];
    discount?: number;
    paymentTerms?: string;
}

export async function saveQuote(caseId: string, data: QuoteUpdateData) {
    try {
        const subtotal = data.items.reduce((acc, item) => acc + (item.quantity * item.unitPrice), 0);
        const total = subtotal - (data.discount || 0);

        // upsert Quote
        const quote = await prisma.quote.upsert({
            where: { leadCaseId: caseId },
            update: {
                subtotal,
                discount: data.discount || 0,
                total,
                paymentTerms: data.paymentTerms,
                items: {
                    deleteMany: {}, // Simplest way to update items: clear and recreate
                    create: data.items.map(item => ({
                        description: item.description,
                        quantity: item.quantity,
                        unitPrice: item.unitPrice,
                        lineTotal: item.quantity * item.unitPrice,
                        kind: item.kind
                    }))
                }
            },
            create: {
                leadCaseId: caseId,
                subtotal,
                discount: data.discount || 0,
                total,
                paymentTerms: data.paymentTerms,
                status: 'DRAFT',
                items: {
                    create: data.items.map(item => ({
                        description: item.description,
                        quantity: item.quantity,
                        unitPrice: item.unitPrice,
                        lineTotal: item.quantity * item.unitPrice,
                        kind: item.kind
                    }))
                }
            }
        });

        // Update Case status to QUOTED if it was in NEW or IN_PROGRESS
        const parentCase = await prisma.leadCase.findUnique({ where: { id: caseId } });
        if (parentCase && (parentCase.status === 'NEW' || parentCase.status === 'IN_PROGRESS')) {
            await prisma.leadCase.update({
                where: { id: caseId },
                data: { status: 'QUOTED' }
            });
        }

        revalidatePath(`/admin/inbox/${caseId}`);
        return { success: true, quoteId: quote.id };
    } catch (error: any) {
        console.error('Error saving quote:', error);
        return { success: false, error: error.message };
    }
}

export async function updateQuoteStatus(quoteId: string, status: QuoteStatus) {
    try {
        const quote = await prisma.quote.update({
            where: { id: quoteId },
            data: { status },
            include: { leadCase: true }
        });

        if (status === 'ACCEPTED') {
            await prisma.leadCase.update({
                where: { id: quote.leadCaseId },
                data: { status: 'WON' }
            });
        } else if (status === 'REJECTED') {
            await prisma.leadCase.update({
                where: { id: quote.leadCaseId },
                data: { status: 'LOST', closeReason: 'Presupuesto rechazado' }
            });
        }

        revalidatePath(`/admin/inbox/${quote.leadCaseId}`);
        return { success: true };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}
