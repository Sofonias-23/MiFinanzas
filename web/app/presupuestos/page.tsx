'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

export default function Page() {
  const router = useRouter();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let active = true;
    async function check() {
      const { data } = await supabase.auth.getSession();
      if (!data.session) {
        router.replace('/login');
        return;
      }
      if (active) setReady(true);
    }
    void check();
    return () => { active = false; };
  }, [router]);

  if (!ready) return <main className="dashboardLoading"><p>Cargando...</p></main>;

  return (
    <main className="featurePlaceholder">
      <a className="brand" href="/espacio">
        <span className="brandMark" aria-hidden="true"><span className="brandDollar">$</span></span>
        <span>MiFinanzas</span>
      </a>
      <section>
        <p className="eyebrow">MI DINERO</p>
        <h1>Presupuestos</h1>
        <p>Aquí podrás configurar y revisar tus presupuestos mensuales por categoría.</p>
        <a className="ghostButton" href="/dashboard">← Volver a Mi dinero</a>
      </section>
    </main>
  );
}
