
import { prisma } from '../lib/prisma';

async function main() {
    const query = "Abel Moeremans";
    console.log(`Searching for client: "${query}"...`);

    const client = await prisma.client.findFirst({
        where: {
            name: {
                contains: "Abel", // Search partial to be safe
                mode: 'insensitive'
            }
        },
        include: {
            vehicles: true,
            workOrders: {
                include: {
                    saleItems: true,
                    service: true
                }
            },
            sales: {
                include: {
                    items: true
                }
            }
        }
    });

    if (!client) {
        console.log("❌ Client not found in current DB.");
    } else {
        console.log(`✅ Found Client: ${client.name} (ID: ${client.id})`);
        console.log(`Phone: ${client.phone}`);
        console.log(`Vehicles: ${client.vehicles.length}`);
        client.vehicles.forEach(v => console.log(` - ${v.brand} ${v.model} (${v.plate})`));

        console.log(`\nWork Orders: ${client.workOrders.length}`);
        client.workOrders.forEach(wo => {
            console.log(` [${wo.date.toISOString().split('T')[0]}] ${wo.service.name} - ${wo.status}`);
            wo.saleItems.forEach(i => console.log(`   - ${i.description}`));
        });

        console.log(`\nSales: ${client.sales.length}`);
    }
}

main().catch(console.error);
