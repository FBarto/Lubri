
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('--- Probando Descuento de Stock en Ventas ---');

    // 1. Crear producto de prueba
    const initialStock = 100;
    const saleQuantity = 5;

    const product = await prisma.product.create({
        data: {
            name: 'Producto Test Stock ' + Date.now(),
            price: 500,
            stock: initialStock,
            category: 'TEST',
            code: 'TEST-' + Date.now()
        }
    });
    console.log(`1. Producto creado: ${product.name} | Stock Inicial: ${product.stock}`);

    try {
        // 2. Realizar venta via API (simulada llamando a la logica o via fetch si el server corre, 
        // pero aqui usaremos fetch al localhost:3000 asumiendo que el server esta levantado, 
        // O mejor, invocar la logica si fuera posible, pero como es una ruta de nextjs, 
        // lo mas real es via fetch. Asumiremos server corriendo en puerto 3000 como en los otros scripts).

        const payload = {
            paymentMethod: 'CASH',
            total: product.price * saleQuantity,
            items: [{
                type: 'PRODUCT',
                id: product.id,
                name: product.name,
                price: product.price,
                quantity: saleQuantity
            }]
        };

        console.log('2. Enviando solicitud de venta...');
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

        // 3. Verificar Stock
        const updatedProduct = await prisma.product.findUnique({ where: { id: product.id } });
        console.log(`3. Stock Post-Venta: ${updatedProduct?.stock}`);

        const expectedStock = initialStock - saleQuantity;
        if (updatedProduct?.stock === expectedStock) {
            console.log('SUCCESS: El stock se descontó correctamente.');
        } else {
            console.error(`FAIL: Stock esperado ${expectedStock}, obtenido ${updatedProduct?.stock}`);
        }

    } catch (e) {
        console.error('ERROR:', e);
    } finally {
        // Cleanup
        console.log('4. Limpiando...');
        await prisma.product.delete({ where: { id: product.id } });
        // Nota: No borramos la venta para mantener historial o deberiamos borrarla en cascada si es test estricto
    }
}

main()
    .finally(async () => {
        await prisma.$disconnect();
    });
