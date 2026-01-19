
import { PrismaClient } from '@prisma/client';
import { differenceInDays, addDays } from 'date-fns';

const prisma = new PrismaClient();

const DEFAULT_SERVICE_INTERVAL_KM = 10000;
const MIN_DATA_POINTS = 2;

async function calculateVehicleUsage(vehicleId: number) {
    try {
        const history = await prisma.workOrder.findMany({
            where: {
                vehicleId,
                status: { in: ['COMPLETED', 'DELIVERED'] },
                mileage: { not: null }
            },
            orderBy: { date: 'desc' },
            take: 5,
            select: { date: true, mileage: true }
        });

        if (history.length < MIN_DATA_POINTS) return null;

        const sortedHistory = history.sort((a, b) => a.date.getTime() - b.date.getTime());
        const firstDate = sortedHistory[0].date;
        const dataPoints = sortedHistory.map(record => ({
            days: differenceInDays(record.date, firstDate),
            mileage: record.mileage as number
        }));

        const n = dataPoints.length;
        const sumX = dataPoints.reduce((acc, p) => acc + p.days, 0);
        const sumY = dataPoints.reduce((acc, p) => acc + p.mileage, 0);
        const sumXY = dataPoints.reduce((acc, p) => acc + (p.days * p.mileage), 0);
        const sumXX = dataPoints.reduce((acc, p) => acc + (p.days * p.days), 0);

        const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);

        if (slope <= 0) return null;

        const lastRecord = sortedHistory[sortedHistory.length - 1];
        const nextTargetMileage = lastRecord.mileage! + DEFAULT_SERVICE_INTERVAL_KM;
        const daysRemaining = Math.ceil((nextTargetMileage - lastRecord.mileage!) / slope);
        const predictedDate = addDays(lastRecord.date, daysRemaining);

        await prisma.vehicle.update({
            where: { id: vehicleId },
            data: {
                averageDailyKm: slope,
                lastServiceDate: lastRecord.date,
                lastServiceMileage: lastRecord.mileage!,
                predictedNextService: predictedDate
            }
        });

        return { averageDailyKm: slope, predictedDate };
    } catch (e) {
        console.error(e);
        return null;
    }
}

async function main() {
    console.log('🔮 Starting Predictive Engine (Inline Mode)...');

    // Find our seed car if possible, or all
    const cars = await prisma.vehicle.findMany({
        where: { plate: { startsWith: 'PRED' } },
        select: { id: true, plate: true }
    });

    console.log(`Found ${cars.length} test vehicles.`);

    for (const car of cars) {
        const result = await calculateVehicleUsage(car.id);
        if (result) {
            console.log(`✅ [${car.plate}] Usage: ${result.averageDailyKm.toFixed(1)} km/day -> Next Service: ${result.predictedDate?.toISOString().split('T')[0]}`);
        } else {
            console.log(`[${car.plate}] No prediction available.`);
        }
    }
}

main()
    .catch(console.error)
    .finally(async () => await prisma.$disconnect());
