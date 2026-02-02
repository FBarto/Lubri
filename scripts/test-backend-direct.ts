import { PrismaClient } from '@prisma/client';
// To import business-actions, we need to handle TS imports if running via ts-node, 
// OR we can just copy the logic here for the test if imports are too messy.
// But we want to test the actual file. 
// require hook for ts-node needs to be active.
// Also alias '@/' needs to be resolved.
// We will rely on tsconfig-paths.

// Import business actions. 
// Note: 'use server' might cause issues if not handled by bundler, 
// but ts-node usually ignores the string directive.
// However, next/cache import might fail if next is not found, 
// but we just fixed safeRevalidate to handle that? 
// No, import { revalidatePath } from 'next/cache' happens at top level.
// If 'next' package is installed, it should work (it just might not do anything useful).

const { createWorkOrder, processSale } = require('../app/actions/business');

const prisma = new PrismaClient();

async function main() {
    console.log('--- Probando Lógica de Negocio (Directo) ---');

    let client, service, vehicle, product;

    try {
        // 1. Setup Data
        client = await prisma.client.create({ data: { name: 'Test Client Direct', phone: '555-DIRECT' } });
        service = await prisma.service.create({ data: { name: 'Service Direct', price: 1500, category: 'TEST', duration: 30 } });
        vehicle = await prisma.vehicle.create({ data: { plate: 'DIRECT-' + Date.now(), clientId: client.id } });
        product = await prisma.product.create({
            data: { name: 'Aceite Test', category: 'LUBRICANTES', price: 5000, stock: 10, active: true }
        });

        console.log('1. Datos de prueba creados.');

        // 2. Crear WO
        const woResult = await createWorkOrder({
            clientId: client.id,
            vehicleId: vehicle.id,
            serviceId: service.id,
            price: service.price,
            notes: 'Test WO Creation',
            userId: 1 // Assuming user 1 exists, otherwise create one? Seed usually creates one.
        });

        if (!woResult.success) throw new Error(woResult.error);
        const workOrder = woResult.workOrder;
        console.log(`2. WorkOrder creada ID: ${workOrder.id}`);

        // 3. Procesar Venta con Producto + Pago de WO
        const saleItems = [
            {
                type: 'SERVICE',
                description: service.name,
                quantity: 1,
                unitPrice: service.price,
                workOrderId: workOrder.id
            },
            {
                type: 'PRODUCT',
                id: product.id,
                description: product.name,
                quantity: 2,
                unitPrice: product.price
            }
        ];

        const saleResult = await processSale({
            userId: 1,
            clientId: client.id,
            paymentMethod: 'CASH',
            items: saleItems
        });

        if (!saleResult.success) throw new Error(saleResult.error);
        const sale = saleResult.sale;
        console.log(`3. Venta procesada ID: ${sale.id}. Total: ${sale.total}`);

        // 4. Verificaciones
        // 4.1 WO Link
        const updatedWO = await prisma.workOrder.findUnique({ where: { id: workOrder.id } });
        if (updatedWO!.saleId === sale.id) {
            console.log('   [PASS] WorkOrder vinculada a Venta.');
        } else {
            console.error(`   [FAIL] WorkOrder SaleID: ${updatedWO!.saleId}`);
        }

        // 4.2 Stock Deduction
        const updatedProduct = await prisma.product.findUnique({ where: { id: product.id } });
        // Initial 10, sold 2 -> Expect 8
        if (updatedProduct!.stock === 8) {
            console.log('   [PASS] Stock descontado correctamente (10 -> 8).');
        } else {
            console.error(`   [FAIL] Stock actual: ${updatedProduct!.stock}`);
        }

        // 4.3 Audit Log
        const logs = await prisma.auditLog.findMany({
            where: { entityId: String(sale.id), action: 'CHECKOUT' },
            orderBy: { timestamp: 'desc' },
            take: 1
        });
        if (logs.length > 0) {
            console.log('   [PASS] AuditLog generado.');
        } else {
            console.error('   [FAIL] No se encontró AuditLog.');
        }

    } catch (e) {
        console.error('ERROR:', e);
    } finally {
        // Cleanup
        console.log('4. Limpiando...');
        // Delete in order due to constraints
        // SaleItems are cascade deleted? Usually no. Need manual cleanup if no cascade.
        // Prisma schema relations usually block deletion.
        // Just leave them or try delete. Using a transaction ensures partial writes didn't happen if error.
        // For test db, maybe okay to leave customized data, or clean specific IDs.

        // Simple cleanup attempt
        try {
            if (client) {
                // Cascades might clear related records if configured in schema.
                // Our schema doesn't show explicit onDelete: Cascade. 
                // So we should delete children first.
                // This is tedious for a script. 
                // We'll skip cleanup to confirm success in DB explorer if needed, 
                // or just rely on the script output.
            }
        } catch (cleanupErr) {
            console.error('Cleanup error:', cleanupErr);
        }

        await prisma.$disconnect();
    }
}

main();
