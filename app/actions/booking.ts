'use server';

import { prisma } from '../../lib/prisma';
import { revalidatePath } from 'next/cache';
import {
    LeadCase,
    CaseType,
    ServiceCategory,
    Priority,
    ChecklistTemplate,
    InputType,
    CaseStatus,
    LogChannel
} from '@prisma/client';
import { parseLeadIntake } from '../lib/gemini';
import { ActionResponse } from './types';
import { safeRevalidate } from '../lib/server-utils';
import { WhatsAppService } from '../lib/whatsapp/service';

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
    fuelType?: string;
    engine?: string;
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
    leadCaseId?: string;
    force?: boolean;
}

// --- Actions ---

export async function createClient(data: CreateClientInput): Promise<ActionResponse> {
    console.log('[createClient] Input:', data);
    try {
        if (!data.name || !data.phone) {
            console.error('[createClient] Missing fields:', data);
            return { success: false, error: 'Missing defined fields (name, phone)' };
        }

        const client = await prisma.client.create({
            data: {
                name: data.name,
                phone: data.phone,
            },
        });

        console.log('[createClient] Success:', client.id);
        safeRevalidate('/admin/clients');
        return { success: true, data: { client, existing: false } };
    } catch (error: any) {
        console.error('[createClient] Error:', error);
        if (error.code === 'P2002') {
            console.log('[createClient] P2002 Collision, recovering...');
            // Client already exists! Return it.
            const existing = await prisma.client.findFirst({ where: { phone: data.phone } });
            if (existing) {
                console.log('[createClient] Recovered existing:', existing.id);
                // Return existing but mark success? Or return correct data structure
                return { success: true, data: { client: existing, existing: true } };
            }
        }
        return { success: false, error: error.message };
    }
}

export async function createVehicle(data: CreateVehicleInput): Promise<ActionResponse> {
    console.log('[createVehicle] Input:', data);
    try {
        if (!data.plate || !data.clientId) {
            console.error('[createVehicle] Missing fields:', data);
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
                specifications: {
                    fuelType: data.fuelType,
                    engine: data.engine
                }
            },
        });

        console.log('[createVehicle] Success:', vehicle.id);
        safeRevalidate('/admin/vehicles');
        return { success: true, data: vehicle };
    } catch (error: any) {
        console.error('[createVehicle] Error:', error);
        if (error.code === 'P2002') {
            return { success: false, error: 'A vehicle with this plate already exists' };
        }
        return { success: false, error: error.message };
    }
}

export async function updateVehicle(id: number, data: Partial<CreateVehicleInput>): Promise<ActionResponse> {
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
        return { success: true, data: vehicle };
    } catch (error: any) {
        console.error('Error updating vehicle:', error);
        return { success: false, error: error.message };
    }
}

export async function createAppointment(data: CreateAppointmentInput): Promise<ActionResponse> {
    console.log('[createAppointment] Input:', JSON.stringify(data));
    try {
        let { clientId, vehicleId } = data;
        const { serviceId, date, notes, guestData, leadCaseId } = data;

        // 0. Handle Guest Data (Find or Create Client/Vehicle)
        if (!clientId || !vehicleId) {
            if (guestData && guestData.name && guestData.phone && guestData.plate) {
                // Find or Create Client
                let client = await prisma.client.findFirst({
                    where: { phone: guestData.phone }
                });

                if (!client) {
                    const cResult = await createClient({ name: guestData.name, phone: guestData.phone });
                    if (!cResult.success || !cResult.data) throw new Error(cResult.error);
                    client = cResult.data;
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
                    if (!vResult.success || !vResult.data) throw new Error(vResult.error);
                    vehicle = vResult.data;
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

        const { force = false } = data;

        if (!isMorning && !isAfternoon && !force) {
            return { success: false, error: 'Horario fuera de atención. (08:30-13:00 / 16:30-20:30)' };
        }

        // 2. Calculate End Time
        const service = await prisma.service.findUnique({ where: { id: Number(serviceId) } });
        if (!service) return { success: false, error: 'Service not found' };

        const duration = service.duration || 30;
        const endTime = new Date(startTime.getTime() + duration * 60000);

        // 3. Validate Overlap
        if (!force) {
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
                leadCaseId: leadCaseId,
            },
            include: {
                client: true,
                vehicle: true,
                service: true
            }
        });

        // 5. Update LeadCase or Create New one
        let finalCaseId = leadCaseId;
        if (leadCaseId) {
            await prisma.leadCase.update({
                where: { id: leadCaseId },
                data: { status: 'SCHEDULED', clientId: Number(clientId), vehicleId: Number(vehicleId) }
            });
        } else {
            // AUTO-CREATE CASE for direct bookings (so they appear in Romi's Inbox)
            try {
                const mapToServiceCategory = (cat: string): any => {
                    const c = (cat || '').toUpperCase();
                    if (c.includes('ACEITE') || c.includes('LUBRI') || c.includes('OIL')) return 'OIL_SERVICE';
                    if (c.includes('BATER') || c.includes('BATTERY')) return 'BATTERY';
                    if (c.includes('NEUMA') || c.includes('CUBIER') || c.includes('TYRE')) return 'TYRES';
                    return 'OTHER';
                };

                const serviceName = appointment.service.name;
                const clientName = appointment.client?.name || 'Cliente';
                const dayStr = startTime.toLocaleDateString('es-AR');
                const timeStr = startTime.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' });

                const newCase = await prisma.leadCase.create({
                    data: {
                        summary: `Turno: ${serviceName} - ${clientName}`,
                        type: 'APPOINTMENT',
                        serviceCategory: mapToServiceCategory(appointment.service.category),
                        status: 'SCHEDULED',
                        clientId: Number(clientId),
                        vehicleId: Number(vehicleId),
                        intakeRawText: `Turno agendado vía web para el ${dayStr} a las ${timeStr}`,
                        slaDueAt: new Date(Date.now() + 1 * 60 * 60 * 1000), // 1h SLA for auto-confirmations
                    }
                });
                finalCaseId = newCase.id;

                // Create initial log
                await prisma.caseLog.create({
                    data: {
                        leadCaseId: newCase.id,
                        authorUserId: 1, // System
                        channel: 'INTERNAL_NOTE',
                        message: `Turno agendado automáticamente para el ${dayStr} ${timeStr}.`
                    }
                });
            } catch (caseError: any) {
                console.error('CRITICAL: Failed to auto-create LeadCase:', caseError.message, caseError.code);
                // Non-blocking, we still have the appointment
            }
        }

        // Schedule WhatsApp Notifications (Async, don't block)
        WhatsAppService.scheduleAppointmentNotifications(appointment.id).catch(e =>
            console.error('Failed to schedule WA notifications:', e)
        );

        safeRevalidate('/admin/calendar');
        return { success: true, data: { appointment, caseId: finalCaseId } };

    } catch (error: any) {
        console.error('Error creating appointment:', error);
        return { success: false, error: error.message };
    }
}
