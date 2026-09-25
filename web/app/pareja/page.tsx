'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

import { supabase } from '@/lib/supabase';

export default function ParejaPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    async function checkSession() {
      const { data } = await supabase.auth.getSession();
      if (!data.session) {
        router.replace('/login');
        return;
      }
      if (active) setLoading(false);
    }

    void checkSession();
    return () => {
      active = false;
    };
  }, [router]);

  if (loading) {
    return <main className="dashboardLoading"><p>Cargando espacio de pareja...</p></main>;
  }

  return (
    <main className="couplePlaceholder">
      <a className="brand" href="/espacio">
        <span className="brandMark" aria-hidden="true">
          <span className="brandDollar">$</span>
        </span>
        <span>MiFinanzas</span>
      </a>

      <section>
        <p className="eyebrow">ESPACIO PAREJA</p>
        <h1>Gastos compartidos, sin confusiones.</h1>
        <p>
          Ya dejamos listo el acceso al espacio Pareja. En el siguiente punto
          conectaremos aquí los gastos compartidos, quién pagó y el balance entre ambos.
        </p>
        <a className="ghostButton" href="/espacio">← Volver a elegir espacio</a>
      </section>
    </main>
  );
}
