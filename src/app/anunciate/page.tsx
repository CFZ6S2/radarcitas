import Link from "next/link";

const steps = [
  {
    number: "1",
    title: "Crea tu cuenta gratis",
    description:
      "Regístrate en segundos con tu número de teléfono o cuenta de Google. Sin formularios largos ni verificaciones eternas.",
  },
  {
    number: "2",
    title: "Publica tu perfil",
    description:
      "Añade tu nombre, descripción, tarifas y activa tu GPS. Tu perfil aparecerá en el mapa para clientes cercanos.",
  },
  {
    number: "3",
    title: "Recibe clientes por WhatsApp",
    description:
      "Los clientes cerca de ti ven tu perfil en el radar y te contactan con un solo clic directamente a tu WhatsApp.",
  },
];

const benefits = [
  {
    icon: (
      <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    title: "100% Gratis, sin comisiones",
    description:
      "No cobramos por publicar tu perfil, ni por cada mensaje que recibas, ni comisión por cita. Todo lo que ganas es tuyo.",
    color: "rose",
  },
  {
    icon: (
      <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
      </svg>
    ),
    title: "WhatsApp directo, sin intermediarios",
    description:
      "Nada de chats internos ni sistemas de créditos. El cliente toca un botón y habla contigo directamente por WhatsApp.",
    color: "green",
  },
  {
    icon: (
      <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
      </svg>
    ),
    title: "Tú controlas tu visibilidad",
    description:
      "Desde tu panel puedes pausar tu perfil cuando quieras. Si estás ocupada o no disponible, desapareces del mapa con un clic.",
    color: "blue",
  },
  {
    icon: (
      <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
    title: "Clientes de tu zona",
    description:
      "Al ser un radar geolocalizado, solo te contactan personas que ya están cerca. Menos desplazamiento, más citas reales.",
    color: "amber",
  },
  {
    icon: (
      <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
      </svg>
    ),
    title: "Privacidad garantizada",
    description:
      "No mostramos tu dirección exacta. Los clientes ven una distancia aproximada, nunca tu ubicación precisa en el mapa.",
    color: "purple",
  },
  {
    icon: (
      <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
      </svg>
    ),
    title: "Alta en 2 minutos",
    description:
      "Sin papeleo, sin esperar aprobaciones. Te registras, activas el GPS, publicas tu perfil y ya estás visible en el radar.",
    color: "emerald",
  },
];

const colorMap: Record<string, { bg: string; text: string; border: string }> = {
  rose: { bg: "bg-rose-950", text: "text-rose-500", border: "border-rose-900/50" },
  green: { bg: "bg-green-950", text: "text-green-500", border: "border-green-900/50" },
  blue: { bg: "bg-blue-950", text: "text-blue-500", border: "border-blue-900/50" },
  amber: { bg: "bg-amber-950", text: "text-amber-500", border: "border-amber-900/50" },
  purple: { bg: "bg-purple-950", text: "text-purple-500", border: "border-purple-900/50" },
  emerald: { bg: "bg-emerald-950", text: "text-emerald-500", border: "border-emerald-900/50" },
};

const faqs = [
  {
    q: "¿Es realmente gratis?",
    a: "Sí, completamente. No hay planes de pago, comisiones ocultas ni límites. Publicar tu perfil es y será gratis.",
  },
  {
    q: "¿Los clientes ven mi dirección exacta?",
    a: "No. Ven una distancia aproximada (por ejemplo, '2.3 km') y tu zona general en el mapa, nunca tu calle ni tu número.",
  },
  {
    q: "¿Puedo desaparecer del mapa cuando quiera?",
    a: "Sí. Desde tu panel de control puedes pausar o reactivar tu perfil con un solo clic. También puedes borrar tu perfil permanentemente.",
  },
  {
    q: "¿Necesito descargar alguna app?",
    a: "No. RadarCitas funciona directamente desde el navegador de tu móvil. No necesitas instalar nada.",
  },
  {
    q: "¿Cómo me contactan los clientes?",
    a: "Tu perfil incluye un botón de WhatsApp. Cuando un cliente lo toca, se abre una conversación directa contigo. Sin chats intermedios ni pagos por mensaje.",
  },
];

export default function AnunciatePage() {
  return (
    <main className="min-h-screen bg-zinc-950 text-zinc-50 selection:bg-rose-500/30">
      {/* Navbar */}
      <nav className="sticky top-0 w-full flex justify-between items-center px-6 py-4 z-50 bg-zinc-950/90 backdrop-blur-md border-b border-zinc-800/50">
        <Link href="/" className="font-black text-xl tracking-tighter text-white flex items-center gap-2">
          <div className="w-3 h-3 bg-rose-600 rounded-full animate-pulse shadow-[0_0_10px_rgba(225,29,72,0.8)]"></div>
          RADAR<span className="text-rose-600">CITAS</span>
        </Link>
        <Link
          href="/register"
          className="text-sm font-bold bg-rose-600 hover:bg-rose-500 text-white px-5 py-2 rounded-xl transition shadow-[0_0_15px_rgba(225,29,72,0.3)]"
        >
          Publicar mi perfil
        </Link>
      </nav>

      {/* Hero */}
      <section className="relative pt-20 pb-16 lg:pt-32 lg:pb-24 overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-rose-600/15 rounded-full blur-[120px] -z-10 pointer-events-none"></div>
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h1 className="text-4xl lg:text-6xl font-extrabold tracking-tight leading-[1.1] mb-6">
            Anuncia tu perfil{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-rose-400 to-rose-600">
              gratis
            </span>{" "}
            y recibe clientes cercanos
          </h1>
          <p className="text-lg lg:text-xl text-zinc-400 max-w-2xl mx-auto mb-10 leading-relaxed">
            RadarCitas es un mapa interactivo donde los clientes encuentran perfiles cerca de ellos y te contactan directamente por WhatsApp. Sin comisiones, sin intermediarios, sin pagar por mensajes.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/register"
              className="w-full sm:w-auto px-8 py-4 bg-rose-600 hover:bg-rose-500 text-white font-extrabold text-lg rounded-2xl shadow-[0_0_25px_rgba(225,29,72,0.4)] hover:shadow-[0_0_35px_rgba(225,29,72,0.6)] transition-all transform hover:-translate-y-1"
            >
              Publicar mi perfil gratis
            </Link>
            <Link
              href="/radar"
              className="w-full sm:w-auto px-8 py-4 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-white font-bold rounded-2xl transition-all text-center"
            >
              Ver el radar primero
            </Link>
          </div>
        </div>
      </section>

      {/* Cómo funciona */}
      <section className="py-16 lg:py-24 bg-zinc-900/30 border-t border-zinc-800/50">
        <div className="max-w-4xl mx-auto px-6">
          <h2 className="text-3xl lg:text-4xl font-extrabold text-center mb-4">
            Cómo funciona
          </h2>
          <p className="text-zinc-400 text-center mb-12 max-w-xl mx-auto">
            En tres pasos estás visible para clientes de tu zona.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {steps.map((step) => (
              <div key={step.number} className="relative bg-zinc-900/60 border border-zinc-800/50 rounded-2xl p-6">
                <div className="w-10 h-10 bg-rose-600 text-white font-extrabold rounded-xl flex items-center justify-center mb-4 text-lg">
                  {step.number}
                </div>
                <h3 className="text-lg font-bold mb-2">{step.title}</h3>
                <p className="text-zinc-400 text-sm leading-relaxed">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Beneficios */}
      <section className="py-16 lg:py-24 border-t border-zinc-800/50">
        <div className="max-w-5xl mx-auto px-6">
          <h2 className="text-3xl lg:text-4xl font-extrabold text-center mb-4">
            Por qué elegir RadarCitas
          </h2>
          <p className="text-zinc-400 text-center mb-12 max-w-xl mx-auto">
            Diseñado para que tú tengas el control total, sin depender de nadie.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {benefits.map((b) => {
              const c = colorMap[b.color];
              return (
                <div key={b.title} className="bg-zinc-900/60 border border-zinc-800/50 rounded-2xl p-6">
                  <div className={`w-12 h-12 ${c.bg} ${c.text} rounded-2xl flex items-center justify-center mb-4 border ${c.border}`}>
                    {b.icon}
                  </div>
                  <h3 className="text-lg font-bold mb-2">{b.title}</h3>
                  <p className="text-zinc-400 text-sm leading-relaxed">{b.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-16 lg:py-24 bg-zinc-900/30 border-t border-zinc-800/50">
        <div className="max-w-3xl mx-auto px-6">
          <h2 className="text-3xl lg:text-4xl font-extrabold text-center mb-12">
            Preguntas frecuentes
          </h2>
          <div className="space-y-4">
            {faqs.map((faq) => (
              <details key={faq.q} className="group bg-zinc-900/60 border border-zinc-800/50 rounded-2xl overflow-hidden">
                <summary className="flex items-center justify-between cursor-pointer px-6 py-4 font-semibold text-white hover:text-rose-400 transition list-none">
                  {faq.q}
                  <svg className="w-5 h-5 text-zinc-500 group-open:rotate-180 transition-transform flex-shrink-0 ml-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </summary>
                <div className="px-6 pb-4 text-sm text-zinc-400 leading-relaxed">
                  {faq.a}
                </div>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Final */}
      <section className="py-16 lg:py-24 border-t border-zinc-800/50">
        <div className="max-w-3xl mx-auto px-6 text-center">
          <h2 className="text-3xl lg:text-4xl font-extrabold mb-4">
            Empieza a recibir clientes hoy
          </h2>
          <p className="text-zinc-400 mb-8 max-w-xl mx-auto leading-relaxed">
            Publicar tu perfil lleva 2 minutos y es completamente gratis. Sin sorpresas, sin letra pequeña.
          </p>
          <Link
            href="/register"
            className="inline-block px-10 py-4 bg-rose-600 hover:bg-rose-500 text-white font-extrabold text-lg rounded-2xl shadow-[0_0_25px_rgba(225,29,72,0.4)] hover:shadow-[0_0_35px_rgba(225,29,72,0.6)] transition-all transform hover:-translate-y-1"
          >
            Publicar mi perfil gratis
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 text-center border-t border-zinc-800/50">
        <p className="text-zinc-500 text-sm">
          &copy; {new Date().getFullYear()} RadarCitas. Solo para mayores de 18 años.
        </p>
      </footer>
    </main>
  );
}
