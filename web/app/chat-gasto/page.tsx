'use client';

import { FormEvent, useCallback, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import type { User } from '@supabase/supabase-js';

import { supabase } from '@/lib/supabase';

type ExpenseRow = {
  id: string;
  amount: number;
  description: string;
  type: 'personal' | 'compartido';
  payer_id: string;
};

type CommentRow = {
  id: string;
  author_id: string;
  body: string;
  created_at: string;
};

type ReactionRow = {
  id: string;
  user_id: string;
  emoji: string;
};

type PartnerStatus = {
  partner_name: string | null;
  member_count: number;
};

const QUICK_REPLIES = ['Ya te pagué', '¿Cuánto fue?', 'Gracias', 'Lo registro'];
const REACTIONS = ['👍', '❤️', '😂', '🎉', '👀'];

function money(value: number) {
  return new Intl.NumberFormat('es-PE', {
    style: 'currency',
    currency: 'PEN',
    minimumFractionDigits: 2,
  }).format(value);
}

export default function ChatGastoPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const expenseId = searchParams.get('id');

  const [user, setUser] = useState<User | null>(null);
  const [expense, setExpense] = useState<ExpenseRow | null>(null);
  const [partnerName, setPartnerName] = useState('Tu pareja');
  const [myName, setMyName] = useState('Tú');
  const [comments, setComments] = useState<CommentRow[]>([]);
  const [reactions, setReactions] = useState<ReactionRow[]>([]);
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
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

    const [expenseResult, statusResult, profileResult, commentResult, reactionResult] = await Promise.all([
      supabase.from('expenses').select('id, amount, description, type, payer_id').eq('id', expenseId).maybeSingle(),
      supabase.rpc('get_partner_status'),
      supabase.from('profiles').select('display_name').eq('id', currentUser.id).maybeSingle(),
      supabase.from('expense_comments').select('id, author_id, body, created_at').eq('expense_id', expenseId).order('created_at', { ascending: true }),
      supabase.from('expense_reactions').select('id, user_id, emoji').eq('expense_id', expenseId).order('created_at', { ascending: true }),
    ]);

    const row = expenseResult.data as ExpenseRow | null;
    const status = (statusResult.data?.[0] ?? null) as PartnerStatus | null;

    setUser(currentUser);
    setExpense(row ? { ...row, amount: Number(row.amount) } : null);
    setPartnerName(status?.partner_name || 'Tu pareja');
    setMyName(
      profileResult.data?.display_name ||
        currentUser.user_metadata?.display_name ||
        currentUser.email?.split('@')[0] ||
        'Tú',
    );
    setComments((commentResult.data ?? []) as CommentRow[]);
    setReactions((reactionResult.data ?? []) as ReactionRow[]);
    setLoading(false);
  }, [expenseId, router]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  useEffect(() => {
    if (!user || !expenseId) return;

    const channel = supabase
      .channel('web-chat-' + expenseId + '-' + user.id)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'expense_comments', filter: 'expense_id=eq.' + expenseId }, () => void loadData())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'expense_reactions', filter: 'expense_id=eq.' + expenseId }, () => void loadData())
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [user, expenseId, loadData]);

  async function sendMessage(event?: FormEvent<HTMLFormElement>, quick?: string) {
    event?.preventDefault();

    if (!user || !expense || expense.type !== 'compartido') return;

    const body = (quick ?? text).trim();
    if (!body) return;

    setSending(true);
    setErrorMessage('');

    const { error } = await supabase.from('expense_comments').insert({
      expense_id: expense.id,
      author_id: user.id,
      body,
    });

    setSending(false);

    if (error) {
      setErrorMessage(error.message || 'No se pudo enviar.');
      return;
    }

    setText('');
    await loadData();
  }

  async function react(emoji: string) {
    if (!user || !expense) return;

    const mine = reactions.find((item) => item.user_id === user.id);

    if (mine?.emoji === emoji) {
      const { error } = await supabase
        .from('expense_reactions')
        .delete()
        .eq('expense_id', expense.id)
        .eq('user_id', user.id);

      if (error) {
        setErrorMessage(error.message);
        return;
      }
    } else {
      const { error } = await supabase
        .from('expense_reactions')
        .upsert(
          { expense_id: expense.id, user_id: user.id, emoji },
          { onConflict: 'expense_id,user_id' },
        );

      if (error) {
        setErrorMessage(error.message);
        return;
      }
    }

    await loadData();
  }

  async function deleteComment(comment: CommentRow) {
    if (!user || comment.author_id !== user.id) return;
    if (!window.confirm('¿Eliminar este mensaje?')) return;

    const { error } = await supabase
      .from('expense_comments')
      .delete()
      .eq('id', comment.id)
      .eq('author_id', user.id);

    if (error) {
      setErrorMessage(error.message);
      return;
    }

    await loadData();
  }

  if (loading) {
    return <main className="dashboardLoading"><p>Cargando chat...</p></main>;
  }

  if (!user || !expense || expense.type !== 'compartido') {
    return (
      <main className="detailMissing">
        <h1>Chat no disponible</h1>
        <p>El chat existe únicamente para gastos compartidos.</p>
        <a className="primaryButton" href="/pareja">Volver a Pareja</a>
      </main>
    );
  }

  const payer = expense.payer_id === user.id ? 'Tú' : partnerName;
  const myReaction = reactions.find((item) => item.user_id === user.id)?.emoji;

  return (
    <main className="chatPage">
      <header className="chatHeader">
        <a className="expenseBack" href="/pareja">← Pareja</a>
        <div>
          <b>Chat del gasto</b>
          <span>Todo queda junto al movimiento</span>
        </div>
        <a href={'/detalle-gasto?id=' + expense.id}>Detalle</a>
      </header>

      <section className="chatWrap">
        <div className="chatPeople">
          <span className="chatPerson blue">◉</span>
          <div><b>{myName}</b><small>Tú</small></div>
          <span className="chatHeart">♥</span>
          <span className="chatPerson pink">♥</span>
          <div><b>{partnerName}</b><small>Pareja</small></div>
        </div>

        <a className="chatExpenseContext" href={'/detalle-gasto?id=' + expense.id}>
          <span>🧾</span>
          <div>
            <b>{expense.description}</b>
            <small>{money(expense.amount)} · Pagó {payer}</small>
          </div>
          <strong>→</strong>
        </a>

        <div className="chatMessages">
          {comments.length ? comments.map((comment) => {
            const mine = comment.author_id === user.id;
            return (
              <div className={mine ? 'chatBubbleWrap mine' : 'chatBubbleWrap partner'} key={comment.id}>
                <span>{mine ? 'Tú' : partnerName}</span>
                <div className={mine ? 'chatBubble mine' : 'chatBubble partner'}>
                  <p>{comment.body}</p>
                  {mine ? (
                    <button type="button" onClick={() => void deleteComment(comment)}>Eliminar</button>
                  ) : null}
                </div>
                <small>
                  {new Date(comment.created_at).toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' })}
                </small>
              </div>
            );
          }) : (
            <div className="chatEmpty">
              <span>💬</span>
              <b>Empiecen la conversación</b>
              <p>Útil para recordar pagos, acuerdos o detalles del gasto.</p>
            </div>
          )}
        </div>

        <div className="chatReactionRow">
          {REACTIONS.map((emoji) => (
            <button
              key={emoji}
              type="button"
              className={myReaction === emoji ? 'active' : ''}
              onClick={() => void react(emoji)}
            >
              {emoji}
              <small>{reactions.filter((item) => item.emoji === emoji).length || ''}</small>
            </button>
          ))}
        </div>

        <div className="chatQuickReplies">
          {QUICK_REPLIES.map((reply) => (
            <button key={reply} type="button" onClick={() => void sendMessage(undefined, reply)}>{reply}</button>
          ))}
        </div>

        {errorMessage ? <p className="formError chatError">{errorMessage}</p> : null}

        <form className="chatComposer" onSubmit={(event) => void sendMessage(event)}>
          <textarea
            value={text}
            onChange={(event) => setText(event.target.value)}
            placeholder="Escribe un mensaje..."
            maxLength={500}
            rows={2}
          />
          <button type="submit" disabled={!text.trim() || sending}>{sending ? '…' : 'Enviar'}</button>
        </form>
      </section>
    </main>
  );
}
