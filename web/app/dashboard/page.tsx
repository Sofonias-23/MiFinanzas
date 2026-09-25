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
  created_at: string;
};

type IncomeRow = {
  id: string;
  amount: number;
  description: string;
  created_at: string;
};

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

      const [profileResult, expenseResult, incomeResult] = await Promise.all([
        supabase
          .from('profiles')
          .select('display_name')
          .eq('id', currentUser.id)
          .maybeSingle(),
        supabase
          .from('expenses')
          .select('id, amount, description, type, category, created_at')
          .order('created_at', { ascending: false }),
        supabase
          .from('incomes')
          .select('id, amount, description, created_at')
          .order('created_at', { ascending: false }),
      ]);

      if (!active) return;

      const fallbackName =
        currentUser.user_metadata?.display_name ||
        currentUser.email?.split('@')[0] ||
        'Usuario';

      setDisplayName(profileResult.data?.display_name || fallbackName);
      setExpenses((expenseResult.data ?? []) as ExpenseRow[]);
      setIncomes((incomeResult.data ?? []) as IncomeRow[]);
      setLoading(false);
    }

    void loadDashboard();

    return () => {
      active = false;
    };
  }, [router]);

  const totalExpenses = useMemo(
    () => expenses.reduce((sum, item) => sum + Number(item.amount || 0), 0),
    [expenses],
  );

  const totalIncome = useMemo(
    () => incomes.reduce((sum, item) => sum + Number(item.amount || 0), 0),
    [incomes],
  );

  const available = totalIncome - totalExpenses;

  const categoryTotals = useMemo(() => {
    const totals = new Map<string, number>();

    expenses.forEach((expense) => {
      const category = expense.category || 'otros';
      totals.set(category, (totals.get(category) ?? 0) + Number(expense.amount || 0));
    });

    return Array.from(totals.entries())
      .map(([name, amount]) => ({
        name,
        amount,
        percentage: totalExpenses > 0 ? Math.round((amount / totalExpenses) * 100) : 0,
      }))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 4);
  }, [expenses, totalExpenses]);

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
        <p>Cargando tus finanzas...</p>
      </main>
    );
  }

  return (
    <main className="dashboardShell">
      <aside className="sidebar">
        <a className="brand" href="/">
          <span className="brandMark" aria-hidden="true">
            <span className="brandDollar">$</span>
          </span>
          <span>MiFinanzas</span>
        </a>

        <nav>
          <a className="active" href="#">⌂ Inicio</a>
          <a href="#">▣ Gastos</a>
          <a href="#">◫ Estadísticas</a>
          <a href="#">◇ Deudas</a>
          <a href="#">◎ Metas</a>
          <a href="#">⚙ Configuración</a>
        </nav>

        <button className="logoutButton" type="button" onClick={handleLogout}>
          Cerrar sesión
        </button>
      </aside>

      <section className="dashboardMain">
        <div className="dashboardHeader">
          <div>
            <p className="eyebrow">MI PERFIL</p>
            <h1>Hola, {displayName}</h1>
            <p>Aquí tienes un resumen real de tus finanzas.</p>
          </div>
          <div className="profileSwitch">
            <button className="selected">Mi perfil</button>
            <button>Pareja</button>
          </div>
        </div>

        <div className="metricGrid">
          <article>
            <span>Gasto total</span>
            <strong>{formatMoney(totalExpenses)}</strong>
          </article>
          <article>
            <span>Ingresos</span>
            <strong>{formatMoney(totalIncome)}</strong>
          </article>
          <article>
            <span>Disponible</span>
            <strong>{formatMoney(available)}</strong>
          </article>
        </div>

        <div className="dashboardGrid">
          <article className="panel">
            <div className="panelTitle">
              <div>
                <span>Gastos por categoría</span>
                <strong>{formatMoney(totalExpenses)}</strong>
              </div>
              <div className="donut" />
            </div>

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
                <span className="emptyState">Aún no tienes gastos registrados.</span>
              )}
            </div>
          </article>

          <article className="panel">
            <div className="panelHeading">
              <h2>Últimos gastos</h2>
              <span>{expenses.length} registros</span>
            </div>

            <div className="expenseList">
              {expenses.slice(0, 6).map((expense) => (
                <div key={expense.id}>
                  <span className="expenseIcon">◈</span>
                  <span>
                    <b>{expense.description}</b>
                    <small>{formatDate(expense.created_at)}</small>
                  </span>
                  <strong>- {formatMoney(Number(expense.amount || 0))}</strong>
                </div>
              ))}

              {!expenses.length ? (
                <p className="emptyState">Los gastos que registres en la app aparecerán aquí.</p>
              ) : null}
            </div>
          </article>
        </div>
      </section>
    </main>
  );
}
