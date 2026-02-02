
import { NextResponse } from 'next/server';
import { createQuickClient, createQuickVehicle } from '../../actions/inbox';
import { suggestServiceEstimate, confirmQuoteAsWorkOrder } from '../../actions/maintenance';

export async function GET() {
    const results: any[] = [];
    const log = (step: string, result: any) => results.push({ step, success: result.success, data: result.data, error: result.error });

    try {
        // 1. Create Client
        const uniqueSuffix = Date.now().toString().slice(-4);
        const clientRes = await createQuickClient(`Test Client ${uniqueSuffix}`, `999${uniqueSuffix}`);
        log('1. Create Client', clientRes);

        if (!clientRes.success || !clientRes.data) throw new Error('Client creation failed');
        const client = clientRes.data;

        // 2. Create Vehicle
        const vehicleRes = await createQuickVehicle(client.id, 'Test Brand', 'Test Model', `TST${uniqueSuffix}`);
        log('2. Create Vehicle', vehicleRes);

        if (!vehicleRes.success || !vehicleRes.data) throw new Error('Vehicle creation failed');
        const vehicle = vehicleRes.data;

        // 3. Get Estimate (Smart/History)
        const estimateRes = await suggestServiceEstimate(vehicle.id, 'BASIC');
        log('3. Get Estimate', estimateRes);

        if (!estimateRes.success || !estimateRes.data) throw new Error('Estimate failed');
        const items = estimateRes.data.items;

        // 4. Confirm Quote as Work Order
        const woRes = await confirmQuoteAsWorkOrder({
            vehicleId: vehicle.id,
            clientId: client.id,
            items: items,
            mileage: 10000,
            userId: 1 // Assuming admin user exists
        });
        log('4. Create Work Order', woRes);

        if (!woRes.success) throw new Error('Work Order creation failed');

        return NextResponse.json({ success: true, flow: results });

    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message, flow: results }, { status: 500 });
    }
}
