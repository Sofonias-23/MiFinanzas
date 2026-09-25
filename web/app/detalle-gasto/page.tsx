'use client';

import { FormEvent, useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import type { User } from '@supabase/supabase-js';

import { supabase } from '@/lib/supabase';

type ExpenseRow = {
  id: string;
  amount: number;
  description: string;
  type: 'personal' | 'compartido';
  category: string;
  payment_method: string;
  created_at: string;
  created_by: string;
  payer_id: string;
  my_share: number;
  partner_share: number;
};

type CategoryRow = { id: string; slug: string; name: string; icon: string };
type PaymentRow = { id: string; slug: string; name: string; icon: string };
type PartnerStatus = { household_id: string | null; partner_name: string | null; member_count: number };
type CommentRow = { id: string; author_id: string; body: string; created_at: string };
type ReactionRow = { id: string; user_id: string; emoji: string };

const REACTIONS = ['👍', '❤️', '😂', '🎉', '👀'];

function money(value: number) {
  return new Intl.NumberFormat('es-PE', {
    style: 'currency',
    currency: 'PEN',
    minimumFractionDigits: 2,
  }).format(value);
}

export default function DetalleGastoPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const expenseId = searchParams.get('id');

  const [user, setUser] = useState<User | null>(null);
  const [expense, setExpense] = useState<ExpenseRow | null>(null);
  const [categories, setCategories] = useState<CategoryRow[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<PaymentRow[]>([]);
  const [partnerName, setPartnerName] = useState('tu pareja');
  const [partnerId, setPartnerId] = useState<string | null>(null);
  const [comments, setComments] = useState<CommentRow[]>([]);
  const [reactions, setReactions] = useState<ReactionRow[]>([]);
  const [editing, setEditing] = useState(false);
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('');
  const [payerId, setPayerId] = useState('');
  const [myShare, setMyShare] = useState('');
  const [partnerShare, setPartnerShare] = useState('');
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');

  const loadData = useCallback(async () => {
    if (!expenseId) {
      setLoading(false);
      return;
    }

    const { data: sessionData } = await supabase.auth.getSession();
    const currentUser = sessionData.session?.user ?? null;

    if (!currentUser) {
      router.replace('/login');
      return;
    }

    const [expenseResult, categoryResult, paymentResult, statusResult, commentsResult, reactionsResult] =
      await Promise.all([
        supabase
          .from('expenses')
          .select('id, amount, description, type, category, payment_method, created_at, created_by, payer_id, my_share, partner_share')
          .eq('id', expenseId)
          .maybeSingle(),
        supabase.from('expense_categories').select('id, slug, name, icon').order('created_at', { ascending: true }),
        supabase.from('payment_methods').select('id, slug, name, icon').order('created_at', { ascending: true }),
        supabase.rpc('get_partner_status'),
        supabase.from('expense_comments').select('id, author_id, body, created_at').eq('expense_id', expenseId).order('created_at', { ascending: true }),
        supabase.from('expense_reactions').select('id, user_id, emoji').eq('expense_id', expenseId).order('created_at', { ascending: true }),
      ]);

    const row = expenseResult.data as ExpenseRow | null;
    const status = (statusResult.data?.[0] ?? null) as PartnerStatus | null;

    setUser(currentUser);
    setExpense(
      row
        ? {
            ...row,
            amount: Number(row.amount),
            my_share: Number(row.my_share || 0),
            partner_share: Number(row.partner_share || 0),
          }
        : null,
    );
    setCategories((categoryResult.data ?? []) as CategoryRow[]);
    setPaymentMethods((paymentResult.data ?? []) as PaymentRow[]);
    setPartnerName(status?.partner_name || 'tu pareja');
    setComments((commentsResult.data ?? []) as CommentRow[]);
    setReactions((reactionsResult.data ?? []) as ReactionRow[]);

    if (status?.household_id && status.member_count >= 2) {
      const { data: member } = await supabase
        .from('household_members')
        .select('user_id')
        .eq('household_id', status.household_id)
        .neq('user_id', currentUser.id)
        .limit(1)
        .maybeSingle();
      setPartnerId(member?.user_id ?? null);
    }

    if (row) {
      setDescription(row.description);
      setAmount(Number(row.amount).toFixed(2));
      setCategory(row.category);
      setPaymentMethod(row.payment_method);
      setPayerId(row.payer_id);
      setMyShare(Number(row.my_share || 0).toFixed(2));
      setPartnerShare(Number(row.partner_share || 0).toFixed(2));
    }

    setLoading(false);
  }, [expenseId, router]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  useEffect(() => {
    if (!user || !expenseId) return;

    const channel = supabase
      .channel('web-expense-detail-' + expenseId + '-' + user.id)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'expenses', filter: 'id=eq.' + expenseId }, () => void loadData())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'expense_comments', filter: 'expense_id=eq.' + expenseId }, () => void loadData())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'expense_reactions', filter: 'expense_id=eq.' + expenseId }, () => void loadData())
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [user, expenseId, loadData]);

  const canEdit = Boolean(user && expense && expense.created_by === user.id);
  const shared = expense?.type === 'compartido';
  const categoryData = categories.find((item) => item.slug === expense?.category);
  const paymentData = paymentMethods.find((item) => item.slug === expense?.payment_method);

  const myCurrentShare = useMemo(() => {
    if (!user || !expense) return 0;
    return expense.created_by === user.id ? expense.my_share : expense.partner_share;
  }, [expense, user]);

  const otherCurrentShare = expense ? Math.round((expense.amount - myCurrentShare) * 100) / 100 : 0;

  const reactionCounts = useMemo(() => {
    const result: Record<string, number> = {};
    reactions.forEach((reaction) => {
      result[reaction.emoji] = (result[reaction.emoji] || 0) + 1;
    });
    return result;
  }, [reactions]);

  async function saveEdit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!user || !expense || !canEdit) return;

    setErrorMessage('');
    const parsedAmount = Number(amount.replace(',', '.'));
    const mine = Number(myShare.replace(',', '.'));
    const partner = Number(partnerShare.replace(',', '.'));

    if (!description.trim()) {
      setErrorMessage('Escribe una descripción.');
      return;
    }
    if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
      setErrorMessage('El monto debe ser mayor a cero.');
      return;
    }
    if (
      shared &&
      (!Number.isFinite(mine) || !Number.isFinite(partner) || mine < 0 || partner < 0 || Math.abs(mine + partner - parsedAmount) > 0.01)
    ) {
      setErrorMessage('Las partes deben sumar exactamente el total.');
      return;
    }

    setSaving(true);
    const { error } = await supabase
      .from('expenses')
      .update({
        description: description.trim(),
        amount: Math.round(parsedAmount * 100) / 100,
        category,
        payment_method: paymentMethod,
        payer_id: shared ? payerId : user.id,
        my_share: shared ? Math.round(mine * 100) / 100 : Math.round(parsedAmount * 100) / 100,
        partner_share: shared ? Math.round(partner * 100) / 100 : 0,
      })
      .eq('id', expense.id)
      .eq('created_by', user.id);
    setSaving(false);

    if (error) {
      setErrorMessage(error.message || 'No se pudo guardar.');
      return;
    }

    setEditing(false);
    await loadData();
  }

  async function deleteExpense() {
    if (!user || !expense || !canEdit) return;
    if (!window.confirm(shared ? '¿Eliminar este gasto compartido para ambos?' : '¿Eliminar este gasto?')) return;

    const { error } = await supabase
      .from('expenses')
      .delete()
      .eq('id', expense.id)
      .eq('created_by', user.id);

    if (error) {
      setErrorMessage(error.message);
      return;
    }

    router.replace(shared ? '/pareja' : '/dashboard');
  }

  if (loading) {
    return <main className="dashboardLoading"><p>Cargando detalle...</p></main>;
  }

  if (!user || !expense) {
    return (
      <main className="detailMissing">
        <h1>Movimiento no disponible</h1>
        <p>Puede haberse eliminado o todavía estar sincronizando.</p>
        <a className="primaryButton" href="/movimientos">Volver a movimientos</a>
      </main>
    );
  }

  const payerLabel = expense.payer_id === user.id ? 'Tú' : partnerName;
  const creatorLabel = expense.created_by === user.id ? 'Tú' : partnerName;

  return (
    <main className={shared ? 'detailPage shared' : 'detailPage'}>
      <header className="expenseTopbar">
        <a className="brand" href={shared ? '/pareja' : '/dashboard'}>
          <span className="brandMark" aria-hidden="true"><span className="brandDollar">$</span></span>
          <span>MiFinanzas</span>
        </a>
        <div className="detailTopActions">
          <a className="expenseBack" href="/movimientos">← Movimientos</a>
          {canEdit ? (
            <button type="button" onClick={() => setEditing((value) => !value)}>{editing ? 'Cancelar' : 'Editar'}</button>
          ) : null}
        </div>
      </header>

      <section className="detailWrap">
        {!editing ? (
          <>
            <section className="detailHero">
              <span className="detailIcon">{categoryData?.icon || '🧾'}</span>
              <span className="detailType">{shared ? '👥 Compartido' : '👤 Personal'}</span>
              <h1>{expense.description}</h1>
              <strong>{money(expense.amount)}</strong>
              <small>{new Date(expense.created_at).toLocaleString('es-PE')}</small>
            </section>

            <div className="detailGrid">
              <section className="detailPanel">
                <p className="eyebrow">INFORMACIÓN</p>
                <div className="detailInfoRows">
                  <div><span>Categoría</span><b>{categoryData?.icon || '📦'} {categoryData?.name || expense.category}</b></div>
                  <div><span>Método de pago</span><b>{paymentData?.icon || '💳'} {paymentData?.name || expense.payment_method}</b></div>
                  <div><span>Registrado por</span><b>{creatorLabel}</b></div>
                  {shared ? <div><span>Pagó</span><b>{payerLabel}</b></div> : null}
                </div>
              </section>

              {shared ? (
                <section className="detailPanel">
                  <p className="eyebrow">DIVISIÓN</p>
                  <div className="detailSplit">
                    <div>
                      <span>Tu parte</span>
                      <strong>{money(myCurrentShare)}</strong>
                      <small>{expense.amount > 0 ? Math.round((myCurrentShare / expense.amount) * 100) : 0}%</small>
                    </div>
                    <div>
                      <span>Parte de {partnerName}</span>
                      <strong>{money(otherCurrentShare)}</strong>
                      <small>{expense.amount > 0 ? Math.round((otherCurrentShare / expense.amount) * 100) : 0}%</small>
                    </div>
                  </div>
                </section>
              ) : null}
            </div>

            {shared ? (
              <section className="detailConversationPreview">
                <div>
                  <p className="eyebrow">CONVERSACIÓN</p>
                  <h2>Chat del gasto</h2>
                  <p>{comments.length ? comments.length + ' mensajes registrados.' : 'Todavía no hay mensajes.'}</p>
                </div>
                <a className="primaryButton" href={'/chat-gasto?id=' + expense.id}>Abrir chat</a>

                <div className="detailReactions">
                  {REACTIONS.map((emoji) => (
                    <span key={emoji}>{emoji} {reactionCounts[emoji] || 0}</span>
                  ))}
                </div>
              </section>
            ) : null}

            {canEdit ? (
              <button className="detailDeleteButton" type="button" onClick={() => void deleteExpense()}>
                Eliminar gasto
              </button>
            ) : null}

            {errorMessage ? <p className="formError">{errorMessage}</p> : null}
          </>
        ) : (
          <form className="detailEditForm" onSubmit={saveEdit}>
            <div className="detailEditHeader">
              <div>
                <p className="eyebrow">EDITAR</p>
                <h1>Modificar gasto</h1>
              </div>
              <button className="primaryButton" type="submit" disabled={saving}>{saving ? 'Guardando...' : 'Guardar cambios'}</button>
            </div>

            <label>Descripción<input value={description} onChange={(event) => setDescription(event.target.value)} /></label>
            <label>Monto<input value={amount} onChange={(event) => setAmount(event.target.value)} inputMode="decimal" /></label>

            <label>
              Categoría
              <select value={category} onChange={(event) => setCategory(event.target.value)}>
                {categories.map((item) => <option key={item.id} value={item.slug}>{item.icon} {item.name}</option>)}
              </select>
            </label>

            <label>
              Método
              <select value={paymentMethod} onChange={(event) => setPaymentMethod(event.target.value)}>
                {paymentMethods.map((item) => <option key={item.id} value={item.slug}>{item.icon} {item.name}</option>)}
              </select>
            </label>

            {shared ? (
              <>
                <fieldset className="detailPayerFieldset">
                  <legend>Quién pagó</legend>
                  <div>
                    <button type="button" className={payerId === user.id ? 'active' : ''} onClick={() => setPayerId(user.id)}>Tú</button>
                    <button type="button" className={payerId === partnerId ? 'active pink' : ''} onClick={() => partnerId && setPayerId(partnerId)}>{partnerName}</button>
                  </div>
                </fieldset>

                <label>Tu parte<input value={myShare} onChange={(event) => setMyShare(event.target.value)} inputMode="decimal" /></label>
                <label>Parte de {partnerName}<input value={partnerShare} onChange={(event) => setPartnerShare(event.target.value)} inputMode="decimal" /></label>
              </>
            ) : null}

            {errorMessage ? <p className="formError detailEditError">{errorMessage}</p> : null}
          </form>
        )}
      </section>
    </main>
  );
}
