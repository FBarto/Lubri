const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
    const username = 'gaston';
    const password = 'tornado250';
    const name = 'Gaston Beca';

    const existingUser = await prisma.user.findUnique({
        where: { username }
    });

    if (existingUser) {
        console.log(`User '${username}' already exists.`);
        // Optional: Update password if needed, but for now just skip
        return;
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
        data: {
            username,
            passwordHash: hashedPassword,
            role: 'EMPLOYEE',
            name
        }
    });

    console.log(`Created employee user: ${user.name} (${user.username})`);
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
