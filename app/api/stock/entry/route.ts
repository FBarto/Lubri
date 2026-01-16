import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/auth';

export async function POST(request: Request) {
    try {
        const session = await auth();

        // Ensure user is authenticated
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { items } = body;

        if (!items || !Array.isArray(items) || items.length === 0) {
            return NextResponse.json({ error: 'Invalid items payload' }, { status: 400 });
        }

        // Get user ID from session
        const userId = parseInt(session.user.id);

        await prisma.$transaction(async (tx) => {
            for (const item of items) {
                const { productId, quantity } = item;

                if (!productId || !quantity || quantity <= 0) {
                    throw new Error(`Invalid item data for product ${productId}`);
                }

                // Update product stock
                const product = await tx.product.update({
                    where: { id: productId },
                    data: {
                        stock: {
                            increment: quantity
                        }
                    }
                });

                // Create audit log
                await tx.auditLog.create({
                    data: {
                        userId: userId,
                        action: 'STOCK_ENTRY',
                        entity: 'PRODUCT',
                        entityId: productId.toString(),
                        details: JSON.stringify({
                            previousStock: product.stock - quantity,
                            added: quantity,
                            newStock: product.stock,
                            productName: product.name
                        })
                    }
                });
            }
        });

        return NextResponse.json({ success: true, message: 'Stock updated successfully' });

    } catch (error: any) {
        console.error('Error updating stock:', error);
        return NextResponse.json(
            { error: error.message || 'Internal Server Error' },
            { status: 500 }
        );
    }
}
