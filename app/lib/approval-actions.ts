'use server';

import { prisma } from '../../lib/prisma';
import crypto from 'crypto';

import { WhatsAppService } from './whatsapp/service';

/**
 * Sends a budget for approval to the client (Mock WhatsApp message).
 */
export async function sendBudgetForApproval(workOrderId: number) {
    try {
        const token = crypto.randomBytes(32).toString('hex');

        const updatedWo = await prisma.workOrder.update({
            where: { id: workOrderId },
            data: {
                approvalToken: token,
                approvalStatus: 'PENDING',
                approvalSentAt: new Date()
            },
            include: { client: true, vehicle: true }
        });

        // Send WhatsApp (Backend attempt)
        WhatsAppService.sendBudgetApproval(updatedWo, token).catch(e => console.error('BG WA Error:', e));

        // Construct Frontend URL (Frictionless)
        const link = `https://lubricentro-fb.com/approval/${token}`; // TODO: Env var
        const message = `Hola ${updatedWo.client.name.split(' ')[0]}! 👋\nTe pasamos el presupuesto para tu ${updatedWo.vehicle.brand} ${updatedWo.vehicle.model}.\n\nPodes revisarlo y confirmarlo acá: ${link}`;

        const phone = updatedWo.client.phone.replace(/\D/g, '');
        const waUrl = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;

        return { success: true, token, waUrl };
    } catch (error) {
        console.error('Error sending budget approval:', error);
        return { success: false, error: 'Failed to send approval' };
    }
}

/**
 * Generates a WhatsApp link for "Vehicle Ready"
 */
export async function generateVehicleReadyWhatsAppLink(workOrderId: number) {
    try {
        const wo = await prisma.workOrder.findUnique({
            where: { id: workOrderId },
            include: { client: true, vehicle: true }
        });

        if (!wo || !wo.client.phone) return { success: false, error: 'Cannot generate link' };

        const message = `Hola ${wo.client.name.split(' ')[0]}! 👋\nTu ${wo.vehicle.brand} ${wo.vehicle.model} (${wo.vehicle.plate}) ya está listo para retirar! 🚗💨\n\nTe esperamos!`;
        const phone = wo.client.phone.replace(/\D/g, '');
        const waUrl = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;

        return { success: true, waUrl };
    } catch (error) {
        console.error('Error generating ready link:', error);
        return { success: false, error: 'Internal Error' };
    }
}

/**
 * Processes the client's decision on a budget.
 */
export async function processApproval(token: string, decision: 'APPROVE' | 'REJECT') {
    try {
        const wo = await prisma.workOrder.findUnique({
            where: { approvalToken: token }
        });

        if (!wo) return { success: false, error: 'Invalid token' };
        if (wo.approvalStatus !== 'PENDING') return { success: false, error: 'Budget already processed' };

        await prisma.workOrder.update({
            where: { id: wo.id },
            data: {
                approvalStatus: decision === 'APPROVE' ? 'APPROVED' : 'REJECTED'
            }
        });

        return { success: true };
    } catch (error) {
        console.error('Error processing approval:', error);
        return { success: false, error: 'Failed to process' };
    }
}

/**
 * Gets Work Order details for the public approval page.
 */
export async function getBudgetDetails(token: string) {
    try {
        const wo = await prisma.workOrder.findUnique({
            where: { approvalToken: token },
            include: {
                client: true,
                vehicle: true,
                service: true,
                saleItems: true
            }
        });

        if (!wo) return { success: false, error: 'Budget not found' };

        let items: any[] = [];
        let finalPrice = 0;

        // Strategy: If linked to a Sale, the Sale is the source of truth for items and total.
        // If not (Manual WO), we use wo.price + serviceDetails items.

        if (wo.saleId) {
            // Fetch Sale Items (Sync fix ensures they are up to date)
            const saleItems = await prisma.saleItem.findMany({
                where: { saleId: wo.saleId }
            });
            const sale = await prisma.sale.findUnique({
                where: { id: wo.saleId }
            });

            items = saleItems;
            finalPrice = sale?.total || wo.price;
            // Note: if sale.total is 0 for some reason, fallback to wo.price could still be double counting if wo.price is total. 
            // But usually sale.total is correct.
        } else {
            // No Sale linked (Manual creation)
            const serviceDetailsItems = (wo.serviceDetails as any)?.items || [];
            items = [...wo.saleItems, ...serviceDetailsItems];

            // Avoid duplicates if saleItems already contains serviceDetails items (unlikely if no saleId)
            // But technically wo.saleItems are linked to Sale. If no Sale, wo.saleItems should be empty.

            const itemsTotal = items.reduce((sum: number, item: any) => sum + (item.quantity * (item.unitPrice || item.price || 0)), 0);
            finalPrice = wo.price + itemsTotal;
        }

        return {
            success: true,
            data: {
                id: wo.id,
                clientName: wo.client.name,
                vehicle: `${wo.vehicle.brand} ${wo.vehicle.model} (${wo.vehicle.plate})`,
                serviceName: wo.service.name,
                price: finalPrice,
                items: items.map(i => ({
                    description: i.description || i.name,
                    quantity: i.quantity,
                    price: i.unitPrice || i.price || 0,
                    subtotal: i.quantity * (i.unitPrice || i.price || 0)
                })),
                status: wo.approvalStatus,
                date: wo.date
            }
        };
    } catch (error) {
        console.error('Error fetching budget details:', error);
        return { success: false, error: 'Internal Server Error' };
    }
}
