import { prisma } from './prisma';
import crypto from 'crypto';

export class WhatsAppService {
    /**
     * Generates confirmation and reminder messages for an appointment.
     */
    static async scheduleAppointmentNotifications(appointmentId: number) {
        try {
            // Using raw queries because prisma generate might be blocked by file locks
            const appointments: any[] = await prisma.$queryRaw`
                SELECT a.*, c.name as clientName, c.phone as clientPhone, s.name as serviceName, v.plate as vehiclePlate
                FROM Appointment a
                JOIN Client c ON a.clientId = c.id
                JOIN Service s ON a.serviceId = s.id
                JOIN Vehicle v ON a.vehicleId = v.id
                WHERE a.id = ${appointmentId}
                LIMIT 1
            `;

            const appointment = appointments[0];
            if (!appointment || !appointment.clientPhone) return;

            const phone = appointment.clientPhone;
            const apptDate = new Date(appointment.date);

            // 1. Generate Tokens
            const confirmToken = await this.createToken(appointmentId, 'CONFIRM');
            const cancelToken = await this.createToken(appointmentId, 'CANCEL');

            const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
            const confirmLink = `${baseUrl}/wa/confirm?token=${confirmToken}`;
            const cancelLink = `${baseUrl}/wa/cancel?token=${cancelToken}`;

            // 2. Schedule Confirmation Message (Immediate)
            const varsConfirmation = JSON.stringify({
                clientName: appointment.clientName,
                date: apptDate.toLocaleDateString('es-AR'),
                time: apptDate.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' }),
                service: appointment.serviceName,
                vehicle: appointment.vehiclePlate,
                confirmLink,
                cancelLink
            });

            await prisma.$executeRaw`
                INSERT INTO WhatsAppMessage (phone, template, variables, status, scheduledAt, appointmentId, createdAt)
                VALUES (${phone}, 'CONFIRMATION', ${varsConfirmation}, 'PENDING', ${new Date()}, ${appointmentId}, ${new Date()})
            `;

            // 3. Schedule 24h Reminder
            const reminder24h = new Date(apptDate);
            reminder24h.setDate(reminder24h.getDate() - 1);
            if (reminder24h > new Date()) {
                const vars24h = JSON.stringify({
                    clientName: appointment.clientName,
                    time: apptDate.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' }),
                    confirmLink,
                    cancelLink
                });
                await prisma.$executeRaw`
                    INSERT INTO WhatsAppMessage (phone, template, variables, status, scheduledAt, appointmentId, createdAt)
                    VALUES (${phone}, 'REMINDER_24H', ${vars24h}, 'PENDING', ${reminder24h}, ${appointmentId}, ${new Date()})
                `;
            }

            // 4. Schedule 2h Reminder
            const reminder2h = new Date(apptDate);
            reminder2h.setHours(reminder2h.getHours() - 2);
            if (reminder2h > new Date()) {
                const vars2h = JSON.stringify({
                    clientName: appointment.clientName,
                    time: apptDate.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })
                });
                await prisma.$executeRaw`
                    INSERT INTO WhatsAppMessage (phone, template, variables, status, scheduledAt, appointmentId, createdAt)
                    VALUES (${phone}, 'REMINDER_2H', ${vars2h}, 'PENDING', ${reminder2h}, ${appointmentId}, ${new Date()})
                `;
            }
        } catch (error) {
            console.error('Error in scheduleAppointmentNotifications:', error);
        }
    }

    private static async createToken(appointmentId: number, action: 'CONFIRM' | 'CANCEL') {
        const token = crypto.randomBytes(32).toString('hex');
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + 7);

        await prisma.$executeRaw`
            INSERT INTO WhatsAppToken (token, action, expiresAt, appointmentId, createdAt)
            VALUES (${token}, ${action}, ${expiresAt}, ${appointmentId}, ${new Date()})
        `;

        return token;
    }

    static async processPendingMessages() {
        try {
            const now = new Date();
            const pending: any[] = await prisma.$queryRaw`
                SELECT * FROM WhatsAppMessage 
                WHERE status = 'PENDING' AND scheduledAt <= ${now}
            `;

            for (const msg of pending) {
                try {
                    console.log(`[WhatsApp Sim] Sending ${msg.template} to ${msg.phone}`);

                    await prisma.$executeRaw`
                        UPDATE WhatsAppMessage 
                        SET status = 'SENT', sentAt = ${new Date()}
                        WHERE id = ${msg.id}
                    `;
                } catch (error: any) {
                    await prisma.$executeRaw`
                        UPDATE WhatsAppMessage 
                        SET status = 'FAILED', error = ${error.message}
                        WHERE id = ${msg.id}
                    `;
                }
            }
        } catch (error) {
            console.error('Error in processPendingMessages:', error);
        }
    }
    static async sendTemplateMessage(phone: string, template: string, language: string, variables: any[], appointmentId: number) {
        try {
            const varsJson = JSON.stringify(variables);
            // language param is currently unused in DB but kept for interface compatibility or future use

            await prisma.$executeRaw`
                INSERT INTO WhatsAppMessage (phone, template, variables, status, scheduledAt, appointmentId, createdAt)
                VALUES (${phone}, ${template}, ${varsJson}, 'PENDING', ${new Date()}, ${appointmentId}, ${new Date()})
            `;

            console.log(`[WhatsAppService] Scheduled template ${template} for ${phone}`);
        } catch (error) {
            console.error('Error in sendTemplateMessage:', error);
            throw error;
        }
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

            const vars = JSON.stringify({
                body: message
            });

            await prisma.$executeRaw`
                INSERT INTO WhatsAppMessage (phone, template, variables, status, scheduledAt, appointmentId, createdAt)
                VALUES (${adminPhone}, 'ADMIN_ALERT', ${vars}, 'PENDING', ${new Date()}, ${appointment.id}, ${new Date()})
            `;
            console.log(`[WhatsAppService] Admin alert scheduled for ${adminPhone}`);
        } catch (error) {
            console.error('[WhatsAppService] Failed to send admin alert:', error);
        }
    }
}
