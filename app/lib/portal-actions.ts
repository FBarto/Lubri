'use server';

import { prisma } from '../../lib/prisma';

export async function getClientDataByToken(token: string) {
    try {
        // 1. Find Token and link to Client
        const waToken = await prisma.whatsAppToken.findUnique({
            where: { token },
            include: {
                appointment: {
                    include: {
                        client: {
                            include: {
                                vehicles: true,
                                workOrders: {
                                    orderBy: { date: 'desc' },
                                    include: {
                                        service: true,
                                        vehicle: true,
                                        attachments: true,
                                        saleItems: true
                                    }
                                }
                            }
                        }
                    }
                }
            }
        });

        if (!waToken || !waToken.appointment || !waToken.appointment.client) {
            return { success: false, error: 'Invalid or expired token' };
        }

        const client = waToken.appointment.client;

        // 2. Calculate "Upcoming Services" (Basic Logic for now)
        // Iterate vehicles, check last service mileage/date and estimate next.
        // For MVP, we'll just list the vehicles and maybe a generic "Check due" if mileage is missing.

        return {
            success: true,
            client: {
                name: client.name,
                phone: client.phone,
                workOrders: client.workOrders.map(wo => ({
                    id: wo.id,
                    date: wo.date,
                    serviceName: wo.service.name,
                    vehiclePlate: wo.vehicle.plate,
                    vehicleModel: wo.vehicle.model,
                    mileage: wo.mileage,
                    status: wo.status,
                    price: wo.price,
                    serviceDetails: wo.serviceDetails,
                    serviceItems: wo.saleItems, // Map saleItems to serviceItems for UI
                    attachments: wo.attachments
                })),
                vehicles: await Promise.all(client.vehicles.map(async v => {
                    const { getVehicleMaintenanceHistory } = await import('./maintenance-actions');
                    const history = await getVehicleMaintenanceHistory(v.id);
                    return {
                        ...v,
                        predictedNextService: v.predictedNextService,
                        maintenanceStatus: history.success ? history.data : null
                    };
                }))
            }
        };

    } catch (error) {
        console.error('Error fetching portal data:', error);
        return { success: false, error: 'Internal Server Error' };
    }
}
