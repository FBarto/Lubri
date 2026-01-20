'use server';

import { prisma } from '../../lib/prisma';

export async function getUnreadNotifications(userId: number) {
    try {
        const notifications = await prisma.notification.findMany({
            where: {
                userId,
                isRead: false
            },
            orderBy: { createdAt: 'desc' },
            take: 10
        });
        return { success: true, data: notifications };
    } catch (e) {
        return { success: false, error: 'Failed' };
    }
}

export async function markNotificationRead(id: string) {
    try {
        await prisma.notification.update({
            where: { id },
            data: { isRead: true }
        });
        return { success: true };
    } catch (e) {
        return { success: false, error: 'Failed' };
    }
}

/**
 * Checks for cases with expired SLA and creates notifications.
 * Should be run periodically or on page load.
 */
export async function checkSlaStatus() {
    try {
        const now = new Date();

        const overdueCases = await prisma.leadCase.findMany({
            where: {
                slaDueAt: { lt: now },
                status: { notIn: ['CLOSED', 'LOST', 'WON'] },
            }
        });

        let createdCount = 0;

        for (const c of overdueCases) {
            // Check if active notification exists
            const existing = await prisma.notification.findFirst({
                where: {
                    leadCaseId: c.id,
                    type: 'SLA_DUE',
                    isRead: false
                }
            });

            if (!existing) {
                let targetUserId = 1; // Default Admin
                if (c.assignedToUserId) {
                    targetUserId = c.assignedToUserId;
                }

                await prisma.notification.create({
                    data: {
                        userId: targetUserId,
                        leadCaseId: c.id,
                        type: 'SLA_DUE',
                        message: `SLA Vencido: Caso de ${c.summary || 'Cliente'}`,
                    }
                });
                createdCount++;
            }
        }

        return { success: true, created: createdCount };
    } catch (e) {
        console.error(e);
        return { success: false, error: 'SLA Check Failed' };
    }
}

/**
 * Checks for appointments starting in < 24hs and notify.
 */
export async function checkReminders() {
    try {
        const now = new Date();
        const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);

        const appointments = await prisma.appointment.findMany({
            where: {
                date: {
                    gt: now,
                    lt: tomorrow
                },
                status: 'CONFIRMED',
                reminderSentAt: null
            },
            include: { leadCase: true }
        });

        let createdCount = 0;

        for (const app of appointments) {
            // Check if notification exists
            // Only relevant if linked to leadCase for now (as per module requirement)
            if (!app.leadCaseId) continue;

            const existing = await prisma.notification.findFirst({
                where: {
                    leadCaseId: app.leadCaseId,
                    type: 'REMINDER_DUE'
                }
            });

            if (!existing) {
                // Notify assigned user or admin
                let targetUserId = 1;
                if (app.leadCase?.assignedToUserId) {
                    targetUserId = app.leadCase.assignedToUserId;
                }

                await prisma.notification.create({
                    data: {
                        userId: targetUserId,
                        leadCaseId: app.leadCaseId,
                        type: 'REMINDER_DUE',
                        message: `Recordatorio: Turno mañana para caso ${app.leadCase?.summary}`,
                    }
                });
                createdCount++;
            }
        }

        return { success: true, created: createdCount };

    } catch (e) {
        console.error(e);
        return { success: false, error: 'Reminder Check Failed' };
    }
}
