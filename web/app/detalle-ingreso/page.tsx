'use client';

import { Suspense, FormEvent, useCallback, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import type { User } from '@supabase/supabase-js';

import { supabase } from '@/lib/supabase';

type IncomeRow = {
  id: string;
  created_by: string;
  amount: number;
  description: string;
  created_at: string;
};

function money(value: number) {
  return new Intl.NumberFormat('es-PE', {
    style: 'currency',
    currency: 'PEN',
    minimumFractionDigits: 2,
  }).format(value);
}

function toDateTimeLocal(value: string) {
  const date = new Date(value);
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60_000);
  return local.toISOString().slice(0, 16);
}

function DetalleIngresoContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const incomeId = searchParams.get('id');

  const [user, setUser] = useState<User | null>(null);
  const [income, setIncome] = useState<IncomeRow | null>(null);
  const [editing, setEditing] = useState(false);
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [dateTime, setDateTime] = useState('');
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');

  const loadData = useCallback(async () => {
    if (!incomeId) {
      setLoading(false);
      return;
    }

    const { data: sessionData } = await supabase.auth.getSession();
    const currentUser = sessionData.session?.user ?? null;

    if (!currentUser) {
      router.replace('/login');
      return;
    }

    const { data, error } = await supabase
      .from('incomes')
      .select('id, created_by, amount, description, created_at')
      .eq('id', incomeId)
      .maybeSingle();

    if (error) {
      setErrorMessage(error.message);
    }

    const row = data as IncomeRow | null;
    setUser(currentUser);
    setIncome(row ? { ...row, amount: Number(row.amount) } : null);

    if (row) {
      setDescription(row.description);
      setAmount(Number(row.amount).toFixed(2));
      setDateTime(toDateTimeLocal(row.created_at));
    }

    setLoading(false);
  }, [incomeId, router]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const canEdit = Boolean(user && income && income.created_by === user.id);

  async function saveEdit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!user || !income || !canEdit) return;

    setErrorMessage('');
    const parsedAmount = Number(amount.replace(',', '.'));

    if (!description.trim()) {
      setErrorMessage('Escribe una descripción.');
      return;
    }

    if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
      setErrorMessage('El monto debe ser mayor a cero.');
      return;
    }

    if (!dateTime) {
      setErrorMessage('Selecciona la fecha y hora del ingreso.');
      return;
    }

    const parsedDate = new Date(dateTime);
    if (Number.isNaN(parsedDate.getTime())) {
      setErrorMessage('La fecha ingresada no es válida.');
      return;
    }

    setSaving(true);
    const { error } = await supabase
      .from('incomes')
      .update({
        description: description.trim(),
        amount: Math.round(parsedAmount * 100) / 100,
        created_at: parsedDate.toISOString(),
      })
      .eq('id', income.id)
      .eq('created_by', user.id);
    setSaving(false);

    if (error) {
      setErrorMessage(error.message || 'No se pudo actualizar el ingreso.');
      return;
    }

    setEditing(false);
    await loadData();
  }

  async function deleteIncome() {
    if (!user || !income || !canEdit) return;
    if (!window.confirm('¿Eliminar este ingreso? Esta acción no se puede deshacer.')) return;

    const { error } = await supabase
      .from('incomes')
      .delete()
      .eq('id', income.id)
      .eq('created_by', user.id);

    if (error) {
      setErrorMessage(error.message || 'No se pudo eliminar el ingreso.');
      return;
    }

    router.replace('/movimientos?filter=personal');
  }

  if (loading) {
    return <main className="dashboardLoading"><p>Cargando ingreso...</p></main>;
  }

  if (!user || !income) {
    return (
      <main className="detailMissing">
        <h1>Ingreso no disponible</h1>
        <p>Puede haberse eliminado o todavía estar sincronizando.</p>
        <a className="primaryButton" href="/movimientos?filter=personal">Volver a movimientos</a>
      </main>
    );
  }

  return (
    <main className="detailPage incomeDetailPage">
      <header className="expenseTopbar">
        <a className="brand" href="/dashboard">
          <span className="brandMark" aria-hidden="true"><span className="brandDollar">$</span></span>
          <span>MiFinanzas</span>
        </a>
        <div className="detailTopActions">
          <a className="expenseBack" href="/movimientos?filter=personal">← Movimientos</a>
          {canEdit ? (
            <button type="button" onClick={() => setEditing((value) => !value)}>
              {editing ? 'Cancelar' : 'Editar'}
            </button>
          ) : null}
        </div>
      </header>

      <section className="detailWrap">
        {!editing ? (
          <>
            <section className="detailHero incomeDetailHero">
              <span className="detailIcon">💰</span>
              <span className="detailType">Ingreso personal</span>
              <h1>{income.description}</h1>
              <strong className="moneyIncome">+ {money(income.amount)}</strong>
              <small>{new Date(income.created_at).toLocaleString('es-PE')}</small>
            </section>

            <section className="detailPanel incomeDetailPanel">
              <p className="eyebrow">INFORMACIÓN</p>
              <div className="detailInfoRows">
                <div><span>Tipo</span><b>Ingreso personal</b></div>
                <div><span>Fecha</span><b>{new Date(income.created_at).toLocaleString('es-PE')}</b></div>
              </div>
            </section>

            {canEdit ? (
              <button className="detailDeleteButton" type="button" onClick={() => void deleteIncome()}>
                Eliminar ingreso
              </button>
            ) : null}

            {errorMessage ? <p className="formError">{errorMessage}</p> : null}
          </>
        ) : (
          <form className="detailEditForm" onSubmit={saveEdit}>
            <div className="detailEditHeader">
              <div>
                <p className="eyebrow">EDITAR</p>
                <h1>Modificar ingreso</h1>
              </div>
              <button className="primaryButton" type="submit" disabled={saving}>
                {saving ? 'Guardando...' : 'Guardar cambios'}
              </button>
            </div>

            <label>
              Descripción
              <input
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                maxLength={120}
                required
              />
            </label>

            <label>
              Monto
              <input
                value={amount}
                onChange={(event) => setAmount(event.target.value)}
                inputMode="decimal"
                required
              />
            </label>

            <label className="detailDateField">
              Fecha y hora
              <input
                type="datetime-local"
                value={dateTime}
                onChange={(event) => setDateTime(event.target.value)}
                required
              />
            </label>

            {errorMessage ? <p className="formError detailEditError">{errorMessage}</p> : null}
          </form>
        )}
      </section>
    </main>
  );
}

export default function DetalleIngresoPage() {
  return (
    <Suspense fallback={<main className="dashboardLoading"><p>Cargando ingreso...</p></main>}>
      <DetalleIngresoContent />
    </Suspense>
  );
}
