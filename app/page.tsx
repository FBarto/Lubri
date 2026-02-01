
import Link from 'next/link';
import { Clock, CheckCircle2, Award, Zap, Shield, MapPin, Phone, MessageCircle, Droplet, Disc, ChevronDown, Bell, X, Lock } from 'lucide-react';
import GoogleReviews from './components/GoogleReviews';

export default async function Home() {
  return (
    <div className="min-h-screen bg-neutral-950 text-white font-sans selection:bg-red-600 selection:text-white overflow-x-hidden">

      {/* --- PROMO BANNER --- */}
      <div className="bg-yellow-400 text-neutral-900 px-4 py-2 font-bold text-center text-sm md:text-base tracking-wide relative z-50 flex justify-center items-center gap-2">
        <MessageCircle className="w-4 h-4" />
        <span>📱 Reservá tu turno online y asegurá tu lugar sin esperas.</span>
        <Link href="/book" className="underline hover:text-red-700 ml-2">¡Elegir horario!</Link>
      </div>

      {/* --- HERO SECTION --- */}
      <main>
        <header className="relative min-h-[90vh] flex items-center justify-center overflow-hidden py-20">
          {/* Advanced Background with Depth */}
          <div className="absolute inset-0 bg-neutral-950 z-0"></div>
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,_rgba(220,38,38,0.15),transparent_70%)] z-0"></div>
          <div className="absolute top-1/4 left-1/4 w-[600px] h-[600px] bg-red-600/10 blur-[150px] rounded-full z-0 opacity-50"></div>
          <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-blue-600/5 blur-[150px] rounded-full z-0 opacity-30"></div>
          <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10 z-0 pointer-events-none"></div>

          <div className="relative z-10 container mx-auto px-6 text-center">
            <div className="inline-flex items-center gap-2 mb-8 px-4 py-1.5 bg-white/5 backdrop-blur-md border border-white/10 rounded-full shadow-inner group cursor-default">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-red-600"></span>
              </span>
              <span className="text-white/70 font-medium tracking-wide text-xs uppercase">Asunción 505, Villa Carlos Paz</span>
            </div>

            {/* Acceso interno removido del flujo público */}

            <div className="relative inline-block mb-6">
              <h1 className="text-4xl md:text-6xl lg:text-8xl font-black italic tracking-tighter text-white leading-[0.85] mb-2 drop-shadow-2xl">
                FB <span className="text-transparent bg-clip-text bg-gradient-to-br from-white via-white to-neutral-500">LUBRICENTRO</span> <br />
                <span className="relative inline-block mt-6">
                  <span className="absolute -inset-1 bg-red-600 blur-2xl opacity-20 animate-pulse"></span>
                  <span className="relative text-base md:text-2xl text-red-500 font-bold uppercase not-italic tracking-tight">
                    Service – Baterías – Gomería <span className="text-white/40 ml-2">Villa Carlos Paz</span>
                  </span>
                </span>
              </h1>
            </div>

            <p className="text-xl md:text-2xl text-neutral-400 mb-12 max-w-2xl mx-auto font-light leading-relaxed">
              Mantenimiento preventivo oficial en el corazón de Carlos Paz. <span className="text-white font-semibold">Cuidamos tu auto</span> para que solo te preocupes por disfrutar el viaje.
            </p>

            <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
              <Link
                href="/book"
                className="group relative bg-red-600 hover:bg-red-700 text-white px-12 py-5 rounded-xl font-bold text-xl transition-all shadow-[0_10px_40px_-10px_rgba(220,38,38,0.5)] hover:shadow-[0_20px_50px_-10px_rgba(220,38,38,0.6)] active:scale-95 uppercase tracking-wider overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700"></div>
                <span className="relative flex items-center gap-3">
                  Sacar Turno Online
                  <Zap size={20} className="fill-current" />
                </span>
              </Link>
              <a
                href="https://wa.me/5493516756248"
                target="_blank"
                rel="noopener noreferrer"
                className="group flex items-center gap-3 px-10 py-5 bg-white/5 hover:bg-white/10 backdrop-blur-md border border-white/10 hover:border-white/20 rounded-xl font-bold text-lg transition-all"
              >
                <MessageCircle className="text-green-500 group-hover:scale-110 transition-transform" />
                <span>WhatsApp Directo</span>
              </a>
            </div>

            {/* Vehicle Status Summary - Stitch inspired */}
            <div className="mt-20 max-w-4xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-4 px-4">
              <div className="bg-white/5 backdrop-blur-md border border-white/5 p-4 rounded-2xl">
                <div className="text-xs text-neutral-500 uppercase font-black mb-1">Aceite</div>
                <div className="text-xl font-bold text-red-500">Premium</div>
              </div>
              <div className="bg-white/5 backdrop-blur-md border border-white/5 p-4 rounded-2xl">
                <div className="text-xs text-neutral-500 uppercase font-black mb-1">Batería</div>
                <div className="text-xl font-bold text-blue-400">Control</div>
              </div>
              <div className="bg-white/5 backdrop-blur-md border border-white/5 p-4 rounded-2xl">
                <div className="text-xs text-neutral-500 uppercase font-black mb-1">Gomería</div>
                <div className="text-xl font-bold text-green-500">Service</div>
              </div>
              <div className="bg-white/5 backdrop-blur-md border border-white/5 p-4 rounded-2xl">
                <div className="text-xs text-neutral-500 uppercase font-black mb-1">Revisión</div>
                <div className="text-xl font-bold text-yellow-500">General</div>
              </div>
            </div>
          </div>
        </header>

        {/* --- PREMIUM BENEFITS TILES --- */}
        <section className="py-12 bg-neutral-900 border-y border-white/5 relative z-10">
          <div className="container mx-auto px-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="flex items-center gap-4 group cursor-default">
                <div className="w-12 h-12 rounded-full bg-red-600/20 flex items-center justify-center text-red-500 border border-red-600/30 group-hover:bg-red-600 group-hover:text-white transition-all duration-300">
                  <Clock size={24} />
                </div>
                <div>
                  <h4 className="font-bold text-white uppercase tracking-tighter italic">Service en el Acto</h4>
                  <p className="text-xs text-neutral-500 font-medium">Sin vueltas. Mantenimiento rápido mientras esperás.</p>
                </div>
              </div>
              <div className="flex items-center gap-4 group cursor-default">
                <div className="w-12 h-12 rounded-full bg-blue-600/20 flex items-center justify-center text-blue-500 border border-blue-600/30 group-hover:bg-blue-600 group-hover:text-white transition-all duration-300">
                  <Award size={24} />
                </div>
                <div>
                  <h4 className="font-bold text-white uppercase tracking-tighter italic">Marcas Líderes</h4>
                  <p className="text-xs text-neutral-500 font-medium">Total, Elaion y repuestos originales para tu motor.</p>
                </div>
              </div>
              <div className="flex items-center gap-4 group cursor-default">
                <div className="w-12 h-12 rounded-full bg-green-600/20 flex items-center justify-center text-green-500 border border-green-600/30 group-hover:bg-green-600 group-hover:text-white transition-all duration-300">
                  <Shield size={24} />
                </div>
                <div>
                  <h4 className="font-bold text-white uppercase tracking-tighter italic">Control Preventivo</h4>
                  <p className="text-xs text-neutral-500 font-medium">Chequeo general de fluidos y sistemas visibles.</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* --- QUIENES SOMOS (About) --- */}
        <section className="py-20 bg-neutral-900">
          <div className="container mx-auto px-6 max-w-4xl text-center">
            <h2 className="text-3xl font-black italic uppercase tracking-tighter mb-8">
              Tu confianza en <span className="text-red-600">Villa Carlos Paz</span>
            </h2>
            <p className="text-xl text-neutral-300 leading-relaxed mb-6">
              En <strong>FB Lubricentro</strong>, entendemos que tu auto es mucho más que un vehículo: es tu herramienta de trabajo o el compañero de tus vacaciones. Por eso, en nuestro local de <strong>Asunción 505</strong>, ofrecemos atención directa y honesta.
            </p>
            <p className="text-neutral-400">
              Somos vecinos de Carlos Paz apasionados por lo que hacemos. Nos especializamos en que salgas a la ruta con la tranquilidad de que tu motor, tus frenos y tu batería están en perfectas condiciones. Atención personalizada y repuestos originales son nuestro sello.
            </p>
          </div>
        </section>

        {/* --- SERVICES SECTION --- */}
        <section className="py-24 bg-neutral-950 relative">
          <div className="container mx-auto px-6">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-5xl font-black italic uppercase tracking-tighter mb-4">
                Nuestros <span className="text-red-600">Servicios</span>
              </h2>
              <p className="text-neutral-400 max-w-xl mx-auto">
                Mantenimiento integral para autos, camionetas y utilitarios.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 px-4">
              <ServiceCard
                icon={<Droplet className="w-10 h-10" />}
                title="Aceite y Filtros"
                desc="Service completo con aceites sintéticos y filtros originales. Mantener la garantía y la vida útil de tu motor es nuestra prioridad."
                tag="Service Oficial"
              />
              <ServiceCard
                icon={<Zap className="w-10 h-10" />}
                title="Baterías"
                desc="Stock permanente de marcas líderes. Incluimos el control del sistema de carga y la colocación en el momento sin cargo extra."
                tag="Electricidad"
              />
              <ServiceCard
                icon={<Disc className="w-10 h-10" />}
                title="Gomería"
                desc="Arreglo de pinchaduras, balanceo computarizado y rotación. Seguridad garantizada para que salgas a la ruta tranquilo."
                tag="Gomería Express"
              />
              <ServiceCard
                icon={<Shield className="w-10 h-10" />}
                title="Preventivo"
                desc="Revisión de niveles, frenos y aditivos. Pequeños cuidados preventivos que evitan grandes gastos mecánicos en el futuro."
                tag="Mantenimiento"
              />
            </div>
          </div>
        </section>

        {/* --- FAQ SECTION (AI Optimized) --- */}
        <section className="py-24 bg-neutral-900/50">
          <div className="container mx-auto px-6 max-w-4xl">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-black italic uppercase tracking-tighter mb-4">
                Preguntas <span className="text-red-600">Frecuentes</span>
              </h2>
            </div>
            <div className="grid gap-6">
              <FAQItem
                question="¿Dónde hacer cambio de aceite en Villa Carlos Paz?"
                answer="Estamos en Asunción 505, casi esquina con el centro. Somos el lubricentro referente en la ciudad para locales y turistas."
              />
              <FAQItem
                question="¿Cuánto tiempo demora un service completo?"
                answer="Generalmente, en menos de una hora tenemos tu auto listo, incluyendo el cambio de aceite, filtros y chequeo de puntos críticos."
              />
              <FAQItem
                question="¿Tienen baterías en stock para mi modelo?"
                answer="Sí, contamos con stock permanente de baterías de marcas líderes para autos, camionetas y utilitarios. Colocación en el acto."
              />
              <FAQItem
                question="¿Es necesario sacar turno previo?"
                answer="Atendemos por orden de llegada, pero recomendamos reservar turno online para asegurar tu lugar sin esperas, especialmente en temporada alta."
              />
            </div>
          </div>
        </section>
      </main>

      {/* --- GOOGLE REVIEWS --- */}
      <GoogleReviews />

      {/* --- FOOTER --- */}
      <footer className="bg-neutral-950 pt-20 pb-10 border-t border-neutral-900">
        <div className="container mx-auto px-6 grid grid-cols-1 md:grid-cols-4 gap-12 mb-16">
          <div className="md:col-span-1">
            <h3 className="text-2xl font-black italic tracking-tighter text-white mb-6">FB Lubricentro</h3>
            <p className="text-neutral-500 mb-6">
              Asunción 505, Villa Carlos Paz.<br />
              Expertos en tu vehículo.
            </p>
            <div className="flex gap-4">
              <a href="https://wa.me/5493516756248" target="_blank" className="w-10 h-10 bg-neutral-900 rounded-full flex items-center justify-center text-neutral-400 hover:bg-[#25D366] hover:text-white transition-colors"><MessageCircle size={20} /></a>
            </div>
          </div>

          <div>
            <h4 className="font-bold text-white mb-6 uppercase tracking-wider">Contacto</h4>
            <ul className="space-y-4 text-neutral-400">
              <li className="flex items-center gap-3">
                <MapPin className="text-red-600" size={20} />
                <span>Asunción 505, Villa Carlos Paz, Córdoba</span>
              </li>
              <li className="flex items-center gap-3">
                <Phone className="text-red-600" size={20} />
                <span>+54 9 351 675-6248</span>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-bold text-white mb-6 uppercase tracking-wider">Horarios Verano</h4>
            <ul className="space-y-2 text-neutral-400">
              <li className="flex justify-between"><span>Lun - Vie</span> <span className="text-white font-bold">08:30 - 13:00</span></li>
              <li className="flex justify-between"><span></span> <span className="text-white font-bold">16:30 - 20:30</span></li>
              <li className="flex justify-between mt-4"><span>Sábados</span> <span className="text-white font-bold">09:00 - 13:00</span></li>
            </ul>
          </div>

          {/* Map Section */}
          <div className="h-48 rounded-lg overflow-hidden bg-neutral-900 border border-neutral-800 relative">
            <iframe
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3403.415865662709!2d-64.50243668485093!3d-31.424458981401493!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x942d6640d6777c71%3A0x2db21b5b42d79383!2sAsuncion%20505%2C%20Villa%20Carlos%20Paz%2C%20C%C3%B3rdoba!5e0!3m2!1ses-419!2sar!4v1700000000000!5m2!1ses-419!2sar"
              width="100%"
              height="100%"
              style={{ border: 0 }}
              allowFullScreen
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              className="grayscale hover:grayscale-0 transition-all duration-500"
            ></iframe>
          </div>
        </div>

        <div className="border-t border-neutral-900 pt-8 text-center text-neutral-600 text-sm">
          <p>&copy; 2026 FB Lubricentro – Service, baterías y gomería. Todos los derechos reservados.</p>
          <div className="mt-2 text-xs">
            <Link href="/login" className="inline-flex items-center gap-2 text-neutral-600 hover:text-red-500 transition-colors py-2 px-4 rounded-lg hover:bg-white/5 border border-transparent hover:border-white/5">
              <Lock size={14} />
              <span className="font-semibold pt-0.5">Acceso Personal</span>
            </Link>
          </div>
        </div>
      </footer>

      {/* --- FLOATING WHATSAPP BUTTON --- */}
      <a
        href="https://wa.me/5493516756248"
        target="_blank"
        rel="noopener noreferrer"
        className="fixed bottom-6 right-6 bg-[#25D366] hover:bg-[#128C7E] text-white p-4 rounded-full shadow-2xl z-50 transition-transform hover:scale-110 flex items-center justify-center"
        aria-label="Contactar por WhatsApp"
      >
        <MessageCircle size={32} fill="white" className="text-[#25D366]" />
      </a>

    </div>
  );
}

function ServiceCard({ icon, title, desc, tag }: { icon: any, title: string, desc: string, tag?: string }) {
  return (
    <div className="group relative bg-white/5 backdrop-blur-sm p-8 rounded-3xl border border-white/5 hover:border-red-600/30 transition-all duration-500 hover:shadow-[0_20px_50px_-15px_rgba(220,38,38,0.3)] overflow-hidden">
      <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
        {icon}
      </div>

      <div className="relative z-10">
        <div className="mb-6 p-4 bg-red-600/10 rounded-2xl inline-block group-hover:scale-110 group-hover:bg-red-600 group-hover:text-white text-red-500 transition-all duration-500">
          {icon}
        </div>

        {tag && (
          <div className="mb-3 text-[10px] font-black uppercase tracking-[3px] text-red-500/80">
            {tag}
          </div>
        )}

        <h3 className="text-2xl font-black text-white mb-4 italic uppercase tracking-tighter leading-tight group-hover:text-red-500 transition-colors">
          {title}
        </h3>
        <p className="text-neutral-400 leading-relaxed text-sm font-medium opacity-80 group-hover:opacity-100 transition-opacity">
          {desc}
        </p>

        <div className="mt-8 pt-6 border-t border-white/5 flex items-center justify-between opacity-0 group-hover:opacity-100 transition-all duration-500 translate-y-4 group-hover:translate-y-0">
          <span className="text-xs font-bold uppercase tracking-widest text-neutral-500">Premium Service</span>
          <div className="w-8 h-8 rounded-full border border-red-600 animate-pulse flex items-center justify-center">
            <Zap size={14} className="text-red-500 fill-current" />
          </div>
        </div>
      </div>

      {/* Modern Gradient Overlay */}
      <div className="absolute -bottom-1/2 -right-1/2 w-64 h-64 bg-red-600/10 blur-[80px] rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
    </div>
  );
}

function FAQItem({ question, answer }: { question: string, answer: string }) {
  return (
    <details className="group bg-neutral-900 rounded-xl border border-neutral-800 open:border-red-600/30 transition-all">
      <summary className="flex cursor-pointer items-center justify-between p-6 font-bold text-lg select-none">
        {question}
        <ChevronDown className="w-5 h-5 text-neutral-500 group-open:rotate-180 transition-transform group-open:text-red-600" />
      </summary>
      <div className="px-6 pb-6 text-neutral-400 leading-relaxed">
        {answer}
      </div>
    </details>
  );
}
