
import { PrismaClient } from '@prisma/client';
import { differenceInDays, addDays } from 'date-fns';

const prisma = new PrismaClient();

// Configuration
const DEFAULT_SERVICE_INTERVAL_KM = 10000;
const MIN_DATA_POINTS = 2; // Need at least 2 service records to calculate a slope

interface PredictionResult {
    vehicleId: number;
    averageDailyKm: number;
    predictedDate: Date | null;
    confidence: 'HIGH' | 'LOW' | 'NONE';
    lastServiceDate: Date;
    lastServiceMileage: number;
}

/**
 * Calculates the average daily usage and predicts the next service date for a vehicle.
 * Uses Linear Regression on the last N WorkOrders.
 */
export async function calculateVehicleUsage(vehicleId: number): Promise<PredictionResult | null> {
    try {
        // 1. Fetch History (Oil Changes only ideally, but for now all COMPLETED WOs with mileage)
        const history = await prisma.workOrder.findMany({
            where: {
                vehicleId,
                status: { in: ['COMPLETED', 'DELIVERED'] },
                mileage: { not: null }
            },
            orderBy: { date: 'desc' },
            take: 5, // Last 5 services is a good window
            select: {
                date: true,
                mileage: true
            }
        });

        if (history.length < MIN_DATA_POINTS) {
            console.log(`[Predictor] Not enough history for Vehicle ${vehicleId}`);
            return null;
        }

        // 2. Prepare Data Points [DaysSinceStart, Mileage]
        // Sort ascending for regression
        const sortedHistory = history.sort((a, b) => a.date.getTime() - b.date.getTime());

        const firstDate = sortedHistory[0].date;
        const dataPoints = sortedHistory.map(record => ({
            days: differenceInDays(record.date, firstDate),
            mileage: record.mileage!
        }));

        // 3. Linear Regression (Least Squares)
        // y = mx + c (y = mileage, x = days)
        // m = slope (Avg Km/Day)

        const n = dataPoints.length;
        const sumX = dataPoints.reduce((acc, p) => acc + p.days, 0);
        const sumY = dataPoints.reduce((acc, p) => acc + p.mileage, 0);
        const sumXY = dataPoints.reduce((acc, p) => acc + (p.days * p.mileage), 0);
        const sumXX = dataPoints.reduce((acc, p) => acc + (p.days * p.days), 0);

        const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);

        // Sanity Check: Negative slope means mileage decreasing (impossible? or odometer rollback)
        if (slope <= 0) {
            console.warn(`[Predictor] Negative or zero usage detected for Vehicle ${vehicleId}. Slope: ${slope}`);
            return null;
        }

        // 4. Prediction
        const lastRecord = sortedHistory[sortedHistory.length - 1];
        const nextTargetMileage = lastRecord.mileage! + DEFAULT_SERVICE_INTERVAL_KM;
        const currentMileage = lastRecord.mileage!;

        const kmRemaining = nextTargetMileage - currentMileage;
        const daysRemaining = Math.ceil(kmRemaining / slope);

        const predictedDate = addDays(lastRecord.date, daysRemaining);

        // 5. Update Vehicle Record
        await prisma.vehicle.update({
            where: { id: vehicleId },
            data: {
                averageDailyKm: slope,
                lastServiceDate: lastRecord.date,
                lastServiceMileage: lastRecord.mileage!,
                predictedNextService: predictedDate
            }
        });

        return {
            vehicleId,
            averageDailyKm: slope,
            predictedDate,
            confidence: n >= 3 ? 'HIGH' : 'LOW',
            lastServiceDate: lastRecord.date,
            lastServiceMileage: lastRecord.mileage!
        };

    } catch (error) {
        console.error(`[Predictor] Error calculating usage for vehicle ${vehicleId}:`, error);
        return null;
    }
}
