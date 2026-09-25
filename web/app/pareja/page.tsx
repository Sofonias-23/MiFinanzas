'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import type { User } from '@supabase/supabase-js';

import { supabase } from '@/lib/supabase';

type PartnerStatus = {
  household_id: string | null;
  my_role: string | null;
  partner_name: string | null;
  member_count: number;
  invite_code: string | null;
};

type ExpenseRow = {
  id: string;
  amount: number;
  description: string;
  type: 'personal' | 'compartido';
  category: string | null;
  payment_method: string | null;
  created_at: string;
  created_by: string;
  payer_id: string;
  my_share: number;
  partner_share: number;
};

type CategoryRow = {
  slug: string;
  name: string;
  icon: string;
};

type PaymentRow = {
  slug: string;
  name: string;
};

type SettlementRow = {
  id: string;
  payer_id: string;
  receiver_id: string;
  amount: number;
};

function isCurrentMonth(value: string) {
  const date = new Date(value);
  const now = new Date();
  return date.getFullYear() === now.getFullYear() && date.getMonth() === now.getMonth();
}

function formatMoney(value: number) {
  return new Intl.NumberFormat('es-PE', {
    style: 'currency',
    currency: 'PEN',
    minimumFractionDigits: 2,
  }).format(value);
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat('es-PE', {
    day: '2-digit',
    month: 'short',
  }).format(new Date(value));
}

export default function ParejaPage() {
  const router = useRouter();

  const [user, setUser] = useState<User | null>(null);
  const [displayName, setDisplayName] = useState('Tú');
  const [status, setStatus] = useState<PartnerStatus | null>(null);
  const [expenses, setExpenses] = useState<ExpenseRow[]>([]);
  const [categories, setCategories] = useState<CategoryRow[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<PaymentRow[]>([]);
  const [settlements, setSettlements] = useState<SettlementRow[]>([]);
  const [joinCode, setJoinCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');

  const loadData = useCallback(async () => {
    const { data: sessionData } = await supabase.auth.getSession();
    const currentUser = sessionData.session?.user ?? null;

    if (!currentUser) {
      router.replace('/login');
      return;
    }

    const [profileResult, statusResult, expenseResult, categoryResult, paymentResult, settlementResult] =
      await Promise.all([
        supabase
          .from('profiles')
          .select('display_name')
          .eq('id', currentUser.id)
          .maybeSingle(),
        supabase.rpc('get_partner_status'),
        supabase
          .from('expenses')
          .select('id, amount, description, type, category, payment_method, created_at, created_by, payer_id, my_share, partner_share')
          .eq('type', 'compartido')
          .order('created_at', { ascending: false }),
        supabase
          .from('expense_categories')
          .select('slug, name, icon')
          .order('created_at', { ascending: true }),
        supabase
          .from('payment_methods')
          .select('slug, name')
          .order('created_at', { ascending: true }),
        supabase
          .from('partner_settlements')
          .select('id, payer_id, receiver_id, amount')
          .order('created_at', { ascending: false }),
      ]);

    setUser(currentUser);
    setDisplayName(
      profileResult.data?.display_name ||
        currentUser.user_metadata?.display_name ||
        currentUser.email?.split('@')[0] ||
        'Tú',
    );
    setStatus((statusResult.data?.[0] ?? null) as PartnerStatus | null);
    setExpenses(
      ((expenseResult.data ?? []) as ExpenseRow[]).map((item) => ({
        ...item,
        amount: Number(item.amount),
        my_share: Number(item.my_share || 0),
        partner_share: Number(item.partner_share || 0),
      })),
    );
    setCategories((categoryResult.data ?? []) as CategoryRow[]);
    setPaymentMethods((paymentResult.data ?? []) as PaymentRow[]);
    setSettlements(
      ((settlementResult.data ?? []) as SettlementRow[]).map((item) => ({
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
      .channel('web-couple-' + user.id)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'expenses' },
        () => void loadData(),
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'partner_settlements' },
        () => void loadData(),
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [user, loadData]);

  const linked = (status?.member_count ?? 0) >= 2 && Boolean(status?.household_id);
  const partnerName = status?.partner_name || 'tu pareja';

  const monthShared = useMemo(
    () => expenses.filter((expense) => isCurrentMonth(expense.created_at)),
    [expenses],
  );

  const monthTotal = useMemo(
    () => monthShared.reduce((sum, expense) => sum + Number(expense.amount || 0), 0),
    [monthShared],
  );

  const paidByMe = useMemo(
    () =>
      monthShared
        .filter((expense) => expense.payer_id === user?.id)
        .reduce((sum, expense) => sum + Number(expense.amount || 0), 0),
    [monthShared, user],
  );

  const paidByPartner = Math.max(0, monthTotal - paidByMe);

  const partnerBalance = useMemo(() => {
    if (!user) return 0;

    const expenseBalance = expenses.reduce((balance, expense) => {
      const myShare =
        expense.created_by === user.id
          ? Number(expense.my_share || 0)
          : Number(expense.partner_share || 0);

      if (expense.payer_id === user.id) {
        return balance + (Number(expense.amount || 0) - myShare);
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

  const categorySummary = useMemo(() => {
    const totals = new Map<string, number>();

    monthShared.forEach((expense) => {
      const slug = expense.category || 'otros';
      totals.set(slug, (totals.get(slug) ?? 0) + Number(expense.amount || 0));
    });

    return Array.from(totals.entries())
      .map(([slug, amount]) => {
        const category = categories.find((item) => item.slug === slug);
        return {
          slug,
          amount,
          name: category?.name || slug,
          icon: category?.icon || '📦',
          percent: monthTotal > 0 ? (amount / monthTotal) * 100 : 0,
        };
      })
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 4);
  }, [monthShared, categories, monthTotal]);

  async function generateInvite() {
    setBusy(true);
    setErrorMessage('');

    const { data, error } = await supabase.rpc('create_partner_invite');

    setBusy(false);

    if (error) {
      setErrorMessage(error.message || 'No se pudo generar el código.');
      return;
    }

    setStatus((current) =>
      current
        ? { ...current, invite_code: String(data || '') }
        : {
            household_id: null,
            my_role: null,
            partner_name: null,
            member_count: 1,
            invite_code: String(data || ''),
          },
    );
    await loadData();
  }

  async function joinWithCode() {
    const normalized = joinCode.trim().toUpperCase();

    if (normalized.length !== 8) {
      setErrorMessage('El código debe tener 8 caracteres.');
      return;
    }

    setBusy(true);
    setErrorMessage('');

    const { error } = await supabase.rpc('join_household_by_code', {
      p_code: normalized,
    });

    setBusy(false);

    if (error) {
      setErrorMessage(error.message || 'No se pudo vincular la pareja.');
      return;
    }

    setJoinCode('');
    await loadData();
  }

  async function copyInvite() {
    if (!status?.invite_code) return;
    await navigator.clipboard.writeText(status.invite_code);
  }

  if (loading || !user) {
    return (
      <main className="dashboardLoading">
        <p>Cargando espacio de pareja...</p>
      </main>
    );
  }

  if (!linked) {
    return (
      <main className="coupleConnectPage">
        <header className="expenseTopbar">
          <a className="brand" href="/espacio">
            <span className="brandMark" aria-hidden="true">
              <span className="brandDollar">$</span>
            </span>
            <span>MiFinanzas</span>
          </a>
          <a className="expenseBack" href="/espacio">← Cambiar espacio</a>
        </header>

        <section className="coupleConnectWrap">
          <div className="coupleConnectIntro">
            <p className="eyebrow">ESPACIO PAREJA</p>
            <h1>Conecten sus finanzas compartidas.</h1>
            <p>
              Cada uno conserva sus gastos personales en privado. Aquí solo verán lo que ambos decidan compartir.
            </p>
          </div>

          <div className="coupleConnectGrid">
            <section className="coupleConnectCard">
              <span className="coupleConnectIcon">＋</span>
              <h2>Invitar a tu pareja</h2>
              <p>Genera un código de 8 caracteres y compártelo con la otra cuenta.</p>

              {status?.invite_code ? (
                <div className="inviteCodeBox">
                  <strong>{status.invite_code}</strong>
                  <button type="button" onClick={() => void copyInvite()}>Copiar</button>
                </div>
              ) : (
                <button
                  className="primaryButton coupleConnectButton"
                  type="button"
                  onClick={() => void generateInvite()}
                  disabled={busy}
                >
                  {busy ? 'Generando...' : 'Generar código'}
                </button>
              )}
            </section>

            <section className="coupleConnectCard">
              <span className="coupleConnectIcon pink">↔</span>
              <h2>Ya tengo un código</h2>
              <p>Ingresa el código generado desde la cuenta de tu pareja.</p>

              <input
                className="inviteInput"
                type="text"
                value={joinCode}
                onChange={(event) => setJoinCode(event.target.value.toUpperCase())}
                placeholder="XXXXXXXX"
                maxLength={8}
              />

              <button
                className="primaryButton coupleConnectButton couplePinkButton"
                type="button"
                onClick={() => void joinWithCode()}
                disabled={busy}
              >
                {busy ? 'Vinculando...' : 'Vincular pareja'}
              </button>
            </section>
          </div>

          {errorMessage ? <p className="formError coupleConnectError">{errorMessage}</p> : null}
        </section>
      </main>
    );
  }

  const balanceAbs = Math.abs(partnerBalance);
  const balanceText =
    partnerBalance > 0.005
      ? partnerName + ' te debe'
      : partnerBalance < -0.005
      ? 'Debes a ' + partnerName
      : 'Están al día';

  return (
    <main className="coupleShell">
      <aside className="coupleSidebar">
        <a className="brand" href="/espacio">
          <span className="brandMark" aria-hidden="true">
            <span className="brandDollar">$</span>
          </span>
          <span>MiFinanzas</span>
        </a>

        <nav className="coupleNav">
          <a className="active" href="/pareja">♥ Pareja</a>
          <a href="/nuevo-gasto?type=compartido">＋ Nuevo gasto</a>
          <a href="/movimientos?filter=compartido">▣ Movimientos</a>
          <a href="/presupuestos?scope=pareja">◎ Presupuestos</a>
          <a href="/estadisticas?scope=pareja">◫ Estadísticas</a>
          <a href="/espacio">↔ Cambiar espacio</a>
        </nav>
      </aside>

      <section className="coupleMain">
        <header className="coupleHeader">
          <div>
            <p className="eyebrow">ESPACIO PAREJA</p>
            <h1>{displayName} + {partnerName}</h1>
            <p>Finanzas compartidas, separadas de lo personal.</p>
          </div>
          <a className="coupleNewButton" href="/nuevo-gasto?type=compartido">＋ Nuevo gasto</a>
        </header>

        <div className="coupleSummaryGrid">
          <section className="coupleHeroCard">
            <span>Gastado juntos este mes</span>
            <strong>{formatMoney(monthTotal)}</strong>
            <div className="couplePaidRow">
              <div>
                <small>Pagaste tú</small>
                <b className="statsBlue">{formatMoney(paidByMe)}</b>
              </div>
              <div>
                <small>Pagó {partnerName}</small>
                <b className="statsPink">{formatMoney(paidByPartner)}</b>
              </div>
            </div>
          </section>

          <section className="coupleDebtCard">
            <span>Balance entre ustedes</span>
            <strong>{balanceText}</strong>
            <b>{formatMoney(balanceAbs)}</b>
            <small>
              {partnerBalance > 0.005
                ? 'Saldo a tu favor'
                : partnerBalance < -0.005
                ? 'Saldo pendiente'
                : 'Sin pagos pendientes'}
            </small>
          </section>
        </div>

        <div className="coupleDashboardGrid">
          <section className="couplePanel">
            <div className="couplePanelHeader">
              <div>
                <p className="eyebrow">ÚLTIMOS GASTOS</p>
                <h2>Movimientos compartidos</h2>
              </div>
              <a href="/movimientos?filter=compartido">Ver todos</a>
            </div>

            <div className="coupleExpenseList">
              {expenses.slice(0, 6).length ? (
                expenses.slice(0, 6).map((expense) => {
                  const category = categories.find((item) => item.slug === expense.category);
                  const payment = paymentMethods.find((item) => item.slug === expense.payment_method);
                  const creatorShare =
                    expense.created_by === user.id
                      ? Number(expense.my_share || 0)
                      : Number(expense.partner_share || 0);

                  return (
                    <article className="coupleExpenseRow" key={expense.id}>
                      <span className="coupleExpenseIcon">{category?.icon || '🧾'}</span>
                      <div>
                        <b>{expense.description}</b>
                        <small>
                          Pagó {expense.payer_id === user.id ? 'tú' : partnerName} · Tu parte {formatMoney(creatorShare)}
                        </small>
                        <small>{payment?.name || expense.payment_method || 'Sin especificar'} · {formatDate(expense.created_at)}</small>
                      </div>
                      <strong>{formatMoney(expense.amount)}</strong>
                    </article>
                  );
                })
              ) : (
                <div className="coupleEmpty">
                  <b>Aún no hay gastos juntos.</b>
                  <span>Registra el primero desde “Nuevo gasto”.</span>
                </div>
              )}
            </div>
          </section>

          <section className="couplePanel">
            <div className="couplePanelHeader">
              <div>
                <p className="eyebrow">ESTE MES</p>
                <h2>Por categoría</h2>
              </div>
              <a href="/estadisticas?scope=pareja">Ver estadísticas</a>
            </div>

            <div className="coupleCategoryList">
              {categorySummary.length ? (
                categorySummary.map((item) => (
                  <div className="coupleCategoryRow" key={item.slug}>
                    <span>{item.icon}</span>
                    <div>
                      <div>
                        <b>{item.name}</b>
                        <small>{Math.round(item.percent)}%</small>
                      </div>
                      <div className="coupleCategoryTrack">
                        <div style={{ width: Math.min(100, item.percent) + '%' }} />
                      </div>
                    </div>
                    <strong>{formatMoney(item.amount)}</strong>
                  </div>
                ))
              ) : (
                <div className="coupleEmpty">
                  <span>Sin datos este mes.</span>
                </div>
              )}
            </div>
          </section>
        </div>
      </section>
    </main>
  );
}
