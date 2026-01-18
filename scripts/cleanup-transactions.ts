
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('🚨 STARTING DATABASE CLEANUP (PRODUCTION PREP) 🚨');
    console.log('Using database URL:', process.env.DATABASE_URL);
    console.log('--------------------------------------------------');
    console.log('Strategy: KEEP Master Data (Clients, Vehicles, Products, Users)');
    console.log('Strategy: WIPE Transactional Data (Orders, Sales, Logs)');

    // Safety check: wait 5 seconds unless force flag? No, just careful logging.
    // await new Promise(r => setTimeout(r, 3000));

    try {
        // 1. WhatsApp
        console.log('🗑️  Deleting WhatsApp Messages & Tokens...');
        await prisma.whatsAppMessage.deleteMany({});
        await prisma.whatsAppToken.deleteMany({});

        // 2. Sales & Items
        console.log('🗑️  Deleting Sales & SaleItems...');
        // Need to delete items first to avoid constraint
        // But cascade might handle it? Safest is manual.
        await prisma.saleItem.deleteMany({});
        await prisma.sale.deleteMany({});

        // 3. WorkOrders & Attachments
        console.log('🗑️  Deleting WorkOrders & Attachments...');
        await prisma.workOrderAttachment.deleteMany({});
        // Before deleting WOs, unlink from Sales? already deleted sales.
        // Unlink appointments?
        // Note: Appointment has `workOrder WorkOrder?`. 
        // WorkOrder has `appointmentId`. 
        // Deleting WO is fine, set null in Appt? Or delete Appt first?
        // Let's delete WOs.
        await prisma.workOrder.deleteMany({});

        // 4. Appointments
        console.log('🗑️  Deleting Appointments...');
        await prisma.appointment.deleteMany({});

        // 5. AuditLogs
        console.log('🗑️  Deleting AuditLogs...');
        await prisma.auditLog.deleteMany({});

        console.log('✅ CLEANUP COMPLETE');

        // Verify
        const clients = await prisma.client.count();
        const vehicles = await prisma.vehicle.count();
        const products = await prisma.product.count();
        const wos = await prisma.workOrder.count();

        console.log('--------------------------------------------------');
        console.log(`Clients Remaining: ${clients}`);
        console.log(`Vehicles Remaining: ${vehicles}`);
        console.log(`Products Remaining: ${products}`);
        console.log(`WorkOrders Remaining: ${wos} (Should be 0)`);
        console.log('--------------------------------------------------');

    } catch (e) {
        console.error('❌ ERROR CLEANING DATABASE:', e);
    } finally {
        await prisma.$disconnect();
    }
}

main();
