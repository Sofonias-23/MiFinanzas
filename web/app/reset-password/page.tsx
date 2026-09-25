'use client';

import { FormEvent, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

import { supabase } from '@/lib/supabase';

export default function ResetPasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);
  const [hasRecoverySession, setHasRecoverySession] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    let mounted = true;

    async function checkSession() {
      const { data } = await supabase.auth.getSession();
      if (!mounted) return;
      setHasRecoverySession(Boolean(data.session));
      setCheckingSession(false);
    }

    void checkSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!mounted) return;
      if (session) setHasRecoverySession(true);
      setCheckingSession(false);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    if (password.length < 6) {
      setErrorMessage('La contraseña debe tener al menos 6 caracteres.');
      return;
    }

    if (password !== confirmPassword) {
      setErrorMessage('Las contraseñas no coinciden.');
      return;
    }

    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);

    if (error) {
      setErrorMessage('No se pudo actualizar la contraseña. Solicita un nuevo enlace de recuperación.');
      return;
    }

    setSuccessMessage('Contraseña actualizada correctamente. Ya puedes iniciar sesión.');
    window.setTimeout(() => router.replace('/login'), 1200);
  }

  return (
    <main className="authPage">
      <a className="brand authBrand" href="/">
        <span className="brandMark" aria-hidden="true">
          <span className="brandDollar">$</span>
        </span>
        <span>MiFinanzas</span>
      </a>

      <section className="authCard">
        <p className="eyebrow">NUEVA CONTRASEÑA</p>
        <h1>Crea una contraseña nueva</h1>
        <p className="authIntro">
          Este cambio se aplicará a la misma cuenta que usas en la app y en la web.
        </p>

        {checkingSession ? <p className="authIntro">Validando enlace...</p> : null}

        {!checkingSession && !hasRecoverySession ? (
          <div className="recoveryWarning">
            <p>El enlace no es válido o ya expiró.</p>
            <a className="secondaryLink" href="/forgot-password">Solicitar un nuevo enlace</a>
          </div>
        ) : null}

        {hasRecoverySession ? (
          <form onSubmit={handleSubmit}>
            <label>
              Nueva contraseña
              <input
                type="password"
                placeholder="Mínimo 6 caracteres"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                autoComplete="new-password"
                minLength={6}
                required
              />
            </label>

            <label>
              Repite la contraseña
              <input
                type="password"
                placeholder="Repite tu nueva contraseña"
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                autoComplete="new-password"
                minLength={6}
                required
              />
            </label>

            {errorMessage ? <p className="formError">{errorMessage}</p> : null}
            {successMessage ? <p className="formSuccess">{successMessage}</p> : null}

            <button className="primaryButton authSubmit authButton" type="submit" disabled={loading}>
              {loading ? 'Actualizando...' : 'Guardar nueva contraseña'}
            </button>
          </form>
        ) : null}
      </section>
    </main>
  );
}
