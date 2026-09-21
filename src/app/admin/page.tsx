'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { collection, getDocs, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/lib/auth';
import Link from 'next/link';

const ADMIN_EMAILS = ['cesar.herrera.rojo@gmail.com'];

interface Report {
  id: string;
  profileId: string;
  profileName: string;
  reason: string;
  status: 'pending' | 'reviewed' | 'dismissed';
  createdAt?: { seconds: number };
}

interface Profile {
  id: string;
  uid: string;
  name: string;
  age: number;
  whatsapp: string;
  telegram?: string;
  contactMethod?: string;
  description: string;
  active: boolean;
  photos: string[];
  services: string[];
  rates?: string;
  createdAt?: { seconds: number };
  schedule?: { enabled: boolean; days: number[]; startHour: number; endHour: number };
}

export default function AdminPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [message, setMessage] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [reports, setReports] = useState<Report[]>([]);
  const [tab, setTab] = useState<'profiles' | 'reports'>('profiles');

  const isAdmin = user && ADMIN_EMAILS.includes(user.email || '');

  useEffect(() => {
    if (authLoading) return;
    if (!user) { router.replace('/login'); return; }
    if (!ADMIN_EMAILS.includes(user.email || '')) { router.replace('/'); return; }

    async function fetchAll() {
      const snap = await getDocs(collection(db, 'profiles'));
      const list: Profile[] = snap.docs.map(d => {
        const data = d.data();
        return {
          id: d.id,
          uid: data.uid,
          name: data.name,
          age: data.age,
          whatsapp: data.whatsapp,
          telegram: data.telegram || '',
          contactMethod: data.contactMethod || 'whatsapp',
          description: data.description,
          active: data.active !== false,
          photos: data.photos || [],
          services: data.services || [],
          rates: data.rates || '',
          createdAt: data.createdAt,
          schedule: data.schedule,
        };
      });
      list.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
      setProfiles(list);

      const rSnap = await getDocs(collection(db, 'reports'));
      const rList: Report[] = rSnap.docs.map(d => {
        const data = d.data();
        return { id: d.id, profileId: data.profileId, profileName: data.profileName, reason: data.reason, status: data.status || 'pending', createdAt: data.createdAt };
      });
      rList.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
      setReports(rList);
      setLoading(false);
    }
    fetchAll();
  }, [user, authLoading, router]);

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center text-white">
        <span className="animate-pulse">Cargando admin...</span>
      </div>
    );
  }

  if (!isAdmin) return null;

  const toggleActive = async (p: Profile) => {
    const newActive = !p.active;
    await updateDoc(doc(db, 'profiles', p.id), { active: newActive });
    setProfiles(prev => prev.map(x => x.id === p.id ? { ...x, active: newActive } : x));
    setMessage(`${p.name} ${newActive ? 'activado' : 'desactivado'}.`);
  };

  const deleteProfile = async (p: Profile) => {
    await deleteDoc(doc(db, 'profiles', p.id));
    setProfiles(prev => prev.filter(x => x.id !== p.id));
    setConfirmDeleteId(null);
    setMessage(`${p.name} eliminado permanentemente.`);
  };

  const updateReportStatus = async (r: Report, status: 'reviewed' | 'dismissed') => {
    await updateDoc(doc(db, 'reports', r.id), { status });
    setReports(prev => prev.map(x => x.id === r.id ? { ...x, status } : x));
    setMessage(`Reporte ${status === 'reviewed' ? 'marcado como revisado' : 'descartado'}.`);
  };

  const deleteReport = async (r: Report) => {
    await deleteDoc(doc(db, 'reports', r.id));
    setReports(prev => prev.filter(x => x.id !== r.id));
    setMessage('Reporte eliminado.');
  };

  const pendingReports = reports.filter(r => r.status === 'pending').length;

  const filtered = profiles.filter(p => {
    if (filter === 'active' && !p.active) return false;
    if (filter === 'inactive' && p.active) return false;
    if (search) {
      const s = search.toLowerCase();
      return p.name.toLowerCase().includes(s) || p.whatsapp.includes(s) || p.description.toLowerCase().includes(s) || (p.telegram || '').toLowerCase().includes(s);
    }
    return true;
  });

  const stats = {
    total: profiles.length,
    active: profiles.filter(p => p.active).length,
    inactive: profiles.filter(p => !p.active).length,
    withPhotos: profiles.filter(p => p.photos.length > 0).length,
    withSchedule: profiles.filter(p => p.schedule?.enabled).length,
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-white px-4 py-8 selection:bg-rose-500/30">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <Link href="/" className="font-black text-xl tracking-tighter text-white flex items-center gap-2">
            <div className="w-3 h-3 bg-rose-600 rounded-full animate-pulse shadow-[0_0_10px_rgba(225,29,72,0.8)]"></div>
            RADAR<span className="text-rose-600">CITAS</span>
          </Link>
          <span className="text-xs text-zinc-500 bg-zinc-900 px-3 py-1 rounded-full border border-zinc-800">ADMIN</span>
        </div>

        <h1 className="text-3xl font-extrabold tracking-tight mb-2">Panel de Administración</h1>
        <p className="text-zinc-400 mb-6">Gestión de todos los perfiles de la plataforma.</p>

        {message && (
          <div className="bg-zinc-900 border border-zinc-700 text-zinc-200 text-sm rounded-xl px-4 py-3 mb-6 flex justify-between items-center">
            {message}
            <button onClick={() => setMessage('')} className="text-zinc-500 hover:text-white">✕</button>
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-6">
          {[
            ['Total', stats.total, 'bg-zinc-900'],
            ['Activos', stats.active, 'bg-emerald-950'],
            ['Ocultos', stats.inactive, 'bg-red-950'],
            ['Con fotos', stats.withPhotos, 'bg-blue-950'],
            ['Con horario', stats.withSchedule, 'bg-purple-950'],
          ].map(([label, val, bg]) => (
            <div key={label as string} className={`${bg} border border-zinc-800 rounded-xl p-3 text-center`}>
              <div className="text-2xl font-extrabold">{val as number}</div>
              <div className="text-xs text-zinc-400">{label as string}</div>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setTab('profiles')}
            className={`px-4 py-2 rounded-xl text-sm font-semibold transition ${tab === 'profiles' ? 'bg-rose-600 text-white' : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'}`}
          >
            Perfiles
          </button>
          <button
            onClick={() => setTab('reports')}
            className={`px-4 py-2 rounded-xl text-sm font-semibold transition relative ${tab === 'reports' ? 'bg-rose-600 text-white' : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'}`}
          >
            Reportes
            {pendingReports > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">{pendingReports}</span>
            )}
          </button>
        </div>

        {tab === 'profiles' && (<>
        {/* Search + Filter */}
        <div className="flex gap-3 mb-6">
          <input
            type="text"
            placeholder="Buscar por nombre, teléfono, descripción..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="flex-1 bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500 transition"
          />
          <div className="flex gap-1">
            {(['all', 'active', 'inactive'] as const).map(f => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-3 py-2 rounded-xl text-xs font-semibold transition ${
                  filter === f ? 'bg-rose-600 text-white' : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
                }`}
              >
                {f === 'all' ? 'Todos' : f === 'active' ? 'Activos' : 'Ocultos'}
              </button>
            ))}
          </div>
        </div>

        <p className="text-xs text-zinc-500 mb-4">{filtered.length} perfil{filtered.length !== 1 ? 'es' : ''}</p>

        {/* Profile list */}
        <div className="space-y-3">
          {filtered.map(p => (
            <div key={p.id} className="bg-zinc-900/80 border border-zinc-800 rounded-2xl overflow-hidden">
              <div
                className="flex items-center gap-4 p-4 cursor-pointer hover:bg-zinc-800/50 transition"
                onClick={() => setExpandedId(expandedId === p.id ? null : p.id)}
              >
                {p.photos.length > 0 ? (
                  <img src={p.photos[0]} alt="" className="w-12 h-12 rounded-xl object-cover border border-zinc-700 shrink-0" />
                ) : (
                  <div className="w-12 h-12 rounded-xl bg-zinc-800 border border-zinc-700 flex items-center justify-center text-zinc-600 text-xs shrink-0">Sin foto</div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-bold truncate">{p.name}</span>
                    <span className="text-xs text-zinc-500">{p.age} años</span>
                    <span className={`w-2 h-2 rounded-full shrink-0 ${p.active ? 'bg-emerald-500' : 'bg-zinc-600'}`} />
                  </div>
                  <div className="text-xs text-zinc-500 truncate">{p.whatsapp} {p.telegram ? `| @${p.telegram}` : ''}</div>
                </div>
                <svg className={`w-4 h-4 text-zinc-500 transition-transform shrink-0 ${expandedId === p.id ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>

              {expandedId === p.id && (
                <div className="border-t border-zinc-800 p-4 space-y-3">
                  <p className="text-sm text-zinc-300">{p.description}</p>

                  {p.services.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {p.services.map(s => (
                        <span key={s} className="bg-zinc-800 text-zinc-300 px-2 py-0.5 rounded-full text-xs">{s}</span>
                      ))}
                    </div>
                  )}

                  {p.rates && <p className="text-xs text-zinc-400">Tarifas: {p.rates}</p>}

                  {p.photos.length > 0 && (
                    <div className="flex gap-2 overflow-x-auto pb-1">
                      {p.photos.map((url, i) => (
                        <img key={i} src={url} alt="" className="h-20 w-16 object-cover rounded-lg border border-zinc-700 shrink-0" />
                      ))}
                    </div>
                  )}

                  <div className="text-xs text-zinc-500 space-y-1">
                    <div>Contacto: {p.contactMethod || 'whatsapp'}</div>
                    <div>UID: {p.uid}</div>
                    <div>Doc ID: {p.id}</div>
                    {p.schedule?.enabled && (
                      <div>Horario: {p.schedule.startHour}:00-{p.schedule.endHour}:00 | Días: {p.schedule.days.map(d => ['Dom','Lun','Mar','Mié','Jue','Vie','Sáb'][d]).join(', ')}</div>
                    )}
                    {p.createdAt && <div>Creado: {new Date(p.createdAt.seconds * 1000).toLocaleDateString('es-ES')}</div>}
                  </div>

                  <div className="flex gap-2 pt-2">
                    <button
                      onClick={() => toggleActive(p)}
                      className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition ${
                        p.active
                          ? 'bg-red-950/50 text-red-400 border border-red-900/50 hover:bg-red-950'
                          : 'bg-emerald-950/50 text-emerald-400 border border-emerald-900/50 hover:bg-emerald-950'
                      }`}
                    >
                      {p.active ? 'Desactivar' : 'Activar'}
                    </button>
                    {confirmDeleteId === p.id ? (
                      <div className="flex-1 flex gap-2">
                        <button
                          onClick={() => deleteProfile(p)}
                          className="flex-1 bg-red-600 hover:bg-red-500 text-white font-bold py-2.5 rounded-xl transition text-sm"
                        >
                          Confirmar
                        </button>
                        <button
                          onClick={() => setConfirmDeleteId(null)}
                          className="flex-1 bg-zinc-800 text-zinc-300 font-bold py-2.5 rounded-xl transition text-sm hover:bg-zinc-700"
                        >
                          Cancelar
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setConfirmDeleteId(p.id)}
                        className="flex-1 bg-red-950/50 text-red-400 border border-red-900/50 hover:bg-red-950 font-bold py-2.5 rounded-xl transition text-sm"
                      >
                        Eliminar
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
        </>)}

        {tab === 'reports' && (
          <div className="space-y-3">
            {reports.length === 0 ? (
              <div className="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-8 text-center text-zinc-500">
                No hay reportes.
              </div>
            ) : (
              reports.map(r => (
                <div key={r.id} className={`bg-zinc-900/80 border rounded-2xl p-4 space-y-3 ${r.status === 'pending' ? 'border-red-900/50' : 'border-zinc-800'}`}>
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-bold">{r.profileName}</span>
                      <span className={`ml-2 text-xs px-2 py-0.5 rounded-full ${
                        r.status === 'pending' ? 'bg-red-950 text-red-400' :
                        r.status === 'reviewed' ? 'bg-emerald-950 text-emerald-400' :
                        'bg-zinc-800 text-zinc-500'
                      }`}>
                        {r.status === 'pending' ? 'Pendiente' : r.status === 'reviewed' ? 'Revisado' : 'Descartado'}
                      </span>
                    </div>
                    {r.createdAt && <span className="text-xs text-zinc-500">{new Date(r.createdAt.seconds * 1000).toLocaleDateString('es-ES')}</span>}
                  </div>
                  <p className="text-sm text-zinc-300 bg-zinc-950 p-3 rounded-xl border border-zinc-800/50">{r.reason}</p>
                  <div className="text-xs text-zinc-500">Profile ID: {r.profileId}</div>
                  <div className="flex gap-2">
                    {r.status === 'pending' && (
                      <>
                        <button onClick={() => updateReportStatus(r, 'reviewed')} className="flex-1 bg-emerald-950/50 text-emerald-400 border border-emerald-900/50 hover:bg-emerald-950 font-bold py-2 rounded-xl text-sm transition">
                          Marcar revisado
                        </button>
                        <button onClick={() => updateReportStatus(r, 'dismissed')} className="flex-1 bg-zinc-800 text-zinc-400 hover:bg-zinc-700 font-bold py-2 rounded-xl text-sm transition">
                          Descartar
                        </button>
                      </>
                    )}
                    <button onClick={() => deleteReport(r)} className="flex-1 bg-red-950/50 text-red-400 border border-red-900/50 hover:bg-red-950 font-bold py-2 rounded-xl text-sm transition">
                      Eliminar
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}
