
import { getVehicleMaintenanceHistory } from '../app/actions/maintenance';

async function testAbelUI() {
    const vehicleId = 111; // AD389JK for Abel
    console.log(`Testing Maintenance History API for Abel's vehicle ID: ${vehicleId}`);

    const result = await getVehicleMaintenanceHistory(vehicleId);

    if (result.success && result.data) {
        console.log("✅ Success!");
        console.log("\nFilters:");
        result.data.filters.forEach(f => {
            console.log(` - ${f.label}: ${f.status} (${f.lastDate ? f.lastDate.toISOString().split('T')[0] : 'Never'}) - ${f.detail || 'No detail'}`);
        });

        console.log("\nFluids:");
        result.data.fluids.forEach(f => {
            console.log(` - ${f.label}: ${f.status} (${f.lastDate ? f.lastDate.toISOString().split('T')[0] : 'Never'}) - ${f.detail || 'No detail'}`);
        });
    } else {
        console.error("❌ Failed:", result.error);
    }
}

testAbelUI().catch(console.error);
