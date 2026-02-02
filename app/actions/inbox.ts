'use server';

import { prisma } from '@/lib/prisma';
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
import { parseLeadIntake } from '@/lib/gemini'; // Adjusted import
import { ActionResponse } from './types';

// --- CHECKLIST TEMPLATES (Merged from specialized file) ---
const CHECKLIST_TEMPLATES: Record<ChecklistTemplate, any[]> = {
    [ChecklistTemplate.TYRES]: [
        { key: 'tyres_need', label: 'Necesidad', inputType: 'SELECT', options: ["Cubierta nueva", "Reparación", "Balanceo", "Alineación", "Auxilio"], isRequired: true, sortOrder: 1 },
        { key: 'tyres_size', label: 'Medida (ej 175/70R13)', inputType: 'TEXT', isRequired: false, sortOrder: 2 },
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
    ],
    [ChecklistTemplate.BATTERY]: [
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
    ],
    [ChecklistTemplate.OIL_SERVICE]: [
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
    ],
    [ChecklistTemplate.GENERIC]: [
        { key: 'need_summary', label: 'Resumen necesidad', inputType: 'TEXT', isRequired: true, sortOrder: 1 },
        { key: 'vehicle_model', label: 'Vehículo', inputType: 'TEXT', isRequired: false, sortOrder: 2 },
        { key: 'vehicle_plate', label: 'Patente', inputType: 'TEXT', isRequired: false, sortOrder: 3 },
        { key: 'urgency', label: 'Urgencia', inputType: 'SELECT', options: ["Ahora", "Hoy", "Esta semana", "Sin apuro"], isRequired: true, sortOrder: 4 },
        { key: 'preferred_time_window', label: 'Turno pref.', inputType: 'SELECT', options: ["Mañana", "Tarde"], isRequired: false, sortOrder: 5 },
        { key: 'payment_method', label: 'Pago', inputType: 'SELECT', options: ["Efectivo", "Transferencia", "Débito", "Crédito"], isRequired: false, sortOrder: 6 },
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

    } catch (error: any) {
        console.error('Error creating LeadCase:', error);
        return { success: false, error: 'Failed to create case' };
    }
}

/**
 * Uses Gemini to parse raw intake text and auto-populate case data
 */
export async function processLeadWithAI(caseId: string, rawText: string): Promise<ActionResponse> {
    try {
        // 1. Call Gemini to parse
        const aiRes = await parseLeadIntake(rawText);
        if (!aiRes.success || !aiRes.data) return { success: false, error: aiRes.error || 'Parsing failed' };

        const data = aiRes.data;

        // 2. Update the LeadCase with AI findings
        await prisma.leadCase.update({
            where: { id: caseId },
            data: {
                summary: data.summary || undefined,
                priority: data.urgency === 'alta' ? 'HIGH' : data.urgency === 'media' ? 'MEDIUM' : 'LOW',
            }
        });

        // 3. Populate Checklist Items if they match
        const checklistItems = await prisma.caseChecklistItem.findMany({
            where: { leadCaseId: caseId }
        });

        for (const item of checklistItems) {
            let newValue = null;

            // Basic matching logic
            if (item.key === 'vehicle_model' && data.vehicle_model) newValue = data.vehicle_model;
            if (item.key === 'vehicle_plate' && data.plate) newValue = data.plate;
            if (item.key === 'service_type' && data.service_type) newValue = data.service_type;
            if (item.key === 'need_summary' && data.summary) newValue = data.summary;

            if (newValue) {
                await prisma.caseChecklistItem.update({
                    where: { id: item.id },
                    data: { value: String(newValue), isDone: true }
                });
            }
        }

        // 4. Log AI Action
        await prisma.caseLog.create({
            data: {
                leadCaseId: caseId,
                authorUserId: 1, // System/AI
                channel: 'INTERNAL_NOTE',
                message: 'Información extraída automáticamente usando Gemini AI.',
            }
        });

        revalidatePath(`/admin/inbox/${caseId}`);
        return { success: true, data };

    } catch (error) {
        console.error('Error in processLeadWithAI:', error);
        return { success: false, error: 'AI processing failed' };
    }
}

export async function updateChecklistItem(itemId: string, value: any, isDone: boolean): Promise<ActionResponse> {
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

export async function addCaseLog(caseId: string, authorUserId: number, message: string, channel: LogChannel): Promise<ActionResponse> {
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

export async function updateCaseStatus(caseId: string, status: CaseStatus): Promise<ActionResponse> {
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

export async function assignClientToCase(caseId: string, clientId: number, vehicleId?: number): Promise<ActionResponse> {
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

export async function getInboxCases(): Promise<ActionResponse> {
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

export async function getServicesList(): Promise<ActionResponse> {
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
}): Promise<ActionResponse> {
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

export async function generateWhatsAppLink(caseId: string): Promise<ActionResponse> {
    try {
        const leadCase = await prisma.leadCase.findUnique({
            where: { id: caseId },
            include: { checklist: true, client: true, vehicle: true }
        });

        if (!leadCase) return { success: false, error: 'Case not found' };
        if (!leadCase.client?.phone) return { success: false, error: 'Client needs a phone number' };

        // 1. Format Message
        const appointment = leadCase.status === 'SCHEDULED' ?
            await prisma.appointment.findFirst({ where: { leadCaseId: caseId }, orderBy: { createdAt: 'desc' } }) : null;

        let message = `*Hola ${leadCase.client.name.split(' ')[0]}!* 👋\n`;

        if (appointment) {
            const dateStr = new Date(appointment.date).toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long' });
            const timeStr = new Date(appointment.date).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' });
            message += `Vimos que agendaste un turno para el *${dateStr}* a las *${timeStr}* para: _${leadCase.summary}_\n\n`;
        } else {
            message += `Te escribimos de Lubri por: _${leadCase.summary}_\n\n`;
        }

        if (leadCase.vehicle) {
            message += `🚗 *Vehículo:* ${leadCase.vehicle.model} (${leadCase.vehicle.plate})\n`;
        }

        const filledItems = leadCase.checklist
            .filter(i => i.isDone && i.value)
            .sort((a, b) => a.sortOrder - b.sortOrder);

        if (filledItems.length > 0) {
            message += `\n📋 *Detalle:*\n`;
            filledItems.forEach(item => {
                const val = item.value === 'true' ? 'Sí' : item.value;
                if (val !== 'false' && val !== 'null') {
                    message += `- ${item.label}: ${val}\n`;
                }
            });
        }

        message += `\nAvísanos si querés avanzar! 🔧`;

        // 2. Log Action
        await prisma.caseLog.create({
            data: {
                leadCaseId: caseId,
                authorUserId: leadCase.assignedToUserId || 1,
                channel: 'WHATSAPP',
                message: 'Link de WhatsApp generado.'
            }
        });

        // 3. Return URL
        const cleanPhone = leadCase.client.phone.replace(/\D/g, '');
        const url = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;

        revalidatePath(`/admin/inbox/${caseId}`);
        return { success: true, data: { url } };

    } catch (error) {
        return { success: false, error: 'Failed' };
    }
}

// --- QUICK ACTIONS FOR MODAL ---

export async function searchClients(query: string): Promise<ActionResponse> {
    if (query.length < 2) return { success: true, data: [] };
    try {
        const clients = await prisma.client.findMany({
            where: {
                OR: [
                    { name: { contains: query, mode: 'insensitive' } },
                    { phone: { contains: query, mode: 'insensitive' } },
                    { vehicles: { some: { plate: { contains: query, mode: 'insensitive' } } } }
                ]
            },
            take: 5,
            include: { vehicles: true }
        });
        return { success: true, data: clients };
    } catch (e) {
        return { success: false, error: 'Search failed' };
    }
}

export async function getClientVehicles(clientId: number): Promise<ActionResponse> {
    try {
        const vehicles = await prisma.vehicle.findMany({
            where: { clientId }
        });
        return { success: true, data: vehicles };
    } catch (e) {
        return { success: false, error: 'Fetch failed' };
    }
}

export async function createQuickClient(name: string, phone: string): Promise<ActionResponse> {
    try {
        const client = await prisma.client.create({
            data: { name, phone }
        });
        return { success: true, data: client };
    } catch (e) {
        return { success: false, error: 'Create failed' };
    }
}

export async function createQuickVehicle(clientId: number, brand: string, model: string, plate: string): Promise<ActionResponse> {
    try {
        const vehicle = await prisma.vehicle.create({
            data: { clientId, brand, model, plate, type: 'CAR' }
        });
        return { success: true, data: vehicle };
    } catch (e) {
        return { success: false, error: 'Create vehicle failed' };
    }
}

export async function getInboxKanbanBoard(): Promise<ActionResponse> {
    try {
        const cases = await prisma.leadCase.findMany({
            where: {
                status: {
                    in: ['NEW', 'IN_PROGRESS', 'WAITING_CUSTOMER', 'READY_TO_SCHEDULE', 'SCHEDULED']
                }
            },
            include: {
                client: true,
                vehicle: true,
                assignedToUser: true
            },
            orderBy: { slaDueAt: 'asc' }
        });
        return { success: true, data: cases };
    } catch (e) {
        return { success: false, error: 'Failed' };
    }
}

// --- QUOTE BUILDER ACTIONS ---

export async function getQuote(caseId: string): Promise<ActionResponse> {
    try {
        const quote = await prisma.quote.findUnique({
            where: { leadCaseId: caseId },
            include: {
                items: true,
                leadCase: {
                    include: { client: true, vehicle: true }
                }
            }
        });
        return { success: true, data: quote };
    } catch (e) {
        return { success: false, error: 'Fetch Quote Failed' };
    }
}

export async function createOrUpdateQuote(caseId: string, items: any[], discount: number = 0): Promise<ActionResponse> {
    try {
        // Calculate totals
        const subtotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        const total = subtotal - discount;

        // Upsert Quote
        const quote = await prisma.quote.upsert({
            where: { leadCaseId: caseId },
            update: {
                subtotal,
                discount,
                total,
                items: {
                    deleteMany: {},
                    create: items.map(item => ({
                        description: item.name,
                        quantity: Number(item.quantity),
                        unitPrice: Number(item.price),
                        lineTotal: Number(item.price) * Number(item.quantity),
                        kind: item.type || 'PRODUCT'
                    }))
                },
                updatedAt: new Date()
            },
            create: {
                leadCaseId: caseId,
                subtotal,
                discount,
                total,
                status: 'DRAFT',
                items: {
                    create: items.map(item => ({
                        description: item.name,
                        quantity: Number(item.quantity),
                        unitPrice: Number(item.price),
                        lineTotal: Number(item.price) * Number(item.quantity),
                        kind: item.type || 'PRODUCT'
                    }))
                }
            }
        });

        // Update Case Status if Draft
        await prisma.leadCase.update({
            where: { id: caseId },
            data: { status: 'QUOTED' }
        });

        revalidatePath(`/admin/inbox/${caseId}`);
        return { success: true, data: quote };
    } catch (e) {
        console.error(e);
        return { success: false, error: 'Save Quote Failed' };
    }
}

export async function searchProductsForQuote(query: string): Promise<ActionResponse> {
    try {
        if (query.length < 2) return { success: true, data: [] };

        // Search Products
        const products = await prisma.product.findMany({
            where: {
                OR: [
                    { name: { contains: query, mode: 'insensitive' } },
                    { code: { contains: query, mode: 'insensitive' } }
                ],
                active: true
            },
            take: 10
        });

        // Search Services
        const services = await prisma.service.findMany({
            where: {
                name: { contains: query, mode: 'insensitive' },
                active: true
            },
            take: 5
        });

        // Normalize
        const results = [
            ...products.map(p => ({ id: p.id, name: p.name, price: p.price, type: 'PRODUCT', stock: p.stock })),
            ...services.map(s => ({ id: s.id, name: s.name, price: s.price, type: 'SERVICE', stock: null }))
        ];

        return { success: true, data: results };
    } catch (e) {
        return { success: false, error: 'Search Failed' };
    }
}

export async function getInboxStats(year: number, month: number): Promise<ActionResponse> {
    try {
        const startDate = new Date(year, month - 1, 1);
        const endDate = new Date(year, month, 0, 23, 59, 59);

        const cases = await prisma.leadCase.findMany({
            where: {
                createdAt: {
                    gte: startDate,
                    lte: endDate
                }
            },
            select: { status: true }
        });

        const total = cases.length;
        const won = cases.filter(c => c.status === 'WON').length;
        const lost = cases.filter(c => c.status === 'LOST').length;
        const conversionRate = total > 0 ? (won / total) * 100 : 0;

        // Status Distribution
        const distribution = cases.reduce((acc, curr) => {
            acc[curr.status] = (acc[curr.status] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);

        return {
            success: true,
            data: {
                total,
                won,
                lost,
                conversionRate,
                distribution
            }
        };

    } catch (e) {
        return { success: false, error: 'Stats Failed' };
    }
}
