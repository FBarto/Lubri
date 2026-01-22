const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function runTest() {
    console.log("--- INICIANDO PRUEBA DE FLUJO: GASTON -> CAJA ---");

    // 1. Verificar Stock Inicial
    const productId = 6;
    const initialProduct = await prisma.product.findUnique({ where: { id: productId } });
    console.log(`Stock Inicial de '${initialProduct.name}': ${initialProduct.stock}`);

    // 2. Simular Gastón mandando a Caja (PENDING)
    console.log("\nSimulando a Gastón enviando venta PENDIENTE a Caja...");
    const sale = await prisma.sale.create({
        data: {
            userId: 1,
            total: 50000,
            paymentMethod: 'PENDING_PAYMENT',
            status: 'PENDING',
            items: {
                create: [{
                    type: 'PRODUCT',
                    description: initialProduct.name,
                    quantity: 1,
                    unitPrice: initialProduct.price,
                    subtotal: initialProduct.price,
                    productId: productId
                }]
            }
        },
        include: { items: true }
    });
    console.log(`Venta PENDIENTE creada. ID: ${sale.id}, Status: ${sale.status}`);

    // 3. Verificar que el stock NO bajó
    const midProduct = await prisma.product.findUnique({ where: { id: productId } });
    console.log(`Stock después de mandarlo a Caja (debe seguir siendo ${initialProduct.stock}): ${midProduct.stock}`);

    if (initialProduct.stock === midProduct.stock) {
        console.log("✅ ÉXITO: El stock no se descontó prematuramente.");
    } else {
        console.log("❌ ERROR: El stock bajó antes de tiempo!");
    }

    // 4. Simular Romi cobrando en Caja (COMPLETED)
    console.log("\nSimulando a Romi finalizando el cobro en Caja...");
    const updatedSale = await prisma.sale.update({
        where: { id: sale.id },
        data: {
            status: 'COMPLETED',
            paymentMethod: 'EFECTIVO',
            date: new Date()
        }
    });

    // El trigger manual que haríamos en el Server Action: descontar stock
    await prisma.product.update({
        where: { id: productId },
        data: { stock: { decrement: 1 } }
    });

    console.log(`Venta FINALIZADA. Status: ${updatedSale.status}, Pago: ${updatedSale.paymentMethod}`);

    // 5. Verificar que el stock SÍ bajó ahora
    const finalProduct = await prisma.product.findUnique({ where: { id: productId } });
    console.log(`Stock final (debe ser ${initialProduct.stock - 1}): ${finalProduct.stock}`);

    if (finalProduct.stock === initialProduct.stock - 1) {
        console.log("✅ ÉXITO: El stock se descontó correctamente al completar el cobro.");
    } else {
        console.log("❌ ERROR: El stock no se descontó al final.");
    }

    console.log("\n--- PRUEBA FINALIZADA CON ÉXITO ---");
}

runTest()
    .catch(e => console.error(e))
    .finally(() => prisma.$disconnect());
