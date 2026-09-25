'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import type { User } from '@supabase/supabase-js';

import { supabase } from '@/lib/supabase';

type ExpenseRow = {
  id: string;
  amount: number;
  description: string;
  type: string;
  category: string | null;
  payment_method: string | null;
  created_at: string;
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
};

type PaymentRow = {
  slug: string;
  name: string;
};

type BudgetRow = {
  category: string;
  amount: number;
};

function isCurrentMonth(value: string) {
  const date = new Date(value);
  const now = new Date();
  return date.getFullYear() === now.getFullYear() && date.getMonth() === now.getMonth();
}

function monthKey() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
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

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [displayName, setDisplayName] = useState('Usuario');
  const [expenses, setExpenses] = useState<ExpenseRow[]>([]);
  const [incomes, setIncomes] = useState<IncomeRow[]>([]);
  const [categories, setCategories] = useState<CategoryRow[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<PaymentRow[]>([]);
  const [budgets, setBudgets] = useState<BudgetRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    async function loadDashboard() {
      const { data: sessionData } = await supabase.auth.getSession();
      const currentUser = sessionData.session?.user ?? null;

      if (!currentUser) {
        router.replace('/login');
        return;
      }

      if (!active) return;
      setUser(currentUser);

      const [profileResult, expenseResult, incomeResult, categoryResult, paymentResult, budgetResult] =
        await Promise.all([
          supabase
            .from('profiles')
            .select('display_name')
            .eq('id', currentUser.id)
            .maybeSingle(),
          supabase
            .from('expenses')
            .select('id, amount, description, type, category, payment_method, created_at')
            .eq('type', 'personal')
            .order('created_at', { ascending: false }),
          supabase
            .from('incomes')
            .select('id, amount, description, created_at')
            .order('created_at', { ascending: false }),
          supabase
            .from('expense_categories')
            .select('slug, name')
            .order('created_at', { ascending: true }),
          supabase
            .from('payment_methods')
            .select('slug, name')
            .order('created_at', { ascending: true }),
          supabase
            .from('budgets')
            .select('category, amount')
            .eq('scope', 'personal')
            .eq('month', monthKey()),
        ]);

      if (!active) return;

      const fallbackName =
        currentUser.user_metadata?.display_name ||
        currentUser.email?.split('@')[0] ||
        'Usuario';

      setDisplayName(profileResult.data?.display_name || fallbackName);
      setExpenses((expenseResult.data ?? []) as ExpenseRow[]);
      setIncomes((incomeResult.data ?? []) as IncomeRow[]);
      setCategories((categoryResult.data ?? []) as CategoryRow[]);
      setPaymentMethods((paymentResult.data ?? []) as PaymentRow[]);
      setBudgets((budgetResult.data ?? []) as BudgetRow[]);
      setLoading(false);
    }

    void loadDashboard();

    return () => {
      active = false;
    };
  }, [router]);

  const monthExpenses = useMemo(
    () => expenses.filter((expense) => isCurrentMonth(expense.created_at)),
    [expenses],
  );

  const monthIncomes = useMemo(
    () => incomes.filter((income) => isCurrentMonth(income.created_at)),
    [incomes],
  );

  const totalExpense = useMemo(
    () => monthExpenses.reduce((sum, item) => sum + Number(item.amount || 0), 0),
    [monthExpenses],
  );

  const totalIncome = useMemo(
    () => monthIncomes.reduce((sum, item) => sum + Number(item.amount || 0), 0),
    [monthIncomes],
  );

  const balance = totalIncome - totalExpense;

  const budgetTotal = useMemo(
    () => budgets.reduce((sum, item) => sum + Number(item.amount || 0), 0),
    [budgets],
  );

  const budgetSpent = useMemo(
    () =>
      budgets.reduce((sum, budget) => {
        const spent = monthExpenses
          .filter((expense) => expense.category === budget.category)
          .reduce((acc, expense) => acc + Number(expense.amount || 0), 0);
        return sum + spent;
      }, 0),
    [budgets, monthExpenses],
  );

  const budgetPercent =
    budgetTotal > 0 ? Math.min(100, Math.round((budgetSpent / budgetTotal) * 100)) : 0;

  const recentMovements = useMemo(() => {
    const expenseMovements = expenses.map((expense) => ({
      id: `expense-${expense.id}`,
      kind: 'expense' as const,
      description: expense.description,
      amount: Number(expense.amount || 0),
      createdAt: expense.created_at,
      category:
        categories.find((item) => item.slug === expense.category)?.name ||
        expense.category ||
        'Otros',
      meta:
        paymentMethods.find((item) => item.slug === expense.payment_method)?.name ||
        expense.payment_method ||
        'Sin especificar',
    }));

    const incomeMovements = incomes.map((income) => ({
      id: `income-${income.id}`,
      kind: 'income' as const,
      description: income.description,
      amount: Number(income.amount || 0),
      createdAt: income.created_at,
      category: 'Ingreso',
      meta: 'Ingreso',
    }));

    return [...expenseMovements, ...incomeMovements]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 6);
  }, [expenses, incomes, categories, paymentMethods]);

  const categoryTotals = useMemo(() => {
    const totals = new Map<string, number>();

    monthExpenses.forEach((expense) => {
      const categoryName =
        categories.find((item) => item.slug === expense.category)?.name ||
        expense.category ||
        'Otros';
      totals.set(categoryName, (totals.get(categoryName) ?? 0) + Number(expense.amount || 0));
    });

    return Array.from(totals.entries())
      .map(([name, amount]) => ({
        name,
        amount,
        percentage: totalExpense > 0 ? Math.round((amount / totalExpense) * 100) : 0,
      }))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 4);
  }, [monthExpenses, categories, totalExpense]);

  async function handleLogout() {
    await supabase.auth.signOut();
    router.replace('/login');
  }

  if (loading || !user) {
    return (
      <main className="dashboardLoading">
        <div className="brand">
          <span className="brandMark" aria-hidden="true">
            <span className="brandDollar">$</span>
          </span>
          <span>MiFinanzas</span>
        </div>
        <p>Cargando Mi dinero...</p>
      </main>
    );
  }

  return (
    <main className="moneyShell">
      <aside className="moneySidebar">
        <a className="brand" href="/espacio">
          <span className="brandMark" aria-hidden="true">
            <span className="brandDollar">$</span>
          </span>
          <span>MiFinanzas</span>
        </a>

        <nav className="moneyNav">
          <a className="active" href="/dashboard">⌂ Mi dinero</a>
          <a href="/movimientos">▣ Movimientos</a>
          <a href="/presupuestos">◎ Presupuestos</a>
          <a href="/estadisticas">◫ Estadísticas</a>
          <a href="/categorias">◇ Categorías</a>
          <a href="/metodos-pago">▤ Métodos de pago</a>
          <a href="/perfil">◉ Perfil</a>
          <a href="/espacio">↔ Cambiar espacio</a>
        </nav>

        <button className="logoutButton" type="button" onClick={handleLogout}>
          Cerrar sesión
        </button>
      </aside>

      <section className="moneyMain">
        <header className="moneyHeader">
          <div>
            <p className="eyebrow">MI DINERO</p>
            <h1>Hola, {displayName}</h1>
            <p>Tu resumen personal del mes.</p>
          </div>
          <div className="moneyHeaderLinks">
            <a className="moneyProfileButton" href="/perfil">Perfil</a>
            <a className="moneyProfileButton" href="/espacio">Cambiar espacio</a>
          </div>
        </header>

        <section className="moneyBalanceCard">
          <div className="moneyBalanceTop">
            <div>
              <span>Saldo actual</span>
              <strong>{formatMoney(balance)}</strong>
            </div>
            <span className="moneyMonth">Este mes</span>
          </div>
          <div className="moneyMetrics">
            <div>
              <span>Ingresos</span>
              <b className="moneyIncome">+ {formatMoney(totalIncome)}</b>
            </div>
            <div>
              <span>Gastos</span>
              <b className="moneyExpense">- {formatMoney(totalExpense)}</b>
            </div>
          </div>
        </section>

        <div className="moneyQuickActions">
          <a className="moneyQuick moneyQuickPrimary" href="/nuevo-gasto">＋ Registrar gasto</a>
          <a className="moneyQuick" href="/nuevo-ingreso">＋ Registrar ingreso</a>
        </div>

        <section className="moneyBudgetCard">
          <div>
            <span>Presupuesto del mes</span>
            <strong>
              {budgetTotal > 0
                ? `${formatMoney(budgetSpent)} / ${formatMoney(budgetTotal)}`
                : 'Aún no configurado'}
            </strong>
          </div>
          <div className="moneyBudgetRight">
            <b>{budgetTotal > 0 ? `${budgetPercent}%` : '→'}</b>
            <a href="/presupuestos">Gestionar</a>
          </div>
          {budgetTotal > 0 ? (
            <div className="moneyBudgetTrack">
              <div className="moneyBudgetFill" style={{ width: `${budgetPercent}%` }} />
            </div>
          ) : null}
        </section>

        <div className="moneyGrid">
          <section className="moneyPanel">
            <div className="moneyPanelHeader">
              <div>
                <p className="eyebrow">MOVIMIENTOS</p>
                <h2>Últimos movimientos</h2>
              </div>
              <a href="/movimientos">Ver todos</a>
            </div>

            <div className="moneyMovementList">
              {recentMovements.length ? (
                recentMovements.map((movement) => (
                  <div className="moneyMovement" key={movement.id}>
                    <span className={movement.kind === 'income' ? 'movementIcon incomeIcon' : 'movementIcon'}>
                      {movement.kind === 'income' ? '↑' : '↓'}
                    </span>
                    <span className="movementCopy">
                      <b>{movement.description}</b>
                      <small>
                        {movement.category} · {movement.meta} · {formatDate(movement.createdAt)}
                      </small>
                    </span>
                    <strong className={movement.kind === 'income' ? 'moneyIncome' : 'moneyExpense'}>
                      {movement.kind === 'income' ? '+' : '-'} {formatMoney(movement.amount)}
                    </strong>
                  </div>
                ))
              ) : (
                <div className="moneyEmpty">
                  <b>Todo empieza con el primer movimiento.</b>
                  <span>Registra un gasto o ingreso para verlo aquí.</span>
                </div>
              )}
            </div>
          </section>

          <section className="moneyPanel">
            <div className="moneyPanelHeader">
              <div>
                <p className="eyebrow">ESTADÍSTICAS</p>
                <h2>Gastos por categoría</h2>
              </div>
              <a href="/estadisticas">Ver detalle</a>
            </div>

            <div className="categorySummary">
              <div className="donut" />
              <div className="legend">
                {categoryTotals.length ? (
                  categoryTotals.map((category, index) => (
                    <span key={category.name}>
                      <i className={'dot d' + ((index % 4) + 1)} />
                      {category.name}
                      <b>{category.percentage}%</b>
                    </span>
                  ))
                ) : (
                  <span className="emptyState">Aún no hay gastos este mes.</span>
                )}
              </div>
            </div>
          </section>
        </div>
      </section>
    </main>
  );
}
