'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

export async function searchClients(query: string) {
    if (!query || query.length < 2) return [];

    return await prisma.client.findMany({
        where: {
            OR: [
                { name: { contains: query, mode: 'insensitive' } },
                { phone: { contains: query, mode: 'insensitive' } },
            ]
        },
        take: 10,
        orderBy: { name: 'asc' }
    });
}

export async function searchVehicles(query: string) {
    if (!query || query.length < 2) return [];

    const cleanPlate = query.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();

    return await prisma.vehicle.findMany({
        where: {
            plate: { contains: cleanPlate, mode: 'insensitive' }
        },
        include: {
            client: true
        },
        take: 10,
        orderBy: { plate: 'asc' }
    });
}

export async function linkClientToCase(caseId: string, clientId: number) {
    try {
        await prisma.leadCase.update({
            where: { id: caseId },
            data: {
                clientId,
                // If the case currently has a vehicle that doesn't belong to this client,
                // we might want to unlink it, but for now we'll keep it simple.
            }
        });
        revalidatePath(`/admin/inbox/${caseId}`);
        return { success: true };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

export async function linkVehicleToCase(caseId: string, vehicleId: number) {
    try {
        const vehicle = await prisma.vehicle.findUnique({
            where: { id: vehicleId },
            select: { clientId: true }
        });

        await prisma.leadCase.update({
            where: { id: caseId },
            data: {
                vehicleId,
                clientId: vehicle?.clientId // Auto-link client if vehicle is selected
            }
        });
        revalidatePath(`/admin/inbox/${caseId}`);
        return { success: true };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

export async function createAndLinkClient(caseId: string, data: { name: string, phone: string }) {
    try {
        const client = await prisma.client.create({
            data: {
                name: data.name,
                phone: data.phone
            }
        });

        await prisma.leadCase.update({
            where: { id: caseId },
            data: { clientId: client.id }
        });

        revalidatePath(`/admin/inbox/${caseId}`);
        return { success: true, client };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

export async function createAndLinkVehicle(caseId: string, clientId: number, data: { plate: string, brand: string, model: string }) {
    try {
        const cleanPlate = data.plate.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();

        const vehicle = await prisma.vehicle.create({
            data: {
                plate: cleanPlate,
                brand: data.brand,
                model: data.model,
                clientId: clientId
            }
        });

        await prisma.leadCase.update({
            where: { id: caseId },
            data: { vehicleId: vehicle.id }
        });

        revalidatePath(`/admin/inbox/${caseId}`);
        return { success: true, vehicle };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

export async function unlinkClient(caseId: string) {
    try {
        await prisma.leadCase.update({
            where: { id: caseId },
            data: {
                clientId: null,
                vehicleId: null // If we unlink client, we must unlink vehicle too
            }
        });
        revalidatePath(`/admin/inbox/${caseId}`);
        return { success: true };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

export async function unlinkVehicle(caseId: string) {
    try {
        await prisma.leadCase.update({
            where: { id: caseId },
            data: { vehicleId: null }
        });
        revalidatePath(`/admin/inbox/${caseId}`);
        return { success: true };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}
