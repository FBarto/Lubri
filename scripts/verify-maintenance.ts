
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const MAINTENANCE_ITEMS = {
    filters: [
        { key: 'oil_filter', label: 'Filtro Aceite', keywords: ['filtro aceite', 'unidad sellada', '"oil":'] },
        { key: 'air_filter', label: 'Filtro Aire', keywords: ['filtro aire', '"air":'] },
    ],
    fluids: [
        { key: 'engine_oil', label: 'Aceite Motor', keywords: ['aceite motor', 'aceite 10w40', 'aceite 5w30', 'aceite 15w40', 'cambio de aceite', 'mobil', 'elaion', 'shell helix', 'valvoline', 'castrol', 'total', '"oil":'] },
    ]
};

async function getHistory(vehicleId: number) {
    const workOrders = await prisma.workOrder.findMany({
        where: { vehicleId, status: { in: ['COMPLETED', 'DELIVERED'] } },
        include: { saleItems: true, service: true },
        orderBy: { date: 'desc' }
    });

    const findLast = (keywords: string[]) => {
        for (const wo of workOrders) {
            const foundItem = wo.saleItems.find(item =>
                keywords.some(k => item.description.toLowerCase().includes(k))
            );

            const foundNote = keywords.some(k =>
                (wo.notes?.toLowerCase().includes(k)) ||
                (wo.service.name.toLowerCase().includes(k)) ||
                (wo.serviceDetails && JSON.stringify(wo.serviceDetails).toLowerCase().includes(k))
            );

            if (foundItem || foundNote) {
                const daysAgo = Math.floor((Date.now() - new Date(wo.date).getTime()) / (1000 * 60 * 60 * 24));

                let detail = foundItem?.description || null;
                // Specific logic for oil type
                if (keywords.includes('"oil":') && wo.serviceDetails) {
                    const sd = wo.serviceDetails as any;
                    if (sd.oil?.type) detail = sd.oil.type;
                }

                return {
                    date: wo.date,
                    mileage: wo.mileage,
                    daysAgo,
                    detail
                };
            }
        }
        return null;
    };

    const processCategory = (items: typeof MAINTENANCE_ITEMS['fluids']) => {
        return items.map(item => {
            const last = findLast(item.keywords);
            return {
                key: item.key,
                label: item.label,
                mileage: last?.mileage || null,
                detail: last?.detail || null
            };
        });
    };

    return {
        fluids: processCategory(MAINTENANCE_ITEMS.fluids)
    };
}

async function main() {
    console.log('--- Testing Maintenance History (Self-Contained) ---');

    const vehicle = await prisma.vehicle.findFirst({
        where: {
            workOrders: {
                some: {
                    status: 'COMPLETED'
                }
            }
        }
    });

    if (!vehicle) {
        console.log('No vehicle found with history.');
        return;
    }

    console.log(`Testing Vehicle: ${vehicle.plate}`);
    const data = await getHistory(vehicle.id);
    console.log(JSON.stringify(data, null, 2));
}

main()
    .catch(e => console.error(e))
    .finally(async () => {
        await prisma.$disconnect();
    });
