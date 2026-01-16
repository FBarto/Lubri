import { NextResponse } from 'next/server';
import { WhatsAppService } from '@/app/lib/whatsapp/service';

export const dynamic = 'force-dynamic'; // Ensure it's not cached

export async function GET(request: Request) {
    try {
        // In production, you would check for a CRON_SECRET header for security
        // const authHeader = request.headers.get('authorization');
        // if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
        //     return new Response('Unauthorized', { status: 401 });
        // }

        const results = await WhatsAppService.processPendingMessages();

        return NextResponse.json({
            success: true,
            processed: results.length,
            results
        });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
