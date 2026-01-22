
import Link from 'next/link';
import { Clock, CheckCircle2, Award, Zap, Shield, MapPin, Phone, MessageCircle, Droplet, Disc, ChevronDown, Bell, X, User } from 'lucide-react';
import GoogleReviews from './components/GoogleReviews';

export default async function Home() {
  return (
    <div className="min-h-screen bg-neutral-950 text-white font-sans selection:bg-red-600 selection:text-white overflow-x-hidden">

      {/* --- PROMO BANNER --- */}
      <div className="bg-yellow-400 text-neutral-900 px-4 py-2 font-bold text-center text-sm md:text-base tracking-wide relative z-50 flex justify-center items-center gap-2">
        <Bell className="w-4 h-4" />
        <span>🎉 PROMO: 20% OFF en tu primer service reservando online.</span>
        <Link href="/book" className="underline hover:text-red-700 ml-2">¡Reservar ya!</Link>
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

            <Link
              href="/login"
              className="absolute top-0 right-6 md:top-4 md:right-10 group px-5 py-2.5 rounded-full bg-white/5 hover:bg-white/10 backdrop-blur-xl border border-white/10 hover:border-red-500/50 transition-all duration-500 shadow-2xl z-50 flex items-center gap-3 overflow-hidden text-sm font-medium"
            >
              <div className="p-1.5 bg-red-600/20 rounded-full group-hover:bg-red-600 transition-all duration-300">
                <User size={14} className="text-white" />
              </div>
              <span className="text-white/80 group-hover:text-white transition-colors">Portal Cliente</span>
            </Link>

            <div className="relative inline-block mb-6">
              <h1 className="text-5xl md:text-7xl lg:text-9xl font-black italic tracking-tighter text-white leading-[0.85] mb-2 drop-shadow-2xl">
                FB <span className="text-transparent bg-clip-text bg-gradient-to-br from-white via-white to-neutral-500">LUBRICENTRO</span> <br />
                <span className="relative inline-block">
                  <span className="absolute -inset-1 bg-red-600 blur-2xl opacity-20 animate-pulse"></span>
                  <span className="relative text-transparent bg-clip-text bg-gradient-to-r from-red-600 to-red-400">BATERÍAS</span>
                </span>
              </h1>
            </div>

            <p className="text-xl md:text-2xl text-neutral-400 mb-12 max-w-2xl mx-auto font-light leading-relaxed">
              Mantenimiento de alta precisión. Tu vehículo listo en <span className="text-white font-semibold">45 minutos</span> con tecnología de punta y repuestos originales.
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
                <div className="text-xs text-neutral-500 uppercase font-black mb-1">Diagnóstico</div>
                <div className="text-xl font-bold text-yellow-500">Digital</div>
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
                  <h4 className="font-bold text-white uppercase tracking-tighter italic">Atención Express</h4>
                  <p className="text-xs text-neutral-500 font-medium">Sin demoras innecesarias</p>
                </div>
              </div>
              <div className="flex items-center gap-4 group cursor-default">
                <div className="w-12 h-12 rounded-full bg-blue-600/20 flex items-center justify-center text-blue-500 border border-blue-600/30 group-hover:bg-blue-600 group-hover:text-white transition-all duration-300">
                  <Award size={24} />
                </div>
                <div>
                  <h4 className="font-bold text-white uppercase tracking-tighter italic">Garantía de Marca</h4>
                  <p className="text-xs text-neutral-500 font-medium">Solo marcas líderes mundiales</p>
                </div>
              </div>
              <div className="flex items-center gap-4 group cursor-default">
                <div className="w-12 h-12 rounded-full bg-green-600/20 flex items-center justify-center text-green-500 border border-green-600/30 group-hover:bg-green-600 group-hover:text-white transition-all duration-300">
                  <Shield size={24} />
                </div>
                <div>
                  <h4 className="font-bold text-white uppercase tracking-tighter italic">Escaneo Digital</h4>
                  <p className="text-xs text-neutral-500 font-medium">Reporte detallado en cada service</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* --- QUIENES SOMOS (About) --- */}
        <section className="py-20 bg-neutral-900">
          <div className="container mx-auto px-6 max-w-4xl text-center">
            <h2 className="text-3xl font-black italic uppercase tracking-tighter mb-8">
              Expertos en <span className="text-red-600">Tu Vehículo</span>
            </h2>
            <p className="text-xl text-neutral-300 leading-relaxed mb-6">
              En <strong>FB Lubricentro y Baterías</strong>, entendemos que tu auto es parte de tu vida y tus vacaciones.
              Ubicados en el corazón de <strong>Villa Carlos Paz</strong> (Asunción 505), somos un negocio local apasionado por los fierros y la seguridad.
            </p>
            <p className="text-neutral-400">
              Nos especializamos en mantenimiento preventivo rápido y eficiente. No somos solo un taller; somos tus aliados para que salgas a la ruta tranquilo.
              Atención personalizada, honestidad y productos originales son nuestro sello.
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
                desc="Service completo con aceites sintéticos premium. Reemplazo de filtros originales para máxima vida útil."
                tag="Mecánica"
              />
              <ServiceCard
                icon={<Zap className="w-10 h-10" />}
                title="Baterías"
                desc="Diagnóstico digital gratuito, venta y colocación en el acto. Garantía oficial de las mejores marcas."
                tag="Electricidad"
              />
              <ServiceCard
                icon={<Disc className="w-10 h-10" />}
                title="Gomería"
                desc="Reparación de pinchaduras, balanceo computarizado y rotación. Seguridad garantizada por expertos."
                tag="Seguridad"
              />
              <ServiceCard
                icon={<Shield className="w-10 h-10" />}
                title="Integral"
                desc="Chequeo completo de fluidos y sistemas críticos. Todo lo necesario para tu seguridad extrema."
                tag="Preventivo"
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
                answer="Estamos en Asunción 505, Villa Carlos Paz. Realizamos cambio de aceite y filtros en el acto para todo tipo de vehículos."
              />
              <FAQItem
                question="¿Atienden sin turno?"
                answer="Sí, atendemos por orden de llegada. Sin embargo, recomendamos reservar turno online o por WhatsApp para asegurar tu lugar sin esperas."
              />
              <FAQItem
                question="¿Qué horarios tienen?"
                answer="En verano abrimos de Lunes a Viernes de 8:30 a 13:00 y de 16:30 a 20:30. Los sábados de 9:00 a 13:00."
              />
              <FAQItem
                question="¿Venden baterías para autos?"
                answer="Sí, tenemos stock de baterías de todas las marcas y amperajes. Incluimos la colocación y control del sistema de carga."
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
          <p>&copy; 2026 FB Lubricentro y Baterías. Todos los derechos reservados.</p>
          <div className="mt-2 text-xs">
            <Link href="/login" className="hover:text-neutral-400 transition-colors">Acceso Interno</Link>
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
