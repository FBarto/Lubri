
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
    console.log('Creating "Caja" user...');
    const hashedPassword = await bcrypt.hash('lubri123', 10);

    const user = await prisma.user.upsert({
        where: { username: 'caja' },
        update: {
            passwordHash: hashedPassword, // Reset password if exists
            role: 'EMPLOYEE',
            active: true
        },
        create: {
            username: 'caja',
            passwordHash: hashedPassword,
            name: 'Caja Principal',
            role: 'EMPLOYEE',
        },
    });

    console.log('User "caja" created/updated successfully.');
    console.log(user);
}

main().catch(console.error).finally(() => prisma.$disconnect());
