'use client';

import { FormEvent, useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
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

type PartnerStatus = {
  household_id: string | null;
  partner_name: string | null;
  member_count: number;
};

type SplitMode = 'half' | 'exact' | 'percentage';

function parseAmount(value: string) {
  return Number(value.replace(',', '.'));
}

export default function NuevoGastoPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const sharedMode = searchParams.get('type') === 'compartido';

  const [user, setUser] = useState<User | null>(null);
  const [displayName, setDisplayName] = useState('Tú');
  const [partnerName, setPartnerName] = useState('Tu pareja');
  const [partnerId, setPartnerId] = useState<string | null>(null);
  const [householdId, setHouseholdId] = useState<string | null>(null);
  const [categories, setCategories] = useState<CategoryRow[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<PaymentRow[]>([]);
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('');
  const [payerId, setPayerId] = useState('');
  const [splitMode, setSplitMode] = useState<SplitMode>('half');
  const [exactMine, setExactMine] = useState('');
  const [percentMine, setPercentMine] = useState('50');
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

      const [profileResult, categoryResult, paymentResult, statusResult] = await Promise.all([
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
        supabase.rpc('get_partner_status'),
      ]);

      if (!active) return;

      const loadedCategories = (categoryResult.data ?? []) as CategoryRow[];
      const loadedPayments = (paymentResult.data ?? []) as PaymentRow[];
      const status = (statusResult.data?.[0] ?? null) as PartnerStatus | null;

      setUser(currentUser);
      setPayerId(currentUser.id);
      setDisplayName(
        profileResult.data?.display_name ||
          currentUser.user_metadata?.display_name ||
          currentUser.email?.split('@')[0] ||
          'Tú',
      );
      setPartnerName(status?.partner_name || 'Tu pareja');
      setHouseholdId(
        status && status.member_count >= 2 && status.household_id ? status.household_id : null,
      );

      if (status?.household_id && status.member_count >= 2) {
        const { data: member } = await supabase
          .from('household_members')
          .select('user_id')
          .eq('household_id', status.household_id)
          .neq('user_id', currentUser.id)
          .limit(1)
          .maybeSingle();

        if (active) setPartnerId(member?.user_id ?? null);
      }

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

  const split = useMemo(() => {
    if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
      return { mine: 0, partner: 0, valid: false };
    }

    if (!sharedMode) {
      return { mine: numericAmount, partner: 0, valid: true };
    }

    if (splitMode === 'half') {
      const mine = Math.round((numericAmount / 2) * 100) / 100;
      return {
        mine,
        partner: Math.round((numericAmount - mine) * 100) / 100,
        valid: true,
      };
    }

    if (splitMode === 'exact') {
      const mine = parseAmount(exactMine);
      if (!Number.isFinite(mine) || mine < 0 || mine > numericAmount) {
        return { mine: 0, partner: 0, valid: false };
      }

      return {
        mine: Math.round(mine * 100) / 100,
        partner: Math.round((numericAmount - mine) * 100) / 100,
        valid: true,
      };
    }

    const percent = parseAmount(percentMine);
    if (!Number.isFinite(percent) || percent < 0 || percent > 100) {
      return { mine: 0, partner: 0, valid: false };
    }

    const mine = Math.round(numericAmount * (percent / 100) * 100) / 100;
    return {
      mine,
      partner: Math.round((numericAmount - mine) * 100) / 100,
      valid: true,
    };
  }, [numericAmount, sharedMode, splitMode, exactMine, percentMine]);

  useEffect(() => {
    if (sharedMode && Number.isFinite(numericAmount) && numericAmount > 0 && splitMode === 'exact') {
      setExactMine((numericAmount / 2).toFixed(2));
    }
  }, [numericAmount, sharedMode, splitMode]);

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

    if (sharedMode && (!householdId || !partnerId)) {
      setErrorMessage('Primero vincula a tu pareja para registrar gastos compartidos.');
      return;
    }

    if (!split.valid) {
      setErrorMessage('Revisa la división. Las partes deben sumar el total.');
      return;
    }

    setSaving(true);

    const { error } = await supabase.from('expenses').insert({
      created_by: user.id,
      payer_id: sharedMode ? payerId || user.id : user.id,
      household_id: sharedMode ? householdId : null,
      description: description.trim(),
      amount: Math.round(numericAmount * 100) / 100,
      type: sharedMode ? 'compartido' : 'personal',
      category,
      payment_method: paymentMethod,
      my_share: sharedMode ? split.mine : Math.round(numericAmount * 100) / 100,
      partner_share: sharedMode ? split.partner : 0,
    });

    setSaving(false);

    if (error) {
      setErrorMessage(error.message || 'No se pudo guardar el gasto.');
      return;
    }

    router.replace(sharedMode ? '/pareja?created=expense' : '/dashboard?created=expense');
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
    <main className={sharedMode ? 'expensePage sharedExpensePage' : 'expensePage'}>
      <header className="expenseTopbar">
        <a className="brand" href={sharedMode ? '/pareja' : '/dashboard'}>
          <span className="brandMark" aria-hidden="true">
            <span className="brandDollar">$</span>
          </span>
          <span>MiFinanzas</span>
        </a>
        <a className="expenseBack" href={sharedMode ? '/pareja' : '/dashboard'}>
          ← Volver a {sharedMode ? 'Pareja' : 'Mi dinero'}
        </a>
      </header>

      <section className="expenseLayout">
        <div className="expenseIntro">
          <p className="eyebrow">
            {sharedMode ? 'PAREJA · NUEVO GASTO' : 'MI DINERO · NUEVO GASTO'}
          </p>
          <h1>{sharedMode ? 'Gasto compartido' : 'Registrar gasto'}</h1>
          <p>
            {sharedMode
              ? 'Registra quién pagó y cómo se divide el gasto entre ambos.'
              : 'Se guardará como gasto personal y aparecerá también en la app móvil.'}
          </p>

          <div className={sharedMode ? 'expensePrivacyNote shared' : 'expensePrivacyNote'}>
            <span>{sharedMode ? '♥' : '🔒'}</span>
            <div>
              <b>{sharedMode ? 'Lo ven ambos' : 'Solo tú lo ves'}</b>
              <p>
                {sharedMode
                  ? 'Este movimiento aparecerá en el espacio Pareja.'
                  : 'Este gasto no se comparte con tu pareja.'}
              </p>
            </div>
          </div>

          {sharedMode && !householdId ? (
            <div className="sharedMissingPartner">
              <b>Pareja no vinculada</b>
              <span>Necesitas vincular las dos cuentas antes de guardar un gasto compartido.</span>
              <a href="/pareja">Ir a vincular pareja</a>
            </div>
          ) : null}
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

              {sharedMode ? (
                <div className="sharedPayerGrid">
                  <button
                    type="button"
                    className={payerId === user.id ? 'sharedPayer active blue' : 'sharedPayer'}
                    onClick={() => setPayerId(user.id)}
                  >
                    <span>◉</span>
                    <div>
                      <b>{displayName}</b>
                      <small>Tú</small>
                    </div>
                  </button>

                  <button
                    type="button"
                    className={payerId === partnerId ? 'sharedPayer active pink' : 'sharedPayer'}
                    onClick={() => partnerId && setPayerId(partnerId)}
                    disabled={!partnerId}
                  >
                    <span>♥</span>
                    <div>
                      <b>{partnerName}</b>
                      <small>Tu pareja</small>
                    </div>
                  </button>
                </div>
              ) : (
                <div className="expenseReadonlyCard">
                  <span className="expenseUserIcon">◉</span>
                  <div>
                    <b>{displayName}</b>
                    <small>Tu cuenta</small>
                  </div>
                  <span className="expenseCheck">✓</span>
                </div>
              )}
            </div>
          </div>

          <div className="expenseStep compactStep">
            <span className="expenseStepNumber">6</span>
            <div>
              <span className="expenseStepLabel">Tipo de gasto</span>
              <div className="expenseReadonlyCard">
                <span className="expenseUserIcon">{sharedMode ? '♥' : '🔒'}</span>
                <div>
                  <b>{sharedMode ? 'Compartido' : 'Personal'}</b>
                  <small>{sharedMode ? 'Lo vemos ambos' : 'Solo tú lo ves'}</small>
                </div>
                <span className="expenseCheck">✓</span>
              </div>
            </div>
          </div>

          {sharedMode ? (
            <div className="expenseStep">
              <span className="expenseStepNumber">7</span>
              <fieldset>
                <legend>¿Cómo lo dividimos?</legend>

                <div className="splitModeGrid">
                  <button
                    type="button"
                    className={splitMode === 'half' ? 'splitMode active' : 'splitMode'}
                    onClick={() => setSplitMode('half')}
                  >
                    <b>50 / 50</b>
                    <span>Ambos pagan lo mismo</span>
                  </button>

                  <button
                    type="button"
                    className={splitMode === 'exact' ? 'splitMode active' : 'splitMode'}
                    onClick={() => setSplitMode('exact')}
                  >
                    <b>Monto exacto</b>
                    <span>Indica tu parte</span>
                  </button>

                  <button
                    type="button"
                    className={splitMode === 'percentage' ? 'splitMode active' : 'splitMode'}
                    onClick={() => setSplitMode('percentage')}
                  >
                    <b>Porcentaje</b>
                    <span>Ej. 60% / 40%</span>
                  </button>
                </div>

                {splitMode === 'exact' ? (
                  <div className="splitEditor">
                    <label>
                      <span>Tu parte</span>
                      <input
                        type="text"
                        inputMode="decimal"
                        value={exactMine}
                        onChange={(event) => setExactMine(event.target.value)}
                        placeholder="0.00"
                      />
                    </label>
                  </div>
                ) : null}

                {splitMode === 'percentage' ? (
                  <div className="splitEditor">
                    <label>
                      <span>Tu porcentaje</span>
                      <div className="percentInput">
                        <input
                          type="text"
                          inputMode="decimal"
                          value={percentMine}
                          onChange={(event) => setPercentMine(event.target.value)}
                        />
                        <span>%</span>
                      </div>
                    </label>
                  </div>
                ) : null}

                <div className="splitPreview">
                  <div>
                    <span>{displayName}</span>
                    <strong>{'S/ ' + split.mine.toFixed(2)}</strong>
                  </div>
                  <div>
                    <span>{partnerName}</span>
                    <strong>{'S/ ' + split.partner.toFixed(2)}</strong>
                  </div>
                </div>
              </fieldset>
            </div>
          ) : null}

          {errorMessage ? <p className="formError expenseError">{errorMessage}</p> : null}

          <div className="expenseSummary">
            <div>
              <span>Monto</span>
              <b>{Number.isFinite(numericAmount) && numericAmount > 0 ? 'S/ ' + numericAmount.toFixed(2) : 'S/ 0.00'}</b>
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

          <button className={sharedMode ? 'primaryButton expenseSaveButton sharedSaveButton' : 'primaryButton expenseSaveButton'} type="submit" disabled={saving}>
            {saving ? 'Guardando...' : sharedMode ? 'Guardar gasto compartido' : 'Guardar gasto'}
          </button>
        </form>
      </section>
    </main>
  );
}
