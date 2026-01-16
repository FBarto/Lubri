import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { SyncService } from '@/lib/syncService';

export async function PUT(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const data = await request.json();
        const { id: idStr } = await params;
        const id = parseInt(idStr);

        const product = await prisma.product.update({
            where: { id },
            data: {
                name: data.name,
                code: data.code || null,
                category: data.category,
                price: parseFloat(data.price),
                stock: parseInt(data.stock),
                barcode: data.barcode || null
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

export async function DELETE(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id: idStr } = await params;
        const id = parseInt(idStr);

        const product = await prisma.product.update({
            where: { id },
            data: { active: false }
        });

        // Sync to Firebase as deleted (active: false)
        try {
            await SyncService.syncProduct(product);
        } catch (syncError) {
            console.error('Firebase sync error:', syncError);
        }

        return NextResponse.json({ success: true });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
