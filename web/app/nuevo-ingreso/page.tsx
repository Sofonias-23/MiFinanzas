'use client';

import { FormEvent, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import type { User } from '@supabase/supabase-js';

import { supabase } from '@/lib/supabase';

function parseAmount(value: string) {
  return Number(value.replace(',', '.'));
}

export default function NuevoIngresoPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [displayName, setDisplayName] = useState('Usuario');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
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

    void load();

    return () => {
      active = false;
    };
  }, [router]);

  const numericAmount = useMemo(() => parseAmount(amount), [amount]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage('');

    if (!user) {
      router.replace('/login');
      return;
    }

    if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
      setErrorMessage('Ingresa un monto mayor a cero.');
      return;
    }

    if (!description.trim()) {
      setErrorMessage('Escribe de dónde proviene este ingreso.');
      return;
    }

    setSaving(true);

    const { error } = await supabase.from('incomes').insert({
      created_by: user.id,
      description: description.trim(),
      amount: Math.round(numericAmount * 100) / 100,
    });

    setSaving(false);

    if (error) {
      setErrorMessage(error.message || 'No se pudo guardar el ingreso.');
      return;
    }

    router.replace('/dashboard?created=income');
    router.refresh();
  }

  if (loading || !user) {
    return (
      <main className="dashboardLoading">
        <p>Cargando formulario...</p>
      </main>
    );
  }

  return (
    <main className="incomePage">
      <header className="expenseTopbar">
        <a className="brand" href="/dashboard">
          <span className="brandMark" aria-hidden="true">
            <span className="brandDollar">$</span>
          </span>
          <span>MiFinanzas</span>
        </a>
        <a className="expenseBack" href="/dashboard">← Volver a Mi dinero</a>
      </header>

      <section className="incomeLayout">
        <div className="incomeIntro">
          <p className="eyebrow">MI DINERO · NUEVO INGRESO</p>
          <h1>Registrar ingreso</h1>
          <p>
            Registra dinero que entra a tu cuenta personal. Se sincronizará con la app móvil.
          </p>

          <div className="incomeUserCard">
            <span className="incomeUserIcon">↑</span>
            <div>
              <b>{displayName}</b>
              <p>Ingreso personal</p>
            </div>
          </div>
        </div>

        <form className="incomeForm" onSubmit={handleSubmit}>
          <div className="expenseStep">
            <span className="expenseStepNumber incomeStepNumber">1</span>
            <label>
              <span>¿Cuánto ingresó?</span>
              <div className="expenseAmountInput incomeAmountInput">
                <span>S/</span>
                <input
                  type="text"
                  inputMode="decimal"
                  placeholder="0.00"
                  value={amount}
                  onChange={(event) => setAmount(event.target.value)}
                  autoFocus
                  required
                />
              </div>
            </label>
          </div>

          <div className="expenseStep">
            <span className="expenseStepNumber incomeStepNumber">2</span>
            <label>
              <span>¿De dónde proviene?</span>
              <input
                className="expenseTextInput"
                type="text"
                placeholder="Ej. Sueldo, transferencia, venta..."
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                maxLength={120}
                required
              />
            </label>
          </div>

          <div className="incomePreview">
            <span>Ingreso a registrar</span>
            <strong>
              {Number.isFinite(numericAmount) && numericAmount > 0
                ? '+ S/ ' + numericAmount.toFixed(2)
                : '+ S/ 0.00'}
            </strong>
            <small>{description.trim() || 'Sin descripción todavía'}</small>
          </div>

          {errorMessage ? <p className="formError expenseError">{errorMessage}</p> : null}

          <button className="primaryButton incomeSaveButton" type="submit" disabled={saving}>
            {saving ? 'Guardando...' : 'Guardar ingreso'}
          </button>
        </form>
      </section>
    </main>
  );
}
