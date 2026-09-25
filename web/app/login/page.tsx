'use client';

import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';

import { supabase } from '@/lib/supabase';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage('');
    setLoading(true);

    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });

    setLoading(false);

    if (error) {
      setErrorMessage('No se pudo iniciar sesión. Revisa tu correo y contraseña.');
      return;
    }

    router.replace('/espacio');
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
        <p className="eyebrow">BIENVENIDO</p>
        <h1>Iniciar sesión</h1>
        <p className="authIntro">
          Usa la misma cuenta de MiFinanzas que utilizas en la app.
        </p>

        <form onSubmit={handleSubmit}>
          <label>
            Correo
            <input
              type="email"
              placeholder="correo@ejemplo.com"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              autoComplete="email"
              required
            />
          </label>

          <label>
            <span className="authLabelRow">
              <span>Contraseña</span>
              <a className="secondaryLink" href="/forgot-password">
                ¿Olvidaste tu contraseña?
              </a>
            </span>
            <input
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              autoComplete="current-password"
              minLength={6}
              required
            />
          </label>

          {errorMessage ? <p className="formError">{errorMessage}</p> : null}

          <button className="primaryButton authSubmit authButton" type="submit" disabled={loading}>
            {loading ? 'Ingresando...' : 'Ingresar'}
          </button>
        </form>

        <p className="authFoot">
          La web y la app móvil usan la misma cuenta y los mismos datos de Supabase.
        </p>
      </section>
    </main>
  );
}
