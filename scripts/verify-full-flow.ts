import { PrismaClient } from '@prisma/client';
import { processSale, createWorkOrder } from '../app/actions/business';
import { getVehicleMaintenanceHistory } from '../app/actions/maintenance';

const prisma = new PrismaClient();

async function main() {
    console.log('🚀 Starting End-to-End Service Flow Verification...');

    // 1. Setup Test Data
    const phone = `54911${Math.floor(Math.random() * 10000000)}`;
    const plate = `TST${Math.floor(Math.random() * 999)}`;
    console.log(`Creating Client and Vehicle (Plate: ${plate})...`);

    const client = await prisma.client.create({
        data: { name: 'Test User Flow', phone }
    });

    const vehicle = await prisma.vehicle.create({
        data: {
            plate,
            brand: 'TestBrand',
            model: 'TestModel',
            clientId: client.id,
            mileage: 50000
        }
    });

    const service = await prisma.service.findFirst({ where: { active: true } });
    if (!service) throw new Error('No active service found');

    // 2. Create Work Order
    console.log('Creating Work Order...');
    const woRes = await createWorkOrder({
        clientId: client.id,
        vehicleId: vehicle.id,
        serviceId: service.id,
        price: 1000,
        mileage: 55000, // +5000 km
        notes: 'Testing full flow',
        serviceDetails: {
            oil: { type: 'Aceite 10W40', liters: 4 },
            filters: { oil: 'FILTRO-123', air: 'FILTRO-AIR-99' }
        }
    });

    if (!woRes.success || !woRes.data) throw new Error('Failed to create WO');
    const woId = woRes.data.id;

    // 3. Process Sale (Checkout)
    console.log('Processing Sale (Checkout)...');
    const saleRes = await processSale({
        userId: 1,
        clientId: client.id,
        paymentMethod: 'CASH',
        items: [
            {
                type: 'SERVICE',
                description: service.name,
                quantity: 1,
                unitPrice: 1000,
                workOrderId: woId
            },
            {
                type: 'PRODUCT',
                description: 'Aceite 10W40',
                quantity: 4,
                unitPrice: 500,
                id: undefined // Using ad-hoc product for simplicity
            }
        ],
        status: 'COMPLETED'
    });

    if (!saleRes.success) throw new Error('Sale failed: ' + saleRes.error);

    // 4. Verify Vehicle Updates
    console.log('Verifying Vehicle Data Update...');
    const updatedVehicle = await prisma.vehicle.findUnique({ where: { id: vehicle.id } });

    console.log('Vehicle Mileage:', updatedVehicle?.mileage);
    console.log('Vehicle Last Service Date:', updatedVehicle?.lastServiceDate);

    if (updatedVehicle?.mileage !== 55000) {
        console.error('❌ FAIL: Vehicle mileage NOT updated to 55000');
    } else {
        console.log('✅ PASS: Vehicle mileage updated');
    }

    if (!updatedVehicle?.lastServiceDate) {
        console.error('❌ FAIL: Vehicle lastServiceDate is NULL');
    } else {
        console.log('✅ PASS: Vehicle lastServiceDate updated');
    }

    // 5. Verify Maintenance History (Portal Data)
    console.log('Verifying Portal Data...');
    const historyRes = await getVehicleMaintenanceHistory(vehicle.id);

    if (historyRes.success && historyRes.data) {
        const oilStatus = historyRes.data.fluids.find((f: any) => f.key === 'engine_oil');
        if (oilStatus?.status === 'OK' && oilStatus.detail === 'Aceite 10W40') {
            console.log('✅ PASS: Portal shows Correct Oil and Status OK');
        } else {
            console.error('❌ FAIL: Portal Data Mismatch', oilStatus);
        }
    } else {
        console.error('❌ FAIL: Could not fetch history');
    }

    // Cleanup
    // await prisma.workOrder.delete({ where: { id: woId } });
    // await prisma.vehicle.delete({ where: { id: vehicle.id } });
    // await prisma.client.delete({ where: { id: client.id } });
}

main()
    .catch(console.error)
    .finally(async () => await prisma.$disconnect());
