'use client';

import { useState, useEffect } from 'react';
import { GoogleAuthProvider, signInWithPopup, RecaptchaVerifier, signInWithPhoneNumber, type ConfirmationResult } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { useAuth } from '@/lib/auth';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

declare global {
  interface Window {
    recaptchaVerifier?: RecaptchaVerifier;
  }
}

export default function LoginPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [confirmation, setConfirmation] = useState<ConfirmationResult | null>(null);
  const [sending, setSending] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!loading && user) {
      router.replace('/dashboard');
    }
  }, [loading, user, router]);

  if (loading || user) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center text-white">
        <span className="animate-pulse">Cargando...</span>
      </div>
    );
  }

  const handleGoogle = async () => {
    setError('');
    try {
      await signInWithPopup(auth, new GoogleAuthProvider());
      router.push('/dashboard');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error al iniciar sesión con Google';
      setError(msg);
    }
  };

  const handleSendCode = async () => {
    setError('');
    if (!phone.trim()) return;
    setSending(true);
    try {
      if (!window.recaptchaVerifier) {
        window.recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', { size: 'invisible' });
      }
      const result = await signInWithPhoneNumber(auth, phone.trim(), window.recaptchaVerifier);
      setConfirmation(result);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error al enviar el código SMS';
      setError(msg);
      if (window.recaptchaVerifier) {
        window.recaptchaVerifier.clear();
        window.recaptchaVerifier = undefined;
      }
    } finally {
      setSending(false);
    }
  };

  const handleVerifyCode = async () => {
    setError('');
    if (!confirmation || !code.trim()) return;
    setVerifying(true);
    try {
      await confirmation.confirm(code.trim());
      router.push('/dashboard');
    } catch {
      setError('Código incorrecto. Inténtalo de nuevo.');
    } finally {
      setVerifying(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-white flex flex-col justify-center items-center px-4 py-12 selection:bg-rose-500/30">
      <div className="max-w-md w-full bg-zinc-900/80 border border-zinc-800 rounded-[2rem] p-6 sm:p-10 shadow-2xl backdrop-blur-sm">
        <div className="mb-8 text-center">
          <Link href="/" className="text-sm font-semibold text-zinc-400 hover:text-white transition flex items-center justify-center gap-2 mb-4">
            <span>&larr;</span> Volver al inicio
          </Link>
          <h1 className="text-3xl font-extrabold tracking-tight mb-2">Iniciar Sesión</h1>
          <p className="text-zinc-400">Accede para gestionar tu perfil en el radar.</p>
        </div>

        {error && (
          <div className="bg-red-950/40 border border-red-900 text-red-400 text-sm rounded-xl px-4 py-3 mb-6">
            {error}
          </div>
        )}

        {/* Google Login */}
        <button
          onClick={handleGoogle}
          className="w-full flex items-center justify-center gap-3 bg-white text-zinc-900 font-bold py-3.5 rounded-xl hover:bg-zinc-100 transition mb-6 shadow-sm"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
          Continuar con Google
        </button>

        <div className="flex items-center gap-3 mb-6">
          <div className="flex-1 h-px bg-zinc-800"></div>
          <span className="text-xs text-zinc-500 uppercase font-semibold">o con teléfono</span>
          <div className="flex-1 h-px bg-zinc-800"></div>
        </div>

        {/* Phone Login */}
        {!confirmation ? (
          <div className="space-y-3">
            <input
              type="tel"
              value={phone}
              onChange={e => setPhone(e.target.value)}
              placeholder="+34 600 123 456"
              className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-rose-500 transition"
            />
            <button
              onClick={handleSendCode}
              disabled={sending || !phone.trim()}
              className="w-full bg-rose-600 hover:bg-rose-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-3.5 rounded-xl transition shadow-[0_0_20px_rgba(225,29,72,0.3)]"
            >
              {sending ? 'Enviando...' : 'Enviar código SMS'}
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-sm text-zinc-400 text-center">Código enviado a <strong className="text-white">{phone}</strong></p>
            <input
              type="text"
              value={code}
              onChange={e => setCode(e.target.value)}
              placeholder="Código de 6 dígitos"
              maxLength={6}
              className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-center text-2xl tracking-[0.5em] focus:outline-none focus:ring-2 focus:ring-rose-500 transition"
            />
            <button
              onClick={handleVerifyCode}
              disabled={verifying || code.length < 6}
              className="w-full bg-rose-600 hover:bg-rose-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-3.5 rounded-xl transition shadow-[0_0_20px_rgba(225,29,72,0.3)]"
            >
              {verifying ? 'Verificando...' : 'Verificar código'}
            </button>
            <button
              onClick={() => { setConfirmation(null); setCode(''); }}
              className="w-full text-sm text-zinc-500 hover:text-zinc-300 transition"
            >
              Cambiar número
            </button>
          </div>
        )}

        <div id="recaptcha-container"></div>
      </div>
    </div>
  );
}
