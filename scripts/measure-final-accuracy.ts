
import { getLastServiceItems } from '../app/lib/maintenance-actions';
import { prisma } from '../lib/prisma';

async function measureFinalAccuracy() {
    console.log('📊 Measuring FINAL Accuracy (85% Target)...\n');

    const vehiclesWithHistory = await prisma.vehicle.findMany({
        where: { workOrders: { some: {} } },
        select: { id: true }
    });

    const sampleSize = Math.min(100, vehiclesWithHistory.length);
    const shuffled = vehiclesWithHistory.sort(() => 0.5 - Math.random());
    const sample = shuffled.slice(0, sampleSize);

    console.log(`Testing Sample Size: ${sampleSize} vehicles...\n`);

    let totalItems = 0;
    let mappedItems = 0;
    let vehiclesWithAtLeastOneMatch = 0;

    for (const v of sample) {
        const res = await getLastServiceItems(v.id);
        if (res.success && res.data && res.data.items.length > 0) {
            let matchesInThisVehicle = 0;
            res.data.items.forEach(item => {
                totalItems++;
                if (item.found) {
                    mappedItems++;
                    matchesInThisVehicle++;
                }
            });
            if (matchesInThisVehicle > 0) vehiclesWithAtLeastOneMatch++;
        }
    }

    const accuracyPercent = totalItems > 0 ? (mappedItems / totalItems * 100).toFixed(2) : '0';
    const utilityPercent = sampleSize > 0 ? (vehiclesWithAtLeastOneMatch / sampleSize * 100).toFixed(2) : '0';

    console.log(`\n✅ FINAL RESULTS:`);
    console.log(`- Total Maintenance Items Analyzed: ${totalItems}`);
    console.log(`- Successfully Mapped to Catalog: ${mappedItems}`);
    console.log(`- Item Accuracy Rate: ${accuracyPercent}%`);
    console.log(`- Vehicles with Corrected Estimates: ${utilityPercent}%`);

    if (parseFloat(accuracyPercent) >= 85) {
        console.log(`\n🎯 TARGET ACHIEVED! Accuracy is ${accuracyPercent}% (>= 85%)`);
    } else {
        console.log(`\n⚠️  Target not yet reached. Current: ${accuracyPercent}%, Goal: 85%`);
    }
}

measureFinalAccuracy()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
