'use server';

import { prisma } from '../../lib/prisma';
import { ActionResponse } from './types';
import { getVehicleMaintenanceHistory } from './maintenance';

export async function getClientDataByToken(token: string): Promise<ActionResponse> {
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

        const vehiclesWithHistory = await Promise.all(client.vehicles.map(async v => {
            const history = await getVehicleMaintenanceHistory(v.id);
            return {
                ...v,
                predictedNextService: v.predictedNextService,
                maintenanceStatus: history.success ? history.data : null
            };
        }));

        const clientData = {
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
            vehicles: vehiclesWithHistory
        };

        return {
            success: true,
            data: { client: clientData }
        };

    } catch (error) {
        console.error('Error fetching portal data:', error);

        return { success: false, error: 'Internal Server Error' };
    }
}

export async function generatePortalLinkForVehicle(vehicleId: number): Promise<ActionResponse> {
    try {
        const vehicle = await prisma.vehicle.findUnique({
            where: { id: vehicleId },
            include: { client: true }
        });

        if (!vehicle) return { success: false, error: 'Vehicle not found' };

        // 1. Try to find an existing valid token for this vehicle (via any active appointment)
        // This is a bit indirect, but we look for a token linked to an appointment for this vehicle
        const existingToken = await prisma.whatsAppToken.findFirst({
            where: {
                appointment: { vehicleId: vehicle.id },
                expiresAt: { gt: new Date() }
            },
            orderBy: { createdAt: 'desc' }
        });

        if (existingToken) {
            return { success: true, data: { url: `/portal/${existingToken.token}` } };
        }

        // 2. If no token, create a dummy appointment (or use latest) to attach a token
        // Use latest appointment if exists
        let appointment = await prisma.appointment.findFirst({
            where: { vehicleId: vehicle.id },
            orderBy: { date: 'desc' }
        });

        if (!appointment) {
            // Create a dummy one for system access (historical placeholder)
            const service = await prisma.service.findFirst({ where: { active: true } });
            appointment = await prisma.appointment.create({
                data: {
                    clientId: vehicle.clientId,
                    vehicleId: vehicle.id,
                    serviceId: service?.id || 1,
                    date: new Date(),
                    status: 'CONFIRMED',
                    notes: 'System generated for Portal Access'
                }
            });
        }

        const crypto = require('crypto');
        const token = crypto.randomBytes(32).toString('hex');

        await prisma.whatsAppToken.create({
            data: {
                token: token,
                action: 'ACCESS',
                expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days valid for manual link
                appointmentId: appointment.id
            }
        });

        return { success: true, data: { url: `/portal/${token}` } };

    } catch (error) {
        console.error("Error generating portal link:", error);
        return { success: false, error: 'Failed to generate link' };
    }
}
