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
            include: { client: true, vehicle: true, saleItems: { include: { product: true } } } // Include saleItems/product
        });

        if (!wo || !wo.client.phone) return { success: false, error: 'Cannot generate link' };

        // 1. Gather Data
        const vehicle = wo.vehicle;
        const mileage = wo.mileage || 0;
        const nextMileage = mileage + 10000; // Default assumption, maybe customizable later

        // Parse Checklist from ServiceDetails
        const details: any = wo.serviceDetails || {};
        const checklist = details.checklist || {};
        const items = (details.items || []).concat(wo.saleItems || []); // Combine items

        // Find Oil Brand string
        const oilItem = items.find((i: any) =>
            (i.category === 'ENGINE_OIL') ||
            (i.product?.category === 'ENGINE_OIL') ||
            i.name?.toLowerCase().includes('aceite') ||
            (i.description?.toLowerCase().includes('aceite'))
        );
        const oilName = oilItem ? (oilItem.name || oilItem.description) : 'Aceite Premium';

        // 2. Build Message
        let message = `Hola ${wo.client.name}! \n`;
        message += `🚗 Queremos informarle que hemos completado el service de su vehículo ${vehicle.brand} ${vehicle.model} con patente ${vehicle.plate}. A continuación, le detallamos las tareas realizadas:\n\n`;

        message += `🛢️ Cambio de aceite ${oilName} \n`;
        message += `🌬️ Cambio del filtro de aire ${checklist.airFilter ? 'SI' : 'NO'}\n`;
        message += `🛢️ Cambio del filtro de aceite ${checklist.oilFilter ? 'SI' : 'NO'}\n`;
        message += `⛽ Cambio del filtro de combustible ${checklist.fuelFilter ? 'SI' : 'NO'}\n`;
        message += `🏠 Cambio del filtro de habitáculo ${checklist.cabinFilter ? 'SI' : 'NO'}\n`;

        message += `🔧 Revisión de lubricante de caja\n`;
        message += `⚙️ Revisión lubricante de diferencial\n`;
        message += `💧 Revisión de fluido hidráulico\n`;
        message += `❄️ Control y reposición de líquido refrigerante\n`;
        message += `🛑 Control y reposición de líquido de frenos\n`;
        message += `🚿 Reposición de líquido limpiaparabrisas\n\n`;

        message += `📍 Kilometraje actual: ${mileage || '---'}\n`;
        message += `🔄 Próximo cambio de aceite: ${nextMileage}\n\n`;

        message += `Si tiene alguna duda o necesita más información, no dude en contactarnos.\n`;
        message += `¡Gracias por confiar en nosotros! 🙌\n\n`;

        message += `📍 Asunción 505 Villa Carlos Paz Córdoba\n`;
        message += `📞 Tel: 03516 75 6248\n`;
        message += `Atentamente,\nLubricantes FB\n\n`;

        message += `📱 Síguenos en nuestras redes sociales:\n`;
        message += `👉 Instagram https://www.instagram.com/fblubricantes/\n`;
        message += `👉 Facebook https://www.facebook.com/profile.php?id=100054567395088\n\n`;

        message += `⭐ Nos encantaría conocer tu opinión. ¡Déjanos una reseña en Google Maps!\n`;
        message += `👉 Dejar calificación https://www.google.com/maps/place/FB+Lubricentro+y+Bater%C3%ADas/@-31.419292,-64.5148519,17z/data=!4m8!3m7!1s0x942d6714e9ed44ed:0x410af4893ace95ba!8m2!3d-31.4192966!4d-64.512277!9m1!1b1`;

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

        if (wo.saleId) {
            const saleItems = await prisma.saleItem.findMany({
                where: { saleId: wo.saleId }
            });
            const sale = await prisma.sale.findUnique({
                where: { id: wo.saleId }
            });

            items = saleItems;
            finalPrice = sale?.total || wo.price;
        } else {
            const serviceDetailsItems = (wo.serviceDetails as any)?.items || [];
            items = [...wo.saleItems, ...serviceDetailsItems];
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
