'use client';

import { FormEvent, useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import type { User } from '@supabase/supabase-js';

import { supabase } from '@/lib/supabase';

type PaymentRow = {
  id: string;
  slug: string;
  name: string;
  icon: string;
};

const ICONS = ['💵', '📱', '📲', '💳', '🏦', '💰', '🪙', '🧾', '🏧', '💸', '❔'];

function slugify(value: string) {
  const normalized = value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

  return normalized || 'metodo-' + Date.now();
}

export default function MetodosPagoPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [paymentMethods, setPaymentMethods] = useState<PaymentRow[]>([]);
  const [name, setName] = useState('');
  const [icon, setIcon] = useState('💳');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const loadPaymentMethods = useCallback(async () => {
    const { data: sessionData } = await supabase.auth.getSession();
    const currentUser = sessionData.session?.user ?? null;

    if (!currentUser) {
      router.replace('/login');
      return;
    }

    const { data, error } = await supabase
      .from('payment_methods')
      .select('id, slug, name, icon')
      .order('created_at', { ascending: true });

    if (error) {
      setErrorMessage(error.message);
      setLoading(false);
      return;
    }

    setUser(currentUser);
    setPaymentMethods((data ?? []) as PaymentRow[]);
    setLoading(false);
  }, [router]);

  useEffect(() => {
    void loadPaymentMethods();
  }, [loadPaymentMethods]);

  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('web-payment-methods-' + user.id)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'payment_methods' },
        () => void loadPaymentMethods(),
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [user, loadPaymentMethods]);

  async function handleAdd(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage('');

    if (!user) {
      router.replace('/login');
      return;
    }

    const cleanName = name.trim();

    if (!cleanName) {
      setErrorMessage('Escribe un nombre para el método de pago.');
      return;
    }

    if (paymentMethods.some((item) => item.name.toLowerCase() === cleanName.toLowerCase())) {
      setErrorMessage('Ya existe un método de pago con ese nombre.');
      return;
    }

    let slug = slugify(cleanName);
    if (paymentMethods.some((item) => item.slug === slug)) {
      slug += '-' + Date.now().toString().slice(-6);
    }

    setSaving(true);

    const { error } = await supabase.from('payment_methods').insert({
      user_id: user.id,
      slug,
      name: cleanName,
      icon,
    });

    setSaving(false);

    if (error) {
      setErrorMessage(error.message || 'No se pudo crear el método de pago.');
      return;
    }

    setName('');
    setIcon('💳');
    await loadPaymentMethods();
  }

  async function handleDelete(method: PaymentRow) {
    setErrorMessage('');

    if (!user) return;

    if (paymentMethods.length <= 1) {
      setErrorMessage('Debes conservar al menos un método de pago.');
      return;
    }

    const confirmed = window.confirm(
      '¿Eliminar “' + method.name + '”? Tus gastos anteriores conservarán este método en su historial.',
    );

    if (!confirmed) return;

    const { error } = await supabase
      .from('payment_methods')
      .delete()
      .eq('id', method.id)
      .eq('user_id', user.id);

    if (error) {
      setErrorMessage(error.message || 'No se pudo eliminar el método de pago.');
      return;
    }

    await loadPaymentMethods();
  }

  if (loading || !user) {
    return (
      <main className="dashboardLoading">
        <p>Cargando métodos de pago...</p>
      </main>
    );
  }

  return (
    <main className="paymentsPage">
      <header className="expenseTopbar">
        <a className="brand" href="/dashboard">
          <span className="brandMark" aria-hidden="true">
            <span className="brandDollar">$</span>
          </span>
          <span>MiFinanzas</span>
        </a>
        <a className="expenseBack" href="/dashboard">← Mi dinero</a>
      </header>

      <section className="paymentsWrap">
        <div className="paymentsHeading">
          <div>
            <p className="eyebrow">PERSONALIZA TU APP</p>
            <h1>Métodos de pago</h1>
            <p>Crea tus propios métodos y elimina los que ya no uses.</p>
          </div>
          <span className="paymentsCount">{paymentMethods.length} métodos</span>
        </div>

        <div className="paymentsGrid">
          <form className="paymentCreateCard" onSubmit={handleAdd}>
            <div>
              <label htmlFor="payment-name">Nombre</label>
              <input
                id="payment-name"
                type="text"
                placeholder="Ej. Yape, Visa BBVA, Efectivo..."
                value={name}
                onChange={(event) => setName(event.target.value)}
                maxLength={30}
                required
              />
            </div>

            <div>
              <span className="paymentFieldLabel">Icono</span>
              <div className="paymentIconPicker">
                {ICONS.map((item) => (
                  <button
                    key={item}
                    className={icon === item ? 'paymentIconChoice active' : 'paymentIconChoice'}
                    type="button"
                    onClick={() => setIcon(item)}
                  >
                    {item}
                  </button>
                ))}
              </div>
            </div>

            <div className="paymentPreview">
              <span className="paymentPreviewIcon">{icon}</span>
              <div>
                <small>Vista previa</small>
                <b>{name.trim() || 'Nuevo método'}</b>
              </div>
            </div>

            {errorMessage ? <p className="formError paymentError">{errorMessage}</p> : null}

            <button className="primaryButton paymentAddButton" type="submit" disabled={saving}>
              {saving ? 'Creando...' : '＋ Agregar método'}
            </button>
          </form>

          <section className="paymentListCard">
            <div className="paymentListHeader">
              <div>
                <p className="eyebrow">MIS MÉTODOS</p>
                <h2>Disponibles</h2>
              </div>
              <span>{paymentMethods.length}</span>
            </div>

            <div className="paymentList">
              {paymentMethods.map((method) => (
                <article className="paymentRowWeb" key={method.id}>
                  <span className="paymentRowIcon">{method.icon || '💳'}</span>
                  <div>
                    <b>{method.name}</b>
                    <small>{method.slug}</small>
                  </div>
                  <button type="button" onClick={() => void handleDelete(method)}>
                    Eliminar
                  </button>
                </article>
              ))}
            </div>

            <p className="paymentNote">
              Debes conservar al menos un método. Eliminarlo no modifica tus gastos anteriores.
            </p>
          </section>
        </div>
      </section>
    </main>
  );
}
