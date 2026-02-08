
const { getVehicleMaintenanceHistory } = require('./app/actions/maintenance');

async function main() {
    console.log('Testing Maintenance History for GHJ456...');
    try {
        const history = await getVehicleMaintenanceHistory(123); // Need correct vehicle ID. 
        // I need to fetch vehicle ID first.
    } catch (e) {
        console.error(e);
    }
}
// Actually, I can't easily import server actions in a standalone node script because of Next.js 'use server' and module resolution.
// I should use `run_command` to hit the API route if one exists, or rely on the `curl` I did before but looking at server logs (which I can't see).
// ALTERNATIVE: Create a temporary API route that calls `getVehicleMaintenanceHistory` and returns the logs/result.
