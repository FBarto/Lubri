
import { prisma } from '../lib/prisma';

async function main() {
    const name = 'Francisco Olmos';
    console.log(`Searching for ${name}...`);

    const client = await prisma.client.findFirst({
        where: {
            name: { contains: 'Francisco', mode: 'insensitive' }
        },
        include: { vehicles: true }
    });

    if (client) {
        console.log(`Found Client: ${client.name} (ID: ${client.id})`);
        if (client.vehicles.length > 0) {
            console.log(`Vehicle: ${client.vehicles[0].plate} - ${client.vehicles[0].brand} ${client.vehicles[0].model}`);
        } else {
            console.log('Client has no vehicles.');
        }
    } else {
        console.log('Client not found.');
    }
}

main()
    .catch(console.error)
    .finally(async () => await prisma.$disconnect());
