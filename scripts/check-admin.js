
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const user = await prisma.user.findUnique({
        where: { username: 'admin' }
    });
    console.log(user ? 'User found: ' + JSON.stringify(user) : 'User not found');
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
