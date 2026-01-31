
import { prisma } from '../lib/prisma';

async function main() {
    console.log('Cleaning up specific appointments for 2026-01-31...');

    const targetNames = ['sadasdwq', 'Cliente Simulado TEST-7227', 'Francisco Olmos'];

    // Find client IDs first if possible, or just search appointments by date and client name match
    // easier to fetch appointments and filter in memory or extensive query

    const startOfDay = new Date('2026-01-31T00:00:00.000Z');
    const endOfDay = new Date('2026-01-31T23:59:59.999Z');

    const appointments = await prisma.appointment.findMany({
        where: {
            date: {
                gte: startOfDay,
                lte: endOfDay
            }
        },
        include: {
            client: true
        }
    });

    console.log(`Found ${appointments.length} appointments for today.`);

    const toDelete = appointments.filter(app => {
        const name = app.client?.name || '';
        return targetNames.some(target => name.includes(target) || name === target);
    });

    if (toDelete.length === 0) {
        console.log('No matching appointments found to delete.');
        return;
    }

    console.log(`Deleting ${toDelete.length} appointments:`);
    toDelete.forEach(a => console.log(` - ${a.id}: ${a.client.name} at ${a.date}`));

    for (const app of toDelete) {
        // Delete related WhatsApp tokens first if any
        await prisma.whatsAppToken.deleteMany({ where: { appointmentId: app.id } });
        await prisma.appointment.delete({ where: { id: app.id } });
    }

    console.log('Cleanup complete.');
}

main().catch(console.error).finally(() => prisma.$disconnect());
