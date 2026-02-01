
const GRAPH_API_VERSION = 'v17.0'; // Or latest stable version

interface WhatsAppMessagePayload {
    messaging_product: 'whatsapp';
    to: string;
    type: 'template' | 'text';
    template?: {
        name: string;
        language: {
            code: string;
        };
        components?: any[];
    };
    text?: {
        body: string;
        preview_url?: boolean;
    };
}

export class MetaClient {
    private token: string;
    private phoneId: string;
    private baseUrl: string;

    constructor() {
        this.token = process.env.WA_ACCESS_TOKEN || '';
        this.phoneId = process.env.WA_PHONE_NUMBER_ID || '';
        this.baseUrl = `https://graph.facebook.com/${GRAPH_API_VERSION}`;
    }

    async sendMessage(payload: WhatsAppMessagePayload): Promise<{ success: boolean; id?: string; error?: any }> {
        if (!this.token || !this.phoneId) {
            console.warn('⚠️ WhatsApp credentials missing. Message skipped.');
            return { success: false, error: 'MISSING_CREDENTIALS' };
        }

        try {
            const res = await fetch(`${this.baseUrl}/${this.phoneId}/messages`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(payload),
            });

            const data = await res.json();

            if (!res.ok) {
                console.error('❌ WhatsApp API Error:', JSON.stringify(data, null, 2));
                return { success: false, error: data.error };
            }

            return { success: true, id: data.messages?.[0]?.id };
        } catch (error) {
            console.error('❌ Network/Server Error sending WhatsApp:', error);
            return { success: false, error };
        }
    }
}
