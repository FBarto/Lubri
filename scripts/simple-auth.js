const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
    console.log('Simplifying credentials for QA...');

    const users = [
        { username: '1', password: '1', role: 'ADMIN', name: 'Admin User' },
        { username: '2', password: '2', role: 'EMPLOYEE', name: 'Empleado General' },
        { username: '3', password: '3', role: 'EMPLOYEE', name: 'Cajero' },
    ];

    for (const u of users) {
        const hashedPassword = await bcrypt.hash(u.password, 10);

        const user = await prisma.user.upsert({
            where: { username: u.username },
            update: {
                passwordHash: hashedPassword,
                role: u.role,
                name: u.name,
                active: true
            },
            create: {
                username: u.username,
                passwordHash: hashedPassword,
                role: u.role,
                name: u.name,
                active: true
            }
        });

        console.log(`User ${u.username} (${u.role}) ready with password: ${u.password}`);
    }
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
