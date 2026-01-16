
import { db } from '@/lib/firebase';

export class SyncService {

    /**
     * Syncs a Sale transaction to Firestore
     */
    static async syncSale(sale: any, items: any[]) {
        try {
            if (!db) return; // Guard if firebase failed to init

            const saleRef = db.collection('ventas').doc(sale.id.toString());

            const data = {
                id: sale.id,
                total: sale.total,
                paymentMethod: sale.paymentMethod,
                date: sale.date.toISOString(),
                clientId: sale.clientId,
                items: items.map(item => ({
                    description: item.description,
                    quantity: item.quantity,
                    price: item.unitPrice,
                    total: item.subtotal,
                    type: item.type
                })),
                timestamp: new Date()
            };

            await saleRef.set(data);

            console.log(`[Sync] Sale ${sale.id} synced to Firestore`);
        } catch (error) {
            console.error('[Sync Error] Failed to sync sale:', error);
            // We do NOT throw error here to avoid blocking the local process
        }
    }

    /**
     * Syncs a WorkOrder to Firestore
     */
    static async syncWorkOrder(workOrder: any) {
        try {
            if (!db) return;

            const ref = db.collection('ordenes_trabajo').doc(workOrder.id.toString());
            await ref.set({
                id: workOrder.id,
                vehicleId: workOrder.vehicleId,
                clientId: workOrder.clientId,
                serviceId: workOrder.serviceId,
                date: workOrder.date.toISOString(),
                finishedAt: workOrder.finishedAt ? workOrder.finishedAt.toISOString() : null,
                status: workOrder.finishedAt ? 'COMPLETED' : 'PENDING',
                price: workOrder.price,
                notes: workOrder.notes,
                timestamp: new Date()
            });
            console.log(`[Sync] WorkOrder ${workOrder.id} synced to Firestore`);
        } catch (error) {
            console.error('[Sync Error] Failed to sync WorkOrder:', error);
        }
    }

    static async syncClient(client: any) {
        try {
            if (!db) return;
            await db.collection('clientes').doc(client.id.toString()).set({
                ...client,
                createdAt: client.createdAt ? client.createdAt.toISOString() : new Date().toISOString()
            });
            console.log(`[Sync] Client ${client.id} synced`);
        } catch (e) {
            console.error(`[Sync Error] Client ${client.id}:`, e);
        }
    }

    static async syncVehicle(vehicle: any) {
        try {
            if (!db) return;
            await db.collection('vehiculos').doc(vehicle.id.toString()).set(vehicle);
            console.log(`[Sync] Vehicle ${vehicle.id} synced`);
        } catch (e) {
            console.error(`[Sync Error] Vehicle ${vehicle.id}:`, e);
        }
    }

    static async syncProduct(product: any) {
        try {
            if (!db) return;
            await db.collection('productos').doc(product.id.toString()).set(product);
            console.log(`[Sync] Product ${product.id} synced`);
        } catch (e) {
            console.error(`[Sync Error] Product ${product.id}:`, e);
        }
    }
}
