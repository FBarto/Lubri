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

export type ActionResponse<T = any> = {
    success: boolean;
    data?: T;
    error?: string;
};

// --- CHECKLIST TEMPLATES ---
const CHECKLIST_TEMPLATES: Record<ChecklistTemplate, any[]> = {
    [ChecklistTemplate.TYRES]: [
        { key: 'tyres_need', label: '¿Qué necesita?', inputType: 'SELECT', options: ["Cubierta nueva", "Reparación", "Balanceo", "Alineación", "Auxilio"], isRequired: true, sortOrder: 1 },
        { key: 'tyres_size', label: 'Medida (ej: 175/70R13)', inputType: 'TEXT', isRequired: false, sortOrder: 2 }, // Conditional logic handled in UI or validation? validation is hard dynamically
        { key: 'tyres_qty', label: 'Cantidad', inputType: 'NUMBER', isRequired: true, sortOrder: 3 },
        { key: 'tyres_brand_pref', label: 'Preferencia de Marca', inputType: 'TEXT', isRequired: false, sortOrder: 4 },
        { key: 'tyres_urgency', label: 'Urgencia', inputType: 'SELECT', options: ["Hoy", "Esta semana", "Sin apuro"], isRequired: true, sortOrder: 5 },
        { key: 'vehicle_plate', label: 'Patente', inputType: 'TEXT', isRequired: false, sortOrder: 6 },
    ],
    [ChecklistTemplate.BATTERY]: [
        { key: 'battery_need', label: 'Necesidad', inputType: 'SELECT', options: ["Compra", "Cambio + instalación", "Auxilio arranque"], isRequired: true, sortOrder: 1 },
        { key: 'vehicle_model', label: 'Vehículo', inputType: 'TEXT', isRequired: true, sortOrder: 2 },
        { key: 'battery_delivery_old', label: 'Entrega batería vieja?', inputType: 'BOOLEAN', isRequired: true, sortOrder: 3 },
        { key: 'battery_installation_place', label: 'Lugar Instalación', inputType: 'SELECT', options: ["En local", "A domicilio"], isRequired: true, sortOrder: 4 },
        { key: 'urgency', label: 'Urgencia', inputType: 'SELECT', options: ["Ahora", "Hoy", "Esta semana"], isRequired: true, sortOrder: 5 },
    ],
    [ChecklistTemplate.OIL_SERVICE]: [
        { key: 'service_type', label: 'Tipo Service', inputType: 'SELECT', options: ["Aceite+filtro", "Aceite+filtros", "Completo"], isRequired: true, sortOrder: 1 },
        { key: 'vehicle_model', label: 'Vehículo', inputType: 'TEXT', isRequired: true, sortOrder: 2 },
        { key: 'oil_preference', label: 'Aceite preferido', inputType: 'TEXT', isRequired: true, sortOrder: 3 },
        { key: 'filters_needed', label: 'Filtros', inputType: 'MULTISELECT', options: ["Aceite", "Aire", "Habitáculo", "Combustible"], isRequired: true, sortOrder: 4 },
        { key: 'urgency', label: 'Urgencia', inputType: 'SELECT', options: ["Mañana", "Tarde", "Semana"], isRequired: true, sortOrder: 5 },
    ],
    [ChecklistTemplate.GENERIC]: [
        { key: 'need_summary', label: 'Resumen Necesidad', inputType: 'TEXT', isRequired: true, sortOrder: 1 },
        { key: 'urgency', label: 'Urgencia', inputType: 'SELECT', options: ["Ahora", "Hoy", "Esta semana", "Sin apuro"], isRequired: true, sortOrder: 2 },
        { key: 'preferred_time_window', label: 'Turno Preferido', inputType: 'SELECT', options: ["Mañana", "Tarde"], isRequired: false, sortOrder: 3 },
    ]
};

// --- ACTIONS ---

export async function createLeadCase(input: {
    summary: string;
    type: CaseType;
    serviceCategory: ServiceCategory;
    priority?: Priority;
    rawText?: string;
    authorUserId: number; // Who created it
}): Promise<ActionResponse<LeadCase>> {
    try {
        const { summary, type, serviceCategory, priority, rawText, authorUserId } = input;

        // 1. Determine Template
        let templateKey: ChecklistTemplate = ChecklistTemplate.GENERIC;
        if (serviceCategory === 'TYRES') templateKey = ChecklistTemplate.TYRES;
        if (serviceCategory === 'BATTERY') templateKey = ChecklistTemplate.BATTERY;
        if (serviceCategory === 'OIL_SERVICE') templateKey = ChecklistTemplate.OIL_SERVICE;

        // 2. Create Case with Transaction
        const newCase = await prisma.$transaction(async (tx) => {
            const c = await tx.leadCase.create({
                data: {
                    summary,
                    type,
                    serviceCategory,
                    priority: priority || 'MEDIUM',
                    status: 'NEW',
                    slaDueAt: new Date(Date.now() + 2 * 60 * 60 * 1000), // +2 hours default
                    intakeRawText: rawText,
                    assignedToUserId: authorUserId, // Self assign
                    lastContactAt: new Date(),
                }
            });

            // 3. Create Checklist Items
            const templateItems = CHECKLIST_TEMPLATES[templateKey];
            if (templateItems) {
                await tx.caseChecklistItem.createMany({
                    data: templateItems.map(item => ({
                        leadCaseId: c.id,
                        templateKey,
                        key: item.key,
                        label: item.label,
                        inputType: item.inputType as InputType,
                        options: item.options ? JSON.stringify(item.options) : undefined,
                        isRequired: item.isRequired,
                        sortOrder: item.sortOrder,
                    }))
                });
            }

            // 4. Log Creation
            await tx.caseLog.create({
                data: {
                    leadCaseId: c.id,
                    authorUserId,
                    channel: 'INTERNAL_NOTE',
                    message: `Caso creado. Categoría: ${serviceCategory}.`,
                }
            });

            return c;
        });

        revalidatePath('/admin/inbox');
        return { success: true, data: newCase };

    } catch (error) {
        console.error('Error creating LeadCase:', error);
        return { success: false, error: 'Failed to create case' };
    }
}

export async function updateChecklistItem(itemId: string, value: any, isDone: boolean) {
    try {
        await prisma.caseChecklistItem.update({
            where: { id: itemId },
            data: {
                value: String(value), // Store as string
                isDone
            }
        });
        // We don't strictly revalidate path here to avoid flickering input focus, 
        // relying on client state or specific revalidation if needed.
        return { success: true };
    } catch (error) {
        return { success: false, error: 'Update failed' };
    }
}

export async function addCaseLog(caseId: string, authorUserId: number, message: string, channel: LogChannel) {
    try {
        const log = await prisma.caseLog.create({
            data: {
                leadCaseId: caseId,
                authorUserId,
                message,
                channel
            }
        });

        // Update last contact
        await prisma.leadCase.update({
            where: { id: caseId },
            data: { lastContactAt: new Date() }
        });

        revalidatePath(`/admin/inbox/${caseId}`);
        return { success: true, data: log };
    } catch (error) {
        return { success: false, error: 'Log failed' };
    }
}

export async function updateCaseStatus(caseId: string, status: CaseStatus) {
    try {
        await prisma.leadCase.update({
            where: { id: caseId },
            data: { status }
        });
        revalidatePath('/admin/inbox');
        return { success: true };
    } catch (error) {
        return { success: false, error: 'Status update failed' };
    }
}

export async function assignClientToCase(caseId: string, clientId: number, vehicleId?: number) {
    try {
        await prisma.leadCase.update({
            where: { id: caseId },
            data: {
                clientId,
                vehicleId
            }
        });
        revalidatePath(`/admin/inbox/${caseId}`);
        return { success: true };
    } catch (error) {
        console.error(error);
        return { success: false, error: 'Associate failed' };
    }
}

export async function getInboxCases() {
    try {
        const cases = await prisma.leadCase.findMany({
            where: {
                status: { not: 'CLOSED' }
            },
            include: {
                assignedToUser: true,
                client: true,
                vehicle: true
            },
            orderBy: {
                slaDueAt: 'asc'
            }
        });
        return { success: true, data: cases };
    } catch (error) {
        return { success: false, error: 'Failed to fetch' };
    }
}
// --- CONVERSION & UTILS ---

export async function getServicesList() {
    try {
        const services = await prisma.service.findMany({
            where: { active: true },
            select: { id: true, name: true, duration: true, price: true }
        });
        return { success: true, data: services };
    } catch (error) {
        return { success: false, error: 'Failed' };
    }
}

export async function convertCaseToAppointment(input: {
    caseId: string;
    date: Date;
    serviceId: number;
    notes?: string;
}) {
    try {
        const { caseId, date, serviceId, notes } = input;

        // 1. Get Case to reuse Client/Vehicle
        const leadCase = await prisma.leadCase.findUnique({
            where: { id: caseId }
        });

        if (!leadCase || !leadCase.clientId || !leadCase.vehicleId) {
            return { success: false, error: 'Case needs linked Client/Vehicle first' };
        }

        // 2. Create Appointment
        const appointment = await prisma.appointment.create({
            data: {
                date,
                status: 'CONFIRMED',
                clientId: leadCase.clientId,
                vehicleId: leadCase.vehicleId,
                serviceId,
                notes: notes || leadCase.summary,
                leadCaseId: caseId
            }
        });

        // 3. Update Case Status
        await prisma.leadCase.update({
            where: { id: caseId },
            data: { status: 'SCHEDULED' }
        });

        // 4. Log it
        await prisma.caseLog.create({
            data: {
                leadCaseId: caseId,
                authorUserId: leadCase.assignedToUserId || 1, // fallback
                channel: 'INTERNAL_NOTE',
                message: `Caso convertido a Turno #${appointment.id} para el ${date.toLocaleDateString()}`
            }
        });

        revalidatePath(`/admin/inbox/${caseId}`);
        return { success: true, data: appointment };

    } catch (error) {
        console.error('Convert Error:', error);
        return { success: false, error: 'Conversion failed' };
    }
}
