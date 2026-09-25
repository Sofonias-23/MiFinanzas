'use client';

import { FormEvent, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import type { User } from '@supabase/supabase-js';

import { supabase } from '@/lib/supabase';

type Preferences = {
  display_name: string | null;
  currency: string;
  budget_alerts_enabled: boolean;
  partner_activity_enabled: boolean;
};

export default function AjustesPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [preferences, setPreferences] = useState<Preferences | null>(null);
  const [name, setName] = useState('');
  const [savingName, setSavingName] = useState(false);
  const [savingPreference, setSavingPreference] = useState(false);
  const [message, setMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    let active = true;

    async function load() {
      const { data: sessionData } = await supabase.auth.getSession();
      const currentUser = sessionData.session?.user ?? null;

      if (!currentUser) {
        router.replace('/login');
        return;
      }

      const { data, error } = await supabase
        .from('profiles')
        .select('display_name, currency, budget_alerts_enabled, partner_activity_enabled')
        .eq('id', currentUser.id)
        .single();

      if (!active) return;

      if (error) {
        setErrorMessage(error.message);
        return;
      }

      const next = data as Preferences;
      setUser(currentUser);
      setPreferences(next);
      setName(
        next.display_name ||
        currentUser.user_metadata?.display_name ||
        currentUser.email?.split('@')[0] ||
        '',
      );
    }

    void load();
    return () => { active = false; };
  }, [router]);

  async function saveName(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!user || !preferences) return;

    const clean = name.trim();
    setMessage('');
    setErrorMessage('');

    if (clean.length < 2) {
      setErrorMessage('Escribe al menos 2 caracteres.');
      return;
    }

    setSavingName(true);

    const { error: profileError } = await supabase
      .from('profiles')
      .update({ display_name: clean })
      .eq('id', user.id);

    if (profileError) {
      setSavingName(false);
      setErrorMessage(profileError.message);
      return;
    }

    const { error: authError } = await supabase.auth.updateUser({
      data: { display_name: clean },
    });

    setSavingName(false);

    if (authError) {
      setErrorMessage(authError.message);
      return;
    }

    setPreferences({ ...preferences, display_name: clean });
    setMessage('Nombre actualizado correctamente.');
  }

  async function updateToggle(
    field: 'budget_alerts_enabled' | 'partner_activity_enabled',
    value: boolean,
  ) {
    if (!user || !preferences || savingPreference) return;

    const previous = preferences[field];
    setPreferences({ ...preferences, [field]: value });
    setSavingPreference(true);
    setMessage('');
    setErrorMessage('');

    const { error } = await supabase
      .from('profiles')
      .update({ [field]: value })
      .eq('id', user.id);

    setSavingPreference(false);

    if (error) {
      setPreferences({ ...preferences, [field]: previous });
      setErrorMessage(error.message);
      return;
    }

    setMessage('Preferencia guardada.');
  }

  if (!user || !preferences) {
    return <main className="dashboardLoading"><p>Cargando preferencias...</p></main>;
  }

  return (
    <main className="settingsPage">
      <header className="expenseTopbar">
        <a className="brand" href="/perfil">
          <span className="brandMark" aria-hidden="true"><span className="brandDollar">$</span></span>
          <span>MiFinanzas</span>
        </a>
        <a className="expenseBack" href="/perfil">← Perfil</a>
      </header>

      <section className="settingsWrap">
        <div className="settingsHeading">
          <p className="eyebrow">TU CUENTA</p>
          <h1>Cuenta y preferencias</h1>
          <p>Configura cómo quieres usar MiFinanzas.</p>
        </div>

        <div className="settingsGrid">
          <section className="settingsCard">
            <p className="eyebrow">MI CUENTA</p>
            <form onSubmit={saveName}>
              <label>
                Nombre visible
                <input value={name} onChange={(event) => setName(event.target.value)} maxLength={40} />
              </label>

              <div className="settingsReadOnly">
                <span>Correo</span>
                <b>{user.email}</b>
              </div>

              <button className="primaryButton settingsSave" type="submit" disabled={savingName}>
                {savingName ? 'Guardando...' : 'Guardar nombre'}
              </button>
            </form>
          </section>

          <section className="settingsCard">
            <p className="eyebrow">MONEDA</p>
            <div className="settingsCurrency">
              <span>🇵🇪</span>
              <div>
                <b>Sol peruano</b>
                <small>{preferences.currency} · Símbolo S/</small>
              </div>
              <i>Predeterminada</i>
            </div>
            <p className="settingsHelper">
              Por ahora MiFinanzas trabaja en soles para mantener los cálculos consistentes.
            </p>
          </section>

          <section className="settingsCard settingsWide">
            <p className="eyebrow">AVISOS</p>

            <label className="settingsToggleRow">
              <div>
                <b>📊 Alertas de presupuesto</b>
                <span>Avisos cuando te acerques o superes un límite.</span>
              </div>
              <input
                type="checkbox"
                checked={preferences.budget_alerts_enabled}
                onChange={(event) => void updateToggle('budget_alerts_enabled', event.target.checked)}
                disabled={savingPreference}
              />
            </label>

            <label className="settingsToggleRow">
              <div>
                <b>👥 Actividad de pareja</b>
                <span>Preferencia para avisos de gastos y pagos compartidos.</span>
              </div>
              <input
                type="checkbox"
                checked={preferences.partner_activity_enabled}
                onChange={(event) => void updateToggle('partner_activity_enabled', event.target.checked)}
                disabled={savingPreference}
              />
            </label>
          </section>

          <section className="settingsPrivacy settingsWide">
            <div>
              <b>🔒 Separación por diseño</b>
              <p>Tus ingresos, gastos personales, deudas privadas y presupuestos personales pertenecen solo a tu cuenta.</p>
            </div>
            <div>
              <b>👥 En Pareja</b>
              <p>Solo se comparte lo que registras expresamente como compartido: gastos, balance, liquidaciones y presupuestos de pareja.</p>
            </div>
          </section>
        </div>

        {message ? <p className="formSuccess settingsMessage">{message}</p> : null}
        {errorMessage ? <p className="formError settingsMessage">{errorMessage}</p> : null}

        <a className="settingsDataLink" href="/datos">Datos y seguridad →</a>
      </section>
    </main>
  );
}
