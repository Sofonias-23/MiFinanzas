'use client';

import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';

import { supabase } from '@/lib/supabase';
import { trackEvent } from '@/lib/analytics';

type AuthMode = 'login' | 'register';

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<AuthMode>('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  function changeMode(nextMode: AuthMode) {
    setMode(nextMode);
    setErrorMessage('');
    setSuccessMessage('');
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    const cleanEmail = email.trim().toLowerCase();

    if (!cleanEmail.includes('@')) {
      setErrorMessage('Escribe un correo válido.');
      return;
    }

    if (mode === 'register') {
    if (password.length < 6) {
      setErrorMessage('La contraseña debe tener al menos 6 caracteres.');
      return;
    }

    if (!/[A-Z]/.test(password)) {
      setErrorMessage('La contraseña debe incluir al menos una letra mayúscula.');
      return;
    }

    if (!/[^A-Za-z0-9]/.test(password)) {
      setErrorMessage('La contraseña debe incluir al menos un carácter especial, por ejemplo: ! @ # $ %.');
      return;
    }
    }

    if (mode === 'register' && name.trim().length < 2) {
      setErrorMessage('Escribe tu nombre.');
      return;
    }

    setLoading(true);

    if (mode === 'login') {
      const { error } = await supabase.auth.signInWithPassword({
        email: cleanEmail,
        password,
      });

      setLoading(false);

      if (error) {
        setErrorMessage('No se pudo iniciar sesión. Revisa tu correo y contraseña.');
        return;
      }

      trackEvent('login', { method: 'email' });
      router.replace('/espacio');
      return;
    }

    const { data, error } = await supabase.auth.signUp({
      email: cleanEmail,
      password,
      options: {
        data: {
          display_name: name.trim(),
        },
        emailRedirectTo:
          typeof window !== 'undefined'
            ? `${window.location.origin}/login`
            : 'https://sfiq.app/login',
      },
    });

    setLoading(false);

    if (error) {
      setErrorMessage(
        error.message.toLowerCase().includes('already')
          ? 'Este correo ya está registrado. Prueba iniciar sesión.'
          : 'No se pudo crear la cuenta. Revisa los datos e inténtalo nuevamente.',
      );
      return;
    }

    trackEvent('sign_up', { method: 'email' });

    if (data.session) {
      router.replace('/espacio');
      return;
    }

    setSuccessMessage(
      'Cuenta creada. Revisa tu correo para confirmar la cuenta y luego inicia sesión.',
    );
    setPassword('');
    setMode('login');
  }

  return (
    <main className="authPage">
      <a className="brand authBrand" href="/">
        <span className="brandMark" aria-hidden="true">
          <span className="brandDollar">$</span>
        </span>
        <span>SFIQ</span>
      </a>

      <section className="authCard">
        <p className="eyebrow">{mode === 'login' ? 'BIENVENIDO' : 'EMPIEZA EN SFIQ'}</p>
        <h1>{mode === 'login' ? 'Iniciar sesión' : 'Crear cuenta'}</h1>
        <p className="authIntro">
          {mode === 'login'
            ? 'Usa la misma cuenta de SFIQ que utilizas en la app.'
            : 'Crea una cuenta y usa los mismos datos tanto en la web como en la app móvil.'}
        </p>

        <div className="authModeSwitch" role="tablist" aria-label="Acceso a SFIQ">
          <button
            type="button"
            className={mode === 'login' ? 'authModeButton active' : 'authModeButton'}
            onClick={() => changeMode('login')}
          >
            Ingresar
          </button>
          <button
            type="button"
            className={mode === 'register' ? 'authModeButton active' : 'authModeButton'}
            onClick={() => changeMode('register')}
          >
            Crear cuenta
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          {mode === 'register' ? (
            <label>
              Nombre
              <input
                type="text"
                placeholder="Tu nombre"
                value={name}
                onChange={(event) => setName(event.target.value)}
                autoComplete="name"
                maxLength={40}
                required
              />
            </label>
          ) : null}

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
              {mode === 'login' ? (
                <a className="secondaryLink" href="/forgot-password">
                  ¿Olvidaste tu contraseña?
                </a>
              ) : null}
            </span>
            <input
              type="password"
              placeholder={mode === 'register' ? '6+ caracteres, mayúscula y símbolo' : '••••••••'}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              autoComplete={mode === 'register' ? 'new-password' : 'current-password'}
              minLength={6}
              pattern={mode === 'register' ? '(?=.*[A-Z])(?=.*[^A-Za-z0-9]).{6,}' : undefined}
              title={mode === 'register' ? 'Mínimo 6 caracteres, una mayúscula y un carácter especial.' : undefined}
              required
            />
          </label>

          {mode === 'register' ? (
            <p className="authPasswordHint">
              Usa mínimo 6 caracteres, al menos una letra mayúscula y un carácter especial.
            </p>
          ) : null}

          {errorMessage ? <p className="formError">{errorMessage}</p> : null}
          {successMessage ? <p className="formSuccess">{successMessage}</p> : null}

          <button className="primaryButton authSubmit authButton" type="submit" disabled={loading}>
            {loading
              ? 'Procesando...'
              : mode === 'login'
                ? 'Ingresar'
                : 'Crear cuenta'}
          </button>
        </form>

        <p className="authFoot">
          Al crear una cuenta aceptas los <a className="secondaryLink" href="/terminos">Términos</a> y la{' '}
          <a className="secondaryLink" href="/privacidad">Política de privacidad</a>. La web y la app móvil
          usan la misma cuenta y los mismos datos de Supabase.
        </p>
      </section>
    </main>
  );
}
