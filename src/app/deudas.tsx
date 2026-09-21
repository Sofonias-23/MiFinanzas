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

type PartnerStatus = {
  partner_name: string | null;
  member_count: number;
};

export default function DeudasScreen() {
  const {
    user,
    authLoading,
    partnerBalance,
    settlements,
    refreshExpenses,
    refreshSettlements,
  } = useFinance();

  const [debts, setDebts] = useState<Debt[]>([]);
  const [partnerName, setPartnerName] = useState('tu pareja');
  const [direction, setDirection] = useState<Direction>('me_deben');
  const [showPersonal, setShowPersonal] = useState(false);
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

  const loadPartner = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase.rpc('get_partner_status');
    const status = (data?.[0] ?? null) as PartnerStatus | null;
    if (status?.member_count && status.member_count >= 2) {
      setPartnerName(status.partner_name || 'tu pareja');
    }
  }, [user]);

  useFocusEffect(
    useCallback(() => {
      loadDebts();
      loadPartner();
      refreshExpenses();
      refreshSettlements();
    }, [loadDebts, loadPartner, refreshExpenses, refreshSettlements])
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

  const visibleDebts = useMemo(
    () => debts.filter((debt) => debt.direction === direction),
    [debts, direction]
  );

  const pending = useMemo(
    () => debts.filter((debt) => debt.status === 'pendiente'),
    [debts]
  );

  const personalReceivable = useMemo(
    () =>
      pending
        .filter((debt) => debt.direction === 'me_deben')
        .reduce((sum, debt) => sum + debt.amount, 0),
    [pending]
  );

  const personalOwed = useMemo(
    () =>
      pending
        .filter((debt) => debt.direction === 'debo')
        .reduce((sum, debt) => sum + debt.amount, 0),
    [pending]
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
    const next: DebtStatus = debt.status === 'pendiente' ? 'pagada' : 'pendiente';
    const { error } = await supabase
      .from('debts')
      .update({ status: next, updated_at: new Date().toISOString() })
      .eq('id', debt.id);

    if (error) {
      Alert.alert('No se pudo actualizar', error.message);
      return;
    }
    await loadDebts();
  };

  const deleteDebt = (debt: Debt) => {
    Alert.alert('Eliminar deuda', `¿Eliminar la deuda de ${debt.person}?`, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Eliminar',
        style: 'destructive',
        onPress: async () => {
          const { error } = await supabase.from('debts').delete().eq('id', debt.id);
          if (error) {
            Alert.alert('No se pudo eliminar', error.message);
            return;
          }
          await loadDebts();
        },
      },
    ]);
  };

  if (authLoading || !user) return null;

  const balanceAbs = Math.abs(partnerBalance);
  const partnerText =
    partnerBalance > 0.005
      ? `${partnerName} te debe`
      : partnerBalance < -0.005
      ? `Tú le debes a ${partnerName}`
      : 'Están al día';

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
          <Text style={styles.headerTitle}>Deudas</Text>
          <View style={styles.spacer} />
        </View>

        <Text style={styles.sectionEyebrow}>ENTRE USTEDES</Text>
        <View style={styles.partnerCard}>
          <Text style={styles.balanceIcon}>⚖️</Text>
          <Text style={styles.partnerLabel}>Balance con {partnerName}</Text>
          <Text style={styles.partnerText}>{partnerText}</Text>
          <Text
            style={[
              styles.partnerAmount,
              partnerBalance > 0.005 && styles.green,
              partnerBalance < -0.005 && styles.pink,
            ]}
          >
            S/ {balanceAbs.toFixed(2)}
          </Text>

          {balanceAbs >= 0.01 ? (
            <TouchableOpacity
              style={styles.settleButton}
              onPress={() => router.push('/saldar-deuda')}
            >
              <Text style={styles.settleText}>▣ Saldar deuda</Text>
            </TouchableOpacity>
          ) : (
            <View style={styles.upToDate}>
              <Text style={styles.upToDateText}>✓ No tienen pagos pendientes</Text>
            </View>
          )}
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Últimos pagos</Text>
          <Text style={styles.count}>{settlements.length}</Text>
        </View>

        {settlements.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyText}>Aquí aparecerán los pagos que hagan entre ustedes.</Text>
          </View>
        ) : (
          <View style={styles.list}>
            {settlements.slice(0, 6).map((settlement) => {
              const iPaid = settlement.payerId === user.id;
              return (
                <View key={settlement.id} style={styles.settlementRow}>
                  <View style={styles.settlementIcon}>
                    <Text style={styles.settlementIconText}>⇄</Text>
                  </View>
                  <View style={styles.settlementText}>
                    <Text style={styles.rowTitle}>
                      {iPaid ? `Pagaste a ${partnerName}` : `${partnerName} te pagó`}
                    </Text>
                    <Text style={styles.rowMeta}>
                      {new Date(settlement.createdAt).toLocaleDateString('es-PE')} · {settlement.paymentMethod}
                    </Text>
                    {settlement.note ? (
                      <Text style={styles.note}>{settlement.note}</Text>
                    ) : null}
                  </View>
                  <Text style={styles.settlementAmount}>S/ {settlement.amount.toFixed(2)}</Text>
                </View>
              );
            })}
          </View>
        )}

        <TouchableOpacity
          style={styles.personalToggle}
          onPress={() => setShowPersonal((value) => !value)}
        >
          <View>
            <Text style={styles.personalTitle}>Otras deudas personales</Text>
            <Text style={styles.personalSub}>
              Privadas · Me deben S/ {personalReceivable.toFixed(2)} · Debo S/ {personalOwed.toFixed(2)}
            </Text>
          </View>
          <Text style={styles.personalArrow}>{showPersonal ? '⌃' : '⌄'}</Text>
        </TouchableOpacity>

        {showPersonal ? (
          <>
            <View style={styles.personalHeader}>
              <View style={styles.personalTabs}>
                <TouchableOpacity
                  style={[styles.personalTab, direction === 'me_deben' && styles.personalTabBlue]}
                  onPress={() => setDirection('me_deben')}
                >
                  <Text style={styles.personalTabText}>Me deben</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.personalTab, direction === 'debo' && styles.personalTabPink]}
                  onPress={() => setDirection('debo')}
                >
                  <Text style={styles.personalTabText}>Debo</Text>
                </TouchableOpacity>
              </View>
              <TouchableOpacity
                style={styles.newButton}
                onPress={() => setShowForm((value) => !value)}
              >
                <Text style={styles.newButtonText}>{showForm ? 'Cerrar' : '＋ Nueva'}</Text>
              </TouchableOpacity>
            </View>

            {showForm ? (
              <View style={styles.formCard}>
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
                  placeholder="Monto"
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
                  <Text style={styles.saveText}>{busy ? 'Guardando...' : 'Guardar deuda'}</Text>
                </TouchableOpacity>
              </View>
            ) : null}

            {visibleDebts.length === 0 ? (
              <View style={styles.emptyCard}>
                <Text style={styles.emptyText}>No hay deudas personales aquí.</Text>
              </View>
            ) : (
              <View style={styles.list}>
                {visibleDebts.map((debt) => {
                  const paid = debt.status === 'pagada';
                  return (
                    <View key={debt.id} style={[styles.debtCard, paid && styles.debtPaid]}>
                      <View style={styles.debtTop}>
                        <View style={styles.debtText}>
                          <Text style={[styles.rowTitle, paid && styles.paidText]}>{debt.person}</Text>
                          <Text style={styles.rowMeta}>
                            {new Date(debt.created_at).toLocaleDateString('es-PE')}
                          </Text>
                          {debt.note ? <Text style={styles.note}>{debt.note}</Text> : null}
                        </View>
                        <Text style={[styles.debtAmount, direction === 'debo' && styles.pink]}>
                          S/ {debt.amount.toFixed(2)}
                        </Text>
                      </View>
                      <View style={styles.debtActions}>
                        <TouchableOpacity onPress={() => togglePaid(debt)}>
                          <Text style={styles.markText}>
                            {paid ? '↩ Pendiente' : '✓ Marcar pagada'}
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
          </>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#07111F' },
  content: { padding: 18, paddingBottom: 42 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  back: { color: '#60A5FA', fontSize: 14, fontWeight: '900', width: 70 },
  headerTitle: { color: '#FFFFFF', fontSize: 17, fontWeight: '900' },
  spacer: { width: 70 },
  sectionEyebrow: { color: '#F472B6', fontSize: 9, fontWeight: '900', letterSpacing: 0.8, marginTop: 20, marginBottom: 8 },
  partnerCard: { backgroundColor: '#34172A', borderRadius: 22, padding: 19, alignItems: 'center', borderWidth: 1, borderColor: '#5C294B' },
  balanceIcon: { fontSize: 25 },
  partnerLabel: { color: '#C9A8B9', fontSize: 9, fontWeight: '800', marginTop: 6 },
  partnerText: { color: '#FFFFFF', fontSize: 16, fontWeight: '900', marginTop: 6, textAlign: 'center' },
  partnerAmount: { color: '#CBD5E1', fontSize: 34, fontWeight: '900', marginTop: 3 },
  green: { color: '#4ADE80' },
  pink: { color: '#F472B6' },
  settleButton: { marginTop: 14, width: '100%', backgroundColor: '#F43F75', borderRadius: 14, paddingVertical: 13, alignItems: 'center' },
  settleText: { color: '#FFFFFF', fontSize: 11, fontWeight: '900' },
  upToDate: { marginTop: 13, paddingHorizontal: 14, paddingVertical: 9, backgroundColor: '#12382D', borderRadius: 12 },
  upToDateText: { color: '#4ADE80', fontSize: 9, fontWeight: '900' },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 21, marginBottom: 8 },
  sectionTitle: { color: '#FFFFFF', fontSize: 14, fontWeight: '900' },
  count: { color: '#64748B', fontSize: 9, fontWeight: '900' },
  list: { gap: 8 },
  settlementRow: { backgroundColor: '#0E1A2A', borderRadius: 14, padding: 12, flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: '#1B2B40' },
  settlementIcon: { width: 38, height: 38, borderRadius: 12, backgroundColor: '#16263A', alignItems: 'center', justifyContent: 'center' },
  settlementIconText: { color: '#60A5FA', fontSize: 17, fontWeight: '900' },
  settlementText: { flex: 1, marginLeft: 9 },
  rowTitle: { color: '#FFFFFF', fontSize: 11, fontWeight: '900' },
  rowMeta: { color: '#64748B', fontSize: 8, marginTop: 3 },
  note: { color: '#94A3B8', fontSize: 8, marginTop: 3 },
  settlementAmount: { color: '#4ADE80', fontSize: 11, fontWeight: '900', marginLeft: 8 },
  emptyCard: { backgroundColor: '#0E1A2A', borderRadius: 14, padding: 18 },
  emptyText: { color: '#64748B', fontSize: 9, textAlign: 'center' },
  personalToggle: { marginTop: 20, backgroundColor: '#0E1A2A', borderRadius: 16, padding: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderWidth: 1, borderColor: '#1B2B40' },
  personalTitle: { color: '#FFFFFF', fontSize: 12, fontWeight: '900' },
  personalSub: { color: '#64748B', fontSize: 8, marginTop: 3 },
  personalArrow: { color: '#94A3B8', fontSize: 18 },
  personalHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 10 },
  personalTabs: { flex: 1, flexDirection: 'row', backgroundColor: '#0E1A2A', borderRadius: 12, padding: 3 },
  personalTab: { flex: 1, minHeight: 34, borderRadius: 9, alignItems: 'center', justifyContent: 'center' },
  personalTabBlue: { backgroundColor: '#164E9D' },
  personalTabPink: { backgroundColor: '#7A234A' },
  personalTabText: { color: '#FFFFFF', fontSize: 8, fontWeight: '900' },
  newButton: { backgroundColor: '#1D4ED8', borderRadius: 11, paddingHorizontal: 10, paddingVertical: 9 },
  newButtonText: { color: '#FFFFFF', fontSize: 8, fontWeight: '900' },
  formCard: { backgroundColor: '#0E1A2A', borderRadius: 15, padding: 13, marginTop: 9, borderWidth: 1, borderColor: '#1B2B40' },
  input: { backgroundColor: '#07111F', color: '#FFFFFF', borderRadius: 12, padding: 12, fontSize: 11, marginBottom: 8, borderWidth: 1, borderColor: '#1B2B40' },
  noteInput: { minHeight: 58, textAlignVertical: 'top' },
  saveButton: { backgroundColor: '#1677FF', borderRadius: 12, paddingVertical: 11, alignItems: 'center' },
  saveText: { color: '#FFFFFF', fontSize: 10, fontWeight: '900' },
  disabled: { opacity: 0.5 },
  debtCard: { backgroundColor: '#0E1A2A', borderRadius: 14, padding: 12, borderWidth: 1, borderColor: '#1B2B40' },
  debtPaid: { opacity: 0.55 },
  debtTop: { flexDirection: 'row', justifyContent: 'space-between' },
  debtText: { flex: 1 },
  debtAmount: { color: '#60A5FA', fontSize: 12, fontWeight: '900' },
  paidText: { textDecorationLine: 'line-through', color: '#64748B' },
  debtActions: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 10, paddingTop: 8, borderTopWidth: 1, borderTopColor: '#1B2B40' },
  markText: { color: '#60A5FA', fontSize: 8, fontWeight: '900' },
  deleteText: { color: '#F87171', fontSize: 8, fontWeight: '900' },
});
