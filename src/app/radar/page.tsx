'use client';

import dynamic from 'next/dynamic';

const RadarMap = dynamic(() => import('@/components/RadarMap'), { 
  ssr: false,
  loading: () => <p className="text-center p-10 flex h-screen items-center justify-center bg-zinc-950 text-white">Iniciando radar interactivo...</p>
});

export default function RadarPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-between bg-zinc-950">
      <div className="w-full h-screen">
        <RadarMap />
      </div>
    </main>
  );
}
