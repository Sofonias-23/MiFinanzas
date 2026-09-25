'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import type { User } from '@supabase/supabase-js';

import { supabase } from '@/lib/supabase';

type Filter = 'todos' | 'personal' | 'compartido';

type ExpenseRow = {
  id: string;
  amount: number;
  description: string;
  type: 'personal' | 'compartido';
  category: string | null;
  payment_method: string | null;
  created_at: string;
  created_by: string;
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

function normalizeFilter(value: string | null): Filter {
  if (value === 'personal' || value === 'compartido') return value;
  return 'todos';
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
    year: 'numeric',
  }).format(new Date(value));
}

export default function MovimientosPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [user, setUser] = useState<User | null>(null);
  const [expenses, setExpenses] = useState<ExpenseRow[]>([]);
  const [incomes, setIncomes] = useState<IncomeRow[]>([]);
  const [categories, setCategories] = useState<CategoryRow[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<PaymentRow[]>([]);
  const [filter, setFilter] = useState<Filter>(() => normalizeFilter(searchParams.get('filter')));
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setFilter(normalizeFilter(searchParams.get('filter')));
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

      const [expenseResult, incomeResult, categoryResult, paymentResult] = await Promise.all([
        supabase
          .from('expenses')
          .select('id, amount, description, type, category, payment_method, created_at, created_by, my_share, partner_share')
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
      ]);

      if (!active) return;

      setUser(currentUser);
      setExpenses((expenseResult.data ?? []) as ExpenseRow[]);
      setIncomes((incomeResult.data ?? []) as IncomeRow[]);
      setCategories((categoryResult.data ?? []) as CategoryRow[]);
      setPaymentMethods((paymentResult.data ?? []) as PaymentRow[]);
      setLoading(false);
    }

    void load();

    return () => {
      active = false;
    };
  }, [router]);

  const movements = useMemo(() => {
    const query = search.trim().toLowerCase();

    const expenseMovements = expenses
      .filter((expense) => {
        if (filter === 'personal' && expense.type !== 'personal') return false;
        if (filter === 'compartido' && expense.type !== 'compartido') return false;
        if (query && !expense.description.toLowerCase().includes(query)) return false;
        return true;
      })
      .map((expense) => {
        const category = categories.find((item) => item.slug === expense.category);
        const payment = paymentMethods.find((item) => item.slug === expense.payment_method);
        const amount =
          expense.type === 'compartido'
            ? expense.created_by === user?.id
              ? Number(expense.my_share || 0)
              : Number(expense.partner_share || 0)
            : Number(expense.amount || 0);

        return {
          id: 'expense-' + expense.id,
          kind: 'expense' as const,
          expenseId: expense.id,
          description: expense.description,
          amount,
          createdAt: expense.created_at,
          icon: category?.icon || '🧾',
          meta: [
            category?.name || expense.category || 'Otros',
            payment?.name || expense.payment_method || 'Sin especificar',
            expense.type === 'compartido' ? 'Compartido' : 'Personal',
          ].join(' · '),
        };
      });

    const incomeMovements =
      filter === 'compartido'
        ? []
        : incomes
            .filter((income) =>
              query ? income.description.toLowerCase().includes(query) : true,
            )
            .map((income) => ({
              id: 'income-' + income.id,
              kind: 'income' as const,
              expenseId: null,
              description: income.description,
              amount: Number(income.amount || 0),
              createdAt: income.created_at,
              icon: '💰',
              meta: 'Ingreso personal',
            }));

    return [...expenseMovements, ...incomeMovements].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );
  }, [expenses, incomes, categories, paymentMethods, filter, search, user]);

  const totals = useMemo(() => {
    let income = 0;
    let expense = 0;

    movements.forEach((movement) => {
      if (movement.kind === 'income') income += movement.amount;
      else expense += movement.amount;
    });

    return { income, expense, balance: income - expense };
  }, [movements]);

  if (loading || !user) {
    return (
      <main className="dashboardLoading">
        <p>Cargando movimientos...</p>
      </main>
    );
  }

  return (
    <main className="movementsPage">
      <header className="expenseTopbar">
        <a className="brand" href="/dashboard">
          <span className="brandMark" aria-hidden="true">
            <span className="brandDollar">$</span>
          </span>
          <span>MiFinanzas</span>
        </a>

        <div className="movementTopActions">
          <a className="expenseBack" href="/dashboard">← Mi dinero</a>
          <a className="primaryButton small" href="/nuevo-gasto">＋ Nuevo gasto</a>
        </div>
      </header>

      <section className="movementsWrap">
        <div className="movementsHeading">
          <div>
            <p className="eyebrow">HISTORIAL</p>
            <h1>Movimientos</h1>
            <p>Consulta gastos e ingresos de tu cuenta y del espacio compartido.</p>
          </div>

          <div className="movementTotals">
            <div>
              <span>Ingresos</span>
              <b className="moneyIncome">+ {formatMoney(totals.income)}</b>
            </div>
            <div>
              <span>Gastos</span>
              <b className="moneyExpense">- {formatMoney(totals.expense)}</b>
            </div>
            <div>
              <span>Balance</span>
              <b>{formatMoney(totals.balance)}</b>
            </div>
          </div>
        </div>

        <div className="movementControls">
          <input
            className="movementSearch"
            type="search"
            placeholder="Buscar movimiento..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />

          <div className="movementFilters">
            {[
              ['todos', 'Todos'],
              ['personal', 'Mi dinero'],
              ['compartido', 'Pareja'],
            ].map(([value, label]) => (
              <button
                key={value}
                type="button"
                className={filter === value ? 'movementFilter active' : 'movementFilter'}
                onClick={() => setFilter(value as Filter)}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        <div className="movementTableCard">
          <div className="movementTableHeader">
            <span>Movimiento</span>
            <span>Detalle</span>
            <span>Fecha</span>
            <span>Monto</span>
          </div>

          {movements.length ? (
            <div className="movementRows">
              {movements.map((movement) => (
                <div className="movementRow" key={movement.id}>
                  <div className="movementMain">
                    <span className={movement.kind === 'income' ? 'movementBigIcon incomeIcon' : 'movementBigIcon'}>
                      {movement.icon}
                    </span>
                    <div>
                      <b>{movement.description}</b>
                      <small>{movement.kind === 'income' ? 'Ingreso' : 'Gasto'}</small>
                    </div>
                  </div>

                  <span className="movementMeta">{movement.meta}</span>
                  <span className="movementDate">{formatDate(movement.createdAt)}</span>
                  <strong className={movement.kind === 'income' ? 'moneyIncome' : 'moneyExpense'}>
                    {movement.kind === 'income' ? '+' : '-'} {formatMoney(movement.amount)}
                  </strong>
                </div>
              ))}
            </div>
          ) : (
            <div className="movementEmpty">
              <b>No hay movimientos</b>
              <span>Prueba otro filtro o registra un nuevo movimiento.</span>
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
