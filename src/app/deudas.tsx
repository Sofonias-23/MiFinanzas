import { router, useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Alert,
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

type Direction = 'me_deben' | 'debo';
type DebtStatus = 'pendiente' | 'pagada';

type Debt = {
  id: string;
  direction: Direction;
  person: string;
  amount: number;
  note: string | null;
  status: DebtStatus;
  created_at: string;
};

export default function DeudasScreen() {
  const { user, authLoading } = useFinance();

  const [debts, setDebts] = useState<Debt[]>([]);
  const [direction, setDirection] = useState<Direction>('me_deben');
  const [showForm, setShowForm] = useState(false);
  const [person, setPerson] = useState('');
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) router.replace('/login');
  }, [authLoading, user]);

  const loadDebts = useCallback(async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from('debts')
      .select('id, direction, person, amount, note, status, created_at')
      .order('created_at', { ascending: false });

    if (error) {
      Alert.alert('No se pudieron cargar las deudas', error.message);
      return;
    }

    setDebts(
      (data ?? []).map((row: any) => ({
        ...row,
        amount: Number(row.amount),
      }))
    );
  }, [user]);

  useFocusEffect(
    useCallback(() => {
      loadDebts();
    }, [loadDebts])
  );

  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel(`debts-${user.id}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'debts' },
        () => loadDebts()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, loadDebts]);

  const pending = useMemo(
    () => debts.filter((debt) => debt.status === 'pendiente'),
    [debts]
  );

  const meDeben = useMemo(
    () =>
      pending
        .filter((debt) => debt.direction === 'me_deben')
        .reduce((total, debt) => total + debt.amount, 0),
    [pending]
  );

  const debo = useMemo(
    () =>
      pending
        .filter((debt) => debt.direction === 'debo')
        .reduce((total, debt) => total + debt.amount, 0),
    [pending]
  );

  const visibleDebts = useMemo(
    () => debts.filter((debt) => debt.direction === direction),
    [debts, direction]
  );

  const saveDebt = async () => {
    if (!user) return;

    const parsedAmount = Number(amount.replace(',', '.'));

    if (!person.trim()) {
      Alert.alert('Falta una persona', 'Escribe a quién corresponde la deuda.');
      return;
    }

    if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
      Alert.alert('Monto inválido', 'Escribe un monto mayor a cero.');
      return;
    }

    try {
      setBusy(true);

      const { error } = await supabase.from('debts').insert({
        user_id: user.id,
        direction,
        person: person.trim(),
        amount: parsedAmount,
        note: note.trim() || null,
      });

      if (error) throw error;

      setPerson('');
      setAmount('');
      setNote('');
      setShowForm(false);
      await loadDebts();
    } catch (error: any) {
      Alert.alert('No se pudo guardar', error?.message ?? 'Inténtalo nuevamente.');
    } finally {
      setBusy(false);
    }
  };

  const togglePaid = async (debt: Debt) => {
    const nextStatus: DebtStatus =
      debt.status === 'pendiente' ? 'pagada' : 'pendiente';

    const { error } = await supabase
      .from('debts')
      .update({ status: nextStatus, updated_at: new Date().toISOString() })
      .eq('id', debt.id);

    if (error) {
      Alert.alert('No se pudo actualizar', error.message);
      return;
    }

    await loadDebts();
  };

  const deleteDebt = (debt: Debt) => {
    Alert.alert(
      'Eliminar deuda',
      `¿Quieres eliminar la deuda de ${debt.person}?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            const { error } = await supabase
              .from('debts')
              .delete()
              .eq('id', debt.id);

            if (error) {
              Alert.alert('No se pudo eliminar', error.message);
              return;
            }

            await loadDebts();
          },
        },
      ]
    );
  };

  if (authLoading || !user) return null;

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Text style={styles.back}>‹ Volver</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => setShowForm((value) => !value)}
          >
            <Text style={styles.addButtonText}>{showForm ? 'Cerrar' : '＋ Nueva'}</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.title}>Deudas</Text>
        <Text style={styles.subtitle}>
          Controla lo que te deben y lo que tú debes. Esta información es privada para tu cuenta.
        </Text>

        <View style={styles.summaryRow}>
          <View style={[styles.summaryCard, styles.receivableCard]}>
            <Text style={styles.summaryLabel}>Me deben</Text>
            <Text style={styles.receivableAmount}>S/ {meDeben.toFixed(2)}</Text>
          </View>
          <View style={[styles.summaryCard, styles.owedCard]}>
            <Text style={styles.summaryLabel}>Debo</Text>
            <Text style={styles.owedAmount}>S/ {debo.toFixed(2)}</Text>
          </View>
        </View>

        {showForm && (
          <View style={styles.formCard}>
            <Text style={styles.formTitle}>Nueva deuda</Text>

            <View style={styles.typeRow}>
              <TouchableOpacity
                style={[
                  styles.typeButton,
                  direction === 'me_deben' && styles.typeButtonActive,
                ]}
                onPress={() => setDirection('me_deben')}
              >
                <Text
                  style={[
                    styles.typeText,
                    direction === 'me_deben' && styles.typeTextActive,
                  ]}
                >
                  Me deben
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.typeButton,
                  direction === 'debo' && styles.typeButtonActiveRed,
                ]}
                onPress={() => setDirection('debo')}
              >
                <Text
                  style={[
                    styles.typeText,
                    direction === 'debo' && styles.typeTextActive,
                  ]}
                >
                  Yo debo
                </Text>
              </TouchableOpacity>
            </View>

            <TextInput
              style={styles.input}
              value={person}
              onChangeText={setPerson}
              placeholder={direction === 'me_deben' ? '¿Quién te debe?' : '¿A quién debes?'}
              placeholderTextColor="#475569"
            />

            <TextInput
              style={styles.input}
              value={amount}
              onChangeText={setAmount}
              placeholder="Monto, por ejemplo 120.50"
              placeholderTextColor="#475569"
              keyboardType="decimal-pad"
            />

            <TextInput
              style={[styles.input, styles.noteInput]}
              value={note}
              onChangeText={setNote}
              placeholder="Nota opcional"
              placeholderTextColor="#475569"
              multiline
            />

            <TouchableOpacity
              style={[styles.saveButton, busy && styles.disabled]}
              onPress={saveDebt}
              disabled={busy}
            >
              <Text style={styles.saveButtonText}>
                {busy ? 'Guardando...' : 'Guardar deuda'}
              </Text>
            </TouchableOpacity>
          </View>
        )}

        <View style={styles.tabs}>
          <TouchableOpacity
            style={[styles.tab, direction === 'me_deben' && styles.tabActive]}
            onPress={() => setDirection('me_deben')}
          >
            <Text
              style={[
                styles.tabText,
                direction === 'me_deben' && styles.tabTextActive,
              ]}
            >
              Me deben
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tab, direction === 'debo' && styles.tabActiveRed]}
            onPress={() => setDirection('debo')}
          >
            <Text
              style={[
                styles.tabText,
                direction === 'debo' && styles.tabTextActive,
              ]}
            >
              Debo
            </Text>
          </TouchableOpacity>
        </View>

        {visibleDebts.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyTitle}>No hay deudas aquí</Text>
            <Text style={styles.emptyText}>
              Pulsa “Nueva” para registrar la primera.
            </Text>
          </View>
        ) : (
          <View style={styles.list}>
            {visibleDebts.map((debt) => {
              const paid = debt.status === 'pagada';
              return (
                <View key={debt.id} style={[styles.debtCard, paid && styles.debtPaid]}>
                  <View style={styles.debtTop}>
                    <View style={styles.debtMain}>
                      <Text style={[styles.person, paid && styles.paidText]}>
                        {debt.person}
                      </Text>
                      <Text style={styles.date}>
                        {new Date(debt.created_at).toLocaleDateString('es-PE')}
                      </Text>
                    </View>

                    <Text
                      style={[
                        styles.amount,
                        debt.direction === 'me_deben'
                          ? styles.receivableAmountSmall
                          : styles.owedAmountSmall,
                        paid && styles.paidText,
                      ]}
                    >
                      S/ {debt.amount.toFixed(2)}
                    </Text>
                  </View>

                  {debt.note ? <Text style={styles.note}>{debt.note}</Text> : null}

                  <View style={styles.debtActions}>
                    <TouchableOpacity
                      style={styles.statusButton}
                      onPress={() => togglePaid(debt)}
                    >
                      <Text style={styles.statusButtonText}>
                        {paid ? '↩ Marcar pendiente' : '✓ Marcar pagada'}
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity onPress={() => deleteDebt(debt)}>
                      <Text style={styles.deleteText}>Eliminar</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              );
            })}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0B1220' },
  content: { padding: 20, paddingBottom: 42 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  back: { color: '#60A5FA', fontSize: 16 },
  addButton: {
    backgroundColor: '#1D4ED8',
    borderRadius: 13,
    paddingHorizontal: 14,
    paddingVertical: 9,
  },
  addButtonText: { color: '#FFFFFF', fontSize: 12, fontWeight: '800' },
  title: { color: '#FFFFFF', fontSize: 30, fontWeight: '900', marginTop: 20 },
  subtitle: {
    color: '#64748B',
    fontSize: 12,
    lineHeight: 18,
    marginTop: 6,
  },
  summaryRow: { flexDirection: 'row', gap: 12, marginTop: 20 },
  summaryCard: { flex: 1, borderRadius: 18, padding: 17 },
  receivableCard: { backgroundColor: '#102B26' },
  owedCard: { backgroundColor: '#32171D' },
  summaryLabel: { color: '#94A3B8', fontSize: 11, fontWeight: '700' },
  receivableAmount: { color: '#4ADE80', fontSize: 22, fontWeight: '900', marginTop: 5 },
  owedAmount: { color: '#F87171', fontSize: 22, fontWeight: '900', marginTop: 5 },
  formCard: {
    marginTop: 18,
    backgroundColor: '#111827',
    borderRadius: 20,
    padding: 17,
  },
  formTitle: { color: '#FFFFFF', fontSize: 17, fontWeight: '900' },
  typeRow: { flexDirection: 'row', gap: 9, marginTop: 14 },
  typeButton: {
    flex: 1,
    backgroundColor: '#0F172A',
    borderRadius: 12,
    paddingVertical: 11,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#1E293B',
  },
  typeButtonActive: { backgroundColor: '#12382D', borderColor: '#22C55E' },
  typeButtonActiveRed: { backgroundColor: '#3A171C', borderColor: '#EF4444' },
  typeText: { color: '#64748B', fontSize: 12, fontWeight: '800' },
  typeTextActive: { color: '#FFFFFF' },
  input: {
    marginTop: 11,
    backgroundColor: '#0F172A',
    color: '#FFFFFF',
    borderRadius: 13,
    paddingHorizontal: 14,
    paddingVertical: 13,
    fontSize: 14,
  },
  noteInput: { minHeight: 70, textAlignVertical: 'top' },
  saveButton: {
    backgroundColor: '#2563EB',
    borderRadius: 13,
    paddingVertical: 13,
    alignItems: 'center',
    marginTop: 13,
  },
  saveButtonText: { color: '#FFFFFF', fontSize: 13, fontWeight: '900' },
  disabled: { opacity: 0.6 },
  tabs: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 22,
    marginBottom: 12,
  },
  tab: {
    flex: 1,
    backgroundColor: '#111827',
    borderRadius: 12,
    paddingVertical: 11,
    alignItems: 'center',
  },
  tabActive: { backgroundColor: '#12382D' },
  tabActiveRed: { backgroundColor: '#3A171C' },
  tabText: { color: '#64748B', fontSize: 12, fontWeight: '800' },
  tabTextActive: { color: '#FFFFFF' },
  list: { gap: 10 },
  debtCard: {
    backgroundColor: '#111827',
    borderRadius: 17,
    padding: 15,
  },
  debtPaid: { opacity: 0.58 },
  debtTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  debtMain: { flex: 1 },
  person: { color: '#FFFFFF', fontSize: 15, fontWeight: '800' },
  date: { color: '#475569', fontSize: 10, marginTop: 3 },
  amount: { fontSize: 15, fontWeight: '900', marginLeft: 10 },
  receivableAmountSmall: { color: '#4ADE80' },
  owedAmountSmall: { color: '#F87171' },
  note: { color: '#94A3B8', fontSize: 11, lineHeight: 16, marginTop: 10 },
  debtActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 13,
    paddingTop: 11,
    borderTopWidth: 1,
    borderTopColor: '#1E293B',
  },
  statusButton: {
    backgroundColor: '#172554',
    borderRadius: 10,
    paddingHorizontal: 11,
    paddingVertical: 8,
  },
  statusButtonText: { color: '#93C5FD', fontSize: 10, fontWeight: '800' },
  deleteText: { color: '#F87171', fontSize: 10, fontWeight: '800' },
  paidText: { textDecorationLine: 'line-through', color: '#64748B' },
  emptyCard: {
    backgroundColor: '#111827',
    borderRadius: 17,
    padding: 24,
    alignItems: 'center',
  },
  emptyTitle: { color: '#FFFFFF', fontSize: 15, fontWeight: '800' },
  emptyText: { color: '#64748B', fontSize: 11, marginTop: 5 },
});
