
import { PrismaClient } from '@prisma/client';
import { hash } from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
    console.log('🌱 Seeding Redes Module data...');

    // 1. Create User "Romi"
    const passwordHash = await hash('Romi123', 10);

    const romi = await prisma.user.upsert({
        where: { username: 'Romi' },
        update: {
            passwordHash,
            role: 'EMPLOYEE',
            active: true,
        },
        create: {
            name: 'Romina',
            username: 'Romi',
            passwordHash,
            role: 'EMPLOYEE',
            active: true,
        }
    });

    console.log('✅ User Romi created/updated:', romi.id);
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
