'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import type { User } from '@supabase/supabase-js';

import { supabase } from '@/lib/supabase';

export default function DatosPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [confirmation, setConfirmation] = useState('');
  const [resetting, setResetting] = useState(false);
  const [sendingPassword, setSendingPassword] = useState(false);
  const [message, setMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    let active = true;

    async function load() {
      const { data } = await supabase.auth.getSession();
      const currentUser = data.session?.user ?? null;

      if (!currentUser) {
        router.replace('/login');
        return;
      }

      if (active) setUser(currentUser);
    }

    void load();
    return () => { active = false; };
  }, [router]);

  async function sendPasswordReset() {
    if (!user?.email) return;

    setSendingPassword(true);
    setMessage('');
    setErrorMessage('');

    const { error } = await supabase.auth.resetPasswordForEmail(user.email, {
      redirectTo: window.location.origin + '/reset-password',
    });

    setSendingPassword(false);

    if (error) {
      setErrorMessage(error.message);
      return;
    }

    setMessage('Te enviamos un enlace para cambiar tu contraseña.');
  }

  async function resetPersonalData() {
    if (!user || confirmation !== 'REINICIAR') return;

    setResetting(true);
    setMessage('');
    setErrorMessage('');

    const { error: budgetError } = await supabase
      .from('budgets')
      .delete()
      .eq('scope', 'personal')
      .eq('user_id', user.id);

    if (budgetError) {
      setResetting(false);
      setErrorMessage(budgetError.message);
      return;
    }

    const { error } = await supabase.rpc('reset_my_finance_data');
    setResetting(false);

    if (error) {
      setErrorMessage(error.message || 'No se pudieron reiniciar tus datos.');
      return;
    }

    setConfirmation('');
    setMessage('Tus datos personales fueron reiniciados. El espacio de pareja se conservó.');
  }

  async function signOut() {
    await supabase.auth.signOut();
    router.replace('/login');
  }

  if (!user) {
    return <main className="dashboardLoading"><p>Cargando seguridad...</p></main>;
  }

  return (
    <main className="dataPage">
      <header className="expenseTopbar">
        <a className="brand" href="/perfil">
          <span className="brandMark" aria-hidden="true"><span className="brandDollar">$</span></span>
          <span>MiFinanzas</span>
        </a>
        <a className="expenseBack" href="/perfil">← Perfil</a>
      </header>

      <section className="dataWrap">
        <div className="dataHeading">
          <p className="eyebrow">PRIVACIDAD Y SEGURIDAD</p>
          <h1>Datos y seguridad</h1>
          <p>Controla tu acceso y qué ocurre con tu información personal.</p>
        </div>

        <div className="dataGrid">
          <section className="dataCard">
            <span className="dataIcon">🔐</span>
            <div>
              <h2>Contraseña</h2>
              <p>Te enviaremos un enlace seguro al correo de tu cuenta.</p>
              <b>{user.email}</b>
            </div>
            <button type="button" onClick={() => void sendPasswordReset()} disabled={sendingPassword}>
              {sendingPassword ? 'Enviando...' : 'Cambiar contraseña'}
            </button>
          </section>

          <section className="dataCard">
            <span className="dataIcon">🔒</span>
            <div>
              <h2>Privacidad</h2>
              <p>Tus gastos personales, ingresos y deudas privadas no se muestran a tu pareja.</p>
              <b>Solo se comparte lo marcado como “Compartido”.</b>
            </div>
          </section>
        </div>

        <section className="dataDanger">
          <p className="eyebrow">ZONA DE DATOS</p>
          <h2>Empezar de cero</h2>
          <p>
            Esto elimina tus gastos personales, ingresos, deudas personales, presupuestos personales,
            categorías y métodos de pago. Los gastos compartidos, liquidaciones, presupuestos de pareja
            y la vinculación con tu pareja se conservan.
          </p>

          <label>
            Escribe <b>REINICIAR</b> para confirmar
            <input
              value={confirmation}
              onChange={(event) => setConfirmation(event.target.value.toUpperCase())}
              placeholder="REINICIAR"
              maxLength={9}
            />
          </label>

          <button
            className="dataResetButton"
            type="button"
            disabled={confirmation !== 'REINICIAR' || resetting}
            onClick={() => void resetPersonalData()}
          >
            {resetting ? 'Reiniciando...' : 'Reiniciar mis datos personales'}
          </button>
        </section>

        {message ? <p className="formSuccess dataMessage">{message}</p> : null}
        {errorMessage ? <p className="formError dataMessage">{errorMessage}</p> : null}

        <button className="dataLogout" type="button" onClick={() => void signOut()}>Cerrar sesión</button>
      </section>
    </main>
  );
}
