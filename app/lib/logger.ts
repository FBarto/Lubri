import { prisma } from '../../lib/prisma';

export async function logActivity(
    userId: number,
    action: string,
    entity: string,
    entityId?: string | number,
    details?: string | object
) {
    try {
        await prisma.auditLog.create({
            data: {
                userId,
                action,
                entity,
                entityId: entityId ? String(entityId) : null,
                details: typeof details === 'object' ? JSON.stringify(details) : details,
            },
        });
    } catch (error) {
        console.error('Failed to create audit log:', error);
        // We generally don't want to crash the app if logging fails, just report it
    }
}
