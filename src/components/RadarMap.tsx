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

interface Profile {
  id: string;
  name: string;
  age: number;
  latitude: number;
  longitude: number;
  whatsapp: string;
  description: string;
  distance?: number;
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

export default function RadarMap() {
  const [fetchedProfiles, setFetchedProfiles] = useState<Profile[]>([]);
  const [userLocation, setUserLocation] = useState<[number, number]>(DEFAULT_CENTER);
  const [radiusKm, setRadiusKm] = useState<number>(5);
  const [isMounted, setIsMounted] = useState(false);
  const [locating, setLocating] = useState(false);

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
            
            if (data.active === false) continue;

            loadedProfiles.push({
              id: doc.id,
              name: data.name,
              age: data.age,
              latitude: lat,
              longitude: lng,
              whatsapp: data.whatsapp,
              description: data.description,
            });
          }
        }
        
        // Evitamos duplicados en caso de solapamiento de geohashes
        const uniqueProfiles = Array.from(new Map(loadedProfiles.map(p => [p.id, p])).values());
        setFetchedProfiles(uniqueProfiles);
      } catch (error) {
        console.error("Error al cargar perfiles de Firebase:", error);
      }
    }

    fetchProfilesInRadius();
  }, [userLocation, radiusKm, isMounted]);

  // 3. Filtrado final preciso en el cliente usando useMemo
  const filteredProfiles = useMemo(() => {
    return fetchedProfiles.map(profile => {
      const distInMeters = distanceBetween(userLocation, [profile.latitude, profile.longitude]);
      return {
        ...profile,
        distance: Math.round(distInMeters * 10) / 10
      };
    }).filter(p => (p.distance ?? 0) <= radiusKm);
  }, [fetchedProfiles, userLocation, radiusKm]);

  if (!isMounted) return <div className="h-screen w-full flex items-center justify-center bg-zinc-900 text-white">Cargando radar...</div>;

  return (
    <div className="relative h-screen w-full">
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
      </div>

      <MapContainer 
        center={userLocation} 
        zoom={13} 
        scrollWheelZoom={true} 
        className="h-full w-full z-0"
      >
        <MapController center={userLocation} />
        <TileLayer
          attribution='&copy; <a href="https://carto.com/attributions">CARTO</a>'
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
        />

        <Marker position={userLocation} icon={centerIcon}>
          <Popup>
            <div className="p-1 text-center text-zinc-900 font-semibold text-xs">
              📍 Estás aquí
            </div>
          </Popup>
        </Marker>

        {filteredProfiles.map((profile) => (
          <Marker key={profile.id} position={[profile.latitude, profile.longitude]} icon={profileIcon}>
            <Popup>
              <div className="p-2 text-zinc-900 min-w-[200px]">
                <div className="flex justify-between items-center mb-1">
                  <h3 className="font-bold text-lg">{profile.name}, {profile.age}</h3>
                  <span className="text-xs bg-rose-100 text-rose-700 font-semibold px-2 py-0.5 rounded-full">
                    {profile.distance} km
                  </span>
                </div>
                <p className="text-xs text-zinc-500 mb-3">{profile.description}</p>
                <a 
                  href={`https://wa.me/${profile.whatsapp?.replace(/[^0-9]/g, '')}?text=Hola%20${profile.name},%20he%20visto%20tu%20perfil%20en%20el%20radar.`} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="block w-full bg-green-600 text-white text-center py-2 px-3 rounded-xl font-medium hover:bg-green-700 transition text-sm shadow-sm"
                >
                  Contactar por WhatsApp
                </a>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}
