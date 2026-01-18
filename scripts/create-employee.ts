
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
    console.log('Creating employee user...');
    const passwordHash = await bcrypt.hash('empleado', 10);
    const user = await prisma.user.upsert({
        where: { username: 'empleado' },
        update: { passwordHash, active: true, role: 'EMPLOYEE' },
        create: {
            name: 'Empleado Taller',
            username: 'empleado',
            passwordHash,
            role: 'EMPLOYEE',
            active: true
        }
    });
    console.log('User created:', user);
}

main()
    .catch(e => console.error(e))
    .finally(async () => {
        await prisma.$disconnect();
    });
