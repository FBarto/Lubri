const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
    const username = 'admin';
    const password = 'admin123'; // CHANGE THIS IN PRODUCTION

    const existingUser = await prisma.user.findUnique({
        where: { username }
    });

    if (existingUser) {
        console.log(`User '${username}' already exists. Skipping.`);
        return;
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
        data: {
            username,
            passwordHash: hashedPassword,
            role: 'ADMIN',
            name: 'Administrador Inicial'
        }
    });

    console.log(`Created admin user: ${user.username}`);
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
