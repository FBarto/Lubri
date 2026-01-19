'use server';

import { prisma } from '../../lib/prisma';
import { safeRevalidate } from './server-utils';
import { WhatsAppService } from './whatsapp/service';

// --- Types ---
export interface CreateClientInput {
    name: string;
    phone: string;
}

export interface CreateVehicleInput {
    plate: string;
    brand?: string;
    model?: string;
    type?: string; // Auto, Moto, Pickup
    notes?: string;
    mileage?: number;
    clientId: number;
}

export interface CreateAppointmentInput {
    clientId?: number;
    vehicleId?: number;
    serviceId: number;
    date: string | Date; // ISO string or Date object
    notes?: string;
    guestData?: {
        name: string;
        phone: string;
        plate: string;
        model?: string;
    };
}

// --- Actions ---

export async function createClient(data: CreateClientInput) {
    try {
        if (!data.name || !data.phone) {
            return { success: false, error: 'Missing defined fields (name, phone)' };
        }

        const client = await prisma.client.create({
            data: {
                name: data.name,
                phone: data.phone,
            },
        });

        safeRevalidate('/admin/clients');
        return { success: true, client };
    } catch (error: any) {
        console.error('Error creating client:', error);
        return { success: false, error: error.message };
    }
}

export async function createVehicle(data: CreateVehicleInput) {
    try {
        if (!data.plate || !data.clientId) {
            return { success: false, error: 'Missing required fields (plate, clientId)' };
        }

        const vehicle = await prisma.vehicle.create({
            data: {
                plate: data.plate,
                brand: data.brand || '',
                model: data.model || '',
                type: data.type || 'AUTO',
                notes: data.notes || '',
                mileage: data.mileage || null,
                clientId: data.clientId,
            },
        });

        safeRevalidate('/admin/vehicles');
        return { success: true, vehicle };
    } catch (error: any) {
        if (error.code === 'P2002') {
            return { success: false, error: 'A vehicle with this plate already exists' };
        }
        console.error('Error creating vehicle:', error);
        return { success: false, error: error.message };
    }
}

export async function updateVehicle(id: number, data: Partial<CreateVehicleInput>) {
    try {
        const vehicle = await prisma.vehicle.update({
            where: { id },
            data: {
                brand: data.brand,
                model: data.model,
                type: data.type,
                notes: data.notes,
                mileage: data.mileage,
                clientId: data.clientId
            }
        });

        safeRevalidate('/admin/vehicles');
        return { success: true, vehicle };
    } catch (error: any) {
        console.error('Error updating vehicle:', error);
        return { success: false, error: error.message };
    }
}

export async function createAppointment(data: CreateAppointmentInput) {
    try {
        let { clientId, vehicleId } = data;
        const { serviceId, date, notes, guestData } = data;

        // 0. Handle Guest Data (Find or Create Client/Vehicle)
        if (!clientId || !vehicleId) {
            if (guestData && guestData.name && guestData.phone && guestData.plate) {
                // Find or Create Client
                let client = await prisma.client.findFirst({
                    where: { phone: guestData.phone }
                });

                if (!client) {
                    const cResult = await createClient({ name: guestData.name, phone: guestData.phone });
                    if (!cResult.success || !cResult.client) throw new Error(cResult.error);
                    client = cResult.client;
                }

                // Find or Create Vehicle
                let vehicle = await prisma.vehicle.findUnique({
                    where: { plate: guestData.plate }
                });

                if (!vehicle) {
                    const vResult = await createVehicle({
                        plate: guestData.plate,
                        model: guestData.model || 'Modelo Desconocido',
                        clientId: client.id
                    });
                    if (!vResult.success || !vResult.vehicle) throw new Error(vResult.error);
                    vehicle = vResult.vehicle;
                } else {
                    // Update vehicle owner logic if needed
                    if (!vehicle.clientId) {
                        await prisma.vehicle.update({
                            where: { id: vehicle.id },
                            data: { clientId: client.id }
                        });
                    }
                }

                clientId = client.id;
                vehicleId = vehicle.id;
            } else {
                return { success: false, error: 'Missing required fields (clientId/vehicleId OR guestData)' };
            }
        }

        if (!clientId || !vehicleId || !serviceId || !date) {
            return { success: false, error: 'Missing required fields' };
        }

        const startTime = new Date(date);

        // 1. Validate Business Hours (Argentina UTC-3)
        const ARG_OFFSET = 3;
        const arDate = new Date(startTime.getTime() - ARG_OFFSET * 60 * 60 * 1000); // Shift to AR Time (effectively looking at UTC as Local)

        const hour = arDate.getUTCHours();
        const minutes = arDate.getUTCMinutes();
        const timeInMinutes = hour * 60 + minutes;

        const morningStart = 8 * 60 + 30; // 08:30
        const morningEnd = 13 * 60;       // 13:00
        const afternoonStart = 16 * 60 + 30; // 16:30
        const afternoonEnd = 20 * 60 + 30;   // 20:30

        const isMorning = timeInMinutes >= morningStart && timeInMinutes < morningEnd;
        const isAfternoon = timeInMinutes >= afternoonStart && timeInMinutes < afternoonEnd;

        if (!isMorning && !isAfternoon) {
            return { success: false, error: 'Horario fuera de atención. (08:30-13:00 / 16:30-20:30)' };
        }

        // 2. Calculate End Time
        const service = await prisma.service.findUnique({ where: { id: Number(serviceId) } });
        if (!service) return { success: false, error: 'Service not found' };

        const duration = service.duration || 30;
        const endTime = new Date(startTime.getTime() + duration * 60000);

        // 3. Validate Overlap
        const potentialCollisions = await prisma.appointment.findMany({
            where: {
                status: { not: 'CANCELLED' },
                date: {
                    gte: new Date(startTime.getTime() - 180 * 60000),
                    lte: new Date(endTime.getTime() + 180 * 60000)
                }
            },
            include: { service: true }
        });

        for (const appt of potentialCollisions) {
            const apptStart = new Date(appt.date);
            const apptDuration = appt.service.duration;
            const apptEnd = new Date(apptStart.getTime() + apptDuration * 60000);

            if (startTime < apptEnd && endTime > apptStart) {
                return { success: false, error: `Conflicto de horario con otro turno (${appt.service.name} ${apptStart.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })})` };
            }
        }

        // 4. Create Appointment
        const appointment = await prisma.appointment.create({
            data: {
                date: startTime,
                clientId: Number(clientId),
                vehicleId: Number(vehicleId),
                serviceId: Number(serviceId),
                status: 'REQUESTED',
                notes: notes,
            }
        });

        // Schedule WhatsApp Notifications (Async, don't block)
        WhatsAppService.scheduleAppointmentNotifications(appointment.id).catch(e =>
            console.error('Failed to schedule WA notifications:', e)
        );

        safeRevalidate('/admin/calendar');
        return { success: true, appointment };

    } catch (error: any) {
        console.error('Error creating appointment:', error);
        return { success: false, error: error.message };
    }
}
