import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
    try {
        // Group by brand and model to find the most popular combinations
        const topVehicles = await prisma.vehicle.groupBy({
            by: ['brand', 'model'],
            _count: {
                _all: true
            },
            orderBy: {
                _count: {
                    brand: 'desc'  // Fallback if _all fails, but for count we usually need a field? 
                    // Actually, Prisma documentation says: orderBy: { _count: { field: 'desc' } }
                    // If we want count of rows, we often use a field that is unique or present.
                    // But let's try `_all` which is standard for "count(*)"
                }
            },
            take: 10
        });

        // Wait, the sorting might not work as expected with just `brand`.
        // Let's do a safe fetch and sort in Javascript if the dataset is small? 
        // No, we should use DB.
        // Let's try `orderBy: { _count: { _all: 'desc' } }`.

        // If that's risky, let's look at `prisma/schema.prisma`, there is no specific field guarantee.
        // Let's use `orderBy: { _count: { id: 'desc' } }` wouldn't work because `id` is not in `by`.

        // Let's try a simpler approach: Raw query or just fetch all grouped and sort JS.
        // Grouping all brands/models shouldn't be THAT huge yet.
        // The user has a Lubricentro, maybe 1000 cars? 5000? 
        // Fetching all groups might be fine.

        // Let's use:
        const groups = await prisma.vehicle.groupBy({
            by: ['brand', 'model'],
            _count: { _all: true },
        });

        const sorted = groups
            .sort((a, b) => b._count._all - a._count._all)
            .slice(0, 10);

        return NextResponse.json(sorted);

    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
