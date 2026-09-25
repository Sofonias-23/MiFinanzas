'use client';

import { FormEvent, useState } from 'react';

import { supabase } from '@/lib/supabase';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [sent, setSent] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage('');
    setSent(false);
    setLoading(true);

    const redirectTo = `${window.location.origin}/reset-password`;
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo,
    });

    setLoading(false);

    if (error) {
      setErrorMessage('No pudimos enviar el correo de recuperación. Inténtalo nuevamente.');
      return;
    }

    setSent(true);
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
        <p className="eyebrow">RECUPERAR ACCESO</p>
        <h1>Restablece tu contraseña</h1>
        <p className="authIntro">
          Ingresa el correo de tu cuenta MiFinanzas. Te enviaremos un enlace para crear una contraseña nueva.
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

          {errorMessage ? <p className="formError">{errorMessage}</p> : null}
          {sent ? (
            <p className="formSuccess">
              Correo enviado. Revisa tu bandeja de entrada y también la carpeta de spam.
            </p>
          ) : null}

          <button className="primaryButton authSubmit authButton" type="submit" disabled={loading}>
            {loading ? 'Enviando...' : 'Enviar enlace de recuperación'}
          </button>
        </form>

        <div className="authBottomLink">
          <a className="secondaryLink" href="/login">← Volver a iniciar sesión</a>
        </div>
      </section>
    </main>
  );
}
