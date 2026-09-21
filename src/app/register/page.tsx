'use client';

import { useState, useEffect } from 'react';
import { collection, addDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/lib/auth';
import { geohashForLocation } from 'geofire-common';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function RegisterProfilePage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [form, setForm] = useState({
    name: '',
    age: '',
    whatsapp: '',
    description: '',
  });
  const [location, setLocation] = useState<{lat: number, lng: number} | null>(null);
  const [locating, setLocating] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      router.replace('/login');
    }
  }, [authLoading, user, router]);

  if (authLoading || !user) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center text-white">
        <span className="animate-pulse">Cargando...</span>
      </div>
    );
  }

  const requestLocation = () => {
    if (!navigator.geolocation) {
      alert('Tu navegador no soporta geolocalización.');
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setLocating(false);
      },
      (err) => {
        alert('No se pudo obtener la ubicación. Por favor, asegúrate de dar permisos de GPS a tu navegador web.');
        setLocating(false);
      },
      { enableHighAccuracy: true }
    );
  };

  const [photos, setPhotos] = useState<File[]>([]);
  const [rates, setRates] = useState('');
  const [services, setServices] = useState<string[]>([]);
  
  const AVAILABLE_SERVICES = ['Masaje', 'Trato de Novios', 'Garganta Profunda', 'Beso con Lengua', 'Lluvia Dorada', 'Juguetes', 'Salidas'];

  const handleServiceToggle = (service: string) => {
    setServices(prev => 
      prev.includes(service) ? prev.filter(s => s !== service) : [...prev, service]
    );
  };

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const selected = Array.from(e.target.files).slice(0, 3); // Max 3 photos
      setPhotos(selected);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!location) {
      alert('⚠️ Es obligatorio compartir tu ubicación para aparecer en el mapa.');
      return;
    }
    if (!acceptedTerms) {
      alert('Debes aceptar las condiciones de visibilidad.');
      return;
    }

    setLoading(true);
    try {
      const safeName = form.name.substring(0, 30).replace(/[<>]/g, '');
      const safeDescription = form.description.substring(0, 300).replace(/[<>]/g, '');
      const safeWhatsApp = form.whatsapp.replace(/[^0-9+]/g, '').substring(0, 15);
      const safeRates = rates.substring(0, 200).replace(/[<>]/g, '');

      // Ofuscar la ubicación
      const radiusInMeters = 200;
      const r = radiusInMeters * Math.sqrt(Math.random());
      const theta = Math.random() * 2 * Math.PI;
      const dx = r * Math.cos(theta);
      const dy = r * Math.sin(theta);
      const latOffset = dy / 111111;
      const lngOffset = dx / (111111 * Math.cos(location.lat * Math.PI / 180));
      const obfuscatedLat = location.lat + latOffset;
      const obfuscatedLng = location.lng + lngOffset;
      const hash = geohashForLocation([obfuscatedLat, obfuscatedLng]);

      // Upload photos to Storage
      const { ref, uploadBytes, getDownloadURL } = await import('firebase/storage');
      const { storage } = await import('@/lib/firebase');
      const photoUrls = [];
      
      for (const file of photos) {
        const fileRef = ref(storage, `profiles/${user?.uid}/${Date.now()}_${file.name}`);
        const snapshot = await uploadBytes(fileRef, file);
        const url = await getDownloadURL(snapshot.ref);
        photoUrls.push(url);
      }

      await addDoc(collection(db, 'profiles'), {
        uid: user?.uid,
        name: safeName,
        age: Number(form.age),
        whatsapp: safeWhatsApp,
        description: safeDescription,
        rates: safeRates,
        services: services,
        photos: photoUrls,
        location: {
          latitude: obfuscatedLat,
          longitude: obfuscatedLng,
        },
        geohash: hash,
        active: true,
        createdAt: new Date()
      });
      setSuccess(true);
    } catch (error) {
      console.error("Error al registrar perfil:", error);
      alert('Hubo un error al registrar el perfil. Inténtalo de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-white flex flex-col justify-center items-center px-4 py-12 selection:bg-rose-500/30">
      <div className="max-w-xl w-full bg-zinc-900/80 border border-zinc-800 rounded-[2rem] p-6 sm:p-10 shadow-2xl backdrop-blur-sm">
        
        <div className="mb-8 text-center">
          <Link href="/" className="text-sm font-semibold text-zinc-400 hover:text-white transition flex items-center justify-center gap-2 mb-4">
            <span>←</span> Volver al inicio
          </Link>
          <div className="inline-block p-3 bg-rose-500/10 rounded-2xl mb-4">
            <svg className="w-8 h-8 text-rose-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
            </svg>
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight mb-2">Sube tu perfil al Radar</h1>
          <p className="text-zinc-400">Conecta directamente con clientes cercanos mediante WhatsApp, <strong>sin intermediarios</strong>.</p>
        </div>

        {success ? (
          <div className="bg-emerald-950/40 border border-emerald-900 rounded-2xl p-8 text-center animate-in fade-in zoom-in duration-500">
            <div className="w-16 h-16 bg-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h3 className="font-bold text-2xl mb-2 text-emerald-400">¡Perfil Publicado!</h3>
            <p className="text-zinc-300 mb-8 leading-relaxed">
              Ya apareces en el radar. Los usuarios cercanos podrán ver tu distancia exacta y contactarte en un clic a tu WhatsApp.
            </p>
            <Link href="/radar" className="block w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-4 rounded-xl transition shadow-[0_0_20px_rgba(16,185,129,0.3)] mb-3">
              Ver mi perfil en el mapa
            </Link>
            <Link href="/dashboard" className="block w-full bg-zinc-800 hover:bg-zinc-700 text-white font-bold py-4 rounded-xl transition text-center">
              Ir a mi panel de control
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            
            {/* Sección 1: Datos Personales */}
            <div className="bg-zinc-950/50 p-5 rounded-2xl border border-zinc-800/50 space-y-4">
              <h3 className="text-sm font-bold text-rose-500 uppercase tracking-wider mb-2">1. Tus Datos</h3>
              
              <div>
                <label className="block text-sm font-semibold text-zinc-300 mb-1">Tu Nombre o Alias</label>
                <input 
                  type="text" 
                  required
                  value={form.name} 
                  onChange={e => setForm({...form, name: e.target.value})}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-rose-500 transition"
                  placeholder="¿Cómo te van a conocer?"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-zinc-300 mb-1">Edad</label>
                  <input 
                    type="number" 
                    required min={18} max={99}
                    value={form.age} 
                    onChange={e => setForm({...form, age: e.target.value})}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-rose-500 transition"
                    placeholder="Ej. 24"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-zinc-300 mb-1">WhatsApp</label>
                  <input 
                    type="tel" 
                    required
                    value={form.whatsapp} 
                    onChange={e => setForm({...form, whatsapp: e.target.value})}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-rose-500 transition"
                    placeholder="+34 600..."
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-zinc-300 mb-1">¿Qué ofreces? (Descripción general)</label>
                <textarea 
                  rows={2}
                  required
                  value={form.description} 
                  onChange={e => setForm({...form, description: e.target.value})}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-rose-500 transition resize-none"
                  placeholder="Descripción de ti, tu rollo..."
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-zinc-300 mb-1">Tarifas (Opcional)</label>
                <textarea 
                  rows={2}
                  value={rates} 
                  onChange={e => setRates(e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-rose-500 transition resize-none"
                  placeholder="Ej. 30min - 50€ / 1 hora - 100€"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-zinc-300 mb-2">Servicios que ofreces</label>
                <div className="flex flex-wrap gap-2">
                  {AVAILABLE_SERVICES.map(service => (
                    <button
                      key={service}
                      type="button"
                      onClick={() => handleServiceToggle(service)}
                      className={`px-3 py-1.5 rounded-full text-xs font-medium border transition ${
                        services.includes(service) 
                          ? 'bg-rose-600 border-rose-500 text-white shadow-[0_0_10px_rgba(225,29,72,0.3)]' 
                          : 'bg-zinc-800 border-zinc-700 text-zinc-400 hover:border-zinc-500'
                      }`}
                    >
                      {service}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-zinc-300 mb-2">Fotos (Max 3)</label>
                <input 
                  type="file" 
                  accept="image/*"
                  multiple
                  onChange={handlePhotoChange}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-sm focus:outline-none file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-rose-600/10 file:text-rose-500 hover:file:bg-rose-600/20 transition"
                />
                {photos.length > 0 && (
                  <p className="text-xs text-zinc-400 mt-2">
                    Has seleccionado {photos.length} foto(s).
                  </p>
                )}
              </div>
            </div>

            {/* Sección 2: Geolocalización Estricta y Privada */}
            <div className="bg-zinc-950/50 p-5 rounded-2xl border border-zinc-800/50">
              <h3 className="text-sm font-bold text-rose-500 uppercase tracking-wider mb-2">2. Tu Ubicación (Oculta)</h3>
              <p className="text-sm text-zinc-400 mb-4">
                El radar necesita saber dónde estás, pero <strong>por tu seguridad aplicamos un desvío aleatorio de 200 metros</strong>. Los clientes nunca sabrán tu portal exacto, solo la zona.
              </p>
              
              {!location ? (
                <button 
                  type="button"
                  onClick={requestLocation}
                  disabled={locating}
                  className="w-full flex items-center justify-center gap-2 bg-rose-600/10 hover:bg-rose-600/20 text-rose-500 font-bold py-4 rounded-xl transition border border-rose-500/30"
                >
                  {locating ? (
                    <span className="animate-pulse">Detectando GPS...</span>
                  ) : (
                    <>📍 Conceder acceso a mi Ubicación GPS</>
                  )}
                </button>
              ) : (
                <div className="w-full flex items-center justify-between bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 px-5 py-4 rounded-xl font-medium">
                  <div className="flex items-center gap-2">
                    <span>✅</span> Ubicación GPS bloqueada
                  </div>
                  <button type="button" onClick={requestLocation} className="text-xs text-emerald-500 hover:text-emerald-300 underline">
                    Actualizar
                  </button>
                </div>
              )}
            </div>

            {/* Consentimiento y Botón Final */}
            <div className="pt-2">
              <label className="flex items-start gap-3 cursor-pointer group mb-6">
                <div className="relative flex items-center justify-center mt-1">
                  <input 
                    type="checkbox" 
                    required
                    checked={acceptedTerms}
                    onChange={(e) => setAcceptedTerms(e.target.checked)}
                    className="w-5 h-5 appearance-none border-2 border-zinc-700 rounded bg-zinc-900 checked:bg-rose-600 checked:border-rose-600 transition"
                  />
                  {acceptedTerms && (
                    <svg className="w-3 h-3 absolute text-white pointer-events-none" viewBox="0 0 14 10" fill="none">
                      <path d="M1 5L4.5 8.5L13 1" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  )}
                </div>
                <span className="text-sm text-zinc-400 leading-relaxed group-hover:text-zinc-300 transition">
                  Entiendo que mi perfil y ubicación aproximada aparecerán públicamente en el mapa y doy mi consentimiento explícito para recibir mensajes en el WhatsApp proporcionado.
                </span>
              </label>

              <button 
                type="submit" 
                disabled={loading || !location || !acceptedTerms}
                className="w-full bg-rose-600 hover:bg-rose-500 disabled:opacity-50 disabled:hover:bg-rose-600 disabled:cursor-not-allowed text-white font-extrabold text-lg py-4 rounded-xl transition-all shadow-[0_0_20px_rgba(225,29,72,0.4)]"
              >
                {loading ? 'Subiendo al radar...' : 'Publicar mi perfil ahora'}
              </button>
            </div>

          </form>
        )}
      </div>
    </div>
  );
}
