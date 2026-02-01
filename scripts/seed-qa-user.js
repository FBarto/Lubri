const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
    const username = 'qa';
    const password = 'password123';
    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.upsert({
        where: { username },
        update: {
            passwordHash: hashedPassword,
            role: 'EMPLOYEE',
            active: true,
        },
        create: {
            username,
            passwordHash: hashedPassword,
            name: 'QA Automator',
            role: 'EMPLOYEE',
            active: true,
        },
    });

    console.log(`Created/Updated QA user: ${user.username} (ID: ${user.id})`);
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
