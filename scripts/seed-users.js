const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
    const passwordHash = await bcrypt.hash('123456', 10);

    const employee = await prisma.user.upsert({
        where: { username: 'employee' },
        update: { passwordHash, role: 'EMPLOYEE', active: true },
        create: {
            username: 'employee',
            passwordHash,
            name: 'Empleado Prueba',
            role: 'EMPLOYEE',
            active: true
        }
    });

    const admin = await prisma.user.upsert({
        where: { username: 'admin' },
        update: { passwordHash, role: 'ADMIN', active: true },
        create: {
            username: 'admin',
            passwordHash,
            name: 'Admin',
            role: 'ADMIN',
            active: true
        }
    });

    console.log({ employee, admin });
}

main()
    .then(async () => {
        await prisma.$disconnect();
    })
    .catch(async (e) => {
        console.error(e);
        await prisma.$disconnect();
        process.exit(1);
    });
