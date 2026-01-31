
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const codes = ['AMPI 1117', 'Ampi 1108', 'Eco 3033', 'HM 2020', 'MAP 213'];
    // Also trying likely variations if exact match fails (e.g. AMP vs AMPI, uppercase)
    const variations = [
        'AMP 1117', 'AMP 1108', 'ECO 3033', 'HM 2020', 'MAP 213',
        'AMPI 1117', 'AMPI 1108'
    ];

    const allCodes = [...new Set([...codes, ...variations])];

    console.log("Checking for products:", allCodes);

    const products = await prisma.product.findMany({
        where: {
            code: {
                in: allCodes,
                mode: 'insensitive' // case insensitive search if supported, otherwise handled by variations
            }
        }
    });

    console.log("\n--- Verification Results ---");
    products.forEach(p => {
        console.log(`Code: ${p.code}`);
        console.log(`Name: ${p.name}`);
        console.log(`Price (List): $${p.price.toLocaleString('en-US', { minimumFractionDigits: 2 })}`);
        console.log(`Cost (55%):   $${p.cost.toLocaleString('en-US', { minimumFractionDigits: 2 })}`);
        console.log('---');
    });

    if (products.length === 0) {
        console.log("No products found from the list.");
    }
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
