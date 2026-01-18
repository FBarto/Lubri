import Link from 'next/link';
import { Clock, CheckCircle2, Award, Zap, Shield, MapPin, Phone, MessageCircle, Droplet, Disc, ChevronDown, HelpCircle, Bell, X } from 'lucide-react';

export default function Home() {
  return (
    <div className="min-h-screen bg-neutral-950 text-white font-sans selection:bg-red-600 selection:text-white overflow-x-hidden">

      {/* --- PROMO BANNER --- */}
      <div className="bg-yellow-400 text-neutral-900 px-4 py-2 font-bold text-center text-sm md:text-base tracking-wide relative z-50 flex justify-center items-center gap-2">
        <Bell className="w-4 h-4" />
        <span>🎉 PROMO APERTURA: 20% OFF en tu primer service reservando online.</span>
        <Link href="/book" className="underline hover:text-red-700 ml-2">¡Reservar ya!</Link>
      </div>

      {/* --- HERO SECTION --- */}
      <div className="relative h-screen min-h-[600px] flex items-center justify-center overflow-hidden">
        {/* Abstract Dark Background */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-neutral-800 via-neutral-950 to-neutral-950 z-0"></div>
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-20 z-0"></div>

        {/* Glow Effect */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[500px] h-[500px] bg-red-600/20 blur-[120px] rounded-full z-0"></div>

        <div className="relative z-10 container mx-auto px-6 text-center">
          <div className="inline-block mb-4 px-3 py-1 bg-red-600/10 border border-red-600/30 rounded-full">
            <span className="text-red-500 font-bold tracking-widest text-xs uppercase">Villa Carlos Paz</span>
          </div>

          <Link
            href="/login"
            className="absolute top-6 right-6 md:top-10 md:right-10 px-6 py-2 rounded-full border border-white/20 bg-white/5 backdrop-blur-md text-white font-bold text-sm uppercase tracking-wider hover:bg-white/10 hover:border-red-500 transition-all duration-300 z-50 flex items-center gap-2 group"
          >
            <span>Ingresar</span>
            <div className="w-2 h-2 rounded-full bg-red-600 group-hover:animate-pulse"></div>
          </Link>

          <h1 className="text-5xl md:text-7xl lg:text-8xl font-black italic tracking-tighter text-white mb-6 leading-[0.9]">
            MÁXIMO <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-600 to-red-500">RENDIMIENTO</span>
          </h1>

          <p className="text-xl md:text-2xl text-neutral-400 mb-10 max-w-2xl mx-auto font-medium leading-relaxed">
            Service completo en <span className="text-white font-bold">45 minutos</span>.
            Sin esperas. Sin vueltas. Tu auto listo para la ruta.
          </p>

          <div className="flex flex-col md:flex-row gap-4 justify-center items-center">
            <Link
              href="/book"
              className="group relative bg-red-600 hover:bg-red-700 text-white px-10 py-5 rounded-lg font-black text-xl transition-all shadow-[0_0_30px_-5px_bg-red-600] hover:shadow-[0_0_50px_-10px_#dc2626] active:scale-95 uppercase italic tracking-wider clip-path-slant"
            >
              <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out clip-path-slant"></div>
              <span className="relative">Sacar Turno Ahora</span>
            </Link>
          </div>

          <div className="mt-16 opacity-60">
            <p className="text-sm font-bold text-neutral-500 uppercase tracking-widest mb-6">Trabajamos con las mejores marcas</p>
            <div className="flex flex-wrap justify-center gap-8 md:gap-16 grayscale">
              {/* Replaced text with simulated logos for visual impact */}
              <div className="text-2xl font-black tracking-tighter bg-white/10 px-4 py-2 rounded">YPF</div>
              <div className="text-2xl font-black tracking-tighter bg-white/10 px-4 py-2 rounded">SHELL</div>
              <div className="text-2xl font-black tracking-tighter bg-white/10 px-4 py-2 rounded">MOTUL</div>
              <div className="text-2xl font-black tracking-tighter bg-white/10 px-4 py-2 rounded">CASTROL</div>
              <div className="text-2xl font-black tracking-tighter bg-white/10 px-4 py-2 rounded">TOTAL</div>
            </div>
          </div>
        </div>
      </div>

      {/* --- BENEFITS STRIP --- */}
      <div className="bg-red-600 py-6 relative z-10 shadow-2xl">
        <div className="container mx-auto px-6 flex flex-wrap justify-center gap-8 md:gap-16 text-white font-bold uppercase italic tracking-wider">
          <div className="flex items-center gap-3">
            <Clock className="w-6 h-6 text-neutral-900" />
            <span>Listo en 45 min</span>
          </div>
          <div className="flex items-center gap-3">
            <Award className="w-6 h-6 text-neutral-900" />
            <span>Garantía Oficial</span>
          </div>
          <div className="flex items-center gap-3">
            <Shield className="w-6 h-6 text-neutral-900" />
            <span>Seguridad Total</span>
          </div>
        </div>
      </div>

      {/* --- SERVICES SECTION --- */}
      <section className="py-24 bg-neutral-950 relative">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-black italic uppercase tracking-tighter mb-4">
              Nuestros <span className="text-red-600">Servicios</span>
            </h2>
            <p className="text-neutral-400 max-w-xl mx-auto">
              Tecnología de punta y mecánicos expertos para cuidar lo que más te importa.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <ServiceCard
              icon={<Droplet className="w-10 h-10 text-red-600" />}
              title="Lubricación Express"
              desc="Cambio de aceite y filtros con productos de primera línea. Incluye chequeo de fluidos."
            />
            <ServiceCard
              icon={<Zap className="w-10 h-10 text-red-600" />}
              title="Auxilios de Batería"
              desc="¿Te quedaste sin arranque? Venta, colocación y recarga de baterías al instante."
            />
            <ServiceCard
              icon={<Disc className="w-10 h-10 text-red-600" />}
              title="Gomería"
              desc="Reparación de pinchaduras, rotación y balanceo. Todo para que sigas rodando seguro."
            />
          </div>
        </div>
      </section>

      {/* --- FAQ SECTION --- */}
      <section className="py-24 bg-neutral-900/50">
        <div className="container mx-auto px-6 max-w-4xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-black italic uppercase tracking-tighter mb-4">
              Preguntas <span className="text-red-600">Frecuentes</span>
            </h2>
          </div>
          <div className="grid gap-6">
            <FAQItem question="¿Necesito sacar turno?" answer="No es obligatorio, pero sí muy recomendable si querés asegurar tu lugar y evitar esperas. Reservando online, te garantizamos atención inmediata." />
            <FAQItem question="¿Qué medios de pago aceptan?" answer="Aceptamos efectivo, tarjetas de débito, crédito (Visa, Mastercard, Amex) y Mercado Pago. Consultá por cuotas sin interés." />
            <FAQItem question="¿El servicio incluye garantía?" answer="Sí, absolutamente. Todos nuestros trabajos cuentan con garantía sobre la mano de obra y los productos utilizados. Te vas tranquilo." />
            <FAQItem question="¿Hacen servicios a flotas?" answer="Sí, trabajamos con empresas y flotas de vehículos. Contactanos directamente para obtener una propuesta personalizada." />
          </div>
        </div>
      </section>

      {/* --- LEAD CAPTURE SECTION --- */}
      <section className="py-20 bg-red-600 relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10 z-0"></div>
        <div className="container mx-auto px-6 relative z-10 text-center">
          <h2 className="text-3xl md:text-4xl font-black italic uppercase tracking-tighter text-white mb-6">
            ¿No te acordás cuándo te toca?
          </h2>
          <p className="text-white/90 mb-8 text-lg">
            Dejanos tu email y te avisamos cuando sea momento del próximo cambio de aceite.
          </p>
          <div className="flex flex-col md:flex-row justify-center gap-4 max-w-lg mx-auto">
            <input
              type="email"
              placeholder="Tu correo electrónico"
              className="px-6 py-4 rounded-lg bg-white text-neutral-900 placeholder:text-neutral-500 font-bold outline-none ring-4 ring-transparent focus:ring-black/20 transition-all w-full"
            />
            <button className="bg-neutral-900 hover:bg-neutral-800 text-white px-8 py-4 rounded-lg font-black uppercase tracking-wider transition-all whitespace-nowrap">
              Avisame
            </button>
          </div>
          <p className="text-white/60 text-xs mt-4">Libre de SPAM. Solo te contactaremos para recordatorios.</p>
        </div>
      </section>

      {/* --- TESTIMONIALS --- */}
      <section className="py-24 bg-neutral-900 text-center">
        <div className="container mx-auto px-6">
          <h2 className="text-3xl font-black italic uppercase tracking-tighter mb-12">
            Clientes <span className="text-white">Satisfechos</span>
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            <TestimonialCard
              name="Martín G."
              text="Increíble la velocidad. Llegué, tomé un café y a los 40 minutos ya me estaba yendo. Súper recomendable."
              stars={5}
            />
            <TestimonialCard
              name="Laura S."
              text="Me explicaron todo lo que le hacían al auto. Muy transparentes y el precio excelente para la calidad que ofrecen."
              stars={5}
            />
          </div>
        </div>
      </section>

      {/* --- FOOTER --- */}
      <footer className="bg-neutral-950 pt-20 pb-10 border-t border-neutral-900">
        <div className="container mx-auto px-6 grid grid-cols-1 md:grid-cols-4 gap-12 mb-16">
          <div className="md:col-span-1">
            <h3 className="text-2xl font-black italic tracking-tighter text-white mb-6">FB Lubricentro</h3>
            <p className="text-neutral-500 mb-6">
              Pasión por los fierros. Compromiso con tu seguridad. El mejor service de Villa Carlos Paz.
            </p>
            <div className="flex gap-4">
              {/* Social Icons */}
              <a href="#" className="w-10 h-10 bg-neutral-900 rounded-full flex items-center justify-center text-neutral-400 hover:bg-red-600 hover:text-white transition-colors"><MessageCircle size={20} /></a>
            </div>
          </div>

          <div>
            <h4 className="font-bold text-white mb-6 uppercase tracking-wider">Contacto</h4>
            <ul className="space-y-4 text-neutral-400">
              <li className="flex items-center gap-3">
                <MapPin className="text-red-600" size={20} />
                <span>San Martín 1234, Villa Carlos Paz</span>
              </li>
              <li className="flex items-center gap-3">
                <Phone className="text-red-600" size={20} />
                <span>+54 3541 123 456</span>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-bold text-white mb-6 uppercase tracking-wider">Horarios</h4>
            <ul className="space-y-2 text-neutral-400">
              <li className="flex justify-between"><span>Lunes - Viernes</span> <span className="text-white font-bold">08:30 - 13:00</span></li>
              <li className="flex justify-between"><span></span> <span className="text-white font-bold">16:30 - 20:30</span></li>
              <li className="flex justify-between mt-4"><span>Sábados</span> <span className="text-white font-bold">09:00 - 13:00</span></li>
            </ul>
          </div>

          {/* Map Section */}
          <div className="h-48 rounded-lg overflow-hidden bg-neutral-900 border border-neutral-800 relative">
            <iframe
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d13618.67568160408!2d-64.500248!3d-31.420783!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x942d6640d6777c71%3A0x2db21b5b42d79383!2sVilla%20Carlos%20Paz%2C%20C%C3%B3rdoba!5e0!3m2!1ses-419!2sar!4v1700000000000!5m2!1ses-419!2sar"
              width="100%"
              height="100%"
              style={{ border: 0 }}
              allowFullScreen
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              className="grayscale hover:grayscale-0 transition-all duration-500"
            ></iframe>
            <div className="absolute top-2 right-2 bg-white text-black text-xs font-bold px-2 py-1 rounded shadow pointer-events-none">
              Ubicación
            </div>
          </div>
        </div>

        <div className="border-t border-neutral-900 pt-8 text-center text-neutral-600 text-sm">
          <p>&copy; {new Date().getFullYear()} FB Lubricentro. Todos los derechos reservados.</p>
          <div className="mt-2 text-xs">
            <Link href="/login" className="hover:text-neutral-400 transition-colors">Acceso Interno</Link>
          </div>
        </div>
      </footer>

      {/* --- FLOATING WHATSAPP BUTTON --- */}
      <a
        href="https://wa.me/543541000000"
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

function TestimonialCard({ name, text, stars }: { name: string, text: string, stars: number }) {
  return (
    <div className="bg-neutral-800 p-8 rounded-2xl relative">
      <div className="text-red-600 text-6xl absolute top-4 left-4 font-serif opacity-20">"</div>
      <p className="text-neutral-300 mb-6 italic relative z-10">
        {text}
      </p>
      <div className="flex items-center justify-between">
        <span className="font-bold text-white">{name}</span>
        <div className="flex text-yellow-500">
          {[...Array(stars)].map((_, i) => (
            <svg key={i} className="w-4 h-4 fill-current" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>
          ))}
        </div>
      </div>
    </div>
  );
}
