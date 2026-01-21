import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
    const token = await prisma.whatsAppToken.findFirst({
        orderBy: { createdAt: 'desc' },
        select: { token: true }
    });
    if (token) {
        console.log('TOKEN_FOUND:' + token.token);
    } else {
        console.log('NO_TOKEN_FOUND');
    }
}

main().finally(() => prisma.$disconnect());
