
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
    // Webhook verification challenge
    // Meta sends: hub.mode, hub.verify_token, hub.challenge
    const searchParams = request.nextUrl.searchParams;
    const mode = searchParams.get('hub.mode');
    const token = searchParams.get('hub.verify_token');
    const challenge = searchParams.get('hub.challenge');

    const VERIFY_TOKEN = process.env.WA_VERIFY_TOKEN;

    if (mode && token) {
        if (mode === 'subscribe' && token === VERIFY_TOKEN) {
            console.log('✅ Webhook verified!');
            return new NextResponse(challenge, { status: 200 });
        } else {
            return new NextResponse('Forbidden', { status: 403 });
        }
    }

    return new NextResponse('BadRequest', { status: 400 });
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();

        // Log incoming webhook for debugging
        console.log('Incoming Webhook:', JSON.stringify(body, null, 2));

        // Basic acknowledgment to Meta
        // In a real app, you would process the entry array to find messages or status updates
        // and update your DB accordingly (e.g., mark message as READ/DELIVERED).

        // Example structure check:
        // if (body.object === 'whatsapp_business_account') { ... }

        return new NextResponse('OK', { status: 200 });
    } catch (e) {
        console.error('Webhook Error:', e);
        return new NextResponse('Internal Server Error', { status: 500 });
    }
}
