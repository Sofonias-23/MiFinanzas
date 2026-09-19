import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert,
  Animated,
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

type PartnerStatus = {
  household_id: string | null;
  partner_name: string | null;
  member_count: number;
};

type CommentRow = {
  id: string;
  expense_id: string;
  author_id: string;
  body: string;
  created_at: string;
};

type ReactionRow = {
  id: string;
  expense_id: string;
  user_id: string;
  emoji: string;
  created_at: string;
};

const REACTIONS = ['👍', '❤️', '😂', '🎉', '👀'];

export default function DetalleGastoScreen() {
  const params = useLocalSearchParams<{ id?: string }>();
  const expenseId = Array.isArray(params.id) ? params.id[0] : params.id;

  const {
    user,
    authLoading,
    expenses,
    categories,
    paymentMethods,
    refreshExpenses,
  } = useFinance();

  const enter = useRef(new Animated.Value(0)).current;

  const [partnerName, setPartnerName] = useState('tu pareja');
  const [partnerId, setPartnerId] = useState<string | null>(null);
  const [comments, setComments] = useState<CommentRow[]>([]);
  const [reactions, setReactions] = useState<ReactionRow[]>([]);
  const [commentText, setCommentText] = useState('');
  const [sendingComment, setSendingComment] = useState(false);
  const [editing, setEditing] = useState(false);
  const [savingEdit, setSavingEdit] = useState(false);

  const expense = useMemo(
    () => expenses.find((item) => item.id === expenseId) ?? null,
    [expenses, expenseId]
  );

  const [editDescription, setEditDescription] = useState('');
  const [editAmount, setEditAmount] = useState('');
  const [editCategory, setEditCategory] = useState('');
  const [editPayment, setEditPayment] = useState('');
  const [editPayerId, setEditPayerId] = useState('');
  const [editMyShare, setEditMyShare] = useState('');
  const [editPartnerShare, setEditPartnerShare] = useState('');

  useEffect(() => {
    Animated.timing(enter, {
      toValue: 1,
      duration: 250,
      useNativeDriver: true,
    }).start();
  }, [enter]);

  useEffect(() => {
    if (!authLoading && !user) router.replace('/login');
  }, [authLoading, user]);

  const loadPartner = useCallback(async () => {
    if (!user) return;

    const { data } = await supabase.rpc('get_partner_status');
    const status = (data?.[0] ?? null) as PartnerStatus | null;

    if (!status || status.member_count < 2 || !status.household_id) {
      setPartnerId(null);
      return;
    }

    setPartnerName(status.partner_name || 'tu pareja');

    const { data: member } = await supabase
      .from('household_members')
      .select('user_id')
      .eq('household_id', status.household_id)
      .neq('user_id', user.id)
      .limit(1)
      .maybeSingle();

    setPartnerId(member?.user_id ?? null);
  }, [user]);

  const loadConversation = useCallback(async () => {
    if (!expenseId) return;

    const [commentsResult, reactionsResult] = await Promise.all([
      supabase
        .from('expense_comments')
        .select('id, expense_id, author_id, body, created_at')
        .eq('expense_id', expenseId)
        .order('created_at', { ascending: true }),
      supabase
        .from('expense_reactions')
        .select('id, expense_id, user_id, emoji, created_at')
        .eq('expense_id', expenseId)
        .order('created_at', { ascending: true }),
    ]);

    if (!commentsResult.error) {
      setComments((commentsResult.data ?? []) as CommentRow[]);
    }

    if (!reactionsResult.error) {
      setReactions((reactionsResult.data ?? []) as ReactionRow[]);
    }
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
      .channel(`expense-detail-${expenseId}-${user.id}`)
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
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'expenses',
          filter: `id=eq.${expenseId}`,
        },
        () => refreshExpenses()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, expenseId, loadConversation, refreshExpenses]);

  useEffect(() => {
    if (!expense || editing) return;

    setEditDescription(expense.description);
    setEditAmount(expense.amount.toFixed(2));
    setEditCategory(expense.category);
    setEditPayment(expense.paymentMethod);
    setEditPayerId(expense.payerId);
    setEditMyShare(expense.myShare.toFixed(2));
    setEditPartnerShare(expense.partnerShare.toFixed(2));
  }, [expense, editing]);

  const category = useMemo(
    () => categories.find((item) => item.slug === expense?.category),
    [categories, expense?.category]
  );

  const payment = useMemo(
    () => paymentMethods.find((item) => item.slug === expense?.paymentMethod),
    [paymentMethods, expense?.paymentMethod]
  );

  const canEdit = Boolean(user && expense && expense.createdBy === user.id);
  const shared = expense?.type === 'compartido';

  const myCurrentShare = useMemo(() => {
    if (!expense || !user) return 0;
    return expense.createdBy === user.id
      ? expense.myShare
      : expense.partnerShare;
  }, [expense, user]);

  const partnerCurrentShare = expense
    ? Math.round((expense.amount - myCurrentShare) * 100) / 100
    : 0;

  const myReaction = reactions.find((reaction) => reaction.user_id === user?.id)?.emoji;

  const reactionCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const reaction of reactions) {
      counts[reaction.emoji] = (counts[reaction.emoji] ?? 0) + 1;
    }
    return counts;
  }, [reactions]);

  const sendComment = async () => {
    if (!user || !expense || !shared) return;

    const body = commentText.trim();
    if (!body) return;

    try {
      setSendingComment(true);

      const { error } = await supabase.from('expense_comments').insert({
        expense_id: expense.id,
        author_id: user.id,
        body,
      });

      if (error) throw error;

      setCommentText('');
      await loadConversation();
    } catch (error: any) {
      Alert.alert(
        'No se pudo comentar',
        error?.message ?? 'Inténtalo nuevamente.'
      );
    } finally {
      setSendingComment(false);
    }
  };

  const deleteComment = (comment: CommentRow) => {
    if (!user || comment.author_id !== user.id) return;

    Alert.alert('Eliminar comentario', '¿Quieres borrar este comentario?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Eliminar',
        style: 'destructive',
        onPress: async () => {
          const { error } = await supabase
            .from('expense_comments')
            .delete()
            .eq('id', comment.id)
            .eq('author_id', user.id);

          if (error) {
            Alert.alert('No se pudo eliminar', error.message);
            return;
          }

          await loadConversation();
        },
      },
    ]);
  };

  const toggleReaction = async (emoji: string) => {
    if (!user || !expense || !shared) return;

    try {
      if (myReaction === emoji) {
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
            {
              expense_id: expense.id,
              user_id: user.id,
              emoji,
            },
            { onConflict: 'expense_id,user_id' }
          );

        if (error) throw error;
      }

      await loadConversation();
    } catch (error: any) {
      Alert.alert(
        'No se pudo reaccionar',
        error?.message ?? 'Inténtalo nuevamente.'
      );
    }
  };

  const saveEdit = async () => {
    if (!user || !expense || !canEdit) return;

    const amount = Number(editAmount.replace(',', '.'));
    const mine = Number(editMyShare.replace(',', '.'));
    const partner = Number(editPartnerShare.replace(',', '.'));

    if (!editDescription.trim()) {
      Alert.alert('Falta la descripción', 'Escribe una descripción.');
      return;
    }

    if (!Number.isFinite(amount) || amount <= 0) {
      Alert.alert('Monto inválido', 'El monto debe ser mayor a cero.');
      return;
    }

    if (
      shared &&
      (!Number.isFinite(mine) ||
        !Number.isFinite(partner) ||
        mine < 0 ||
        partner < 0 ||
        Math.abs(mine + partner - amount) > 0.01)
    ) {
      Alert.alert(
        'División inválida',
        'Tu parte y la parte de tu pareja deben sumar exactamente el total.'
      );
      return;
    }

    try {
      setSavingEdit(true);

      const { error } = await supabase
        .from('expenses')
        .update({
          description: editDescription.trim(),
          amount,
          category: editCategory,
          payment_method: editPayment,
          payer_id: shared ? editPayerId : user.id,
          my_share: shared ? mine : amount,
          partner_share: shared ? partner : 0,
        })
        .eq('id', expense.id)
        .eq('created_by', user.id);

      if (error) throw error;

      await refreshExpenses();
      setEditing(false);
    } catch (error: any) {
      Alert.alert(
        'No se pudo guardar',
        error?.message ?? 'Inténtalo nuevamente.'
      );
    } finally {
      setSavingEdit(false);
    }
  };

  const deleteExpense = () => {
    if (!user || !expense || !canEdit) return;

    Alert.alert(
      shared ? 'Eliminar gasto compartido' : 'Eliminar gasto',
      shared
        ? 'Se eliminará para ambos y el balance de pareja se recalculará. Esta acción no se puede deshacer.'
        : 'Se eliminará de tus movimientos. Esta acción no se puede deshacer.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            const { error } = await supabase
              .from('expenses')
              .delete()
              .eq('id', expense.id)
              .eq('created_by', user.id);

            if (error) {
              Alert.alert('No se pudo eliminar', error.message);
              return;
            }

            await refreshExpenses();
            router.back();
          },
        },
      ]
    );
  };

  if (authLoading || !user) return null;

  if (!expense) {
    return (
      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
        <View style={styles.notFound}>
          <Text style={styles.notFoundTitle}>Movimiento no disponible</Text>
          <Text style={styles.notFoundText}>
            Puede haberse eliminado o todavía estar sincronizando.
          </Text>
          <TouchableOpacity style={styles.primaryButton} onPress={() => router.back()}>
            <Text style={styles.primaryButtonText}>Volver</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const payerLabel = expense.payerId === user.id ? 'Tú' : partnerName;
  const creatorLabel = expense.createdBy === user.id ? 'Tú' : partnerName;
  const creatorShareLabel =
    expense.createdBy === user.id ? 'Tu parte' : `Parte de ${partnerName}`;
  const otherShareLabel =
    expense.createdBy === user.id ? `Parte de ${partnerName}` : 'Tu parte';

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <Animated.View
          style={[
            styles.flex,
            {
              opacity: enter,
              transform: [
                {
                  translateY: enter.interpolate({
                    inputRange: [0, 1],
                    outputRange: [10, 0],
                  }),
                },
              ],
            },
          ]}
        >
          <ScrollView
            contentContainerStyle={styles.content}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            <View style={styles.header}>
              <TouchableOpacity onPress={() => router.back()}>
                <Text style={styles.back}>‹ Volver</Text>
              </TouchableOpacity>

              {canEdit ? (
                <TouchableOpacity onPress={() => setEditing((value) => !value)}>
                  <Text style={styles.editLink}>
                    {editing ? 'Cancelar' : 'Editar'}
                  </Text>
                </TouchableOpacity>
              ) : null}
            </View>

            {!editing ? (
              <>
                <View style={[styles.heroCard, shared && styles.heroShared]}>
                  <View style={styles.heroIcon}>
                    <Text style={styles.heroIconText}>{category?.icon ?? '🧾'}</Text>
                  </View>

                  <Text style={styles.typeBadge}>
                    {shared ? '👥 Compartido' : '👤 Personal'}
                  </Text>
                  <Text style={styles.description}>{expense.description}</Text>
                  <Text style={styles.amount}>S/ {expense.amount.toFixed(2)}</Text>
                  <Text style={styles.date}>
                    {new Date(expense.createdAt).toLocaleString('es-PE', {
                      day: '2-digit',
                      month: 'long',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </Text>
                </View>

                <Text style={styles.sectionTitle}>Información</Text>
                <View style={styles.card}>
                  <InfoRow
                    label="Categoría"
                    value={`${category?.icon ?? '📦'} ${category?.name ?? expense.category}`}
                  />
                  <Divider />
                  <InfoRow
                    label="Método de pago"
                    value={`${payment?.icon ?? '💳'} ${payment?.name ?? expense.paymentMethod}`}
                  />
                  <Divider />
                  <InfoRow label="Registrado por" value={creatorLabel} />
                  {shared ? (
                    <>
                      <Divider />
                      <InfoRow label="Pagó" value={payerLabel} />
                    </>
                  ) : null}
                </View>

                {shared ? (
                  <>
                    <Text style={styles.sectionTitle}>División</Text>
                    <View style={styles.splitCard}>
                      <View style={styles.splitPerson}>
                        <Text style={styles.splitLabel}>{creatorShareLabel}</Text>
                        <Text style={styles.splitAmount}>
                          S/ {expense.myShare.toFixed(2)}
                        </Text>
                        <Text style={styles.splitPercent}>
                          {expense.amount > 0
                            ? Math.round((expense.myShare / expense.amount) * 100)
                            : 0}
                          %
                        </Text>
                      </View>

                      <View style={styles.splitDivider} />

                      <View style={styles.splitPerson}>
                        <Text style={styles.splitLabel}>{otherShareLabel}</Text>
                        <Text style={styles.splitAmount}>
                          S/ {expense.partnerShare.toFixed(2)}
                        </Text>
                        <Text style={styles.splitPercent}>
                          {expense.amount > 0
                            ? Math.round(
                                (expense.partnerShare / expense.amount) * 100
                              )
                            : 0}
                          %
                        </Text>
                      </View>
                    </View>

                    <View style={styles.myPartCard}>
                      <Text style={styles.myPartLabel}>Tu parte en este gasto</Text>
                      <Text style={styles.myPartAmount}>
                        S/ {myCurrentShare.toFixed(2)}
                      </Text>
                      <Text style={styles.myPartHint}>
                        A {partnerName} le corresponden S/ {partnerCurrentShare.toFixed(2)}
                      </Text>
                    </View>

                    <Text style={styles.sectionTitle}>Reacciones</Text>
                    <View style={styles.reactionsCard}>
                      {REACTIONS.map((emoji) => {
                        const active = myReaction === emoji;
                        const count = reactionCounts[emoji] ?? 0;

                        return (
                          <TouchableOpacity
                            key={emoji}
                            style={[styles.reactionButton, active && styles.reactionActive]}
                            onPress={() => toggleReaction(emoji)}
                          >
                            <Text style={styles.reactionEmoji}>{emoji}</Text>
                            {count > 0 ? (
                              <Text
                                style={[
                                  styles.reactionCount,
                                  active && styles.reactionCountActive,
                                ]}
                              >
                                {count}
                              </Text>
                            ) : null}
                          </TouchableOpacity>
                        );
                      })}
                    </View>

                    <Text style={styles.sectionTitle}>Comentarios</Text>
                    <View style={styles.commentsCard}>
                      {comments.length === 0 ? (
                        <Text style={styles.emptyConversation}>
                          Aún no hay comentarios en este gasto.
                        </Text>
                      ) : (
                        comments.map((comment) => {
                          const mine = comment.author_id === user.id;
                          return (
                            <TouchableOpacity
                              key={comment.id}
                              activeOpacity={mine ? 0.75 : 1}
                              onLongPress={() => mine && deleteComment(comment)}
                              style={[
                                styles.commentBubble,
                                mine
                                  ? styles.commentMine
                                  : styles.commentPartner,
                              ]}
                            >
                              <Text style={styles.commentAuthor}>
                                {mine ? 'Tú' : partnerName}
                              </Text>
                              <Text style={styles.commentBody}>{comment.body}</Text>
                              <Text style={styles.commentDate}>
                                {new Date(comment.created_at).toLocaleString('es-PE', {
                                  day: '2-digit',
                                  month: '2-digit',
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })}
                              </Text>
                            </TouchableOpacity>
                          );
                        })
                      )}

                      <View style={styles.commentComposer}>
                        <TextInput
                          value={commentText}
                          onChangeText={setCommentText}
                          placeholder="Escribe un comentario..."
                          placeholderTextColor="#64748B"
                          style={styles.commentInput}
                          maxLength={500}
                          multiline
                        />
                        <TouchableOpacity
                          style={[
                            styles.sendButton,
                            (!commentText.trim() || sendingComment) &&
                              styles.disabled,
                          ]}
                          onPress={sendComment}
                          disabled={!commentText.trim() || sendingComment}
                        >
                          <Text style={styles.sendText}>
                            {sendingComment ? '…' : '↑'}
                          </Text>
                        </TouchableOpacity>
                      </View>

                      <Text style={styles.commentHint}>
                        Mantén presionado tu comentario para eliminarlo.
                      </Text>
                    </View>
                  </>
                ) : (
                  <View style={styles.privateNote}>
                    <Text style={styles.privateTitle}>🔒 Movimiento privado</Text>
                    <Text style={styles.privateText}>
                      Este gasto solo es visible en tu cuenta.
                    </Text>
                  </View>
                )}

                {canEdit ? (
                  <TouchableOpacity
                    style={styles.deleteButton}
                    onPress={deleteExpense}
                  >
                    <Text style={styles.deleteText}>Eliminar gasto</Text>
                  </TouchableOpacity>
                ) : null}
              </>
            ) : (
              <>
                <Text style={styles.editTitle}>Editar gasto</Text>
                <Text style={styles.editSubtitle}>
                  Los cambios en un gasto compartido se reflejan para ambos y recalculan el balance.
                </Text>

                <Text style={styles.formLabel}>Descripción</Text>
                <TextInput
                  value={editDescription}
                  onChangeText={setEditDescription}
                  style={styles.input}
                  placeholderTextColor="#64748B"
                />

                <Text style={styles.formLabel}>Monto total</Text>
                <TextInput
                  value={editAmount}
                  onChangeText={setEditAmount}
                  keyboardType="decimal-pad"
                  style={styles.amountInput}
                  placeholderTextColor="#64748B"
                />

                <Text style={styles.formLabel}>Categoría</Text>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.chips}
                >
                  {categories.map((item) => {
                    const active = editCategory === item.slug;
                    return (
                      <TouchableOpacity
                        key={item.id}
                        style={[styles.chip, active && styles.chipActive]}
                        onPress={() => setEditCategory(item.slug)}
                      >
                        <Text style={styles.chipText}>
                          {item.icon} {item.name}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>

                <Text style={styles.formLabel}>Método de pago</Text>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.chips}
                >
                  {paymentMethods.map((item) => {
                    const active = editPayment === item.slug;
                    return (
                      <TouchableOpacity
                        key={item.id}
                        style={[styles.chip, active && styles.chipActive]}
                        onPress={() => setEditPayment(item.slug)}
                      >
                        <Text style={styles.chipText}>
                          {item.icon} {item.name}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>

                {shared ? (
                  <>
                    <Text style={styles.formLabel}>¿Quién pagó?</Text>
                    <View style={styles.twoColumns}>
                      <TouchableOpacity
                        style={[
                          styles.choiceButton,
                          editPayerId === user.id && styles.choiceActiveBlue,
                        ]}
                        onPress={() => setEditPayerId(user.id)}
                      >
                        <Text style={styles.choiceTitle}>👤 Yo</Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={[
                          styles.choiceButton,
                          editPayerId === partnerId && styles.choiceActivePink,
                          !partnerId && styles.disabled,
                        ]}
                        onPress={() => partnerId && setEditPayerId(partnerId)}
                        disabled={!partnerId}
                      >
                        <Text style={styles.choiceTitle}>💗 {partnerName}</Text>
                      </TouchableOpacity>
                    </View>

                    <Text style={styles.formLabel}>División exacta</Text>
                    <View style={styles.twoColumns}>
                      <View style={styles.shareField}>
                        <Text style={styles.shareLabel}>Tu parte</Text>
                        <TextInput
                          value={editMyShare}
                          onChangeText={setEditMyShare}
                          keyboardType="decimal-pad"
                          style={styles.shareInput}
                        />
                      </View>
                      <View style={styles.shareField}>
                        <Text style={styles.shareLabel}>{partnerName}</Text>
                        <TextInput
                          value={editPartnerShare}
                          onChangeText={setEditPartnerShare}
                          keyboardType="decimal-pad"
                          style={styles.shareInput}
                        />
                      </View>
                    </View>
                  </>
                ) : null}

                <TouchableOpacity
                  style={[styles.primaryButton, savingEdit && styles.disabled]}
                  onPress={saveEdit}
                  disabled={savingEdit}
                >
                  <Text style={styles.primaryButtonText}>
                    {savingEdit ? 'Guardando...' : 'Guardar cambios'}
                  </Text>
                </TouchableOpacity>
              </>
            )}
          </ScrollView>
        </Animated.View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  );
}

function Divider() {
  return <View style={styles.divider} />;
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  container: { flex: 1, backgroundColor: '#07111F' },
  content: { padding: 20, paddingBottom: 44 },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  back: { color: '#60A5FA', fontSize: 15, fontWeight: '800' },
  editLink: { color: '#60A5FA', fontSize: 13, fontWeight: '900' },

  heroCard: {
    marginTop: 20,
    backgroundColor: '#102B55',
    borderRadius: 23,
    padding: 21,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#1E4E91',
  },
  heroShared: {
    backgroundColor: '#34172A',
    borderColor: '#5C294B',
  },
  heroIcon: {
    width: 58,
    height: 58,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroIconText: { fontSize: 27 },
  typeBadge: {
    color: '#94A3B8',
    fontSize: 10,
    fontWeight: '900',
    marginTop: 12,
  },
  description: {
    color: '#FFFFFF',
    fontSize: 21,
    fontWeight: '900',
    textAlign: 'center',
    marginTop: 5,
  },
  amount: { color: '#FFFFFF', fontSize: 38, fontWeight: '900', marginTop: 6 },
  date: { color: '#64748B', fontSize: 9, marginTop: 7 },

  sectionTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '900',
    marginTop: 23,
    marginBottom: 9,
  },
  card: {
    backgroundColor: '#0E1A2A',
    borderRadius: 18,
    paddingHorizontal: 15,
    borderWidth: 1,
    borderColor: '#1B2B40',
  },
  infoRow: {
    minHeight: 57,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 14,
  },
  infoLabel: { color: '#64748B', fontSize: 10, fontWeight: '800' },
  infoValue: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '900',
    textAlign: 'right',
    flex: 1,
  },
  divider: { height: 1, backgroundColor: '#1B2B40' },

  splitCard: {
    backgroundColor: '#0E1A2A',
    borderRadius: 18,
    padding: 16,
    flexDirection: 'row',
    borderWidth: 1,
    borderColor: '#1B2B40',
  },
  splitPerson: { flex: 1, alignItems: 'center' },
  splitDivider: { width: 1, backgroundColor: '#1B2B40', marginHorizontal: 10 },
  splitLabel: {
    color: '#94A3B8',
    fontSize: 9,
    fontWeight: '800',
    textAlign: 'center',
  },
  splitAmount: { color: '#FFFFFF', fontSize: 20, fontWeight: '900', marginTop: 5 },
  splitPercent: { color: '#64748B', fontSize: 9, marginTop: 3 },

  myPartCard: {
    backgroundColor: '#101A29',
    borderRadius: 16,
    padding: 14,
    marginTop: 9,
    borderWidth: 1,
    borderColor: '#1B2B40',
  },
  myPartLabel: { color: '#94A3B8', fontSize: 9, fontWeight: '800' },
  myPartAmount: { color: '#60A5FA', fontSize: 20, fontWeight: '900', marginTop: 4 },
  myPartHint: { color: '#64748B', fontSize: 9, marginTop: 3 },

  reactionsCard: {
    flexDirection: 'row',
    gap: 8,
    backgroundColor: '#0E1A2A',
    borderRadius: 17,
    padding: 11,
    borderWidth: 1,
    borderColor: '#1B2B40',
  },
  reactionButton: {
    flex: 1,
    minHeight: 43,
    borderRadius: 13,
    backgroundColor: '#16263A',
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 3,
  },
  reactionActive: {
    backgroundColor: '#3A1830',
    borderWidth: 1,
    borderColor: '#EC4899',
  },
  reactionEmoji: { fontSize: 18 },
  reactionCount: { color: '#64748B', fontSize: 9, fontWeight: '900' },
  reactionCountActive: { color: '#FFFFFF' },

  commentsCard: {
    backgroundColor: '#0E1A2A',
    borderRadius: 18,
    padding: 13,
    borderWidth: 1,
    borderColor: '#1B2B40',
  },
  emptyConversation: {
    color: '#64748B',
    fontSize: 10,
    textAlign: 'center',
    paddingVertical: 11,
  },
  commentBubble: {
    maxWidth: '86%',
    borderRadius: 14,
    paddingHorizontal: 11,
    paddingVertical: 9,
    marginBottom: 8,
  },
  commentMine: {
    alignSelf: 'flex-end',
    backgroundColor: '#173A6D',
  },
  commentPartner: {
    alignSelf: 'flex-start',
    backgroundColor: '#3A1830',
  },
  commentAuthor: { color: '#94A3B8', fontSize: 8, fontWeight: '900' },
  commentBody: { color: '#FFFFFF', fontSize: 11, lineHeight: 16, marginTop: 2 },
  commentDate: { color: '#64748B', fontSize: 7, marginTop: 4 },
  commentComposer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
    marginTop: 8,
  },
  commentInput: {
    flex: 1,
    maxHeight: 90,
    minHeight: 43,
    borderRadius: 13,
    backgroundColor: '#07111F',
    color: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#20334B',
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 11,
  },
  sendButton: {
    width: 43,
    height: 43,
    borderRadius: 13,
    backgroundColor: '#EC4899',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendText: { color: '#FFFFFF', fontSize: 20, fontWeight: '900' },
  commentHint: {
    color: '#475569',
    fontSize: 8,
    textAlign: 'center',
    marginTop: 8,
  },

  privateNote: {
    marginTop: 22,
    backgroundColor: '#101A29',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#1B2B40',
  },
  privateTitle: { color: '#FFFFFF', fontSize: 12, fontWeight: '900' },
  privateText: { color: '#64748B', fontSize: 9, marginTop: 4 },

  deleteButton: {
    marginTop: 24,
    borderRadius: 14,
    paddingVertical: 13,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#5A232D',
    backgroundColor: '#2B151A',
  },
  deleteText: { color: '#F87171', fontSize: 11, fontWeight: '900' },

  editTitle: { color: '#FFFFFF', fontSize: 28, fontWeight: '900', marginTop: 21 },
  editSubtitle: {
    color: '#64748B',
    fontSize: 10,
    lineHeight: 15,
    marginTop: 5,
    marginBottom: 5,
  },
  formLabel: {
    color: '#CBD5E1',
    fontSize: 11,
    fontWeight: '900',
    marginTop: 18,
    marginBottom: 7,
  },
  input: {
    backgroundColor: '#0E1A2A',
    color: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#1B2B40',
    padding: 14,
    fontSize: 13,
  },
  amountInput: {
    backgroundColor: '#0E1A2A',
    color: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#1B2B40',
    padding: 15,
    fontSize: 23,
    fontWeight: '900',
  },
  chips: { gap: 8, paddingRight: 16 },
  chip: {
    minHeight: 42,
    borderRadius: 13,
    backgroundColor: '#0E1A2A',
    borderWidth: 1,
    borderColor: '#1B2B40',
    paddingHorizontal: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chipActive: { backgroundColor: '#132E5B', borderColor: '#3B82F6' },
  chipText: { color: '#FFFFFF', fontSize: 10, fontWeight: '800' },

  twoColumns: { flexDirection: 'row', gap: 9 },
  choiceButton: {
    flex: 1,
    minHeight: 48,
    borderRadius: 13,
    backgroundColor: '#0E1A2A',
    borderWidth: 1,
    borderColor: '#1B2B40',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
  },
  choiceActiveBlue: { backgroundColor: '#132E5B', borderColor: '#3B82F6' },
  choiceActivePink: { backgroundColor: '#3A1830', borderColor: '#EC4899' },
  choiceTitle: { color: '#FFFFFF', fontSize: 11, fontWeight: '900' },

  shareField: {
    flex: 1,
    backgroundColor: '#0E1A2A',
    borderRadius: 14,
    padding: 11,
    borderWidth: 1,
    borderColor: '#1B2B40',
  },
  shareLabel: { color: '#64748B', fontSize: 9, fontWeight: '800' },
  shareInput: {
    color: '#FFFFFF',
    fontSize: 19,
    fontWeight: '900',
    paddingVertical: 7,
  },

  primaryButton: {
    marginTop: 24,
    backgroundColor: '#1677FF',
    borderRadius: 15,
    paddingVertical: 15,
    alignItems: 'center',
  },
  primaryButtonText: { color: '#FFFFFF', fontSize: 13, fontWeight: '900' },
  disabled: { opacity: 0.45 },

  notFound: {
    flex: 1,
    padding: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  notFoundTitle: { color: '#FFFFFF', fontSize: 18, fontWeight: '900' },
  notFoundText: {
    color: '#64748B',
    fontSize: 11,
    lineHeight: 16,
    textAlign: 'center',
    marginTop: 6,
  },
});
