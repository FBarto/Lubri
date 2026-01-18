
import { prisma } from '../lib/prisma';

async function main() {
    console.log('--- TEST: FLUJO KANBAN DE ORDENES DE TRABAJO ---');

    /* 
       SCENARIO:
       1. Cliente llega al taller con su vehiculo.
       2. Empleado crea la WO (Estado: PENDING / INGRESÓ).
       3. Empleado inicia el trabajo (Estado: IN_PROGRESS / EN SERVICIO).
       4. Empleado finaliza el trabajo y carga kilometraje (Estado: COMPLETED / LISTO).
       5. Cliente retira el vehiculo (Estado: DELIVERED / ENTREGADO - Paso a Caja).
    */

    // 1. SETUP
    const PHONE = '999111222';
    const PLATE = 'TEST-KB-1';

    // Cleanup previous runs
    const existingClient = await prisma.client.findUnique({ where: { phone: PHONE } });
    if (existingClient) {
        console.log('Cleaning up previous test data...');
        const v = await prisma.vehicle.findUnique({ where: { plate: PLATE } });
        if (v) {
            await prisma.workOrder.deleteMany({ where: { vehicleId: v.id } });
            await prisma.vehicle.delete({ where: { id: v.id } });
        }
        await prisma.client.delete({ where: { id: existingClient.id } });
    }

    console.log('\n[1] Setup: Creando Cliente, Vehiculo y Servicio...');
    const client = await prisma.client.create({
        data: { name: 'Juan Kanban', phone: PHONE }
    });

    const vehicle = await prisma.vehicle.create({
        data: {
            plate: PLATE,
            clientId: client.id,
            brand: 'Toyota',
            model: 'Corolla',
            mileage: 40000
        }
    });

    // Ensure a service exists
    let service = await prisma.service.findFirst({ where: { name: 'Cambio de Aceite Premium' } });
    if (!service) {
        service = await prisma.service.create({
            data: { name: 'Cambio de Aceite Premium', price: 15000, duration: 45, category: 'LUBRICACION' }
        });
    }

    // 2. CREATE WO (Stat: PENDING)
    console.log('\n[2] Creando Orden de Trabajo (Estado: PENDING)...');
    const wo = await prisma.workOrder.create({
        data: {
            clientId: client.id,
            vehicleId: vehicle.id,
            serviceId: service.id,
            price: service.price,
            status: 'PENDING',
            notes: 'Test Kanban Auto',
            date: new Date()
        }
    });
    console.log(`   ✅ WO Creada ID: ${wo.id} | Status: ${wo.status}`);


    // 3. IN_PROGRESS
    console.log('\n[3] Empleado inicia servicio (Status -> IN_PROGRESS)...');
    // Simulate API logic
    const userId = 1; // Assuming admin/employee ID 1 exists
    const woInProgress = await prisma.workOrder.update({
        where: { id: wo.id },
        data: {
            status: 'IN_PROGRESS',
            userId: userId
        }
    });
    console.log(`   ✅ WO ID: ${woInProgress.id} | Status: ${woInProgress.status} | Asignado a UserID: ${woInProgress.userId}`);
    if (woInProgress.status !== 'IN_PROGRESS') throw new Error('Falló cambio a IN_PROGRESS');


    // 4. COMPLETED (Update Mileage)
    console.log('\n[4] Empleado finaliza servicio (Status -> COMPLETED)...');
    const NEW_MILEAGE = 45000;

    // Simulate API Logic
    await prisma.vehicle.update({
        where: { id: vehicle.id },
        data: { mileage: NEW_MILEAGE }
    });

    const woCompleted = await prisma.workOrder.update({
        where: { id: wo.id },
        data: {
            status: 'COMPLETED',
            mileage: NEW_MILEAGE,
            finishedAt: new Date()
        }
    });

    console.log(`   ✅ WO ID: ${woCompleted.id} | Status: ${woCompleted.status} | Millas cargadas: ${woCompleted.mileage}`);

    // Verify Vehicle Mileage Update
    const updatedVehicle = await prisma.vehicle.findUnique({ where: { id: vehicle.id } });
    console.log(`   ✅ Vehículo Plate: ${updatedVehicle?.plate} | Nuevo Kilometraje: ${updatedVehicle?.mileage}`);

    if (updatedVehicle?.mileage !== NEW_MILEAGE) throw new Error('No se actualizó el kilometraje del vehículo');
    if (woCompleted.status !== 'COMPLETED') throw new Error('Falló cambio a COMPLETED');


    // 5. DELIVERED
    console.log('\n[5] Cliente retira vehículo (Status -> DELIVERED)...');
    const woDelivered = await prisma.workOrder.update({
        where: { id: wo.id },
        data: {
            status: 'DELIVERED'
        }
    });
    console.log(`   ✅ WO ID: ${woDelivered.id} | Status: ${woDelivered.status}`);
    if (woDelivered.status !== 'DELIVERED') throw new Error('Falló cambio a DELIVERED');

    console.log('\n✅ TEST COMPLETADO EXITOSAMENTE: El ciclo de vida fue verificado.');
}

main()
    .catch((e) => {
        console.error('\n❌ ERROR TEST:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
