
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { addDays } from 'date-fns';

export async function GET(request: NextRequest) {
    try {
        const today = new Date();
        const twoWeeksLater = addDays(today, 14);

        // Fetch vehicles with predicted service date within next 14 days
        // OR overdue (predicted date in the past but not completed recently?)
        // For simplicity: Predicted Date <= Today + 14 days AND Predicted Date >= Today - 30 days (don't show super old ones ideally, or maybe yes as "Overdue")

        const upcoming = await prisma.vehicle.findMany({
            where: {
                predictedNextService: {
                    lte: twoWeeksLater,
                    // gte: subDays(today, 60) // Optional: filter out ancient predictions
                }
            },
            include: {
                client: {
                    select: { name: true, phone: true }
                }
            },
            orderBy: {
                predictedNextService: 'asc'
            }
        });

        // Format for UI
        const opportunities = upcoming.map(car => ({
            id: car.id,
            plate: car.plate,
            model: `${car.brand} ${car.model}`,
            clientName: car.client.name,
            clientPhone: car.client.phone,
            predictedDate: car.predictedNextService,
            daysUntil: Math.ceil((new Date(car.predictedNextService!).getTime() - today.getTime()) / (1000 * 60 * 60 * 24)),
            confidence: car.averageDailyKm && car.averageDailyKm > 5 ? 'HIGH' : 'LOW' // Simple heuristic
        }));

        return NextResponse.json({ opportunities });
    } catch (error) {
        console.error('Error fetching opportunities:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
