
import { MetaClient } from './meta-client';
import { prisma } from '@/lib/prisma';
import { randomBytes } from 'crypto';

const client = new MetaClient();

export class WhatsAppService {

    /**
     * Schedules confirmation and reminder messages when an appointment is confirmed.
     */
    static async scheduleAppointmentNotifications(appointmentId: number) {
        const appointment = await prisma.appointment.findUnique({
            where: { id: appointmentId },
            include: { client: true, vehicle: true }
        });

        if (!appointment) return;

        // 1. Immediate Confirmation Message
        await prisma.whatsAppMessage.create({
            data: {
                phone: appointment.client.phone,
                template: 'CONFIRMATION',
                status: 'PENDING',
                scheduledAt: new Date(), // Send immediately (next cron run)
                appointmentId: appointment.id
            }
        });

        // 2. 24h Reminder
        const reminderDate = new Date(appointment.date);
        reminderDate.setHours(reminderDate.getHours() - 24);

        if (reminderDate > new Date()) {
            await prisma.whatsAppMessage.create({
                data: {
                    phone: appointment.client.phone,
                    template: 'REMINDER_24H',
                    status: 'PENDING',
                    scheduledAt: reminderDate,
                    appointmentId: appointment.id
                }
            });
        }
    }

    /**
     * Sends an appointment confirmation message with a confirmation link.
     */
    static async sendAppointmentConfirmation(appointment: any, token: string) {
        // Construct the public confirmation URL
        // const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
        const confirmLink = `https://lubricentro-fb.com/wa/confirm?t=${token}`; // Hardcoded domain for now or use env
        const cancelLink = `https://lubricentro-fb.com/wa/cancel?t=${token}`;

        // Template Name: appointment_confirmation (Must exist in Meta Manager)
        // Expected Variables: {{1}} = Client Name, {{2}} = Date/Time, {{3}} = Vehicle, {{4}} = Link

        // NOTE: For Test Numbers, you usually use the 'hello_world' template or a specific approved one.
        // We will assume a 'standard' structure for now, but this is highly dependent on the ACTUAL template created in Meta.

        return await client.sendMessage({
            messaging_product: 'whatsapp',
            to: appointment.client.phone, // Must be E.164 format
            type: 'template',
            template: {
                name: 'appointment_confirm_v1', // Placeholder name
                language: { code: 'es_AR' },
                components: [
                    {
                        type: 'body',
                        parameters: [
                            { type: 'text', text: appointment.client.name },
                            { type: 'text', text: new Date(appointment.date).toLocaleString('es-AR') },
                            { type: 'text', text: `${appointment.vehicle.brand} ${appointment.vehicle.model} (${appointment.vehicle.plate})` },
                            { type: 'text', text: confirmLink } // Dynamic link often goes in button/body
                        ]
                    }
                ]
            }
        });
    }

    static async generateToken(appointmentId: number, action: 'CONFIRM' | 'CANCEL') {
        const token = randomBytes(16).toString('hex');
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + 7); // Valid for 1 week or until appointment

        return await prisma.whatsAppToken.create({
            data: {
                token,
                action,
                appointmentId,
                expiresAt
            }
        });
    }


    static async processPendingMessages() {
        const pendingMessages = await prisma.whatsAppMessage.findMany({
            where: { status: 'PENDING' },
            take: 10 // Process in batches
        });

        const results = [];

        for (const msg of pendingMessages) {
            try {
                const appointment = await prisma.appointment.findUnique({
                    where: { id: msg.appointmentId },
                    include: { client: true, vehicle: true }
                });

                if (!appointment) {
                    await prisma.whatsAppMessage.update({
                        where: { id: msg.id },
                        data: { status: 'FAILED', error: 'Appointment not found' }
                    });
                    continue;
                }

                if (msg.template === 'CONFIRMATION') {
                    const token = await this.generateToken(appointment.id, 'CONFIRM');
                    const res = await this.sendAppointmentConfirmation(appointment, token.token);

                    if (res.success) {
                        await prisma.whatsAppMessage.update({
                            where: { id: msg.id },
                            data: { status: 'SENT', sentAt: new Date() }
                        });
                        results.push({ id: msg.id, status: 'SENT' });
                    } else {
                        await prisma.whatsAppMessage.update({
                            where: { id: msg.id },
                            data: { status: 'FAILED', error: JSON.stringify(res.error) }
                        });
                        await prisma.whatsAppMessage.update({
                            where: { id: msg.id },
                            data: { status: 'FAILED', error: JSON.stringify(res.error) }
                        });
                        results.push({ id: msg.id, status: 'FAILED', error: res.error });
                    }
                } else if (msg.template === 'ADMIN_ALERT') {
                    // Handle Admin Alert (Text Message)
                    const vars = JSON.parse(msg.variables as string || '{}');
                    const res = await this.sendServiceReport(msg.phone, vars.body);

                    if (res.success) {
                        await prisma.whatsAppMessage.update({
                            where: { id: msg.id },
                            data: { status: 'SENT', sentAt: new Date() }
                        });
                        results.push({ id: msg.id, status: 'SENT' });
                    } else {
                        await prisma.whatsAppMessage.update({
                            where: { id: msg.id },
                            data: { status: 'FAILED', error: JSON.stringify(res.error) }
                        });
                        results.push({ id: msg.id, status: 'FAILED', error: res.error });
                    }
                } else {
                    // Handle other templates...
                    // For now, mark as skipped so it doesn't loop
                    await prisma.whatsAppMessage.update({
                        where: { id: msg.id },
                        data: { status: 'FAILED', error: 'Template not implemented' }
                    });
                    results.push({ id: msg.id, status: 'SKIPPED', reason: 'Template not implemented yet' });
                }

            } catch (e: any) {
                console.error(`Error processing msg ${msg.id}`, e);
                await prisma.whatsAppMessage.update({
                    where: { id: msg.id },
                    data: { status: 'FAILED', error: e.message }
                });
            }
        }

        return results;
    }

    /**
     * Sends a budget approval request to the client.
     */
    static async sendBudgetApproval(workOrder: any, token: string) {
        // In production, this link should come from env
        const link = `https://lubricentro-fb.com/approval/${token}`;

        return await client.sendMessage({
            messaging_product: 'whatsapp',
            to: workOrder.client.phone,
            type: 'template',
            template: {
                name: 'budget_approval_v1', // Placeholder template name
                language: { code: 'es_AR' },
                components: [
                    {
                        type: 'body',
                        parameters: [
                            { type: 'text', text: workOrder.client.name },
                            { type: 'text', text: `${workOrder.vehicle.brand} ${workOrder.vehicle.model}` },
                            { type: 'text', text: `$${workOrder.price.toLocaleString()}` },
                            { type: 'text', text: link }
                        ]
                    }
                ]
            }
        });
    }

    static async sendServiceReport(phone: string, text: string) {
        return await client.sendMessage({
            messaging_product: 'whatsapp',
            to: phone,
            type: 'text',
            text: { body: text }
        });
    }

    static async sendAdminAlert(appointment: any) {
        try {
            const adminPhone = process.env.ADMIN_PHONE;
            if (!adminPhone) {
                console.warn('[WhatsAppService] No ADMIN_PHONE configured for alerts');
                return;
            }

            const message = `🚨 *NUEVO TURNO WEB*\n\n` +
                `👤 *Cliente:* ${appointment.client.name}\n` +
                `🚘 *Vehículo:* ${appointment.vehicle.brand} ${appointment.vehicle.model} (${appointment.vehicle.plate})\n` +
                `🛠 *Servicio:* ${appointment.service.name}\n` +
                `📅 *Fecha:* ${new Date(appointment.date).toLocaleDateString('es-AR')}\n` +
                `⏰ *Hora:* ${new Date(appointment.date).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}\n`;

            await prisma.whatsAppMessage.create({
                data: {
                    phone: adminPhone,
                    template: 'ADMIN_ALERT',
                    variables: JSON.stringify({ body: message }),
                    status: 'PENDING',
                    scheduledAt: new Date(),
                    appointmentId: appointment.id
                }
            });
            console.log(`[WhatsAppService] Admin alert scheduled for ${adminPhone}`);
        } catch (error) {
            console.error('[WhatsAppService] Failed to send admin alert:', error);
        }
    }
}
