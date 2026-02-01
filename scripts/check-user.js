const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
    const user = await prisma.user.findUnique({
        where: { username: 'qa' },
    });

    if (!user) {
        console.log('User NOT found');
    } else {
        console.log('User found:', user);
        const match = await bcrypt.compare('password123', user.passwordHash);
        console.log('Password match:', match);
    }
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
