'use server';

import { prisma } from '@/lib/prisma';
import {
    LeadCase, CaseStatus, Priority, ServiceCategory,
    ChecklistTemplate, InputType, LogChannel, CaseType
} from '@prisma/client';
import { revalidatePath } from 'next/cache';
import { auth } from '@/auth';

// --- HELPER: GENERATE CHECKLIST ---
async function generateChecklistItems(leadCaseId: string, category: ServiceCategory) {
    let template: any[] = [];

    // Define templates based on empleado_redes.txt
    if (category === 'TYRES') {
        template = [
            { key: 'tyres_need', label: 'Necesidad', inputType: 'SELECT', options: ["Cubierta nueva", "Reparación", "Balanceo", "Alineación", "Auxilio"], isRequired: true, sortOrder: 1 },
            { key: 'tyres_size', label: 'Medida (ej 175/70R13)', inputType: 'TEXT', isRequired: false, sortOrder: 2 }, // Conditional logic handled in UI validation mostly, but here we init
            { key: 'tyres_qty', label: 'Cantidad', inputType: 'NUMBER', isRequired: true, sortOrder: 3 },
            { key: 'tyres_brand_pref', label: 'Marca preferida', inputType: 'TEXT', isRequired: false, sortOrder: 4 },
            { key: 'tyres_budget_range', label: 'Rango precio', inputType: 'MONEY', isRequired: false, sortOrder: 5 },
            { key: 'tyres_urgency', label: 'Urgencia', inputType: 'SELECT', options: ["Hoy", "Esta semana", "Sin apuro"], isRequired: true, sortOrder: 6 },
            { key: 'tyres_location', label: 'Ubicación (si auxilio)', inputType: 'TEXT', isRequired: false, sortOrder: 7 },
            { key: 'tyres_issue_desc', label: 'Descripción problema', inputType: 'TEXT', isRequired: false, sortOrder: 8 },
            { key: 'vehicle_plate', label: 'Patente', inputType: 'TEXT', isRequired: false, sortOrder: 9 },
            { key: 'vehicle_model', label: 'Modelo vehículo', inputType: 'TEXT', isRequired: false, sortOrder: 10 },
            { key: 'payment_method', label: 'Forma de pago', inputType: 'SELECT', options: ["Efectivo", "Transferencia", "Débito", "Crédito"], isRequired: false, sortOrder: 11 },
            { key: 'preferred_time_window', label: 'Turno pref.', inputType: 'SELECT', options: ["Mañana", "Tarde"], isRequired: false, sortOrder: 12 },
            { key: 'callback_ok', label: 'Llamar?', inputType: 'BOOLEAN', isRequired: false, sortOrder: 13 },
        ];
    } else if (category === 'BATTERY') {
        template = [
            { key: 'battery_need', label: 'Necesidad', inputType: 'SELECT', options: ["Compra", "Cambio + instalación", "Auxilio arranque"], isRequired: true, sortOrder: 1 },
            { key: 'vehicle_model', label: 'Vehículo', inputType: 'TEXT', isRequired: true, sortOrder: 2 },
            { key: 'battery_current_model', label: 'Batería actual', inputType: 'TEXT', isRequired: false, sortOrder: 3 },
            { key: 'battery_cca_or_ah', label: 'Amperaje/CCA', inputType: 'TEXT', isRequired: false, sortOrder: 4 },
            { key: 'battery_delivery_old', label: 'Entrega vieja?', inputType: 'BOOLEAN', isRequired: true, sortOrder: 5 },
            { key: 'battery_installation_place', label: 'Lugar', inputType: 'SELECT', options: ["En local", "A domicilio"], isRequired: false, sortOrder: 6 },
            { key: 'battery_location', label: 'Dirección domicilio', inputType: 'TEXT', isRequired: false, sortOrder: 7 },
            { key: 'battery_symptoms', label: 'Síntomas', inputType: 'TEXT', isRequired: false, sortOrder: 8 },
            { key: 'urgency', label: 'Urgencia', inputType: 'SELECT', options: ["Ahora", "Hoy", "Esta semana"], isRequired: true, sortOrder: 9 },
            { key: 'vehicle_plate', label: 'Patente', inputType: 'TEXT', isRequired: false, sortOrder: 10 },
            { key: 'payment_method', label: 'Pago', inputType: 'SELECT', options: ["Efectivo", "Transferencia", "Débito", "Crédito"], isRequired: false, sortOrder: 11 },
            { key: 'warranty_interest', label: 'Interés garantía?', inputType: 'BOOLEAN', isRequired: false, sortOrder: 12 },
        ];
    } else if (category === 'OIL_SERVICE') {
        template = [
            { key: 'service_type', label: 'Tipo Service', inputType: 'SELECT', options: ["Aceite+filtro", "Aceite+filtros", "Completo"], isRequired: true, sortOrder: 1 },
            { key: 'vehicle_model', label: 'Vehículo', inputType: 'TEXT', isRequired: true, sortOrder: 2 },
            { key: 'vehicle_engine', label: 'Motor', inputType: 'TEXT', isRequired: false, sortOrder: 3 },
            { key: 'vehicle_km', label: 'Kilometraje', inputType: 'NUMBER', isRequired: false, sortOrder: 4 },
            { key: 'oil_preference', label: 'Aceite pref.', inputType: 'TEXT', isRequired: true, sortOrder: 5 },
            { key: 'filters_needed', label: 'Filtros', inputType: 'MULTISELECT', options: ["Aceite", "Aire", "Habitáculo", "Combustible"], isRequired: true, sortOrder: 6 },
            { key: 'service_date_pref', label: 'Fecha pref.', inputType: 'TEXT', isRequired: false, sortOrder: 7 },
            { key: 'service_time_window', label: 'Turno pref.', inputType: 'SELECT', options: ["Mañana", "Tarde"], isRequired: false, sortOrder: 8 },
            { key: 'extra_checks', label: 'Revisar extra', inputType: 'TEXT', isRequired: false, sortOrder: 9 },
            { key: 'vehicle_plate', label: 'Patente', inputType: 'TEXT', isRequired: false, sortOrder: 10 },
            { key: 'payment_method', label: 'Pago', inputType: 'SELECT', options: ["Efectivo", "Transferencia", "Débito", "Crédito"], isRequired: false, sortOrder: 11 },
            { key: 'invoice_needed', label: 'Factura', inputType: 'SELECT', options: ["No", "Factura A", "Factura B"], isRequired: false, sortOrder: 12 },
        ];
    } else {
        // GENERIC / OTHER
        template = [
            { key: 'need_summary', label: 'Resumen necesidad', inputType: 'TEXT', isRequired: true, sortOrder: 1 },
            { key: 'vehicle_model', label: 'Vehículo', inputType: 'TEXT', isRequired: false, sortOrder: 2 },
            { key: 'vehicle_plate', label: 'Patente', inputType: 'TEXT', isRequired: false, sortOrder: 3 },
            { key: 'urgency', label: 'Urgencia', inputType: 'SELECT', options: ["Ahora", "Hoy", "Esta semana", "Sin apuro"], isRequired: true, sortOrder: 4 },
            { key: 'preferred_time_window', label: 'Turno pref.', inputType: 'SELECT', options: ["Mañana", "Tarde"], isRequired: false, sortOrder: 5 },
            { key: 'payment_method', label: 'Pago', inputType: 'SELECT', options: ["Efectivo", "Transferencia", "Débito", "Crédito"], isRequired: false, sortOrder: 6 },
        ];
    }

    const templateKey = category === 'OTHER' ? 'GENERIC' : category as ChecklistTemplate;

    await prisma.caseChecklistItem.createMany({
        data: template.map(t => ({
            leadCaseId,
            templateKey: templateKey,
            key: t.key,
            label: t.label,
            inputType: t.inputType,
            options: t.options ?? null,
            isRequired: t.isRequired,
            sortOrder: t.sortOrder,
            isDone: false
        }))
    });
}


// --- ACTIONS ---

export async function createLeadCase(data: {
    summary: string,
    serviceCategory: ServiceCategory,
    type: CaseType,
    authorUserId: number,
    source?: string
}) {
    try {
        // Calculate SLA (2 hours from now)
        const slaDueAt = new Date(Date.now() + 2 * 60 * 60 * 1000);

        const newCase = await prisma.leadCase.create({
            data: {
                summary: data.summary,
                serviceCategory: data.serviceCategory,
                type: data.type,
                status: 'NEW',
                priority: 'MEDIUM',
                slaDueAt,
                assignedToUserId: data.authorUserId, // Auto-assign to creator (Romi)
                intakeRawText: data.source
            }
        });

        // Generate Checklist
        await generateChecklistItems(newCase.id, data.serviceCategory);

        // Create initial log
        await prisma.caseLog.create({
            data: {
                leadCaseId: newCase.id,
                authorUserId: data.authorUserId,
                channel: 'INTERNAL_NOTE',
                message: 'Caso creado manual desde Inbox.'
            }
        });

        revalidatePath('/admin/inbox');
        return { success: true, caseId: newCase.id };
    } catch (error: any) {
        console.error('Error creating lead case:', error);
        return { success: false, error: error.message };
    }
}

export async function getLeadCases(filters?: { status?: CaseStatus, assignedTo?: number }) {
    const where: any = {};
    if (filters?.status) where.status = filters.status;
    if (filters?.assignedTo) where.assignedToUserId = filters.assignedTo;

    const cases = await prisma.leadCase.findMany({
        where,
        include: {
            assignedToUser: { select: { name: true, username: true } },
            client: { select: { name: true, phone: true } },
            vehicle: { select: { plate: true, brand: true, model: true } }
        },
        orderBy: [
            { priority: 'desc' }, // High priority first
            { slaDueAt: 'asc' }   // Soonest SLA first
        ]
    });
    return cases;
}

export async function getLeadCaseDetail(id: string) {
    return await prisma.leadCase.findUnique({
        where: { id },
        include: {
            assignedToUser: true,
            client: true,
            vehicle: true,
            logs: {
                include: { authorUser: true },
                orderBy: { createdAt: 'desc' }
            },
            checklist: {
                orderBy: { sortOrder: 'asc' }
            },
            quote: {
                include: { items: true }
            },
            appointment: {
                include: { service: true }
            }
        }
    });
}

export async function addCaseLog(caseId: string, userId: number, message: string, channel: LogChannel) {
    try {
        await prisma.caseLog.create({
            data: {
                leadCaseId: caseId,
                authorUserId: userId,
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
        return { success: true };
    } catch (e: any) {
        return { success: false, error: e.message };
    }
}

export async function updateChecklistItem(itemId: string, value: string, isDone: boolean) {
    try {
        await prisma.caseChecklistItem.update({
            where: { id: itemId },
            data: { value, isDone }
        });
        // We do not revalidate path here for speed, assuming client update or granular revalidate
        return { success: true };
    } catch (e) {
        return { success: false };
    }
}

export async function linkClientToCase(caseId: string, clientId: number) {
    await prisma.leadCase.update({
        where: { id: caseId },
        data: { clientId }
    });
    revalidatePath(`/admin/inbox/${caseId}`);
}

export async function linkVehicleToCase(caseId: string, vehicleId: number) {
    await prisma.leadCase.update({
        where: { id: caseId },
        data: { vehicleId }
    });
    revalidatePath(`/admin/inbox/${caseId}`);
}

export async function updateCaseStatus(caseId: string, status: CaseStatus, reason?: string) {
    const data: any = { status };
    if (status === 'CLOSED' || status === 'LOST') {
        data.closeReason = reason;
        data.closeDetail = reason;
    }

    await prisma.leadCase.update({
        where: { id: caseId },
        data
    });
    revalidatePath(`/admin/inbox`);
    revalidatePath(`/admin/inbox/${caseId}`);
}
