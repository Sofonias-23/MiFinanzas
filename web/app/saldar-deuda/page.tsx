'use client';

import { FormEvent, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import type { User } from '@supabase/supabase-js';

import { supabase } from '@/lib/supabase';

type ExpenseRow = {
  amount: number;
  created_by: string;
  payer_id: string;
  my_share: number;
  partner_share: number;
};

type SettlementRow = {
  payer_id: string;
  receiver_id: string;
  amount: number;
};

type PaymentRow = {
  id: string;
  slug: string;
  name: string;
  icon: string;
};

type PartnerStatus = {
  partner_name: string | null;
  member_count: number;
};

function money(value: number) {
  return new Intl.NumberFormat('es-PE', {
    style: 'currency',
    currency: 'PEN',
    minimumFractionDigits: 2,
  }).format(value);
}

export default function SaldarDeudaPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [partnerName, setPartnerName] = useState('tu pareja');
  const [expenses, setExpenses] = useState<ExpenseRow[]>([]);
  const [settlements, setSettlements] = useState<SettlementRow[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<PaymentRow[]>([]);
  const [amount, setAmount] = useState('');
  const [method, setMethod] = useState('');
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    let active = true;

    async function load() {
      const { data: sessionData } = await supabase.auth.getSession();
      const currentUser = sessionData.session?.user ?? null;

      if (!currentUser) {
        router.replace('/login');
        return;
      }

      const [statusResult, expenseResult, settlementResult, paymentResult] = await Promise.all([
        supabase.rpc('get_partner_status'),
        supabase.from('expenses').select('amount, created_by, payer_id, my_share, partner_share').eq('type', 'compartido'),
        supabase.from('partner_settlements').select('payer_id, receiver_id, amount'),
        supabase.from('payment_methods').select('id, slug, name, icon').order('created_at', { ascending: true }),
      ]);

      if (!active) return;

      const status = (statusResult.data?.[0] ?? null) as PartnerStatus | null;

      setUser(currentUser);
      setPartnerName(status?.partner_name || 'tu pareja');
      setExpenses(
        ((expenseResult.data ?? []) as ExpenseRow[]).map((item) => ({
          ...item,
          amount: Number(item.amount),
          my_share: Number(item.my_share || 0),
          partner_share: Number(item.partner_share || 0),
        })),
      );
      setSettlements(
        ((settlementResult.data ?? []) as SettlementRow[]).map((item) => ({
          ...item,
          amount: Number(item.amount),
        })),
      );

      const methods = (paymentResult.data ?? []) as PaymentRow[];
      setPaymentMethods(methods);
      const preferred =
        methods.find((item) => item.slug === 'yape') ||
        methods.find((item) => item.slug === 'plin') ||
        methods.find((item) => item.slug === 'transferencia') ||
        methods[0];
      setMethod(preferred?.slug || '');
      setLoading(false);
    }

    void load();
    return () => { active = false; };
  }, [router]);

  const balance = useMemo(() => {
    if (!user) return 0;

    const expenseBalance = expenses.reduce((total, expense) => {
      const myShare = expense.created_by === user.id ? expense.my_share : expense.partner_share;
      return expense.payer_id === user.id
        ? total + (expense.amount - myShare)
        : total - myShare;
    }, 0);

    const settlementBalance = settlements.reduce((total, settlement) => {
      if (settlement.payer_id === user.id) return total + settlement.amount;
      if (settlement.receiver_id === user.id) return total - settlement.amount;
      return total;
    }, 0);

    return Math.round((expenseBalance + settlementBalance) * 100) / 100;
  }, [expenses, settlements, user]);

  const maxAmount = Math.abs(balance);

  useEffect(() => {
    if (!amount && maxAmount >= 0.01) setAmount(maxAmount.toFixed(2));
  }, [amount, maxAmount]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    const parsed = Number(amount.replace(',', '.'));

    if (!Number.isFinite(parsed) || parsed <= 0 || parsed > maxAmount + 0.001) {
      setErrorMessage('El monto debe ser mayor a cero y no superar ' + money(maxAmount) + '.');
      return;
    }

    setSaving(true);
    const { error } = await supabase.rpc('record_partner_settlement', {
      p_amount: Math.round(parsed * 100) / 100,
      p_payment_method: method || 'efectivo',
      p_note: note.trim() || null,
    });
    setSaving(false);

    if (error) {
      setErrorMessage(error.message || 'No se pudo registrar el pago.');
      return;
    }

    setSuccessMessage(parsed >= maxAmount - 0.005 ? 'Deuda saldada. El balance quedó en cero.' : 'Pago registrado correctamente.');
    setTimeout(() => router.replace('/deudas'), 1100);
  }

  if (loading || !user) {
    return <main className="dashboardLoading"><p>Cargando balance...</p></main>;
  }

  const settled = maxAmount < 0.01;
  const action =
    balance < -0.005
      ? 'Pagar a ' + partnerName
      : balance > 0.005
      ? 'Registrar pago de ' + partnerName
      : 'Están al día';

  return (
    <main className="settlePage">
      <header className="expenseTopbar">
        <a className="brand" href="/deudas">
          <span className="brandMark" aria-hidden="true"><span className="brandDollar">$</span></span>
          <span>MiFinanzas</span>
        </a>
        <a className="expenseBack" href="/deudas">← Deudas</a>
      </header>

      <section className="settleWrap">
        <div className="settleIntro">
          <p className="eyebrow">PAREJA · LIQUIDAR</p>
          <h1>Saldar deuda</h1>
          <p>Registrar un pago reduce el balance entre ustedes, pero no crea un gasto nuevo.</p>

          <div className={settled ? 'settleBalanceCard settled' : 'settleBalanceCard'}>
            <span>Balance actual</span>
            <strong>{settled ? 'Están al día' : balance < 0 ? 'Debes a ' + partnerName : partnerName + ' te debe'}</strong>
            <b>{money(maxAmount)}</b>
          </div>
        </div>

        {!settled ? (
          <form className="settleForm" onSubmit={submit}>
            <div className="settleDirection">
              <span>Acción</span>
              <strong>{action}</strong>
            </div>

            <label>
              Monto del pago
              <div className="settleAmountInput">
                <span>S/</span>
                <input value={amount} onChange={(event) => setAmount(event.target.value)} inputMode="decimal" />
              </div>
              <small>Máximo pendiente: {money(maxAmount)}</small>
            </label>

            <fieldset>
              <legend>Método de pago</legend>
              <div className="settleMethods">
                {paymentMethods.slice(0, 7).map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    className={method === item.slug ? 'settleMethod active' : 'settleMethod'}
                    onClick={() => setMethod(item.slug)}
                  >
                    <span>{item.icon || '💳'}</span>
                    <b>{item.name}</b>
                  </button>
                ))}
              </div>
            </fieldset>

            <label>
              Nota
              <input className="settleNote" value={note} onChange={(event) => setNote(event.target.value)} placeholder="Opcional" maxLength={160} />
            </label>

            {errorMessage ? <p className="formError">{errorMessage}</p> : null}
            {successMessage ? <p className="formSuccess">{successMessage}</p> : null}

            <button className="primaryButton settleSubmit" type="submit" disabled={saving}>
              {saving ? 'Registrando...' : action}
            </button>
          </form>
        ) : (
          <div className="settleDone">
            <span>✓</span>
            <b>No tienen pagos pendientes.</b>
            <a className="ghostButton" href="/pareja">Volver a Pareja</a>
          </div>
        )}
      </section>
    </main>
  );
}
