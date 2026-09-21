'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { signOut } from 'firebase/auth';
import { collection, query, where, getDocs, getDoc, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import { useAuth } from '@/lib/auth';
import Link from 'next/link';

interface Schedule {
  enabled: boolean;
  days: number[]; // 0=Dom, 1=Lun ... 6=Sáb
  startHour: number;
  endHour: number;
}

interface ProfileData {
  docId: string;
  name: string;
  age: number;
  whatsapp: string;
  telegram?: string;
  contactMethod?: 'whatsapp' | 'telegram' | 'both';
  description: string;
  active: boolean;
  photos: string[];
  schedule?: Schedule;
}

const DAY_LABELS = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
const DEFAULT_SCHEDULE: Schedule = { enabled: false, days: [1, 2, 3, 4, 5], startHour: 10, endHour: 22 };

export default function DashboardPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [form, setForm] = useState({ name: '', whatsapp: '', description: '', telegram: '', contactMethod: 'whatsapp' as 'whatsapp' | 'telegram' | 'both' });
  const [saving, setSaving] = useState(false);
  const [toggling, setToggling] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [message, setMessage] = useState('');
  const [newPhotos, setNewPhotos] = useState<File[]>([]);
  const [uploadingPhotos, setUploadingPhotos] = useState(false);
  const [schedule, setSchedule] = useState<Schedule>(DEFAULT_SCHEDULE);
  const [savingSchedule, setSavingSchedule] = useState(false);
  const [favorites, setFavorites] = useState<{ favDocId: string; profileId: string; name: string; age: number; photos: string[]; whatsapp: string; telegram?: string; contactMethod?: string }[]>([]);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.replace('/login');
      return;
    }

    async function fetchProfile() {
      const q = query(collection(db, 'profiles'), where('uid', '==', user!.uid));
      const snap = await getDocs(q);
      if (!snap.empty) {
        const docSnap = snap.docs[0];
        const data = docSnap.data();
        const p: ProfileData = {
          docId: docSnap.id,
          name: data.name,
          age: data.age,
          whatsapp: data.whatsapp,
          telegram: data.telegram || '',
          contactMethod: data.contactMethod || 'whatsapp',
          description: data.description,
          active: data.active !== false,
          photos: data.photos || [],
          schedule: data.schedule || undefined,
        };
        setProfile(p);
        setForm({ name: p.name, whatsapp: p.whatsapp, description: p.description, telegram: p.telegram || '', contactMethod: p.contactMethod || 'whatsapp' });
        if (data.schedule) setSchedule(data.schedule);
      }
      // Load favorites
      const favQ = query(collection(db, 'favorites'), where('uid', '==', user!.uid));
      const favSnap = await getDocs(favQ);
      const favs = [];
      for (const favDoc of favSnap.docs) {
        const profileDoc = await getDoc(doc(db, 'profiles', favDoc.data().profileId));
        if (profileDoc.exists()) {
          const pd = profileDoc.data();
          favs.push({ favDocId: favDoc.id, profileId: profileDoc.id, name: pd.name, age: pd.age, photos: pd.photos || [], whatsapp: pd.whatsapp, telegram: pd.telegram, contactMethod: pd.contactMethod });
        }
      }
      setFavorites(favs);
      setLoadingProfile(false);
    }

    fetchProfile();
  }, [user, authLoading, router]);

  if (authLoading || loadingProfile) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center text-white">
        <span className="animate-pulse">Cargando panel...</span>
      </div>
    );
  }

  if (!user) return null;

  const handleSave = async () => {
    if (!profile) return;
    setSaving(true);
    setMessage('');
    try {
      await updateDoc(doc(db, 'profiles', profile.docId), {
        name: form.name.trim().slice(0, 50),
        whatsapp: form.whatsapp.trim().slice(0, 20),
        description: form.description.trim().slice(0, 500),
        telegram: form.telegram.replace(/[^a-zA-Z0-9_]/g, '').slice(0, 32),
        contactMethod: form.contactMethod,
      });
      setProfile({ ...profile, name: form.name.trim(), whatsapp: form.whatsapp.trim(), description: form.description.trim(), telegram: form.telegram.trim(), contactMethod: form.contactMethod });
      setMessage('Perfil actualizado correctamente.');
    } catch {
      setMessage('Error al guardar. Inténtalo de nuevo.');
    } finally {
      setSaving(false);
    }
  };

  const handleUploadPhotos = async () => {
    if (!profile || newPhotos.length === 0) return;
    if ((profile.photos.length + newPhotos.length) > 3) {
      setMessage('Máximo 3 fotos en total. Elimina alguna primero.');
      return;
    }
    setUploadingPhotos(true);
    setMessage('');
    try {
      const { ref, uploadBytes, getDownloadURL } = await import('firebase/storage');
      const { storage } = await import('@/lib/firebase');
      const urls: string[] = [];
      for (const file of newPhotos) {
        const fileRef = ref(storage, `profiles/${user.uid}/${Date.now()}_${file.name}`);
        const snap = await uploadBytes(fileRef, file);
        urls.push(await getDownloadURL(snap.ref));
      }
      const updatedPhotos = [...profile.photos, ...urls];
      await updateDoc(doc(db, 'profiles', profile.docId), { photos: updatedPhotos });
      setProfile({ ...profile, photos: updatedPhotos });
      setNewPhotos([]);
      setMessage('Fotos subidas correctamente.');
    } catch {
      setMessage('Error al subir fotos.');
    } finally {
      setUploadingPhotos(false);
    }
  };

  const handleRemovePhoto = async (url: string) => {
    if (!profile) return;
    setMessage('');
    try {
      const updatedPhotos = profile.photos.filter(p => p !== url);
      await updateDoc(doc(db, 'profiles', profile.docId), { photos: updatedPhotos });
      setProfile({ ...profile, photos: updatedPhotos });
      setMessage('Foto eliminada.');
    } catch {
      setMessage('Error al eliminar foto.');
    }
  };

  const removeFavorite = async (favDocId: string) => {
    await deleteDoc(doc(db, 'favorites', favDocId));
    setFavorites(prev => prev.filter(f => f.favDocId !== favDocId));
    setMessage('Favorito eliminado.');
  };

  const toggleDay = (day: number) => {
    setSchedule(s => ({
      ...s,
      days: s.days.includes(day) ? s.days.filter(d => d !== day) : [...s.days, day].sort(),
    }));
  };

  const handleSaveSchedule = async () => {
    if (!profile) return;
    setSavingSchedule(true);
    setMessage('');
    try {
      await updateDoc(doc(db, 'profiles', profile.docId), { schedule });
      setProfile({ ...profile, schedule });
      setMessage(schedule.enabled ? 'Horario activado.' : 'Horario desactivado.');
    } catch {
      setMessage('Error al guardar horario.');
    } finally {
      setSavingSchedule(false);
    }
  };

  const handleToggleActive = async () => {
    if (!profile) return;
    setToggling(true);
    try {
      const newActive = !profile.active;
      await updateDoc(doc(db, 'profiles', profile.docId), { active: newActive });
      setProfile({ ...profile, active: newActive });
    } catch {
      setMessage('Error al cambiar visibilidad.');
    } finally {
      setToggling(false);
    }
  };

  const handleDelete = async () => {
    if (!profile) return;
    setDeleting(true);
    try {
      await deleteDoc(doc(db, 'profiles', profile.docId));
      setProfile(null);
      setShowDeleteConfirm(false);
      setMessage('Perfil eliminado permanentemente.');
    } catch {
      setMessage('Error al borrar el perfil.');
    } finally {
      setDeleting(false);
    }
  };

  const handleLogout = async () => {
    await signOut(auth);
    router.push('/');
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-white px-4 py-8 selection:bg-rose-500/30">
      <div className="max-w-xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <Link href="/" className="font-black text-xl tracking-tighter text-white flex items-center gap-2">
            <div className="w-3 h-3 bg-rose-600 rounded-full animate-pulse shadow-[0_0_10px_rgba(225,29,72,0.8)]"></div>
            RADAR<span className="text-rose-600">CITAS</span>
          </Link>
          <button onClick={handleLogout} className="text-sm text-zinc-400 hover:text-white transition">
            Cerrar sesión
          </button>
        </div>

        <h1 className="text-3xl font-extrabold tracking-tight mb-2">Mi Panel</h1>
        <p className="text-zinc-400 mb-4">Gestiona tu perfil y visibilidad en el radar.</p>

        {['cesar.herrera.rojo@gmail.com'].includes(user.email || '') && (
          <Link
            href="/admin"
            className="inline-flex items-center gap-2 bg-zinc-900 border border-zinc-800 text-zinc-300 hover:text-white text-sm font-semibold px-4 py-2 rounded-xl transition mb-6"
          >
            <span className="w-2 h-2 bg-rose-500 rounded-full"></span>
            Panel de Administración
          </Link>
        )}

        {message && (
          <div className="bg-zinc-900 border border-zinc-700 text-zinc-200 text-sm rounded-xl px-4 py-3 mb-6">
            {message}
          </div>
        )}

        {!profile ? (
          <div className="space-y-6">
            <div className="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-8 text-center">
              <p className="text-zinc-400 mb-6">Aún no tienes un perfil publicado en el radar.</p>
              <Link
                href="/register"
                className="inline-block bg-rose-600 hover:bg-rose-500 text-white font-bold py-3 px-8 rounded-xl transition shadow-[0_0_20px_rgba(225,29,72,0.3)]"
              >
                Crear mi perfil
              </Link>
            </div>

            {favorites.length > 0 && (
              <div className="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-5 space-y-4">
                <h3 className="font-bold text-lg">Mis favoritos</h3>
                <div className="space-y-3">
                  {favorites.map(f => (
                    <div key={f.favDocId} className="flex items-center gap-3 bg-zinc-950 rounded-xl p-3 border border-zinc-800/50">
                      {f.photos.length > 0 ? (
                        <img src={f.photos[0]} alt="" className="w-12 h-12 rounded-xl object-cover border border-zinc-700 shrink-0" />
                      ) : (
                        <div className="w-12 h-12 rounded-xl bg-zinc-800 border border-zinc-700 flex items-center justify-center text-zinc-600 text-xs shrink-0">Sin foto</div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm truncate">{f.name}, {f.age}</p>
                        <div className="flex gap-2 mt-1">
                          {(f.contactMethod === 'whatsapp' || f.contactMethod === 'both' || !f.contactMethod) && f.whatsapp && (
                            <a href={`https://wa.me/${f.whatsapp.replace(/[^0-9]/g, '')}`} target="_blank" rel="noopener noreferrer" className="text-xs text-green-400 hover:text-green-300">WhatsApp</a>
                          )}
                          {(f.contactMethod === 'telegram' || f.contactMethod === 'both') && f.telegram && (
                            <a href={`https://t.me/${f.telegram}`} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-400 hover:text-blue-300">Telegram</a>
                          )}
                        </div>
                      </div>
                      <button onClick={() => removeFavorite(f.favDocId)} className="p-2 text-rose-500 hover:text-rose-400 transition shrink-0">
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-6">
            {/* Toggle visibilidad */}
            <div className="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-5 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-lg">Visibilidad en el mapa</h3>
                <p className="text-sm text-zinc-400">
                  {profile.active
                    ? 'Tu perfil es visible para todos los usuarios cercanos.'
                    : 'Tu perfil está oculto. Nadie puede verte en el radar.'}
                </p>
              </div>
              <button
                onClick={handleToggleActive}
                disabled={toggling}
                className={`relative w-14 h-8 rounded-full transition-colors ${
                  profile.active ? 'bg-emerald-600' : 'bg-zinc-700'
                }`}
              >
                <span
                  className={`absolute top-1 left-1 w-6 h-6 bg-white rounded-full transition-transform ${
                    profile.active ? 'translate-x-6' : ''
                  }`}
                />
              </button>
            </div>

            {/* Horario programado */}
            <div className="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-5 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-lg">Horario programado</h3>
                  <p className="text-sm text-zinc-400">
                    {schedule.enabled
                      ? `Visible ${schedule.startHour}:00 - ${schedule.endHour}:00`
                      : 'Tu perfil usa solo el botón manual de arriba.'}
                  </p>
                </div>
                <button
                  onClick={() => setSchedule(s => ({ ...s, enabled: !s.enabled }))}
                  className={`relative w-14 h-8 rounded-full transition-colors ${
                    schedule.enabled ? 'bg-blue-600' : 'bg-zinc-700'
                  }`}
                >
                  <span className={`absolute top-1 left-1 w-6 h-6 bg-white rounded-full transition-transform ${
                    schedule.enabled ? 'translate-x-6' : ''
                  }`} />
                </button>
              </div>

              {schedule.enabled && (
                <>
                  <div>
                    <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">Días activos</label>
                    <div className="flex gap-1.5">
                      {DAY_LABELS.map((label, i) => (
                        <button
                          key={i}
                          type="button"
                          onClick={() => toggleDay(i)}
                          className={`flex-1 py-2 rounded-lg text-xs font-semibold transition ${
                            schedule.days.includes(i)
                              ? 'bg-blue-600 text-white'
                              : 'bg-zinc-800 text-zinc-500 hover:bg-zinc-700'
                          }`}
                        >
                          {label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-zinc-400 mb-1">Desde</label>
                      <select
                        value={schedule.startHour}
                        onChange={e => setSchedule(s => ({ ...s, startHour: Number(e.target.value) }))}
                        className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        {Array.from({ length: 24 }, (_, h) => (
                          <option key={h} value={h}>{String(h).padStart(2, '0')}:00</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-zinc-400 mb-1">Hasta</label>
                      <select
                        value={schedule.endHour}
                        onChange={e => setSchedule(s => ({ ...s, endHour: Number(e.target.value) }))}
                        className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        {Array.from({ length: 24 }, (_, h) => (
                          <option key={h} value={h}>{String(h).padStart(2, '0')}:00</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <p className="text-xs text-zinc-500">
                    {schedule.startHour < schedule.endHour
                      ? `Visible de ${schedule.startHour}:00 a ${schedule.endHour}:00 los días seleccionados.`
                      : schedule.startHour > schedule.endHour
                      ? `Visible de ${schedule.startHour}:00 a ${schedule.endHour}:00 (turno nocturno, cruza medianoche).`
                      : 'La hora de inicio y fin no pueden ser iguales.'}
                  </p>
                </>
              )}

              <button
                onClick={handleSaveSchedule}
                disabled={savingSchedule || (schedule.enabled && schedule.startHour === schedule.endHour)}
                className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-bold py-3 rounded-xl transition"
              >
                {savingSchedule ? 'Guardando...' : 'Guardar horario'}
              </button>
            </div>

            {/* Formulario de edición */}
            <div className="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-5 space-y-4">
              <h3 className="font-bold text-lg">Editar perfil</h3>

              <div>
                <label className="block text-sm font-semibold text-zinc-300 mb-1">Nombre o Alias</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={e => setForm({ ...form, name: e.target.value })}
                  maxLength={50}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-rose-500 transition"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-zinc-300 mb-2">Método de contacto</label>
                <div className="flex gap-2">
                  {([['whatsapp', 'WhatsApp'], ['telegram', 'Telegram'], ['both', 'Ambos']] as const).map(([val, label]) => (
                    <button
                      key={val}
                      type="button"
                      onClick={() => setForm({ ...form, contactMethod: val })}
                      className={`flex-1 py-2 rounded-xl text-xs font-semibold border transition ${
                        form.contactMethod === val
                          ? 'bg-rose-600 border-rose-500 text-white'
                          : 'bg-zinc-800 border-zinc-700 text-zinc-400 hover:border-zinc-500'
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              {(form.contactMethod === 'whatsapp' || form.contactMethod === 'both') && (
                <div>
                  <label className="block text-sm font-semibold text-zinc-300 mb-1">WhatsApp</label>
                  <input
                    type="tel"
                    value={form.whatsapp}
                    onChange={e => setForm({ ...form, whatsapp: e.target.value })}
                    maxLength={20}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-rose-500 transition"
                  />
                </div>
              )}

              {(form.contactMethod === 'telegram' || form.contactMethod === 'both') && (
                <div>
                  <label className="block text-sm font-semibold text-zinc-300 mb-1">Telegram (usuario sin @)</label>
                  <input
                    type="text"
                    value={form.telegram}
                    onChange={e => setForm({ ...form, telegram: e.target.value })}
                    maxLength={32}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-rose-500 transition"
                    placeholder="tu_usuario"
                  />
                </div>
              )}

              <div>
                <label className="block text-sm font-semibold text-zinc-300 mb-1">Descripción</label>
                <textarea
                  rows={3}
                  value={form.description}
                  onChange={e => setForm({ ...form, description: e.target.value })}
                  maxLength={500}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-rose-500 transition resize-none"
                />
              </div>

              <div className="text-sm text-zinc-500">
                Edad: {profile.age} &middot; La ubicación y la edad no se pueden modificar.
              </div>

              <button
                onClick={handleSave}
                disabled={saving}
                className="w-full bg-rose-600 hover:bg-rose-500 disabled:opacity-50 text-white font-bold py-3 rounded-xl transition"
              >
                {saving ? 'Guardando...' : 'Guardar cambios'}
              </button>
            </div>

            {/* Fotos */}
            <div className="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-5 space-y-4">
              <h3 className="font-bold text-lg">Mis fotos</h3>

              {profile.photos.length > 0 ? (
                <div className="flex gap-3 overflow-x-auto pb-2">
                  {profile.photos.map((url, i) => (
                    <div key={i} className="relative shrink-0">
                      <img src={url} alt={`Foto ${i + 1}`} className="h-32 w-28 object-cover rounded-xl border border-zinc-800" />
                      <button
                        onClick={() => handleRemovePhoto(url)}
                        className="absolute -top-2 -right-2 w-6 h-6 bg-red-600 hover:bg-red-500 text-white rounded-full text-xs flex items-center justify-center transition"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-zinc-500">No tienes fotos publicadas.</p>
              )}

              {profile.photos.length < 3 && (
                <div className="space-y-3">
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={e => {
                      if (e.target.files) setNewPhotos(Array.from(e.target.files).slice(0, 3 - profile.photos.length));
                    }}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-sm focus:outline-none file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-rose-600/10 file:text-rose-500 hover:file:bg-rose-600/20 transition"
                  />
                  {newPhotos.length > 0 && (
                    <button
                      onClick={handleUploadPhotos}
                      disabled={uploadingPhotos}
                      className="w-full bg-rose-600 hover:bg-rose-500 disabled:opacity-50 text-white font-bold py-3 rounded-xl transition"
                    >
                      {uploadingPhotos ? 'Subiendo...' : `Subir ${newPhotos.length} foto(s)`}
                    </button>
                  )}
                </div>
              )}

              <p className="text-xs text-zinc-500">{profile.photos.length}/3 fotos</p>
            </div>

            {/* Favoritos */}
            <div className="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-5 space-y-4">
              <h3 className="font-bold text-lg">Mis favoritos</h3>
              {favorites.length === 0 ? (
                <p className="text-sm text-zinc-500">No tienes favoritos. Toca el corazón en un perfil del radar para guardarlo.</p>
              ) : (
                <div className="space-y-3">
                  {favorites.map(f => (
                    <div key={f.favDocId} className="flex items-center gap-3 bg-zinc-950 rounded-xl p-3 border border-zinc-800/50">
                      {f.photos.length > 0 ? (
                        <img src={f.photos[0]} alt="" className="w-12 h-12 rounded-xl object-cover border border-zinc-700 shrink-0" />
                      ) : (
                        <div className="w-12 h-12 rounded-xl bg-zinc-800 border border-zinc-700 flex items-center justify-center text-zinc-600 text-xs shrink-0">Sin foto</div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm truncate">{f.name}, {f.age}</p>
                        <div className="flex gap-2 mt-1">
                          {(f.contactMethod === 'whatsapp' || f.contactMethod === 'both' || !f.contactMethod) && f.whatsapp && (
                            <a href={`https://wa.me/${f.whatsapp.replace(/[^0-9]/g, '')}`} target="_blank" rel="noopener noreferrer" className="text-xs text-green-400 hover:text-green-300">WhatsApp</a>
                          )}
                          {(f.contactMethod === 'telegram' || f.contactMethod === 'both') && f.telegram && (
                            <a href={`https://t.me/${f.telegram}`} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-400 hover:text-blue-300">Telegram</a>
                          )}
                        </div>
                      </div>
                      <button
                        onClick={() => removeFavorite(f.favDocId)}
                        className="p-2 text-rose-500 hover:text-rose-400 transition shrink-0"
                      >
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Zona peligrosa */}
            <div className="bg-zinc-900/80 border border-red-900/50 rounded-2xl p-5">
              <h3 className="font-bold text-lg text-red-400 mb-2">Zona peligrosa</h3>
              {!showDeleteConfirm ? (
                <button
                  onClick={() => setShowDeleteConfirm(true)}
                  className="w-full bg-red-950/50 hover:bg-red-950 text-red-400 font-bold py-3 rounded-xl border border-red-900/50 transition"
                >
                  Eliminar mi perfil permanentemente
                </button>
              ) : (
                <div className="space-y-3">
                  <p className="text-sm text-red-300">
                    Esta acción es irreversible. Tu perfil desaparecerá del mapa y se borrarán todos tus datos.
                  </p>
                  <div className="flex gap-3">
                    <button
                      onClick={handleDelete}
                      disabled={deleting}
                      className="flex-1 bg-red-600 hover:bg-red-500 text-white font-bold py-3 rounded-xl transition"
                    >
                      {deleting ? 'Borrando...' : 'Sí, borrar todo'}
                    </button>
                    <button
                      onClick={() => setShowDeleteConfirm(false)}
                      className="flex-1 bg-zinc-800 text-zinc-300 font-bold py-3 rounded-xl transition hover:bg-zinc-700"
                    >
                      Cancelar
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
