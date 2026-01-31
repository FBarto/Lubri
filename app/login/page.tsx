'use client';

import { useActionState } from 'react';
import { useFormStatus } from 'react-dom';
import { authenticate } from '@/app/lib/actions';

export default function LoginPage() {
    const [errorMessage, dispatch, isPending] = useActionState(authenticate, undefined);

    return (
        <div className="flex h-screen w-full items-center justify-center bg-slate-900">
            <div className="w-full max-w-sm rounded-2xl bg-white p-8 shadow-2xl">
                <div className="mb-6 text-center">
                    <h1 className="text-2xl font-black text-slate-800 uppercase tracking-widest">Lubri Admin</h1>
                    <p className="text-slate-500 font-bold">Iniciar Sesión</p>
                </div>

                <form action={dispatch} className="space-y-4">
                    <div>
                        <label className="mb-1 block text-xs font-bold text-slate-600" htmlFor="username">
                            USUARIO
                        </label>
                        <input
                            className="w-full rounded-xl border border-slate-300 px-4 py-3 font-semibold text-slate-900 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                            id="username"
                            type="text"
                            name="username"
                            placeholder="admin"
                            required
                        />
                    </div>
                    <div>
                        <label className="mb-1 block text-xs font-bold text-slate-600" htmlFor="password">
                            CONTRASEÑA
                        </label>
                        <input
                            className="w-full rounded-xl border border-slate-300 px-4 py-3 font-semibold text-slate-900 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                            id="password"
                            type="password"
                            name="password"
                            placeholder="••••••"
                            required
                            minLength={6}
                        />
                    </div>

                    <div className="pt-2">
                        <LoginButton />
                    </div>

                    <div
                        className="flex h-8 items-end space-x-1"
                        aria-live="polite"
                        aria-atomic="true"
                    >
                        {errorMessage && (
                            <>
                                <p className="text-sm text-red-500 font-bold w-full text-center">{errorMessage}</p>
                            </>
                        )}
                    </div>
                </form>

                <div className="mt-6 text-center pt-4 border-t border-slate-100">
                    <a href="/" className="text-slate-400 font-bold text-xs hover:text-slate-600 transition-colors">
                        ← VOLVER AL INICIO
                    </a>
                </div>
            </div>
        </div>
    );
}

function LoginButton() {
    const { pending } = useFormStatus();

    return (
        <button
            className="mt-4 w-full rounded-xl bg-blue-600 py-3 text-sm font-black text-white hover:bg-blue-500 active:bg-blue-600 aria-disabled:cursor-not-allowed aria-disabled:opacity-50 transition-all"
            aria-disabled={pending}
        >
            {pending ? 'Ingresando...' : 'INGRESAR'}
        </button>
    );
}
