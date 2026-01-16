
import { prisma } from '../lib/prisma';

async function main() {
    console.log('Checking for appointments with invalid COMPLETED status...');

    // We can't use prisma.appointment.findMany({ where: { status: 'COMPLETED' } }) because it throws validation error
    // So we assume we might need to use raw query if possible, but Prisma doesn't easily expose raw update on models with enum validation issues on read.
    // However, executeRaw might work.

    try {
        // SQLite uses number or string for enums? Usually string.
        const count = await prisma.$executeRaw`UPDATE Appointment SET status = 'DONE' WHERE status = 'COMPLETED'`;
        console.log(`Updated ${count} appointments from COMPLETED to DONE.`);
    } catch (e) {
        console.error('Error executing raw update:', e);
    }

    // Verify
    const completedCount = await prisma.appointment.count({
        where: { status: 'DONE' }
    });
    console.log(`Total DONE appointments: ${completedCount}`);
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
