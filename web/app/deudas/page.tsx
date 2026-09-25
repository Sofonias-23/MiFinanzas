'use client';

import { FormEvent, useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import type { User } from '@supabase/supabase-js';

import { supabase } from '@/lib/supabase';

type ExpenseRow = {
  id: string;
  amount: number;
  created_by: string;
  payer_id: string;
  my_share: number;
  partner_share: number;
};

type SettlementRow = {
  id: string;
  payer_id: string;
  receiver_id: string;
  amount: number;
  payment_method: string;
  note: string | null;
  created_at: string;
};

type DebtRow = {
  id: string;
  direction: 'me_deben' | 'debo';
  person: string;
  amount: number;
  note: string | null;
  status: 'pendiente' | 'pagada';
  created_at: string;
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

function dateLabel(value: string) {
  return new Intl.DateTimeFormat('es-PE', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date(value));
}

export default function DeudasPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [partnerName, setPartnerName] = useState('tu pareja');
  const [linked, setLinked] = useState(false);
  const [expenses, setExpenses] = useState<ExpenseRow[]>([]);
  const [settlements, setSettlements] = useState<SettlementRow[]>([]);
  const [debts, setDebts] = useState<DebtRow[]>([]);
  const [direction, setDirection] = useState<'me_deben' | 'debo'>('me_deben');
  const [person, setPerson] = useState('');
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const loadData = useCallback(async () => {
    const { data: sessionData } = await supabase.auth.getSession();
    const currentUser = sessionData.session?.user ?? null;

    if (!currentUser) {
      router.replace('/login');
      return;
    }

    const [statusResult, expenseResult, settlementResult, debtResult] = await Promise.all([
      supabase.rpc('get_partner_status'),
      supabase
        .from('expenses')
        .select('id, amount, created_by, payer_id, my_share, partner_share')
        .eq('type', 'compartido'),
      supabase
        .from('partner_settlements')
        .select('id, payer_id, receiver_id, amount, payment_method, note, created_at')
        .order('created_at', { ascending: false }),
      supabase
        .from('debts')
        .select('id, direction, person, amount, note, status, created_at')
        .order('created_at', { ascending: false }),
    ]);

    const status = (statusResult.data?.[0] ?? null) as PartnerStatus | null;

    setUser(currentUser);
    setPartnerName(status?.partner_name || 'tu pareja');
    setLinked(Boolean(status?.member_count && status.member_count >= 2));
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
    setDebts(
      ((debtResult.data ?? []) as DebtRow[]).map((item) => ({
        ...item,
        amount: Number(item.amount),
      })),
    );
    setLoading(false);
  }, [router]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('web-debts-' + user.id)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'partner_settlements' }, () => void loadData())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'debts' }, () => void loadData())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'expenses' }, () => void loadData())
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [user, loadData]);

  const partnerBalance = useMemo(() => {
    if (!user) return 0;

    const expenseBalance = expenses.reduce((balance, expense) => {
      const myShare =
        expense.created_by === user.id
          ? expense.my_share
          : expense.partner_share;

      if (expense.payer_id === user.id) {
        return balance + (expense.amount - myShare);
      }
      return balance - myShare;
    }, 0);

    const settlementBalance = settlements.reduce((balance, settlement) => {
      if (settlement.payer_id === user.id) return balance + settlement.amount;
      if (settlement.receiver_id === user.id) return balance - settlement.amount;
      return balance;
    }, 0);

    return Math.round((expenseBalance + settlementBalance) * 100) / 100;
  }, [expenses, settlements, user]);

  const pendingReceivable = useMemo(
    () =>
      debts
        .filter((debt) => debt.status === 'pendiente' && debt.direction === 'me_deben')
        .reduce((sum, debt) => sum + debt.amount, 0),
    [debts],
  );

  const pendingOwed = useMemo(
    () =>
      debts
        .filter((debt) => debt.status === 'pendiente' && debt.direction === 'debo')
        .reduce((sum, debt) => sum + debt.amount, 0),
    [debts],
  );

  async function createDebt(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage('');

    if (!user) return;

    const parsed = Number(amount.replace(',', '.'));

    if (!person.trim()) {
      setErrorMessage('Escribe a quién corresponde la deuda.');
      return;
    }
    if (!Number.isFinite(parsed) || parsed <= 0) {
      setErrorMessage('El monto debe ser mayor a cero.');
      return;
    }

    setBusy(true);
    const { error } = await supabase.from('debts').insert({
      user_id: user.id,
      direction,
      person: person.trim(),
      amount: Math.round(parsed * 100) / 100,
      note: note.trim() || null,
    });
    setBusy(false);

    if (error) {
      setErrorMessage(error.message || 'No se pudo guardar la deuda.');
      return;
    }

    setPerson('');
    setAmount('');
    setNote('');
    setShowForm(false);
    await loadData();
  }

  async function togglePaid(debt: DebtRow) {
    const next = debt.status === 'pendiente' ? 'pagada' : 'pendiente';
    const { error } = await supabase
      .from('debts')
      .update({ status: next, updated_at: new Date().toISOString() })
      .eq('id', debt.id);

    if (error) {
      setErrorMessage(error.message);
      return;
    }
    await loadData();
  }

  async function deleteDebt(debt: DebtRow) {
    if (!window.confirm('¿Eliminar la deuda de ' + debt.person + '?')) return;

    const { error } = await supabase.from('debts').delete().eq('id', debt.id);
    if (error) {
      setErrorMessage(error.message);
      return;
    }
    await loadData();
  }

  if (loading || !user) {
    return <main className="dashboardLoading"><p>Cargando deudas...</p></main>;
  }

  const balanceAbs = Math.abs(partnerBalance);
  const balanceText =
    partnerBalance > 0.005
      ? partnerName + ' te debe'
      : partnerBalance < -0.005
      ? 'Debes a ' + partnerName
      : 'Están al día';

  return (
    <main className="debtsPage">
      <header className="expenseTopbar">
        <a className="brand" href="/pareja">
          <span className="brandMark" aria-hidden="true"><span className="brandDollar">$</span></span>
          <span>MiFinanzas</span>
        </a>
        <a className="expenseBack" href="/pareja">← Pareja</a>
      </header>

      <section className="debtsWrap">
        <div className="debtsHeading">
          <div>
            <p className="eyebrow">BALANCES Y PAGOS</p>
            <h1>Deudas</h1>
            <p>Controla lo que se deben entre ustedes y tus deudas personales.</p>
          </div>
          <button className="primaryButton debtNewButton" type="button" onClick={() => setShowForm((value) => !value)}>
            {showForm ? 'Cerrar' : '＋ Nueva deuda personal'}
          </button>
        </div>

        <section className="partnerDebtHero">
          <div>
            <span>Saldo entre ustedes</span>
            <strong>{balanceText}</strong>
            <b>{money(balanceAbs)}</b>
            <small>
              {!linked
                ? 'Primero vincula una pareja.'
                : partnerBalance > 0.005
                ? 'Saldo a tu favor.'
                : partnerBalance < -0.005
                ? 'Saldo pendiente.'
                : 'Sin pagos pendientes.'}
            </small>
          </div>

          {linked && balanceAbs >= 0.01 ? (
            <a className="partnerSettleButton" href="/saldar-deuda">Saldar ahora →</a>
          ) : null}
        </section>

        <div className="debtSummaryGrid">
          <div>
            <span>Me deben</span>
            <strong className="moneyIncome">{money(pendingReceivable)}</strong>
          </div>
          <div>
            <span>Debo</span>
            <strong className="moneyExpense">{money(pendingOwed)}</strong>
          </div>
          <div>
            <span>Liquidaciones</span>
            <strong>{settlements.length}</strong>
          </div>
        </div>

        {showForm ? (
          <form className="personalDebtForm" onSubmit={createDebt}>
            <div className="debtDirectionTabs">
              <button type="button" className={direction === 'me_deben' ? 'active' : ''} onClick={() => setDirection('me_deben')}>
                Me deben
              </button>
              <button type="button" className={direction === 'debo' ? 'active red' : ''} onClick={() => setDirection('debo')}>
                Debo
              </button>
            </div>

            <label>
              Persona
              <input value={person} onChange={(event) => setPerson(event.target.value)} placeholder="Ej. Carlos" maxLength={60} />
            </label>

            <label>
              Monto
              <div className="debtAmountInput">
                <span>S/</span>
                <input value={amount} onChange={(event) => setAmount(event.target.value)} inputMode="decimal" placeholder="0.00" />
              </div>
            </label>

            <label className="debtNoteField">
              Nota
              <input value={note} onChange={(event) => setNote(event.target.value)} placeholder="Opcional" maxLength={160} />
            </label>

            {errorMessage ? <p className="formError debtFormError">{errorMessage}</p> : null}

            <div className="debtFormActions">
              <button type="button" className="ghostButton" onClick={() => setShowForm(false)}>Cancelar</button>
              <button type="submit" className="primaryButton" disabled={busy}>{busy ? 'Guardando...' : 'Guardar deuda'}</button>
            </div>
          </form>
        ) : null}

        {!showForm && errorMessage ? <p className="formError debtStandaloneError">{errorMessage}</p> : null}

        <div className="debtsGrid">
          <section className="debtPanel">
            <div className="debtPanelHeader">
              <div>
                <p className="eyebrow">PERSONALES</p>
                <h2>Otras deudas</h2>
              </div>
              <span>{debts.length}</span>
            </div>

            <div className="personalDebtList">
              {debts.length ? debts.map((debt) => (
                <article className={debt.status === 'pagada' ? 'personalDebtRow paid' : 'personalDebtRow'} key={debt.id}>
                  <span className={debt.direction === 'me_deben' ? 'debtDirectionIcon blue' : 'debtDirectionIcon red'}>
                    {debt.direction === 'me_deben' ? '↓' : '↑'}
                  </span>
                  <div>
                    <b>{debt.person}</b>
                    <small>{debt.direction === 'me_deben' ? 'Te debe' : 'Tú debes'} · {dateLabel(debt.created_at)}</small>
                    {debt.note ? <small>{debt.note}</small> : null}
                  </div>
                  <strong className={debt.direction === 'me_deben' ? 'moneyIncome' : 'moneyExpense'}>{money(debt.amount)}</strong>
                  <div className="personalDebtActions">
                    <button type="button" onClick={() => void togglePaid(debt)}>
                      {debt.status === 'pendiente' ? 'Marcar pagada' : 'Reabrir'}
                    </button>
                    <button type="button" className="delete" onClick={() => void deleteDebt(debt)}>Eliminar</button>
                  </div>
                </article>
              )) : (
                <div className="debtEmpty">No tienes otras deudas registradas.</div>
              )}
            </div>
          </section>

          <section className="debtPanel">
            <div className="debtPanelHeader">
              <div>
                <p className="eyebrow">PAREJA</p>
                <h2>Historial de liquidaciones</h2>
              </div>
              <span>{settlements.length}</span>
            </div>

            <div className="settlementListWeb">
              {settlements.length ? settlements.map((settlement) => {
                const iPaid = settlement.payer_id === user.id;
                return (
                  <article className="settlementRowWeb" key={settlement.id}>
                    <span className={iPaid ? 'settlementIconWeb blue' : 'settlementIconWeb pink'}>{iPaid ? '↑' : '↓'}</span>
                    <div>
                      <b>{iPaid ? 'Pagaste a ' + partnerName : partnerName + ' te pagó'}</b>
                      <small>{dateLabel(settlement.created_at)} · {settlement.payment_method}</small>
                      {settlement.note ? <small>{settlement.note}</small> : null}
                    </div>
                    <strong>{money(settlement.amount)}</strong>
                  </article>
                );
              }) : (
                <div className="debtEmpty">Aún no hay liquidaciones registradas.</div>
              )}
            </div>
          </section>
        </div>
      </section>
    </main>
  );
}
