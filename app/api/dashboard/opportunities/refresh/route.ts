
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { calculateVehicleUsage } from '@/lib/services/predictive-maintenance';

export async function POST() {
    try {
        console.log('[API] Starting Manual Prediction Refresh...');

        // Fetch all active vehicles (optimizable: fetch only those with recent services)
        const vehicles = await prisma.vehicle.findMany({
            select: { id: true }
        });

        let updated = 0;
        for (const v of vehicles) {
            const res = await calculateVehicleUsage(v.id);
            if (res) updated++;
        }

        return NextResponse.json({ success: true, updatedCount: updated });
    } catch (error) {
        console.error('Error refreshing predictions:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
