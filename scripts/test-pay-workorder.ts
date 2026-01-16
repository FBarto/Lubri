
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('--- Probando Cobro de Orden de Trabajo Existente ---');

    try {
        // 1. Setup Data
        const client = await prisma.client.create({ data: { name: 'Test Client Pay WO', phone: '555555' } });
        const service = await prisma.service.create({ data: { name: 'Service Pay Test', price: 2000, category: 'TEST', duration: 30 } });
        const vehicle = await prisma.vehicle.create({ data: { plate: 'PAY-' + Date.now(), clientId: client.id } });

        // Orden de Trabajo PENDIENTE (sin saleId)
        const workOrder = await prisma.workOrder.create({
            data: {
                clientId: client.id,
                vehicleId: vehicle.id,
                serviceId: service.id,
                price: service.price,
                notes: 'Pending payment',
                date: new Date()
            }
        });
        console.log(`1. WorkOrder creada ID: ${workOrder.id} (Sin Sale ID)`);

        // 2. Simular pago desde POS
        // El POS envia un item con type: 'SERVICE' y workOrderId vinculada
        const payload = {
            clientId: client.id,
            paymentMethod: 'CARD',
            total: service.price,
            items: [{
                type: 'SERVICE',
                id: service.id,
                name: service.name,
                price: service.price,
                quantity: 1,
                workOrderId: workOrder.id // VINCULACION CLAVE
            }]
        };

        console.log('2. Enviando solicitud de venta (Pago de WO)...');
        const res = await fetch('http://localhost:3000/api/sales', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (!res.ok) {
            const err = await res.json();
            throw new Error(`Error en venta: ${JSON.stringify(err)}`);
        }

        const sale = await res.json();
        console.log(`   Venta creada ID: ${sale.id}`);

        // 3. Verificar Vinculacion
        const updatedWO = await prisma.workOrder.findUnique({ where: { id: workOrder.id } });
        console.log(`3. WorkOrder SaleID: ${updatedWO?.saleId}`);

        if (updatedWO?.saleId === sale.id) {
            console.log('SUCCESS: La Orden de Trabajo fue vinculada a la Venta.');
        } else {
            console.error('FAIL: La Orden de Trabajo NO tiene el saleId correcto.');
        }

        // Cleanup
        await prisma.workOrder.delete({ where: { id: workOrder.id } });
        await prisma.vehicle.delete({ where: { id: vehicle.id } });
        await prisma.service.delete({ where: { id: service.id } });
        await prisma.client.delete({ where: { id: client.id } });

    } catch (e) {
        console.error('ERROR:', e);
    }
}

main()
    .finally(async () => {
        await prisma.$disconnect();
    });
