'use server';

import { prisma } from '../../lib/prisma';
import { ActionResponse } from './types';

export async function getClientProfile(clientId: number): Promise<ActionResponse> {
    try {
        const client = await prisma.client.findUnique({
            where: { id: clientId },
            include: {
                vehicles: {
                    orderBy: { id: 'desc' }
                },
                sales: {
                    orderBy: { date: 'desc' },
                    include: {
                        items: true
                    },
                    take: 50 // Limit to last 50 for performance
                },
                workOrders: {
                    orderBy: { date: 'desc' },
                    include: {
                        vehicle: true,
                        saleItems: true
                    },
                    take: 50
                },
                appointments: {
                    orderBy: { date: 'desc' },
                    include: {
                        vehicle: true,
                        service: true
                    },
                    take: 20
                },
                leadCases: {
                    orderBy: { createdAt: 'desc' },
                    take: 10
                }
            }
        });

        if (!client) {
            return { success: false, error: 'Cliente no encontrado' };
        }


        // Calculate Lifetime Value (accurate via aggregation)
        const salesAgg = await prisma.sale.aggregate({
            where: { clientId, status: 'COMPLETED' },
            _sum: { total: true }
        });
        const woAgg = await prisma.workOrder.aggregate({
            where: { clientId, status: 'COMPLETED' },
            _sum: { price: true }
        });

        const lifetimeValue = (salesAgg._sum.total || 0) + (woAgg._sum.price || 0);

        // Merge History for unified timeline
        const history = [
            ...client.sales.map(s => ({
                type: 'SALE',
                date: s.date,
                id: s.id,
                total: s.total,
                status: 'COMPLETED', // Sales are usually instant
                items: s.items.length,
                description: `Compra en Mostrador`
            })),
            ...client.workOrders.map(wo => ({
                type: 'WORK_ORDER',
                date: wo.date,
                id: wo.id,
                total: wo.price,
                status: wo.status,
                vehicle: wo.vehicle?.model + ' ' + wo.vehicle?.plate,
                description: `Servicio: ${wo.vehicle?.model}` // Could be more specific if we had main service name
            })),
            ...client.appointments.map(app => ({
                type: 'APPOINTMENT',
                date: app.date,
                id: app.id,
                status: app.status,
                vehicle: app.vehicle.model,
                description: `Turno: ${app.service.name}`
            }))
        ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

        return {
            success: true,
            data: {
                ...client,
                lifetimeValue,
                history // Unified timeline
            }
        };

    } catch (error) {
        console.error('Error fetching client profile:', error);
        return { success: false, error: 'Error al obtener perfil del cliente' };
    }
}
