
import Link from 'next/link';
import { Clock, CheckCircle2, Award, Zap, Shield, MapPin, Phone, MessageCircle, Droplet, Disc, ChevronDown, HelpCircle, Bell, X, User } from 'lucide-react';
import GoogleReviews from './components/GoogleReviews';

export default function Home() {
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
        <header className="relative h-screen min-h-[600px] flex items-center justify-center overflow-hidden">
          {/* Backgrounds */}
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-neutral-800 via-neutral-950 to-neutral-950 z-0"></div>
          <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-20 z-0"></div>
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[500px] h-[500px] bg-red-600/20 blur-[120px] rounded-full z-0"></div>

          <div className="relative z-10 container mx-auto px-6 text-center">
            <div className="inline-block mb-4 px-3 py-1 bg-red-600/10 border border-red-600/30 rounded-full">
              <span className="text-red-500 font-bold tracking-widest text-xs uppercase">Asunción 505, Villa Carlos Paz</span>
            </div>

            <Link
              href="/login"
              className="absolute top-6 right-6 md:top-10 md:right-10 px-6 py-2 rounded-full border border-white/20 bg-white/5 backdrop-blur-md text-white font-bold text-sm uppercase tracking-wider hover:bg-white/10 hover:border-red-500 transition-all duration-300 z-50 flex items-center gap-2 group"
            >
              <span>Ingresar</span>
              <div className="w-2 h-2 rounded-full bg-red-600 group-hover:animate-pulse"></div>
            </Link>

            <h1 className="text-4xl md:text-6xl lg:text-8xl font-black italic tracking-tighter text-white mb-6 leading-[0.9]">
              FB LUBRICENTRO <br /> Y <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-600 to-red-500">BATERÍAS</span>
            </h1>

            <p className="text-xl md:text-2xl text-neutral-400 mb-10 max-w-2xl mx-auto font-medium leading-relaxed">
              Tu auto listo para las sierras en <span className="text-white font-bold">45 minutos</span>.
              Service oficial, cambio de aceite y baterías en Villa Carlos Paz.
            </p>

            <div className="flex flex-col md:flex-row gap-4 justify-center items-center">
              <Link
                href="/book"
                className="group relative bg-red-600 hover:bg-red-700 text-white px-10 py-5 rounded-lg font-black text-xl transition-all shadow-[0_0_30px_-5px_bg-red-600] hover:shadow-[0_0_50px_-10px_#dc2626] active:scale-95 uppercase italic tracking-wider clip-path-slant"
              >
                <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out clip-path-slant"></div>
                <span className="relative">Sacar Turno Ahora</span>
              </Link>
              <a
                href="https://wa.me/5493516756248"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-8 py-5 border border-white/20 hover:bg-white/5 rounded-lg font-bold text-lg transition-all"
              >
                <MessageCircle className="text-green-500" />
                <span>Consultar por WhatsApp</span>
              </a>
            </div>

            <div className="mt-16 opacity-60">
              <p className="text-sm font-bold text-neutral-500 uppercase tracking-widest mb-6">Trabajamos con las mejores marcas</p>
              <div className="flex flex-wrap justify-center gap-8 md:gap-16 grayscale">
                <div className="text-2xl font-black tracking-tighter bg-white/10 px-4 py-2 rounded">YPF</div>
                <div className="text-2xl font-black tracking-tighter bg-white/10 px-4 py-2 rounded">SHELL</div>
                <div className="text-2xl font-black tracking-tighter bg-white/10 px-4 py-2 rounded">MOTUL</div>
                <div className="text-2xl font-black tracking-tighter bg-white/10 px-4 py-2 rounded">CASTROL</div>
              </div>
            </div>
          </div>
        </header>

        {/* --- BENEFITS STRIP --- */}
        <div className="bg-red-600 py-6 relative z-10 shadow-2xl">
          <div className="container mx-auto px-6 flex flex-wrap justify-center gap-8 md:gap-16 text-white font-bold uppercase italic tracking-wider">
            <div className="flex items-center gap-3">
              <Clock className="w-6 h-6 text-neutral-900" />
              <span>Atención Rápida</span>
            </div>
            <div className="flex items-center gap-3">
              <MapPin className="w-6 h-6 text-neutral-900" />
              <span>Asunción 505, VCP</span>
            </div>
            <div className="flex items-center gap-3">
              <Shield className="w-6 h-6 text-neutral-900" />
              <span>Garantía Total</span>
            </div>
          </div>
        </div>

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

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <ServiceCard
                icon={<Droplet className="w-10 h-10 text-red-600" />}
                title="Cambio de Aceite y Filtros"
                desc="Service completo con aceites sintéticos y semi-sintéticos. Reemplazo de filtros de aire, aceite, combustible y habitáculo."
              />
              <ServiceCard
                icon={<Zap className="w-10 h-10 text-red-600" />}
                title="Venta de Baterías"
                desc="Diagnóstico gratuito, venta y colocación en el acto. Trabajamos con las mejores marcas de baterías para asegurar tu arranque."
              />
              <ServiceCard
                icon={<Disc className="w-10 h-10 text-red-600" />}
                title="Gomería y Tren Delantero"
                desc="Reparación de pinchaduras, rotación, balanceo y control de tren delantero. Seguridad para tus ruedas."
              />
              <ServiceCard
                icon={<Shield className="w-10 h-10 text-red-600" />}
                title="Mantenimiento General"
                desc="Chequeo de fluidos (frenos, refrigerante, dirección), escobillas y lámparas. Todo para pasar la VTV/ITV."
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
          <p>&copy; {new Date().getFullYear()} FB Lubricentro y Baterías. Todos los derechos reservados.</p>
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

function ServiceCard({ icon, title, desc }: { icon: any, title: string, desc: string }) {
  return (
    <div className="group bg-neutral-900 p-8 rounded-2xl border border-neutral-800 hover:border-red-600/50 transition-all hover:shadow-[0_0_30px_-10px_rgba(220,38,38,0.2)]">
      <div className="mb-6 p-4 bg-neutral-950 rounded-xl inline-block group-hover:scale-110 transition-transform duration-300">
        {icon}
      </div>
      <h3 className="text-xl font-bold text-white mb-3 italic uppercase">{title}</h3>
      <p className="text-neutral-400 leading-relaxed text-sm">
        {desc}
      </p>
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
