const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
    try {
        console.log('Testing Prisma Connection...');
        const user = await prisma.user.findUnique({
            where: { username: 'admin' }
        });

        if (user) {
            console.log('✅ User found:', user.username);
            console.log('   Role:', user.role);
            console.log('   Password Hash length:', user.passwordHash.length);

            const match = await bcrypt.compare('admin123', user.passwordHash);
            console.log('✅ Password match (admin123):', match);
        } else {
            console.log('❌ User "admin" NOT found.');
        }
    } catch (error) {
        console.error('❌ Prisma Error:', error);
    } finally {
        await prisma.$disconnect();
    }
}

main();
