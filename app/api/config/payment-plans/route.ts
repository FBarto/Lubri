import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
    try {
        const plans = await prisma.paymentPlan.findMany({
            where: { active: true },
            orderBy: { installments: 'asc' }
        });
        return NextResponse.json(plans);
    } catch (error) {
        console.error('Error fetching payment plans:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
