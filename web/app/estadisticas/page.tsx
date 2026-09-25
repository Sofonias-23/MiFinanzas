'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import type { User } from '@supabase/supabase-js';

import { supabase } from '@/lib/supabase';

type Scope = 'personal' | 'pareja';

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

type IncomeRow = {
  id: string;
  amount: number;
  description: string;
  created_at: string;
};

type CategoryRow = {
  slug: string;
  name: string;
  icon: string;
};

type PaymentRow = {
  slug: string;
  name: string;
  icon: string;
};

type SettlementRow = {
  id: string;
  payer_id: string;
  receiver_id: string;
  amount: number;
};

type PartnerStatus = {
  household_id: string | null;
  partner_name: string | null;
  member_count: number;
};

const PALETTE = ['#23A7FF', '#F43F75', '#FFB454', '#8B5CF6', '#54D6C5'];

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

function normalizeScope(value: string | null): Scope {
  return value === 'pareja' ? 'pareja' : 'personal';
}

export default function EstadisticasPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [user, setUser] = useState<User | null>(null);
  const [scope, setScope] = useState<Scope>(() => normalizeScope(searchParams.get('scope')));
  const [expenses, setExpenses] = useState<ExpenseRow[]>([]);
  const [incomes, setIncomes] = useState<IncomeRow[]>([]);
  const [categories, setCategories] = useState<CategoryRow[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<PaymentRow[]>([]);
  const [settlements, setSettlements] = useState<SettlementRow[]>([]);
  const [partnerName, setPartnerName] = useState('tu pareja');
  const [partnerLinked, setPartnerLinked] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setScope(normalizeScope(searchParams.get('scope')));
  }, [searchParams]);

  useEffect(() => {
    let active = true;

    async function load() {
      const { data: sessionData } = await supabase.auth.getSession();
      const currentUser = sessionData.session?.user ?? null;

      if (!currentUser) {
        router.replace('/login');
        return;
      }

      const [expenseResult, incomeResult, categoryResult, paymentResult, settlementResult, partnerResult] =
        await Promise.all([
          supabase
            .from('expenses')
            .select('id, amount, description, type, category, payment_method, created_at, created_by, payer_id, my_share, partner_share')
            .order('created_at', { ascending: false }),
          supabase
            .from('incomes')
            .select('id, amount, description, created_at')
            .order('created_at', { ascending: false }),
          supabase
            .from('expense_categories')
            .select('slug, name, icon')
            .order('created_at', { ascending: true }),
          supabase
            .from('payment_methods')
            .select('slug, name, icon')
            .order('created_at', { ascending: true }),
          supabase
            .from('partner_settlements')
            .select('id, payer_id, receiver_id, amount')
            .order('created_at', { ascending: false }),
          supabase.rpc('get_partner_status'),
        ]);

      if (!active) return;

      setUser(currentUser);
      setExpenses(
        ((expenseResult.data ?? []) as ExpenseRow[]).map((item) => ({
          ...item,
          amount: Number(item.amount),
          my_share: Number(item.my_share || 0),
          partner_share: Number(item.partner_share || 0),
        })),
      );
      setIncomes(
        ((incomeResult.data ?? []) as IncomeRow[]).map((item) => ({
          ...item,
          amount: Number(item.amount),
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

      const status = (partnerResult.data?.[0] ?? null) as PartnerStatus | null;
      setPartnerLinked(Boolean(status?.member_count && status.member_count >= 2));
      setPartnerName(status?.partner_name || 'tu pareja');
      setLoading(false);
    }

    void load();

    return () => {
      active = false;
    };
  }, [router]);

  const monthExpenses = useMemo(
    () =>
      expenses.filter(
        (expense) =>
          isCurrentMonth(expense.created_at) &&
          (scope === 'personal'
            ? expense.type === 'personal'
            : expense.type === 'compartido'),
      ),
    [expenses, scope],
  );

  const totalSpent = useMemo(
    () => monthExpenses.reduce((sum, expense) => sum + Number(expense.amount || 0), 0),
    [monthExpenses],
  );

  const totalIncome = useMemo(
    () =>
      scope === 'personal'
        ? incomes
            .filter((income) => isCurrentMonth(income.created_at))
            .reduce((sum, income) => sum + Number(income.amount || 0), 0)
        : 0,
    [incomes, scope],
  );

  const paidByMe = useMemo(
    () =>
      scope === 'pareja'
        ? monthExpenses
            .filter((expense) => expense.payer_id === user?.id)
            .reduce((sum, expense) => sum + Number(expense.amount || 0), 0)
        : 0,
    [monthExpenses, scope, user],
  );

  const paidByPartner = scope === 'pareja' ? Math.max(0, totalSpent - paidByMe) : 0;

  const partnerBalance = useMemo(() => {
    if (!user) return 0;

    const expenseBalance = expenses
      .filter((expense) => expense.type === 'compartido')
      .reduce((balance, expense) => {
        const myCurrentShare =
          expense.created_by === user.id
            ? Number(expense.my_share || 0)
            : Number(expense.partner_share || 0);

        if (expense.payer_id === user.id) {
          return balance + (Number(expense.amount || 0) - myCurrentShare);
        }

        return balance - myCurrentShare;
      }, 0);

    const settlementBalance = settlements.reduce((balance, settlement) => {
      if (settlement.payer_id === user.id) return balance + settlement.amount;
      if (settlement.receiver_id === user.id) return balance - settlement.amount;
      return balance;
    }, 0);

    return Math.round((expenseBalance + settlementBalance) * 100) / 100;
  }, [expenses, settlements, user]);

  const categoryStats = useMemo(() => {
    const totals = new Map<string, number>();

    monthExpenses.forEach((expense) => {
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
          percent: totalSpent > 0 ? (amount / totalSpent) * 100 : 0,
        };
      })
      .sort((a, b) => b.amount - a.amount);
  }, [monthExpenses, categories, totalSpent]);

  const paymentStats = useMemo(() => {
    const totals = new Map<string, number>();

    monthExpenses.forEach((expense) => {
      const slug = expense.payment_method || 'sin-especificar';
      totals.set(slug, (totals.get(slug) ?? 0) + Number(expense.amount || 0));
    });

    return Array.from(totals.entries())
      .map(([slug, amount]) => {
        const payment = paymentMethods.find((item) => item.slug === slug);
        return {
          slug,
          amount,
          name: payment?.name || slug,
          icon: payment?.icon || '💳',
          percent: totalSpent > 0 ? (amount / totalSpent) * 100 : 0,
        };
      })
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 4);
  }, [monthExpenses, paymentMethods, totalSpent]);

  const donutBackground = useMemo(() => {
    if (!categoryStats.length || totalSpent <= 0) {
      return 'conic-gradient(#1c2d43 0deg 360deg)';
    }

    let cursor = 0;
    const stops: string[] = [];

    categoryStats.slice(0, 5).forEach((item, index) => {
      const start = cursor;
      cursor += item.percent;
      stops.push(
        PALETTE[index] + ' ' + start.toFixed(2) + '% ' + Math.min(cursor, 100).toFixed(2) + '%',
      );
    });

    if (cursor < 100) {
      stops.push('#1c2d43 ' + cursor.toFixed(2) + '% 100%');
    }

    return 'conic-gradient(' + stops.join(', ') + ')';
  }, [categoryStats, totalSpent]);

  if (loading || !user) {
    return (
      <main className="dashboardLoading">
        <p>Cargando estadísticas...</p>
      </main>
    );
  }

  const monthName = new Intl.DateTimeFormat('es-PE', { month: 'long' }).format(new Date());
  const topCategory = categoryStats[0];
  const remaining = totalIncome - totalSpent;

  return (
    <main className="statsPage">
      <header className="expenseTopbar">
        <a className="brand" href="/dashboard">
          <span className="brandMark" aria-hidden="true">
            <span className="brandDollar">$</span>
          </span>
          <span>MiFinanzas</span>
        </a>
        <a className="expenseBack" href="/dashboard">← Mi dinero</a>
      </header>

      <section className="statsWrap">
        <div className="statsHeading">
          <div>
            <p className="eyebrow">ANÁLISIS DEL MES</p>
            <h1>Estadísticas</h1>
            <p>Lo importante de tus finanzas, sin números complicados.</p>
          </div>

          <div className="statsScopeTabs">
            <button
              type="button"
              className={scope === 'personal' ? 'statsScope active personal' : 'statsScope'}
              onClick={() => setScope('personal')}
            >
              👤 Mi dinero
            </button>
            <button
              type="button"
              className={scope === 'pareja' ? 'statsScope active couple' : 'statsScope'}
              onClick={() => setScope('pareja')}
            >
              🩷 Pareja
            </button>
          </div>
        </div>

        {scope === 'pareja' && !partnerLinked ? (
          <div className="budgetPartnerWarning">
            <b>Pareja no vinculada</b>
            <span>Vincula una cuenta de pareja para ver estadísticas compartidas.</span>
          </div>
        ) : null}

        <section className={scope === 'pareja' ? 'statsHero couple' : 'statsHero'}>
          <div className="statsDonutWrap">
            <div className="statsDonut" style={{ background: donutBackground }}>
              <div className="statsDonutHole">
                <strong>{formatMoney(totalSpent)}</strong>
                <span>Total</span>
              </div>
            </div>
          </div>

          <div className="statsHeroMain">
            <span>
              {scope === 'personal'
                ? 'Gastaste en ' + monthName
                : 'Gastaron juntos en ' + monthName}
            </span>
            <strong>{formatMoney(totalSpent)}</strong>
            <small>
              {topCategory
                ? 'Mayor gasto: ' + topCategory.icon + ' ' + topCategory.name
                : 'Aún sin movimientos'}
            </small>
          </div>

          <div className="statsHeroMetrics">
            {scope === 'personal' ? (
              <>
                <div>
                  <span>Ingresaste</span>
                  <b className="moneyIncome">{formatMoney(totalIncome)}</b>
                </div>
                <div>
                  <span>Te queda</span>
                  <b className={remaining < 0 ? 'moneyExpense' : ''}>{formatMoney(remaining)}</b>
                </div>
              </>
            ) : (
              <>
                <div>
                  <span>Pagaste tú</span>
                  <b className="statsBlue">{formatMoney(paidByMe)}</b>
                </div>
                <div>
                  <span>Pagó {partnerName}</span>
                  <b className="statsPink">{formatMoney(paidByPartner)}</b>
                </div>
              </>
            )}
          </div>
        </section>

        {scope === 'pareja' && partnerLinked ? (
          <section className="statsBalanceCard">
            <div>
              <span>Balance actual</span>
              <strong>
                {partnerBalance > 0.005
                  ? partnerName + ' te debe'
                  : partnerBalance < -0.005
                  ? 'Debes a ' + partnerName
                  : 'Están al día'}
              </strong>
            </div>
            <b className={partnerBalance > 0.005 ? 'moneyIncome' : partnerBalance < -0.005 ? 'statsPink' : ''}>
              {formatMoney(Math.abs(partnerBalance))}
            </b>
          </section>
        ) : null}

        <div className="statsGrid">
          <section className="statsPanel">
            <div className="statsPanelHeader">
              <div>
                <p className="eyebrow">CATEGORÍAS</p>
                <h2>¿En qué gastaron más?</h2>
              </div>
              <span>Este mes</span>
            </div>

            {categoryStats.length ? (
              <div className="statsCategoryList">
                {categoryStats.slice(0, 5).map((item, index) => (
                  <div className="statsCategoryRow" key={item.slug}>
                    <span className="statsCategoryIcon">{item.icon}</span>
                    <div className="statsCategoryInfo">
                      <div>
                        <b>{item.name}</b>
                        <span>{Math.round(item.percent)}%</span>
                      </div>
                      <div className="statsTrack">
                        <div
                          className="statsFill"
                          style={{
                            width: Math.min(100, item.percent) + '%',
                            background: PALETTE[index] || '#3B82F6',
                          }}
                        />
                      </div>
                    </div>
                    <strong>{formatMoney(item.amount)}</strong>
                  </div>
                ))}
              </div>
            ) : (
              <div className="statsEmpty">Todavía no hay gastos para analizar.</div>
            )}
          </section>

          <section className="statsPanel">
            <div className="statsPanelHeader">
              <div>
                <p className="eyebrow">PAGOS</p>
                <h2>¿Cómo pagaron?</h2>
              </div>
            </div>

            {paymentStats.length ? (
              <div className="statsPaymentGrid">
                {paymentStats.map((item) => (
                  <div className="statsPaymentCard" key={item.slug}>
                    <span>{item.icon}</span>
                    <b>{item.name}</b>
                    <strong>{Math.round(item.percent)}%</strong>
                    <small>{formatMoney(item.amount)}</small>
                  </div>
                ))}
              </div>
            ) : (
              <div className="statsEmpty">Aún no hay métodos de pago para mostrar.</div>
            )}
          </section>
        </div>

        {topCategory ? (
          <section className="statsInsight">
            <span>🏆</span>
            <div>
              <b>Lo más importante del mes</b>
              <p>
                {scope === 'personal' ? 'Gastaste' : 'Gastaron'} más en {topCategory.name}: {formatMoney(topCategory.amount)}.
              </p>
            </div>
          </section>
        ) : null}

        {scope === 'pareja' && partnerLinked ? (
          <section className="statsCompare">
            <div className="statsPanelHeader">
              <div>
                <p className="eyebrow">PAREJA</p>
                <h2>¿Quién pagó más?</h2>
              </div>
            </div>

            <div className="statsCompareRow">
              <span>Tú</span>
              <strong>{totalSpent > 0 ? Math.round((paidByMe / totalSpent) * 100) : 0}%</strong>
            </div>
            <div className="statsCompareTrack">
              <div
                className="statsCompareMine"
                style={{ width: (totalSpent > 0 ? Math.min(100, (paidByMe / totalSpent) * 100) : 0) + '%' }}
              />
            </div>

            <div className="statsCompareRow">
              <span>{partnerName}</span>
              <strong>{totalSpent > 0 ? Math.round((paidByPartner / totalSpent) * 100) : 0}%</strong>
            </div>
            <div className="statsCompareTrack">
              <div
                className="statsComparePartner"
                style={{ width: (totalSpent > 0 ? Math.min(100, (paidByPartner / totalSpent) * 100) : 0) + '%' }}
              />
            </div>
          </section>
        ) : null}
      </section>
    </main>
  );
}
