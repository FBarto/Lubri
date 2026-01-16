import { prisma } from '../lib/prisma';

async function main() {
    console.log('--- Probando Ordenes de Trabajo ---');

    console.log('1. Creando datos de prueba (Cliente, Vehiculo, Servicio)...');
    const client = await prisma.client.create({
        data: { name: 'Test User WO', phone: '999999999' }
    });

    // Use upsert or meaningful unique data to avoid conflicts if re-run, 
    // but for simplicity in this "scratch" script we just create new ones or fail if phone dup.
    // Actually phone is unique, so let's randomize it or handle cleanup.
    // A better way for test scripts is to Clean Up at start.

    const vehicle = await prisma.vehicle.create({
        data: { plate: 'WO-' + Date.now(), clientId: client.id }
    });

    const service = await prisma.service.create({
        data: { name: 'Service Test', category: 'Test', duration: 30, price: 1000 }
    });

    console.log('2. Creando Turno (Status: CONFIRMED)...');
    const appointment = await prisma.appointment.create({
        data: {
            date: new Date(),
            clientId: client.id,
            vehicleId: vehicle.id,
            serviceId: service.id,
            status: 'CONFIRMED'
        }
    });
    console.log(`   Turno ID: ${appointment.id}, Status: ${appointment.status}`);

    console.log('3. Simulando creacion de Orden de Trabajo vinculada...');

    // LOGIC FROM API route
    const body = {
        clientId: client.id,
        vehicleId: vehicle.id,
        serviceId: service.id,
        price: 1200,
        appointmentId: appointment.id,
        notes: 'Service successfully completed',
        mileage: 50000
    };

    // Transaction
    const workOrder = await prisma.$transaction(async (tx) => {
        const wo = await tx.workOrder.create({
            data: {
                clientId: body.clientId,
                vehicleId: body.vehicleId,
                serviceId: body.serviceId,
                price: body.price,
                notes: body.notes,
                mileage: body.mileage,
                appointmentId: body.appointmentId,
                date: new Date(),
            }
        });

        if (body.appointmentId) {
            await tx.appointment.update({
                where: { id: body.appointmentId },
                data: { status: 'DONE' }
            });
        }

        return wo;
    });

    console.log(`   Orden creada ID: ${workOrder.id}`);

    console.log('4. Verificando estado del Turno...');
    const updatedAppointment = await prisma.appointment.findUnique({
        where: { id: appointment.id }
    });
    console.log(`   Turno ID: ${appointment.id}, Nuevo Status: ${updatedAppointment?.status}`);

    if (updatedAppointment?.status === 'DONE') {
        console.log('SUCCESS: El turno se actualizó correctamente a DONE.');
    } else {
        console.error('FAIL: El turno NO cambió de estado.');
    }

    // Cleanup
    console.log('5. Limpiando...');
    await prisma.workOrder.delete({ where: { id: workOrder.id } });
    await prisma.appointment.delete({ where: { id: appointment.id } });
    await prisma.vehicle.delete({ where: { id: vehicle.id } });
    await prisma.client.delete({ where: { id: client.id } });
    await prisma.service.delete({ where: { id: service.id } });
}

main()
    .catch((e) => console.error(e))
    .finally(async () => {
        await prisma.$disconnect();
    });
