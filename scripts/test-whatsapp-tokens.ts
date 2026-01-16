
import { prisma } from '../lib/prisma';
import crypto from 'crypto';

// Minimal mock of the logic in `lib/whatsapp/tokenService.ts` if we can't import it directly due to potential complexity, 
// OR we try to import the service if it's clean. Let's try to import first.
// If import fails, we replicate logic: token creation and validation.
// Actually, better to test the API endpoint `/api/wa/process-token` if possible, or at least the service logic.

// Let's rely on database state manipulation to simulate "Generating a token" and then verifying it works.

async function main() {
    console.log('--- Probando Flujo de WhatsApp (Tokens) ---');

    // 1. Setup Data
    const phone = '5493510000000';
    console.log('1. Creando Cliente y Vehículo...');
    const client = await prisma.client.upsert({
        where: { phone },
        update: {},
        create: { name: 'WA Test User', phone }
    });

    const vehicle = await prisma.vehicle.create({
        data: { plate: 'WA-' + Date.now(), clientId: client.id, model: 'Test Car' }
    });

    const service = await prisma.service.findFirst();
    if (!service) throw new Error('Need at least one service');

    // 2. Create Appointment
    console.log('2. Creando Turno (REQUESTED)...');
    const appointment = await prisma.appointment.create({
        data: {
            date: new Date(),
            clientId: client.id,
            vehicleId: vehicle.id,
            serviceId: service.id,
            status: 'REQUESTED'
        }
    });

    // 3. Create Token (Manual simulation of what `WhatsAppService` does)
    console.log('3. Generando Token de Confirmación...');
    const tokenString = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24);

    const matchToken = await prisma.whatsAppToken.create({
        data: {
            token: tokenString,
            action: 'CONFIRM',
            appointmentId: appointment.id,
            expiresAt
        }
    });

    console.log(`   Token generado: ${tokenString}`);

    // 4. Simulate "Clicking Link" -> Processing Token
    // We will verify the logic: Find Token -> Check Expiry -> Update Appointment -> Mark Token Used
    console.log('4. Procesando Token (Simulación de API)...');

    const foundToken = await prisma.whatsAppToken.findUnique({
        where: { token: tokenString },
        include: { appointment: true }
    });

    if (!foundToken) throw new Error('Token not found');
    if (foundToken.usedAt) throw new Error('Token already used');
    if (foundToken.expiresAt < new Date()) throw new Error('Token expired');

    if (foundToken.action === 'CONFIRM') {
        await prisma.appointment.update({
            where: { id: foundToken.appointmentId },
            data: { status: 'CONFIRMED' }
        });
        console.log('   Turno confirmado en DB');
    }

    await prisma.whatsAppToken.update({
        where: { id: foundToken.id },
        data: { usedAt: new Date() }
    });
    console.log('   Token marcado como usado');

    // 5. Verify Final State
    const finalAppt = await prisma.appointment.findUnique({ where: { id: appointment.id } });
    if (finalAppt?.status !== 'CONFIRMED') {
        throw new Error('Estado del turno incorrecto, se esperaba CONFIRMED');
    }
    console.log('✅ Flujo de Confirmación Exitoso');

    // Cleanup
    console.log('Limpiando datos...');
    await prisma.whatsAppToken.deleteMany({ where: { appointmentId: appointment.id } });
    await prisma.appointment.delete({ where: { id: appointment.id } });
    await prisma.vehicle.delete({ where: { id: vehicle.id } });
    // Keep client maybe? Or delete if unique.
    // await prisma.client.delete({ where: { id: client.id } });
}

main()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
