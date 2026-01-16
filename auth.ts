import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { z } from 'zod';

async function getUser(username: string) {
    try {
        const user = await prisma.user.findUnique({
            where: { username },
        });
        return user;
    } catch (error) {
        console.error('Failed to fetch user:', error);
        throw new Error('Failed to fetch user.');
    }
}

export const { auth, signIn, signOut, handlers } = NextAuth({
    providers: [
        Credentials({
            name: 'Credentials',
            credentials: {
                username: { label: "Usuario", type: "text" },
                password: { label: "Contraseña", type: "password" }
            },
            async authorize(credentials) {
                const parsedCredentials = z
                    .object({ username: z.string(), password: z.string().min(6) })
                    .safeParse(credentials);

                if (parsedCredentials.success) {
                    const { username, password } = parsedCredentials.data;
                    const user = await getUser(username);

                    if (!user) return null;

                    const passwordsMatch = await bcrypt.compare(password, user.passwordHash);
                    if (passwordsMatch) {
                        if ((user as any).active === false) return null; // Block inactive users

                        try {
                            const { logActivity } = await import('@/app/lib/logger');
                            await logActivity(user.id, 'LOGIN', 'USER', user.id, 'Inicio de sesión exitoso');
                        } catch (e) {
                            console.error('Failed to log login activity', e);
                        }

                        // Cast id to string to satisfy NextAuth User type
                        return {
                            ...user,
                            id: user.id.toString()
                        };
                    }
                }

                console.log('Invalid credentials');
                return null;
            },
        }),
    ],
    secret: "super-secret-random-key-change-me-in-prod",
    pages: {
        signIn: '/login',
    },
    callbacks: {
        async jwt({ token, user }) {
            if (user) {
                token.role = (user as any).role;
                token.id = (user as any).id;
            }
            return token;
        },
        async session({ session, token }) {
            if (token && session.user) {
                (session.user as any).role = token.role;
                (session.user as any).id = token.id;
            }
            return session;
        },
    },
});
