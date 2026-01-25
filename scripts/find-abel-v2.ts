
import { prisma } from '../lib/prisma';

async function main() {
    const query = "Abel Moeremans";
    const client = await prisma.client.findFirst({
        where: { name: { contains: "Abel", mode: 'insensitive' } },
        include: {
            vehicles: true,
            workOrders: {
                include: { service: true }
            }
        }
    });

    if (!client) {
        console.log("❌ Client not found.");
    } else {
        console.log(`✅ Found Client: ${client.name}`);
        console.log(`Work Orders: ${client.workOrders.length}`);
        client.workOrders.sort((a, b) => a.date.getTime() - b.date.getTime()).forEach(wo => {
            console.log(` [${wo.date.toISOString().split('T')[0]}] ${wo.service.name} (Vehicle Plate: ${client.vehicles.find(v => v.id === wo.vehicleId)?.plate})`);
        });
    }
}

main().catch(console.error);
