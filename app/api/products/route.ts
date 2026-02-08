import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { SyncService } from '@/lib/syncService';

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const search = searchParams.get('search');
        const page = parseInt(searchParams.get('page') || '1');
        const limit = parseInt(searchParams.get('limit') || '10');
        const skip = (page - 1) * limit;

        const where: any = { active: true };

        if (search) {
            where.OR = [
                { name: { contains: search, mode: 'insensitive' } },
                { code: { contains: search, mode: 'insensitive' } },
                { barcode: { contains: search, mode: 'insensitive' } },
                { category: { contains: search, mode: 'insensitive' } }
            ];
        }

        const [total, products] = await Promise.all([
            prisma.product.count({ where }),
            prisma.product.findMany({
                where,
                take: limit,
                skip: skip,
                orderBy: { name: 'asc' }
            })
        ]);

        return NextResponse.json({
            data: products,
            meta: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit)
            }
        });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const data = await request.json();

        const product = await prisma.product.create({
            data: {
                name: data.name,
                code: data.code || null,
                category: data.category || 'General',
                price: parseFloat(data.price),
                stock: parseInt(data.stock) || 0,
                barcode: data.barcode || null,
                active: true
            }
        });

        // Sync to Firebase
        try {
            await SyncService.syncProduct(product);
        } catch (syncError) {
            console.error('Firebase sync error:', syncError);
        }

        return NextResponse.json(product);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
