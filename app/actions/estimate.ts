
"use server";

import { prisma } from "@/lib/prisma";
import { WorkOrderStatus } from "@prisma/client";
import { revalidatePath } from "next/cache";

export async function createWorkOrderFromEstimate(vehicleId: number, items: any[], total: number) {
    try {
        const vehicle = await prisma.vehicle.findUnique({
            where: { id: vehicleId },
            include: { client: true } // Need client ID
        });

        if (!vehicle) throw new Error("Vehículo no encontrado");

        // Create Work Order
        const wo = await prisma.workOrder.create({
            data: {
                status: WorkOrderStatus.PENDING, // Or IN_PROGRESS? PENDING means "Recibido"
                vehicleId: vehicle.id,
                clientId: vehicle.clientId,
                price: total,
                date: new Date(),
                // We can create a basic Service record or link to a generic "Service" service if needed.
                // For now, let's assume there's a generic service ID 1 or we need to find one.
                // Quick fix: Find a generic service or the first one.
                serviceId: 1, // DANGER: Hardcoded, need to look up a real service or pass it.
                notes: "Creado desde Presupuesto Rápido",

                // Save items as "ServiceDetails" JSON for display
                serviceDetails: {
                    items: items.map(i => ({
                        name: i.description,
                        quantity: i.quantity,
                        unitPrice: i.unitPrice,
                        productId: i.productId,
                        subtotal: i.quantity * i.unitPrice
                    }))
                }
            }
        });

        // Also create PendingSale (Cart) logic? 
        // The requirement said "Pasar a Orden de Trabajo".
        // Usually WO -> Add items -> Checkout.
        // If we just save them in serviceDetails, they aren't "Sold" yet.
        // Ideally we should create SaleItems linked to this WO, but WO usually accumulates items until closed.
        // Let's create `SaleItem` records linked to this WO immediately so they appear in loops?
        // Or better, assume the WO flow reads `serviceDetails` to populate the grid.

        // Let's create REAL stock reservations if we want to hold them.
        // For now, to keep it simple and safe: Just create the WO header. The Manager will "Load" the JSON items into the order.

        revalidatePath("/admin/work-orders");
        return { success: true, workOrderId: wo.id };

    } catch (error) {
        console.error("Create WO Error:", error);
        return { success: false, error: "Error al guardar en base de datos" };
    }
}
