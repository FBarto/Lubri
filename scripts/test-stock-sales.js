
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
    console.log('--- Probando Descuento de Stock en Ventas (JS) ---');

    // 1. Crear producto de prueba
    const initialStock = 100;
    const saleQuantity = 5;

    // Use try/catch for the whole flow
    let product = null;

    try {
        product = await prisma.product.create({
            data: {
                name: 'Producto Test JS ' + Date.now(),
                price: 500,
                stock: initialStock,
                category: 'TEST',
                code: 'TEST-JS-' + Date.now()
            }
        });
        console.log(`1. Producto creado: ${product.name} | Stock Inicial: ${product.stock}`);

        // 2. Realizar venta via API
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
            // Try to parse error
            try {
                const err = await res.json();
                throw new Error(`Error en venta: ${JSON.stringify(err)}`);
            } catch (parseErr) {
                throw new Error(`Error en venta (Status ${res.status}): ${res.statusText}`);
            }
        }

        const sale = await res.json();
        console.log(`   Venta creada ID: ${sale.id}`);

        // 3. Verificar Stock
        const updatedProduct = await prisma.product.findUnique({ where: { id: product.id } });
        console.log(`3. Stock Post-Venta: ${updatedProduct ? updatedProduct.stock : 'N/A'}`);

        const expectedStock = initialStock - saleQuantity;
        if (updatedProduct && updatedProduct.stock === expectedStock) {
            console.log('SUCCESS: El stock se descontó correctamente.');
        } else {
            console.error(`FAIL: Stock esperado ${expectedStock}, obtenido ${updatedProduct ? updatedProduct.stock : 'N/A'}`);
        }

    } catch (e) {
        console.error('ERROR:', e);
    } finally {
        // Cleanup
        if (product) {
            console.log('4. Limpiando...');
            await prisma.product.delete({ where: { id: product.id } });
        }
        await prisma.$disconnect();
    }
}

main();
