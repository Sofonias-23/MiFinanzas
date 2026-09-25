'use client';

import { FormEvent, useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import type { User } from '@supabase/supabase-js';

import { supabase } from '@/lib/supabase';

type BudgetScope = 'personal' | 'pareja';

type BudgetRow = {
  id: string;
  scope: BudgetScope;
  user_id: string | null;
  household_id: string | null;
  category: string;
  amount: number;
  month: string;
};

type CategoryRow = {
  id: string;
  slug: string;
  name: string;
  icon: string;
};

type ExpenseRow = {
  id: string;
  amount: number;
  type: 'personal' | 'compartido';
  category: string | null;
  created_at: string;
};

type PartnerStatus = {
  household_id: string | null;
  member_count: number;
};

function currentMonthKey() {
  const now = new Date();
  return now.getFullYear() + '-' + String(now.getMonth() + 1).padStart(2, '0') + '-01';
}

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

function normalizeScope(value: string | null): BudgetScope {
  return value === 'pareja' ? 'pareja' : 'personal';
}

export default function PresupuestosPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [user, setUser] = useState<User | null>(null);
  const [scope, setScope] = useState<BudgetScope>(() => normalizeScope(searchParams.get('scope')));
  const [budgets, setBudgets] = useState<BudgetRow[]>([]);
  const [categories, setCategories] = useState<CategoryRow[]>([]);
  const [expenses, setExpenses] = useState<ExpenseRow[]>([]);
  const [householdId, setHouseholdId] = useState<string | null>(null);
  const [category, setCategory] = useState('');
  const [amount, setAmount] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    setScope(normalizeScope(searchParams.get('scope')));
  }, [searchParams]);

  const loadData = useCallback(async () => {
    const { data: sessionData } = await supabase.auth.getSession();
    const currentUser = sessionData.session?.user ?? null;

    if (!currentUser) {
      router.replace('/login');
      return;
    }

    const [budgetResult, categoryResult, expenseResult, partnerResult] = await Promise.all([
      supabase
        .from('budgets')
        .select('id, scope, user_id, household_id, category, amount, month')
        .eq('month', currentMonthKey())
        .order('created_at', { ascending: true }),
      supabase
        .from('expense_categories')
        .select('id, slug, name, icon')
        .order('created_at', { ascending: true }),
      supabase
        .from('expenses')
        .select('id, amount, type, category, created_at')
        .order('created_at', { ascending: false }),
      supabase.rpc('get_partner_status'),
    ]);

    setUser(currentUser);
    setBudgets(
      ((budgetResult.data ?? []) as BudgetRow[]).map((item) => ({
        ...item,
        amount: Number(item.amount),
      })),
    );
    setCategories((categoryResult.data ?? []) as CategoryRow[]);
    setExpenses(
      ((expenseResult.data ?? []) as ExpenseRow[]).map((item) => ({
        ...item,
        amount: Number(item.amount),
      })),
    );

    const status = (partnerResult.data?.[0] ?? null) as PartnerStatus | null;
    setHouseholdId(
      status && status.member_count >= 2 && status.household_id ? status.household_id : null,
    );

    setLoading(false);
  }, [router]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('web-budgets-' + user.id)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'budgets' },
        () => void loadData(),
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'expenses' },
        () => void loadData(),
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [user, loadData]);

  useEffect(() => {
    if (!category && categories.length) {
      setCategory(categories[0].slug);
    }
  }, [categories, category]);

  const visibleBudgets = useMemo(
    () => budgets.filter((budget) => budget.scope === scope),
    [budgets, scope],
  );

  const spentByCategory = useMemo(() => {
    const result: Record<string, number> = {};

    for (const expense of expenses) {
      if (!isCurrentMonth(expense.created_at)) continue;
      if (scope === 'personal' && expense.type !== 'personal') continue;
      if (scope === 'pareja' && expense.type !== 'compartido') continue;

      const key = expense.category || 'otros';
      result[key] = (result[key] ?? 0) + Number(expense.amount || 0);
    }

    return result;
  }, [expenses, scope]);

  const totalBudget = useMemo(
    () => visibleBudgets.reduce((sum, item) => sum + Number(item.amount || 0), 0),
    [visibleBudgets],
  );

  const totalSpent = useMemo(
    () =>
      visibleBudgets.reduce(
        (sum, item) => sum + Number(spentByCategory[item.category] || 0),
        0,
      ),
    [visibleBudgets, spentByCategory],
  );

  const totalPercent = totalBudget > 0 ? Math.min(100, Math.round((totalSpent / totalBudget) * 100)) : 0;
  const monthLabel = new Intl.DateTimeFormat('es-PE', {
    month: 'long',
    year: 'numeric',
  }).format(new Date());

  function resetForm() {
    setEditingId(null);
    setAmount('');
    setCategory(categories[0]?.slug ?? '');
    setShowForm(false);
    setErrorMessage('');
  }

  function startEdit(item: BudgetRow) {
    setEditingId(item.id);
    setCategory(item.category);
    setAmount(Number(item.amount).toFixed(2));
    setShowForm(true);
    setErrorMessage('');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  async function saveBudget(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage('');

    if (!user) {
      router.replace('/login');
      return;
    }

    const parsedAmount = Number(amount.replace(',', '.'));

    if (!category) {
      setErrorMessage('Selecciona una categoría.');
      return;
    }

    if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
      setErrorMessage('Escribe un presupuesto mayor a cero.');
      return;
    }

    if (scope === 'pareja' && !householdId) {
      setErrorMessage('Primero vincula a tu pareja para crear un presupuesto compartido.');
      return;
    }

    const duplicate = visibleBudgets.find(
      (item) => item.category === category && item.id !== editingId,
    );

    if (duplicate) {
      setErrorMessage('Ya existe un presupuesto para esta categoría este mes.');
      return;
    }

    setBusy(true);

    let error = null;

    if (editingId) {
      const result = await supabase
        .from('budgets')
        .update({
          category,
          amount: Math.round(parsedAmount * 100) / 100,
          updated_at: new Date().toISOString(),
        })
        .eq('id', editingId);
      error = result.error;
    } else if (scope === 'personal') {
      const result = await supabase.from('budgets').insert({
        scope: 'personal',
        user_id: user.id,
        household_id: null,
        category,
        amount: Math.round(parsedAmount * 100) / 100,
        month: currentMonthKey(),
        created_by: user.id,
      });
      error = result.error;
    } else {
      const result = await supabase.from('budgets').insert({
        scope: 'pareja',
        user_id: null,
        household_id: householdId,
        category,
        amount: Math.round(parsedAmount * 100) / 100,
        month: currentMonthKey(),
        created_by: user.id,
      });
      error = result.error;
    }

    setBusy(false);

    if (error) {
      setErrorMessage(error.message || 'No se pudo guardar el presupuesto.');
      return;
    }

    await loadData();
    resetForm();
  }

  async function deleteBudget(item: BudgetRow) {
    const confirmed = window.confirm(
      '¿Eliminar este presupuesto? Tus gastos no se borrarán.',
    );
    if (!confirmed) return;

    const { error } = await supabase.from('budgets').delete().eq('id', item.id);

    if (error) {
      setErrorMessage(error.message || 'No se pudo eliminar el presupuesto.');
      return;
    }

    await loadData();
  }

  if (loading || !user) {
    return (
      <main className="dashboardLoading">
        <p>Cargando presupuestos...</p>
      </main>
    );
  }

  return (
    <main className="budgetsPage">
      <header className="expenseTopbar">
        <a className="brand" href="/dashboard">
          <span className="brandMark" aria-hidden="true">
            <span className="brandDollar">$</span>
          </span>
          <span>MiFinanzas</span>
        </a>
        <a className="expenseBack" href="/dashboard">← Mi dinero</a>
      </header>

      <section className="budgetsWrap">
        <div className="budgetsHeading">
          <div>
            <p className="eyebrow">PLAN DEL MES</p>
            <h1>Presupuestos</h1>
            <p>Controla cuánto quieres gastar durante {monthLabel}.</p>
          </div>

          <button
            className="primaryButton budgetNewButton"
            type="button"
            onClick={() => {
              if (showForm) resetForm();
              else setShowForm(true);
            }}
          >
            {showForm ? 'Cerrar' : '＋ Nuevo presupuesto'}
          </button>
        </div>

        <div className="budgetScopeTabs">
          <button
            type="button"
            className={scope === 'personal' ? 'budgetScope active personal' : 'budgetScope'}
            onClick={() => {
              setScope('personal');
              resetForm();
            }}
          >
            👤 Mi dinero
          </button>
          <button
            type="button"
            className={scope === 'pareja' ? 'budgetScope active couple' : 'budgetScope'}
            onClick={() => {
              setScope('pareja');
              resetForm();
            }}
          >
            👥 Pareja
          </button>
        </div>

        {scope === 'pareja' && !householdId ? (
          <div className="budgetPartnerWarning">
            <b>Pareja no vinculada</b>
            <span>Vincula primero tu cuenta con tu pareja para usar presupuestos compartidos.</span>
          </div>
        ) : null}

        <section className="budgetSummaryCard">
          <div>
            <span>Presupuesto {scope === 'personal' ? 'personal' : 'de pareja'}</span>
            <strong>{formatMoney(totalSpent)}</strong>
            <small>de {formatMoney(totalBudget)}</small>
          </div>
          <div className="budgetSummaryRight">
            <b>{totalBudget > 0 ? Math.round((totalSpent / totalBudget) * 100) + '%' : '0%'}</b>
            <span>{totalBudget > totalSpent ? formatMoney(totalBudget - totalSpent) + ' disponibles' : 'Límite alcanzado'}</span>
          </div>
          <div className="budgetProgressTrack">
            <div
              className={
                totalBudget > 0 && totalSpent >= totalBudget
                  ? 'budgetProgressFill danger'
                  : totalBudget > 0 && totalSpent / totalBudget >= 0.75
                  ? 'budgetProgressFill warn'
                  : 'budgetProgressFill'
              }
              style={{ width: totalPercent + '%' }}
            />
          </div>
        </section>

        {showForm ? (
          <form className="budgetForm" onSubmit={saveBudget}>
            <div>
              <label htmlFor="budget-category">Categoría</label>
              <select
                id="budget-category"
                value={category}
                onChange={(event) => setCategory(event.target.value)}
              >
                {categories.map((item) => (
                  <option key={item.id} value={item.slug}>
                    {item.icon} {item.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="budget-amount">Límite mensual</label>
              <div className="budgetAmountControl">
                <span>S/</span>
                <input
                  id="budget-amount"
                  type="text"
                  inputMode="decimal"
                  placeholder="0.00"
                  value={amount}
                  onChange={(event) => setAmount(event.target.value)}
                  required
                />
              </div>
            </div>

            {errorMessage ? <p className="formError budgetFormError">{errorMessage}</p> : null}

            <div className="budgetFormActions">
              <button className="ghostButton" type="button" onClick={resetForm}>
                Cancelar
              </button>
              <button className="primaryButton budgetSaveButton" type="submit" disabled={busy}>
                {busy ? 'Guardando...' : editingId ? 'Guardar cambios' : 'Crear presupuesto'}
              </button>
            </div>
          </form>
        ) : null}

        {!showForm && errorMessage ? <p className="formError budgetStandaloneError">{errorMessage}</p> : null}

        <section className="budgetListSection">
          <div className="budgetListHeader">
            <div>
              <p className="eyebrow">POR CATEGORÍA</p>
              <h2>{scope === 'personal' ? 'Mis límites' : 'Límites compartidos'}</h2>
            </div>
            <span>{visibleBudgets.length} configurados</span>
          </div>

          {visibleBudgets.length ? (
            <div className="budgetCards">
              {visibleBudgets.map((item) => {
                const categoryData = categories.find((entry) => entry.slug === item.category);
                const spent = Number(spentByCategory[item.category] || 0);
                const percent = item.amount > 0 ? Math.round((spent / item.amount) * 100) : 0;
                const capped = Math.min(100, percent);

                return (
                  <article className="budgetCategoryCard" key={item.id}>
                    <div className="budgetCategoryTop">
                      <span className="budgetCategoryIcon">{categoryData?.icon || '📦'}</span>
                      <div>
                        <b>{categoryData?.name || item.category}</b>
                        <span>{formatMoney(spent)} de {formatMoney(item.amount)}</span>
                      </div>
                      <strong className={percent >= 100 ? 'dangerText' : percent >= 75 ? 'warnText' : ''}>
                        {percent}%
                      </strong>
                    </div>

                    <div className="budgetCategoryTrack">
                      <div
                        className={
                          percent >= 100
                            ? 'budgetCategoryFill danger'
                            : percent >= 75
                            ? 'budgetCategoryFill warn'
                            : 'budgetCategoryFill'
                        }
                        style={{ width: capped + '%' }}
                      />
                    </div>

                    <div className="budgetCategoryFooter">
                      <span>
                        {spent <= item.amount
                          ? formatMoney(item.amount - spent) + ' disponibles'
                          : formatMoney(spent - item.amount) + ' sobre el límite'}
                      </span>
                      <div>
                        <button type="button" onClick={() => startEdit(item)}>Editar</button>
                        <button className="delete" type="button" onClick={() => void deleteBudget(item)}>Eliminar</button>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          ) : (
            <div className="budgetEmpty">
              <span>◎</span>
              <b>Aún no tienes presupuestos</b>
              <p>Crea un límite por categoría para saber cuánto llevas gastado durante el mes.</p>
              <button className="primaryButton small" type="button" onClick={() => setShowForm(true)}>
                Crear el primero
              </button>
            </div>
          )}
        </section>
      </section>
    </main>
  );
}
