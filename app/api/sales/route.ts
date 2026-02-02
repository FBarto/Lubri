import { NextRequest, NextResponse } from 'next/server';
import { processSale } from '../../actions/business';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        console.log('API Sales Payload:', JSON.stringify(body, null, 2));

        // Map API body to action input if necessary
        // The script sends: clientId, paymentMethod, total, items: [{ type, id, name, price, quantity, workOrderId }]
        // processSale expects: items: [{ type, id, description, quantity, unitPrice, workOrderId }]
        // Needs a slight mapping for field names (name -> description, price -> unitPrice)

        const inputItems = body.items.map((item: any) => ({
            type: item.type,
            id: item.id,
            description: item.name || item.description,
            quantity: item.quantity,
            unitPrice: item.price || item.unitPrice,
            workOrderId: item.workOrderId
        }));

        const result = await processSale({
            userId: 1, // Hardcoded for API test default, or extract from session if implementing auth here
            clientId: body.clientId,
            paymentMethod: body.paymentMethod,
            items: inputItems
        });

        if (result.success) {
            return NextResponse.json(result.data, { status: 201 });
        } else {
            return NextResponse.json({ error: result.error }, { status: 400 });
        }
    } catch (error) {
        console.error('API Sale Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
