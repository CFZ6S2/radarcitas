'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { signOut } from 'firebase/auth';
import { collection, query, where, getDocs, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import { useAuth } from '@/lib/auth';
import Link from 'next/link';

interface ProfileData {
  docId: string;
  name: string;
  age: number;
  whatsapp: string;
  description: string;
  active: boolean;
}

export default function DashboardPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [form, setForm] = useState({ name: '', whatsapp: '', description: '' });
  const [saving, setSaving] = useState(false);
  const [toggling, setToggling] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [message, setMessage] = useState('');

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
          description: data.description,
          active: data.active !== false,
        };
        setProfile(p);
        setForm({ name: p.name, whatsapp: p.whatsapp, description: p.description });
      }
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
      });
      setProfile({ ...profile, name: form.name.trim(), whatsapp: form.whatsapp.trim(), description: form.description.trim() });
      setMessage('Perfil actualizado correctamente.');
    } catch {
      setMessage('Error al guardar. Inténtalo de nuevo.');
    } finally {
      setSaving(false);
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
        <p className="text-zinc-400 mb-8">Gestiona tu perfil y visibilidad en el radar.</p>

        {message && (
          <div className="bg-zinc-900 border border-zinc-700 text-zinc-200 text-sm rounded-xl px-4 py-3 mb-6">
            {message}
          </div>
        )}

        {!profile ? (
          <div className="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-8 text-center">
            <p className="text-zinc-400 mb-6">Aún no tienes un perfil publicado en el radar.</p>
            <Link
              href="/register"
              className="inline-block bg-rose-600 hover:bg-rose-500 text-white font-bold py-3 px-8 rounded-xl transition shadow-[0_0_20px_rgba(225,29,72,0.3)]"
            >
              Crear mi perfil
            </Link>
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
                <label className="block text-sm font-semibold text-zinc-300 mb-1">WhatsApp</label>
                <input
                  type="tel"
                  value={form.whatsapp}
                  onChange={e => setForm({ ...form, whatsapp: e.target.value })}
                  maxLength={20}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-rose-500 transition"
                />
              </div>

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
