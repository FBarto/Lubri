
import { NextResponse } from 'next/server';
import { prisma } from '../../../../lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const workOrders = await prisma.workOrder.findMany({
            where: {
                status: {
                    in: ['IN_PROGRESS', 'COMPLETED']
                }
            },
            select: {
                id: true,
                status: true,
                date: true,

                vehicle: {
                    select: {
                        brand: true,
                        model: true,
                        plate: true
                    }
                },
                service: {
                    select: {
                        name: true
                    }
                }
            },
            orderBy: {
                date: 'asc'
            }
        });

        // Add a "virtual" column or simple mapping if needed, but frontend can handle it.
        return NextResponse.json(workOrders);
    } catch (error) {
        console.error('Error fetching public kanban:', error);
        return NextResponse.json({ error: 'Failed' }, { status: 500 });
    }
}
