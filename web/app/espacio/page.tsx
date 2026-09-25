'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import type { User } from '@supabase/supabase-js';

import { supabase } from '@/lib/supabase';

export default function EspacioPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [displayName, setDisplayName] = useState('Usuario');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    async function loadUser() {
      const { data } = await supabase.auth.getSession();
      const currentUser = data.session?.user ?? null;

      if (!currentUser) {
        router.replace('/login');
        return;
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('display_name')
        .eq('id', currentUser.id)
        .maybeSingle();

      if (!active) return;

      setUser(currentUser);
      setDisplayName(
        profile?.display_name ||
          currentUser.user_metadata?.display_name ||
          currentUser.email?.split('@')[0] ||
          'Usuario',
      );
      setLoading(false);
    }

    void loadUser();

    return () => {
      active = false;
    };
  }, [router]);

  async function handleLogout() {
    await supabase.auth.signOut();
    router.replace('/login');
  }

  if (loading || !user) {
    return (
      <main className="spaceLoading">
        <div className="brand">
          <span className="brandMark" aria-hidden="true">
            <span className="brandDollar">$</span>
          </span>
          <span>MiFinanzas</span>
        </div>
        <p>Cargando tu espacio...</p>
      </main>
    );
  }

  return (
    <main className="spacePage">
      <div className="spaceBackdrop">
        <div className="spaceGlow spaceGlowBlue" />
        <div className="spaceGlow spaceGlowPink" />
        <div className="spaceMountain spaceMountainLeft" />
        <div className="spaceMountain spaceMountainRight" />
      </div>

      <header className="spaceHeader">
        <a className="brand" href="/">
          <span className="brandMark" aria-hidden="true">
            <span className="brandDollar">$</span>
          </span>
          <span>MiFinanzas</span>
        </a>

        <div className="spaceHeaderActions">
          <span>{displayName}</span>
          <button type="button" onClick={handleLogout}>Cerrar sesión</button>
        </div>
      </header>

      <section className="spaceContent">
        <div className="spaceIntro">
          <p className="eyebrow">BIENVENIDO, {displayName.toUpperCase()}</p>
          <h1>¿Qué quieres ver?</h1>
          <p>
            Tus finanzas personales se mantienen privadas. Los gastos de pareja
            se muestran únicamente en el espacio compartido.
          </p>
        </div>

        <div className="spaceCards">
          <button
            className="spaceChoice spaceChoicePersonal"
            type="button"
            onClick={() => router.push('/dashboard')}
          >
            <span className="spaceChoiceIcon">◉</span>
            <span className="spaceChoiceCopy">
              <small>SOLO PARA MÍ</small>
              <strong>Mi dinero</strong>
              <span>Mis gastos, ingresos, categorías, metas y estadísticas.</span>
            </span>
            <span className="spaceChoiceArrow">→</span>
          </button>

          <button
            className="spaceChoice spaceChoiceCouple"
            type="button"
            onClick={() => router.push('/pareja')}
          >
            <span className="spaceChoiceIcon">♥</span>
            <span className="spaceChoiceCopy">
              <small>ESPACIO COMPARTIDO</small>
              <strong>Pareja</strong>
              <span>Gastos compartidos, balance 50/50 y quién pagó cada cosa.</span>
            </span>
            <span className="spaceChoiceArrow">→</span>
          </button>
        </div>

        <div className="spacePrivacy">
          <span>🔒</span>
          <p>
            Aunque uses el espacio de pareja, tus gastos personales permanecen privados.
          </p>
        </div>
      </section>
    </main>
  );
}
