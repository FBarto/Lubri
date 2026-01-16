import Link from 'next/link';

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-900 text-white p-6">
      <div className="text-center fade-in">
        <h1 className="text-6xl font-black mb-4 text-white uppercase italic tracking-tighter">
          FB <span className="text-red-600">Lubricentro</span>
        </h1>
        <p className="text-xl text-slate-400 mb-10 max-w-lg mx-auto">
          Gestión integral de service, lubricación y mecánica ligera en Villa Carlos Paz.
        </p>

        <div className="flex flex-col md:flex-row gap-4 justify-center">
          <Link href="/admin/dashboard" className="bg-neutral-800 hover:bg-neutral-700 text-white px-8 py-4 rounded-2xl font-bold transition-all shadow-xl hover:shadow-white/5 active:scale-95 text-lg border border-neutral-700">
            Acceso Administración
          </Link>
          <Link href="/book" className="bg-red-600 hover:bg-red-700 text-white px-8 py-4 rounded-2xl font-bold transition-all shadow-xl hover:shadow-red-600/20 active:scale-95 text-lg uppercase tracking-wide">
            Sacar Turno Ahora
          </Link>
        </div>
      </div>

      <div className="mt-20 text-slate-500 text-sm">
        © 2024 FB Lubricentro - Villa Carlos Paz
      </div>
    </div>
  );
}
