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

        // Send WhatsApp
        await WhatsAppService.sendBudgetApproval(updatedWo, token);
        console.log(`[WA] Budget Approval Sent: /approval/${token}`);

        return { success: true, token };
    } catch (error) {
        console.error('Error sending budget approval:', error);
        return { success: false, error: 'Failed to send approval' };
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

        return {
            success: true,
            data: {
                id: wo.id,
                clientName: wo.client.name,
                vehicle: `${wo.vehicle.brand} ${wo.vehicle.model} (${wo.vehicle.plate})`,
                serviceName: wo.service.name,
                price: wo.price,
                items: wo.saleItems,
                status: wo.approvalStatus,
                date: wo.date
            }
        };
    } catch (error) {
        console.error('Error fetching budget details:', error);
        return { success: false, error: 'Internal Server Error' };
    }
}
