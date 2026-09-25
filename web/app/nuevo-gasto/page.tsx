'use client';

import { FormEvent, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import type { User } from '@supabase/supabase-js';

import { supabase } from '@/lib/supabase';

type CategoryRow = {
  id: string;
  slug: string;
  name: string;
  icon: string;
};

type PaymentRow = {
  id: string;
  slug: string;
  name: string;
  icon: string;
};

function parseAmount(value: string) {
  return Number(value.replace(',', '.'));
}

export default function NuevoGastoPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [displayName, setDisplayName] = useState('Tú');
  const [categories, setCategories] = useState<CategoryRow[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<PaymentRow[]>([]);
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('');
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

      const [profileResult, categoryResult, paymentResult] = await Promise.all([
        supabase
          .from('profiles')
          .select('display_name')
          .eq('id', currentUser.id)
          .maybeSingle(),
        supabase
          .from('expense_categories')
          .select('id, slug, name, icon')
          .order('created_at', { ascending: true }),
        supabase
          .from('payment_methods')
          .select('id, slug, name, icon')
          .order('created_at', { ascending: true }),
      ]);

      if (!active) return;

      const loadedCategories = (categoryResult.data ?? []) as CategoryRow[];
      const loadedPayments = (paymentResult.data ?? []) as PaymentRow[];

      setUser(currentUser);
      setDisplayName(
        profileResult.data?.display_name ||
          currentUser.user_metadata?.display_name ||
          currentUser.email?.split('@')[0] ||
          'Tú',
      );
      setCategories(loadedCategories);
      setPaymentMethods(loadedPayments);

      const preferredCategory =
        loadedCategories.find((item) => item.slug === 'ocio') ||
        loadedCategories.find((item) => item.slug === 'comida') ||
        loadedCategories[0];

      const preferredPayment =
        loadedPayments.find((item) => item.slug === 'debito') ||
        loadedPayments.find((item) => item.slug === 'efectivo') ||
        loadedPayments[0];

      setCategory(preferredCategory?.slug ?? '');
      setPaymentMethod(preferredPayment?.slug ?? '');
      setLoading(false);
    }

    void load();

    return () => {
      active = false;
    };
  }, [router]);

  const numericAmount = useMemo(() => parseAmount(amount), [amount]);
  const selectedCategory = categories.find((item) => item.slug === category);
  const selectedPayment = paymentMethods.find((item) => item.slug === paymentMethod);

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
      setErrorMessage('Escribe en qué fue el gasto.');
      return;
    }

    if (!category || !paymentMethod) {
      setErrorMessage('Selecciona una categoría y un método de pago.');
      return;
    }

    setSaving(true);

    const { error } = await supabase.from('expenses').insert({
      created_by: user.id,
      payer_id: user.id,
      household_id: null,
      description: description.trim(),
      amount: Math.round(numericAmount * 100) / 100,
      type: 'personal',
      category,
      payment_method: paymentMethod,
      my_share: Math.round(numericAmount * 100) / 100,
      partner_share: 0,
    });

    setSaving(false);

    if (error) {
      setErrorMessage(error.message || 'No se pudo guardar el gasto.');
      return;
    }

    router.replace('/dashboard?created=expense');
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
    <main className="expensePage">
      <header className="expenseTopbar">
        <a className="brand" href="/dashboard">
          <span className="brandMark" aria-hidden="true">
            <span className="brandDollar">$</span>
          </span>
          <span>MiFinanzas</span>
        </a>
        <a className="expenseBack" href="/dashboard">← Volver a Mi dinero</a>
      </header>

      <section className="expenseLayout">
        <div className="expenseIntro">
          <p className="eyebrow">MI DINERO · NUEVO GASTO</p>
          <h1>Registrar gasto</h1>
          <p>
            Se guardará como gasto personal y aparecerá también en la app móvil
            porque ambos usan el mismo Supabase.
          </p>

          <div className="expensePrivacyNote">
            <span>🔒</span>
            <div>
              <b>Solo tú lo ves</b>
              <p>Este gasto no se comparte con tu pareja.</p>
            </div>
          </div>
        </div>

        <form className="expenseForm" onSubmit={handleSubmit}>
          <div className="expenseStep">
            <span className="expenseStepNumber">1</span>
            <label>
              <span>¿Cuánto?</span>
              <div className="expenseAmountInput">
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
            <span className="expenseStepNumber">2</span>
            <label>
              <span>¿En qué?</span>
              <input
                className="expenseTextInput"
                type="text"
                placeholder="Ej. Cine, almuerzo, taxi..."
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                maxLength={120}
                required
              />
            </label>
          </div>

          <div className="expenseStep">
            <span className="expenseStepNumber">3</span>
            <fieldset>
              <legend>Categoría</legend>
              <div className="expenseOptionGrid">
                {categories.map((item) => (
                  <button
                    key={item.id}
                    className={category === item.slug ? 'expenseOption selected' : 'expenseOption'}
                    type="button"
                    onClick={() => setCategory(item.slug)}
                  >
                    <span className="expenseOptionIcon">{item.icon || '◈'}</span>
                    <span>{item.name}</span>
                  </button>
                ))}
              </div>
            </fieldset>
          </div>

          <div className="expenseStep">
            <span className="expenseStepNumber">4</span>
            <fieldset>
              <legend>¿Cómo pagaste?</legend>
              <div className="expenseOptionGrid paymentGrid">
                {paymentMethods.map((item) => (
                  <button
                    key={item.id}
                    className={paymentMethod === item.slug ? 'expenseOption selected paymentOption' : 'expenseOption paymentOption'}
                    type="button"
                    onClick={() => setPaymentMethod(item.slug)}
                  >
                    <span className="expenseOptionIcon">{item.icon || '💳'}</span>
                    <span>{item.name}</span>
                  </button>
                ))}
              </div>
            </fieldset>
          </div>

          <div className="expenseStep compactStep">
            <span className="expenseStepNumber">5</span>
            <div>
              <span className="expenseStepLabel">¿Quién pagó?</span>
              <div className="expenseReadonlyCard">
                <span className="expenseUserIcon">◉</span>
                <div>
                  <b>{displayName}</b>
                  <small>Tu cuenta</small>
                </div>
                <span className="expenseCheck">✓</span>
              </div>
            </div>
          </div>

          <div className="expenseStep compactStep">
            <span className="expenseStepNumber">6</span>
            <div>
              <span className="expenseStepLabel">Tipo de gasto</span>
              <div className="expenseReadonlyCard">
                <span className="expenseUserIcon">🔒</span>
                <div>
                  <b>Personal</b>
                  <small>Solo tú lo ves</small>
                </div>
                <span className="expenseCheck">✓</span>
              </div>
            </div>
          </div>

          {errorMessage ? <p className="formError expenseError">{errorMessage}</p> : null}

          <div className="expenseSummary">
            <div>
              <span>Monto</span>
              <b>{Number.isFinite(numericAmount) && numericAmount > 0 ? `S/ ${numericAmount.toFixed(2)}` : 'S/ 0.00'}</b>
            </div>
            <div>
              <span>Categoría</span>
              <b>{selectedCategory?.name ?? '—'}</b>
            </div>
            <div>
              <span>Método</span>
              <b>{selectedPayment?.name ?? '—'}</b>
            </div>
          </div>

          <button className="primaryButton expenseSaveButton" type="submit" disabled={saving}>
            {saving ? 'Guardando...' : 'Guardar gasto'}
          </button>
        </form>
      </section>
    </main>
  );
}
