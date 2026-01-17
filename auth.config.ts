import type { NextAuthConfig } from 'next-auth';

export const authConfig = {
    pages: {
        signIn: '/login',
    },
    callbacks: {
        authorized({ auth, request: { nextUrl } }) {
            const isLoggedIn = !!auth?.user;
            const role = (auth?.user as any)?.role;

            const isAdminSection = nextUrl.pathname.startsWith('/admin');
            const isEmployeeSection = nextUrl.pathname.startsWith('/employee');
            const isRoot = nextUrl.pathname === '/';

            // 1. Root: Allow public access
            if (isRoot) {
                return true;
            }

            // 2. Admin Section
            if (isAdminSection) {
                if (!isLoggedIn) return false;
                if (role !== 'ADMIN') return Response.redirect(new URL('/employee', nextUrl));
                return true;
            }

            // 3. Employee Section
            if (isEmployeeSection) {
                if (!isLoggedIn) return false;
                // Allow ADMIN to access employee section (Update 1.05 implies separate homes, but Admin usually has access)
                // However, stricly following "Redirigir a EmpleadoHome" for Employee.
                // We'll allow Admin access for supervision.
                if (role !== 'EMPLOYEE' && role !== 'ADMIN') return Response.redirect(new URL('/login', nextUrl));
                return true;
            }

            // 4. Login Page: Redirect if already logged in
            if (isLoggedIn && nextUrl.pathname === '/login') {
                if (role === 'ADMIN') return Response.redirect(new URL('/admin/dashboard', nextUrl));
                if (role === 'EMPLOYEE') return Response.redirect(new URL('/employee', nextUrl));
            }

            return true;
        },
        async jwt({ token, user }: any) {
            if (user) {
                token.role = user.role;
                token.id = user.id;
            }
            return token;
        },
        async session({ session, token }: any) {
            if (token && session.user) {
                session.user.role = token.role;
                session.user.id = token.id;
            }
            return session;
        },
    },
    secret: "super-secret-random-key-change-me-in-prod",
    providers: [], // Add providers with an empty array for now
} satisfies NextAuthConfig;
