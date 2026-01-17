
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
    const password = 'admin123';
    const hashedPassword = await bcrypt.hash(password, 10);

    await prisma.user.update({
        where: { username: 'admin' },
        data: { passwordHash: hashedPassword }
    });

    console.log(`Password for 'admin' updated to '${password}'`);
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
