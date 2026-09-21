import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useFinance } from '@/context/finance-context';
import { supabase } from '@/lib/supabase';

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

export default function ChatGastoScreen() {
  const params = useLocalSearchParams<{ id?: string }>();
  const expenseId = Array.isArray(params.id) ? params.id[0] : params.id;
  const { user, authLoading, expenses, refreshExpenses } = useFinance();

  const expense = useMemo(
    () => expenses.find((item) => item.id === expenseId) ?? null,
    [expenses, expenseId]
  );

  const [partnerName, setPartnerName] = useState('Tu pareja');
  const [comments, setComments] = useState<CommentRow[]>([]);
  const [reactions, setReactions] = useState<ReactionRow[]>([]);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) router.replace('/login');
  }, [authLoading, user]);

  const loadPartner = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase.rpc('get_partner_status');
    const status = (data?.[0] ?? null) as PartnerStatus | null;
    if (status?.member_count && status.member_count >= 2) {
      setPartnerName(status.partner_name || 'Tu pareja');
    }
  }, [user]);

  const loadConversation = useCallback(async () => {
    if (!expenseId) return;

    const [commentResult, reactionResult] = await Promise.all([
      supabase
        .from('expense_comments')
        .select('id, author_id, body, created_at')
        .eq('expense_id', expenseId)
        .order('created_at', { ascending: true }),
      supabase
        .from('expense_reactions')
        .select('id, user_id, emoji')
        .eq('expense_id', expenseId)
        .order('created_at', { ascending: true }),
    ]);

    if (!commentResult.error) setComments((commentResult.data ?? []) as CommentRow[]);
    if (!reactionResult.error) setReactions((reactionResult.data ?? []) as ReactionRow[]);
  }, [expenseId]);

  useFocusEffect(
    useCallback(() => {
      refreshExpenses();
      loadPartner();
      loadConversation();
    }, [refreshExpenses, loadPartner, loadConversation])
  );

  useEffect(() => {
    if (!user || !expenseId) return;

    const channel = supabase
      .channel(`chat-expense-${expenseId}-${user.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'expense_comments',
          filter: `expense_id=eq.${expenseId}`,
        },
        () => loadConversation()
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'expense_reactions',
          filter: `expense_id=eq.${expenseId}`,
        },
        () => loadConversation()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, expenseId, loadConversation]);

  const send = async (quick?: string) => {
    if (!user || !expense || expense.type !== 'compartido') return;
    const body = (quick ?? text).trim();
    if (!body) return;

    try {
      setSending(true);
      const { error } = await supabase.from('expense_comments').insert({
        expense_id: expense.id,
        author_id: user.id,
        body,
      });
      if (error) throw error;
      setText('');
      await loadConversation();
    } catch (error: any) {
      Alert.alert('No se pudo enviar', error?.message ?? 'Inténtalo nuevamente.');
    } finally {
      setSending(false);
    }
  };

  const react = async (emoji: string) => {
    if (!user || !expense) return;
    const mine = reactions.find((item) => item.user_id === user.id);

    try {
      if (mine?.emoji === emoji) {
        const { error } = await supabase
          .from('expense_reactions')
          .delete()
          .eq('expense_id', expense.id)
          .eq('user_id', user.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('expense_reactions')
          .upsert(
            { expense_id: expense.id, user_id: user.id, emoji },
            { onConflict: 'expense_id,user_id' }
          );
        if (error) throw error;
      }
      await loadConversation();
    } catch (error: any) {
      Alert.alert('No se pudo reaccionar', error?.message ?? 'Inténtalo nuevamente.');
    }
  };

  if (authLoading || !user) return null;

  if (!expense || expense.type !== 'compartido') {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.center}>
          <Text style={styles.emptyTitle}>Chat no disponible</Text>
          <Text style={styles.emptyText}>El chat existe solo para gastos compartidos.</Text>
          <TouchableOpacity style={styles.primary} onPress={() => router.back()}>
            <Text style={styles.primaryText}>Volver</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const payer = expense.payerId === user.id ? 'Tú' : partnerName;
  const myReaction = reactions.find((item) => item.user_id === user.id)?.emoji;

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Text style={styles.back}>‹</Text>
          </TouchableOpacity>
          <View style={styles.headerCenter}>
            <Text style={styles.headerTitle}>Chat del gasto</Text>
            <Text style={styles.headerSub}>Todo queda junto al movimiento</Text>
          </View>
          <TouchableOpacity onPress={() => router.push(`/detalle-gasto?id=${expense.id}` as any)}>
            <Text style={styles.detailLink}>Detalle</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.expenseCard}>
          <View style={styles.expenseIcon}><Text style={styles.expenseIconText}>🧾</Text></View>
          <View style={styles.expenseInfo}>
            <Text style={styles.expenseTitle}>{expense.description}</Text>
            <Text style={styles.expenseMeta}>S/ {expense.amount.toFixed(2)} · Pagó {payer}</Text>
          </View>
          <Text style={styles.arrow}>›</Text>
        </View>

        <ScrollView
          style={styles.flex}
          contentContainerStyle={styles.messages}
          showsVerticalScrollIndicator={false}
        >
          {comments.length === 0 ? (
            <View style={styles.emptyChat}>
              <Text style={styles.emptyChatIcon}>💬</Text>
              <Text style={styles.emptyTitle}>Empiecen la conversación</Text>
              <Text style={styles.emptyText}>Útil para recordar pagos, acuerdos o detalles del gasto.</Text>
            </View>
          ) : (
            comments.map((comment) => {
              const mine = comment.author_id === user.id;
              return (
                <View
                  key={comment.id}
                  style={[styles.bubbleWrap, mine ? styles.mineWrap : styles.partnerWrap]}
                >
                  <Text style={styles.author}>{mine ? 'Tú' : partnerName}</Text>
                  <View style={[styles.bubble, mine ? styles.mineBubble : styles.partnerBubble]}>
                    <Text style={styles.messageText}>{comment.body}</Text>
                  </View>
                  <Text style={styles.time}>
                    {new Date(comment.created_at).toLocaleTimeString('es-PE', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </Text>
                </View>
              );
            })
          )}
        </ScrollView>

        <View style={styles.reactionRow}>
          {REACTIONS.map((emoji) => (
            <TouchableOpacity
              key={emoji}
              style={[styles.reaction, myReaction === emoji && styles.reactionActive]}
              onPress={() => react(emoji)}
            >
              <Text style={styles.reactionText}>{emoji}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.quickReplies}
        >
          {QUICK_REPLIES.map((reply) => (
            <TouchableOpacity key={reply} style={styles.quickReply} onPress={() => send(reply)}>
              <Text style={styles.quickReplyText}>{reply}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <View style={styles.composer}>
          <TextInput
            value={text}
            onChangeText={setText}
            placeholder="Escribe un mensaje..."
            placeholderTextColor="#64748B"
            style={styles.input}
            maxLength={500}
            multiline
          />
          <TouchableOpacity
            style={[styles.sendButton, (!text.trim() || sending) && styles.disabled]}
            disabled={!text.trim() || sending}
            onPress={() => send()}
          >
            <Text style={styles.sendText}>{sending ? '…' : '➤'}</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  container: { flex: 1, backgroundColor: '#07111F' },
  header: {
    minHeight: 60,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#1B2B40',
  },
  back: { color: '#60A5FA', fontSize: 29, width: 42 },
  headerCenter: { flex: 1, alignItems: 'center' },
  headerTitle: { color: '#FFFFFF', fontSize: 15, fontWeight: '900' },
  headerSub: { color: '#64748B', fontSize: 8, marginTop: 2 },
  detailLink: { color: '#60A5FA', fontSize: 9, fontWeight: '900', width: 42, textAlign: 'right' },
  expenseCard: {
    margin: 14,
    marginBottom: 7,
    padding: 12,
    borderRadius: 16,
    backgroundColor: '#0E1A2A',
    borderWidth: 1,
    borderColor: '#1B2B40',
    flexDirection: 'row',
    alignItems: 'center',
  },
  expenseIcon: { width: 40, height: 40, borderRadius: 12, backgroundColor: '#34172A', alignItems: 'center', justifyContent: 'center' },
  expenseIconText: { fontSize: 19 },
  expenseInfo: { flex: 1, marginLeft: 10 },
  expenseTitle: { color: '#FFFFFF', fontSize: 12, fontWeight: '900' },
  expenseMeta: { color: '#94A3B8', fontSize: 8, marginTop: 3 },
  arrow: { color: '#64748B', fontSize: 23 },
  messages: { padding: 14, paddingBottom: 18 },
  emptyChat: { alignItems: 'center', paddingVertical: 44, paddingHorizontal: 25 },
  emptyChatIcon: { fontSize: 34 },
  emptyTitle: { color: '#FFFFFF', fontSize: 14, fontWeight: '900', marginTop: 8, textAlign: 'center' },
  emptyText: { color: '#64748B', fontSize: 9, lineHeight: 14, textAlign: 'center', marginTop: 4 },
  bubbleWrap: { maxWidth: '82%', marginBottom: 11 },
  mineWrap: { alignSelf: 'flex-end', alignItems: 'flex-end' },
  partnerWrap: { alignSelf: 'flex-start', alignItems: 'flex-start' },
  author: { color: '#94A3B8', fontSize: 8, fontWeight: '800', marginBottom: 3 },
  bubble: { borderRadius: 15, paddingHorizontal: 12, paddingVertical: 9 },
  mineBubble: { backgroundColor: '#1769C9', borderBottomRightRadius: 5 },
  partnerBubble: { backgroundColor: '#17263A', borderBottomLeftRadius: 5 },
  messageText: { color: '#FFFFFF', fontSize: 11, lineHeight: 16 },
  time: { color: '#475569', fontSize: 7, marginTop: 3 },
  reactionRow: { flexDirection: 'row', gap: 7, paddingHorizontal: 14, paddingTop: 7 },
  reaction: { flex: 1, height: 38, borderRadius: 12, backgroundColor: '#0E1A2A', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#1B2B40' },
  reactionActive: { backgroundColor: '#3A1830', borderColor: '#EC4899' },
  reactionText: { fontSize: 17 },
  quickReplies: { paddingHorizontal: 14, paddingVertical: 9, gap: 7 },
  quickReply: { backgroundColor: '#12233A', borderRadius: 14, paddingHorizontal: 12, paddingVertical: 8, borderWidth: 1, borderColor: '#24415F' },
  quickReplyText: { color: '#CBD5E1', fontSize: 9, fontWeight: '800' },
  composer: { padding: 12, flexDirection: 'row', alignItems: 'flex-end', gap: 8, borderTopWidth: 1, borderTopColor: '#1B2B40', backgroundColor: '#091421' },
  input: { flex: 1, minHeight: 44, maxHeight: 90, borderRadius: 15, backgroundColor: '#0E1A2A', color: '#FFFFFF', paddingHorizontal: 13, paddingVertical: 10, fontSize: 11, borderWidth: 1, borderColor: '#1B2B40' },
  sendButton: { width: 44, height: 44, borderRadius: 14, backgroundColor: '#1677FF', alignItems: 'center', justifyContent: 'center' },
  sendText: { color: '#FFFFFF', fontSize: 17, fontWeight: '900' },
  disabled: { opacity: 0.45 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  primary: { marginTop: 16, backgroundColor: '#1677FF', borderRadius: 13, paddingHorizontal: 22, paddingVertical: 12 },
  primaryText: { color: '#FFFFFF', fontSize: 11, fontWeight: '900' },
});
