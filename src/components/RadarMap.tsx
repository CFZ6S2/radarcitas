'use client';

import { useEffect, useState, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import { collection, getDocs, query, orderBy, startAt, endAt } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { distanceBetween, geohashQueryBounds } from 'geofire-common';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet-defaulticon-compatibility';
import 'leaflet-defaulticon-compatibility/dist/leaflet-defaulticon-compatibility.css';

interface Schedule {
  enabled: boolean;
  days: number[];
  startHour: number;
  endHour: number;
}

interface Profile {
  id: string;
  uid?: string;
  name: string;
  age: number;
  latitude: number;
  longitude: number;
  whatsapp: string;
  description: string;
  distance?: number;
  rates?: string;
  services?: string[];
  photos?: string[];
  active?: boolean;
  schedule?: Schedule;
  contactMethod?: 'whatsapp' | 'telegram' | 'both';
  telegram?: string;
}

function isWithinSchedule(s: Schedule): boolean {
  const now = new Date();
  if (!s.days.includes(now.getDay())) return false;
  const h = now.getHours();
  if (s.startHour < s.endHour) return h >= s.startHour && h < s.endHour;
  // overnight: e.g. 22-06
  return h >= s.startHour || h < s.endHour;
}

const DEFAULT_CENTER: [number, number] = [40.4168, -3.7038];

const profileIcon = L.divIcon({
  className: 'custom-icon',
  html: `<div class="w-5 h-5 bg-rose-500 rounded-full border-2 border-white shadow-[0_0_15px_rgba(244,63,94,0.9)] animate-pulse"></div>`,
  iconSize: [20, 20],
  iconAnchor: [10, 10],
});

const centerIcon = L.divIcon({
  className: 'custom-icon',
  html: `<div class="w-4 h-4 bg-blue-500 rounded-full border-2 border-white shadow-[0_0_15px_rgba(59,130,246,1)]"></div>`,
  iconSize: [16, 16],
  iconAnchor: [8, 8],
});

function MapController({ center }: { center: [number, number] }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center, map.getZoom());
  }, [center, map]);
  return null;
}

const ALL_SERVICES = ['Masaje', 'Trato de Novios', 'Garganta Profunda', 'Beso con Lengua', 'Lluvia Dorada', 'Juguetes', 'Salidas'];

export default function RadarMap() {
  const [fetchedProfiles, setFetchedProfiles] = useState<Profile[]>([]);
  const [userLocation, setUserLocation] = useState<[number, number]>(DEFAULT_CENTER);
  const [radiusKm, setRadiusKm] = useState<number>(5);
  const [isMounted, setIsMounted] = useState(false);
  const [locating, setLocating] = useState(false);
  const [selectedProfile, setSelectedProfile] = useState<Profile | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [ageMin, setAgeMin] = useState<number>(18);
  const [ageMax, setAgeMax] = useState<number>(99);
  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  const [sortByDistance, setSortByDistance] = useState(true);

  // 1. Obtener ubicación
  useEffect(() => {
    setIsMounted(true);
    if (navigator.geolocation) {
      setLocating(true);
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation([position.coords.latitude, position.coords.longitude]);
          setLocating(false);
        },
        (error) => {
          console.warn("No se pudo obtener la geolocalización GPS, usando ubicación por defecto.", error);
          setLocating(false);
        },
        { enableHighAccuracy: true }
      );
    }
  }, []);

  // 2. Fetch de perfiles usando GeoQueries (para no descargar toda la base de datos)
  useEffect(() => {
    if (!isMounted) return;
    
    async function fetchProfilesInRadius() {
      try {
        const radiusInM = radiusKm * 1000;
        const bounds = geohashQueryBounds(userLocation, radiusInM);
        const promises = [];

        for (const b of bounds) {
          const q = query(
            collection(db, 'profiles'),
            orderBy('geohash'),
            startAt(b[0]),
            endAt(b[1])
          );
          promises.push(getDocs(q));
        }

        const snapshots = await Promise.all(promises);
        const loadedProfiles: Profile[] = [];
        
        for (const snap of snapshots) {
          for (const doc of snap.docs) {
            const data = doc.data();
            const lat = data.location?.latitude || data.latitude;
            const lng = data.location?.longitude || data.longitude;
            
            loadedProfiles.push({
              id: doc.id,
              uid: data.uid,
              name: data.name,
              age: data.age,
              latitude: lat,
              longitude: lng,
              whatsapp: data.whatsapp,
              description: data.description,
              rates: data.rates,
              services: data.services || [],
              photos: data.photos || [],
              active: data.active !== false,
              schedule: data.schedule || undefined,
              contactMethod: data.contactMethod || 'whatsapp',
              telegram: data.telegram || ''
            });
          }
        }
        
        // Evitamos duplicados en caso de solapamiento de geohashes y filtramos inactivos
        const uniqueProfiles = Array.from(new Map(loadedProfiles.map(p => [p.id, p])).values()).filter(p => {
          if (!p.active) return false;
          if (p.schedule?.enabled) return isWithinSchedule(p.schedule);
          return true;
        });
        setFetchedProfiles(uniqueProfiles);
      } catch (error) {
        console.error("Error al cargar perfiles de Firebase:", error);
      }
    }

    fetchProfilesInRadius();
  }, [userLocation, radiusKm, isMounted]);

  const toggleService = (s: string) => {
    setSelectedServices(prev => prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s]);
  };

  const filteredProfiles = useMemo(() => {
    return fetchedProfiles.map(profile => {
      const distInMeters = distanceBetween(userLocation, [profile.latitude, profile.longitude]);
      return { ...profile, distance: Math.round(distInMeters * 10) / 10 };
    })
    .filter(p => (p.distance ?? 0) <= radiusKm)
    .filter(p => p.age >= ageMin && p.age <= ageMax)
    .filter(p => selectedServices.length === 0 || selectedServices.some(s => p.services?.includes(s)))
    .sort((a, b) => sortByDistance ? (a.distance ?? 0) - (b.distance ?? 0) : 0);
  }, [fetchedProfiles, userLocation, radiusKm, ageMin, ageMax, selectedServices, sortByDistance]);

  if (!isMounted) return <div className="h-screen w-full flex items-center justify-center bg-zinc-900 text-white">Cargando radar...</div>;

  return (
    <div className="relative h-screen w-full overflow-hidden">
      <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-[1000] bg-zinc-900/90 backdrop-blur-md text-white px-4 py-3 rounded-2xl shadow-xl border border-zinc-700 flex flex-col sm:flex-row items-center gap-3 max-w-[95%]">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400">Radio:</span>
          <div className="flex gap-1.5">
            {[2, 5, 10, 20].map((r) => (
              <button
                key={r}
                onClick={() => setRadiusKm(r)}
                className={`px-2.5 py-1 rounded-lg text-xs font-medium transition ${
                  radiusKm === r 
                    ? 'bg-rose-600 text-white shadow-md' 
                    : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'
                }`}
              >
                {r} km
              </button>
            ))}
          </div>
        </div>
        {locating && <span className="text-xs text-blue-400 animate-pulse ml-2">Ubicando...</span>}
        <button
          onClick={() => setShowFilters(!showFilters)}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
            showFilters || selectedServices.length > 0 || ageMin > 18 || ageMax < 99
              ? 'bg-rose-600 text-white'
              : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'
          }`}
        >
          Filtros{(selectedServices.length > 0 || ageMin > 18 || ageMax < 99) ? ` (${selectedServices.length + (ageMin > 18 || ageMax < 99 ? 1 : 0)})` : ''}
        </button>
        <span className="text-xs text-zinc-500">{filteredProfiles.length} perfil{filteredProfiles.length !== 1 ? 'es' : ''}</span>
      </div>

      {showFilters && (
        <div className="absolute top-20 left-1/2 transform -translate-x-1/2 z-[1000] bg-zinc-900/95 backdrop-blur-md text-white px-5 py-4 rounded-2xl shadow-xl border border-zinc-700 w-[90%] max-w-md space-y-4">
          <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-zinc-400 block mb-2">Edad: {ageMin} - {ageMax}</label>
            <div className="flex items-center gap-3">
              <input type="range" min={18} max={99} value={ageMin} onChange={e => setAgeMin(Math.min(Number(e.target.value), ageMax))} className="flex-1 accent-rose-500" />
              <input type="range" min={18} max={99} value={ageMax} onChange={e => setAgeMax(Math.max(Number(e.target.value), ageMin))} className="flex-1 accent-rose-500" />
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-zinc-400 block mb-2">Servicios</label>
            <div className="flex flex-wrap gap-1.5">
              {ALL_SERVICES.map(s => (
                <button
                  key={s}
                  onClick={() => toggleService(s)}
                  className={`px-2.5 py-1 rounded-full text-xs font-medium border transition ${
                    selectedServices.includes(s)
                      ? 'bg-rose-600 border-rose-500 text-white'
                      : 'bg-zinc-800 border-zinc-700 text-zinc-400 hover:border-zinc-500'
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-between">
            <label className="flex items-center gap-2 text-xs text-zinc-300">
              <input type="checkbox" checked={sortByDistance} onChange={e => setSortByDistance(e.target.checked)} className="accent-rose-500" />
              Ordenar por cercanía
            </label>
            <button
              onClick={() => { setAgeMin(18); setAgeMax(99); setSelectedServices([]); setSortByDistance(true); }}
              className="text-xs text-rose-400 hover:text-rose-300 transition"
            >
              Limpiar filtros
            </button>
          </div>
        </div>
      )}

      <MapContainer 
        center={userLocation} 
        zoom={13} 
        scrollWheelZoom={true} 
        className="h-full w-full z-0"
      >
        <MapController center={userLocation} />
        <TileLayer
          attribution='&copy; <a href="https://stadiamaps.com/">Stadia Maps</a> &copy; <a href="https://openmaptiles.org/">OpenMapTiles</a> &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://tiles.stadiamaps.com/tiles/alidade_smooth_dark/{z}/{x}/{y}{r}.png"
        />

        <Marker position={userLocation} icon={centerIcon}>
          <Popup>
            <div className="p-1 text-center text-zinc-900 font-semibold text-xs">
              📍 Estás aquí
            </div>
          </Popup>
        </Marker>

        {filteredProfiles.map((profile) => (
          <Marker 
            key={profile.id} 
            position={[profile.latitude, profile.longitude]} 
            icon={profileIcon}
            eventHandlers={{
              click: () => setSelectedProfile(profile)
            }}
          />
        ))}
      </MapContainer>

      {/* Perfil en Bottom Sheet / Drawer */}
      <div className={`absolute bottom-0 left-0 w-full z-[1001] bg-zinc-900 border-t border-zinc-800 rounded-t-3xl shadow-[0_-10px_40px_rgba(0,0,0,0.5)] transition-transform duration-300 ease-in-out ${selectedProfile ? 'translate-y-0' : 'translate-y-full'}`}>
        {selectedProfile && (
          <div className="p-6 max-h-[85vh] overflow-y-auto">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                  {selectedProfile.name}, {selectedProfile.age}
                  <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                </h2>
                <span className="inline-block mt-1 text-xs bg-rose-500/20 text-rose-400 font-semibold px-2.5 py-1 rounded-full border border-rose-500/30">
                  A {selectedProfile.distance} km de ti
                </span>
              </div>
              <button 
                onClick={() => setSelectedProfile(null)}
                className="p-2 bg-zinc-800 hover:bg-zinc-700 rounded-full text-zinc-400 transition"
              >
                ✕
              </button>
            </div>

            {selectedProfile.photos && selectedProfile.photos.length > 0 && (
              <div className="flex gap-3 overflow-x-auto pb-4 snap-x mb-4">
                {selectedProfile.photos.map((url, i) => (
                  <img key={i} src={url} alt="Foto" className="h-48 w-40 object-cover rounded-2xl snap-center shrink-0 border border-zinc-800" />
                ))}
              </div>
            )}

            <div className="space-y-4 mb-6 text-sm text-zinc-300">
              <p className="leading-relaxed bg-zinc-950 p-4 rounded-2xl border border-zinc-800/50">{selectedProfile.description}</p>
              
              {selectedProfile.services && selectedProfile.services.length > 0 && (
                <div>
                  <h4 className="font-semibold text-zinc-400 uppercase text-xs mb-2 tracking-wider">Servicios</h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedProfile.services.map(s => (
                      <span key={s} className="bg-zinc-800 text-zinc-200 px-3 py-1 rounded-full text-xs border border-zinc-700">
                        {s}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {selectedProfile.rates && (
                <div>
                  <h4 className="font-semibold text-zinc-400 uppercase text-xs mb-2 tracking-wider">Tarifas</h4>
                  <p className="bg-zinc-950 p-3 rounded-xl border border-zinc-800/50 whitespace-pre-line text-zinc-300">
                    {selectedProfile.rates}
                  </p>
                </div>
              )}
            </div>

            <div className={`flex gap-3 sticky bottom-0 ${selectedProfile.contactMethod === 'both' ? '' : ''}`}>
              {(selectedProfile.contactMethod === 'whatsapp' || selectedProfile.contactMethod === 'both' || !selectedProfile.contactMethod) && selectedProfile.whatsapp && (
                <a
                  href={`https://wa.me/${selectedProfile.whatsapp.replace(/[^0-9]/g, '')}?text=Hola%20${selectedProfile.name},%20he%20visto%20tu%20perfil%20en%20RadarCitas.`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 flex items-center justify-center gap-2 bg-green-600 hover:bg-green-500 text-white font-bold py-4 rounded-xl transition shadow-[0_0_20px_rgba(22,163,74,0.3)]"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                  WhatsApp
                </a>
              )}
              {(selectedProfile.contactMethod === 'telegram' || selectedProfile.contactMethod === 'both') && selectedProfile.telegram && (
                <a
                  href={`https://t.me/${selectedProfile.telegram}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 flex items-center justify-center gap-2 bg-blue-500 hover:bg-blue-400 text-white font-bold py-4 rounded-xl transition shadow-[0_0_20px_rgba(59,130,246,0.3)]"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.479.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/></svg>
                  Telegram
                </a>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
