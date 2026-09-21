import Link from 'next/link';

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-zinc-950 text-zinc-50 font-sans selection:bg-rose-500/30">
      {/* Navbar Simple */}
      <nav className="absolute top-0 w-full flex justify-between items-center px-6 py-4 z-50">
        <div className="font-black text-xl tracking-tighter text-white flex items-center gap-2">
          <div className="w-3 h-3 bg-rose-600 rounded-full animate-pulse shadow-[0_0_10px_rgba(225,29,72,0.8)]"></div>
          RADAR<span className="text-rose-600">CITAS</span>
        </div>
        <div className="flex items-center gap-4">
          <Link
            href="/dashboard"
            className="text-sm font-semibold text-zinc-300 hover:text-white transition"
          >
            Mi Perfil
          </Link>
          <Link
            href="/radar"
            className="text-sm font-semibold text-zinc-300 hover:text-white transition"
          >
            Entrar al Radar
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 overflow-hidden flex flex-col items-center text-center px-4">
        {/* Decoración de fondo (Glows) */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-rose-600/20 rounded-full blur-[120px] -z-10 pointer-events-none"></div>
        <div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-blue-600/10 rounded-full blur-[100px] -z-10 pointer-events-none"></div>

        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-zinc-900/80 border border-zinc-800 text-xs font-medium text-zinc-300 mb-8 backdrop-blur-sm">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500"></span>
          </span>
          Radar Activo en tu zona
        </div>

        <h1 className="text-5xl lg:text-7xl font-extrabold tracking-tight max-w-4xl leading-[1.1] mb-6">
          Encuentra compañía <br className="hidden md:block" />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-rose-400 to-rose-600">
            cerca de ti al instante.
          </span>
        </h1>
        
        <p className="text-lg lg:text-xl text-zinc-400 max-w-2xl mb-10 leading-relaxed">
          El primer radar geolocalizado en tiempo real. Visualiza perfiles en tu mapa y conecta directamente por WhatsApp sin intermediarios ni registros tediosos.
        </p>

        <div className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto">
          <Link 
            href="/radar" 
            className="w-full sm:w-auto px-8 py-4 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-2xl shadow-[0_0_20px_rgba(225,29,72,0.4)] hover:shadow-[0_0_30px_rgba(225,29,72,0.6)] transition-all transform hover:-translate-y-1"
          >
            Abrir Radar Ahora
          </Link>
          <Link 
            href="/register"
            className="w-full sm:w-auto px-8 py-4 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-white font-bold rounded-2xl transition-all text-center"
          >
            Anunciar mi perfil
          </Link>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-zinc-900/30 border-t border-zinc-800/50">
        <div className="max-w-6xl mx-auto px-6 grid grid-cols-1 md:grid-cols-3 gap-12 text-center md:text-left">
          
          <div className="flex flex-col items-center md:items-start">
            <div className="w-12 h-12 bg-rose-950 text-rose-500 rounded-2xl flex items-center justify-center mb-6 border border-rose-900/50">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <h3 className="text-xl font-bold mb-3">Geolocalización Real</h3>
            <p className="text-zinc-400 leading-relaxed">Filtra perfiles por distancia exacta. Descubre quién está a 2km, 5km o 10km de tu posición actual al instante.</p>
          </div>

          <div className="flex flex-col items-center md:items-start">
            <div className="w-12 h-12 bg-green-950 text-green-500 rounded-2xl flex items-center justify-center mb-6 border border-green-900/50">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </div>
            <h3 className="text-xl font-bold mb-3">Contacto Directo</h3>
            <p className="text-zinc-400 leading-relaxed">Sin chats internos lentos ni pagos por mensajes. Inicia la conversación directamente a través de WhatsApp.</p>
          </div>

          <div className="flex flex-col items-center md:items-start">
            <div className="w-12 h-12 bg-blue-950 text-blue-500 rounded-2xl flex items-center justify-center mb-6 border border-blue-900/50">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <h3 className="text-xl font-bold mb-3">100% Privado</h3>
            <p className="text-zinc-400 leading-relaxed">No guardamos tu ubicación. No necesitas registrarte para buscar. Entras, miras el mapa y conectas. Así de simple.</p>
          </div>

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
