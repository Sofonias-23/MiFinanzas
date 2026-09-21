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

import { AppIcon } from '@/components/app-icon';
import { useFinance } from '@/context/finance-context';
import { supabase } from '@/lib/supabase';

type Direction = 'me_deben' | 'debo';
type DebtStatus = 'pendiente' | 'pagada';
type Tab = 'entre' | 'historial';

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

  const [tab, setTab] = useState<Tab>('entre');
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
      ? `Te debe`
      : 'Están al día';

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <AppIcon name="back" size={17} color="#23A7FF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Deudas</Text>
          <View style={styles.headerSpacer} />
        </View>

        <View style={styles.tabs}>
          <TouchableOpacity
            style={[styles.tab, tab === 'entre' && styles.tabActive]}
            onPress={() => setTab('entre')}
          >
            <Text style={[styles.tabText, tab === 'entre' && styles.tabTextActive]}>
              Entre ustedes
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, tab === 'historial' && styles.tabActive]}
            onPress={() => setTab('historial')}
          >
            <Text style={[styles.tabText, tab === 'historial' && styles.tabTextActive]}>
              Historial
            </Text>
          </TouchableOpacity>
        </View>

        {tab === 'entre' ? (
          <>
            <View style={styles.partnerCard}>
              <Text style={styles.partnerLabel}>Saldo entre ustedes</Text>

              <View style={styles.balanceIcon}>
                <AppIcon name="settle" size={27} color="#F43F75" />
              </View>

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

              <Text style={styles.partnerHint}>
                {partnerBalance < -0.005
                  ? `Tú debes este monto a ${partnerName}.`
                  : partnerBalance > 0.005
                  ? `${partnerName} te debe este monto.`
                  : 'No tienen pagos pendientes.'}
              </Text>

              {balanceAbs >= 0.01 ? (
                <TouchableOpacity
                  style={styles.settleButton}
                  onPress={() => router.push('/saldar-deuda')}
                >
                  <Text style={styles.settleText}>Saldar ahora</Text>
                </TouchableOpacity>
              ) : null}
            </View>

            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Últimos movimientos</Text>
              <TouchableOpacity onPress={() => setTab('historial')}>
                <Text style={styles.link}>Ver todos</Text>
              </TouchableOpacity>
            </View>

            {settlements.length === 0 ? (
              <View style={styles.emptyCard}>
                <Text style={styles.emptyText}>
                  Aquí aparecerán los pagos que hagan entre ustedes.
                </Text>
              </View>
            ) : (
              <View style={styles.list}>
                {settlements.slice(0, 5).map((settlement) => {
                  const iPaid = settlement.payerId === user.id;
                  return (
                    <View key={settlement.id} style={styles.settlementRow}>
                      <View style={styles.avatar}>
                        <AppIcon
                          name="profile"
                          size={20}
                          color={iPaid ? '#23A7FF' : '#F43F75'}
                        />
                      </View>

                      <View style={styles.settlementText}>
                        <Text style={styles.rowTitle}>
                          {iPaid ? 'Tú pagaste' : `${partnerName} pagó`}
                        </Text>
                        <Text style={styles.rowMeta}>
                          {new Date(settlement.createdAt).toLocaleDateString('es-PE')}
                          {' · '}
                          {settlement.paymentMethod}
                        </Text>
                      </View>

                      <View style={styles.rowRight}>
                        <Text style={styles.rowState}>
                          {iPaid ? 'Pagado' : 'Recibido'}
                        </Text>
                        <Text
                          style={[
                            styles.settlementAmount,
                            iPaid ? styles.green : styles.pink,
                          ]}
                        >
                          S/ {settlement.amount.toFixed(2)}
                        </Text>
                      </View>
                    </View>
                  );
                })}
              </View>
            )}
          </>
        ) : (
          <>
            <Text style={styles.historyTitle}>Historial de liquidaciones</Text>

            {settlements.length === 0 ? (
              <View style={styles.emptyCard}>
                <Text style={styles.emptyText}>Aún no hay liquidaciones registradas.</Text>
              </View>
            ) : (
              <View style={styles.list}>
                {settlements.map((settlement) => {
                  const iPaid = settlement.payerId === user.id;
                  return (
                    <View key={settlement.id} style={styles.settlementRow}>
                      <View style={styles.settlementIcon}>
                        <AppIcon name="settle" size={18} color="#60A5FA" />
                      </View>
                      <View style={styles.settlementText}>
                        <Text style={styles.rowTitle}>
                          {iPaid
                            ? `Pagaste a ${partnerName}`
                            : `${partnerName} te pagó`}
                        </Text>
                        <Text style={styles.rowMeta}>
                          {new Date(settlement.createdAt).toLocaleDateString('es-PE')}
                          {' · '}
                          {settlement.paymentMethod}
                        </Text>
                        {settlement.note ? (
                          <Text style={styles.note}>{settlement.note}</Text>
                        ) : null}
                      </View>
                      <Text style={styles.settlementAmount}>
                        S/ {settlement.amount.toFixed(2)}
                      </Text>
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
                      style={[
                        styles.personalTab,
                        direction === 'me_deben' && styles.personalTabBlue,
                      ]}
                      onPress={() => setDirection('me_deben')}
                    >
                      <Text style={styles.personalTabText}>Me deben</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[
                        styles.personalTab,
                        direction === 'debo' && styles.personalTabPink,
                      ]}
                      onPress={() => setDirection('debo')}
                    >
                      <Text style={styles.personalTabText}>Debo</Text>
                    </TouchableOpacity>
                  </View>
                  <TouchableOpacity
                    style={styles.newButton}
                    onPress={() => setShowForm((value) => !value)}
                  >
                    <Text style={styles.newButtonText}>
                      {showForm ? 'Cerrar' : '＋ Nueva'}
                    </Text>
                  </TouchableOpacity>
                </View>

                {showForm ? (
                  <View style={styles.formCard}>
                    <TextInput
                      style={styles.input}
                      value={person}
                      onChangeText={setPerson}
                      placeholder={
                        direction === 'me_deben'
                          ? '¿Quién te debe?'
                          : '¿A quién debes?'
                      }
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
                      <Text style={styles.saveText}>
                        {busy ? 'Guardando...' : 'Guardar deuda'}
                      </Text>
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
                        <View
                          key={debt.id}
                          style={[styles.debtCard, paid && styles.debtPaid]}
                        >
                          <View style={styles.debtTop}>
                            <View style={styles.debtText}>
                              <Text style={[styles.rowTitle, paid && styles.paidText]}>
                                {debt.person}
                              </Text>
                              <Text style={styles.rowMeta}>
                                {new Date(debt.created_at).toLocaleDateString('es-PE')}
                              </Text>
                              {debt.note ? (
                                <Text style={styles.note}>{debt.note}</Text>
                              ) : null}
                            </View>
                            <Text
                              style={[
                                styles.debtAmount,
                                direction === 'debo' && styles.pink,
                              ]}
                            >
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
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#07111F' },
  content: { padding: 18, paddingBottom: 42 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    width: 34,
    height: 34,
    borderRadius: 11,
    backgroundColor: '#0E1A2A',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: { color: '#FFFFFF', fontSize: 17, fontWeight: '900' },
  headerSpacer: { width: 34 },
  tabs: {
    marginTop: 16,
    flexDirection: 'row',
    backgroundColor: '#0E1A2A',
    borderRadius: 12,
    padding: 3,
  },
  tab: {
    flex: 1,
    minHeight: 34,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabActive: { backgroundColor: '#173A6D' },
  tabText: { color: '#64748B', fontSize: 9, fontWeight: '900' },
  tabTextActive: { color: '#60A5FA' },
  partnerCard: {
    marginTop: 12,
    backgroundColor: '#0E1A2A',
    borderRadius: 18,
    padding: 17,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#1B2B40',
  },
  partnerLabel: { color: '#94A3B8', fontSize: 8, fontWeight: '800' },
  balanceIcon: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: '#34172A',
    borderWidth: 2,
    borderColor: '#F43F75',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
  },
  partnerText: {
    color: '#F472B6',
    fontSize: 12,
    fontWeight: '900',
    marginTop: 9,
    textAlign: 'center',
  },
  partnerAmount: {
    color: '#F472B6',
    fontSize: 31,
    fontWeight: '900',
    marginTop: 2,
  },
  partnerHint: {
    color: '#94A3B8',
    fontSize: 8,
    marginTop: 3,
    textAlign: 'center',
  },
  green: { color: '#4ADE80' },
  pink: { color: '#F472B6' },
  settleButton: {
    marginTop: 13,
    width: '100%',
    backgroundColor: '#F43F75',
    borderRadius: 12,
    paddingVertical: 11,
    alignItems: 'center',
  },
  settleText: { color: '#FFFFFF', fontSize: 10, fontWeight: '900' },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 18,
    marginBottom: 8,
  },
  sectionTitle: { color: '#FFFFFF', fontSize: 12, fontWeight: '900' },
  link: { color: '#60A5FA', fontSize: 8, fontWeight: '900' },
  list: { gap: 7 },
  settlementRow: {
    backgroundColor: '#0E1A2A',
    borderRadius: 13,
    padding: 10,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#1B2B40',
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#13243A',
    alignItems: 'center',
    justifyContent: 'center',
  },
  settlementIcon: {
    width: 36,
    height: 36,
    borderRadius: 11,
    backgroundColor: '#16263A',
    alignItems: 'center',
    justifyContent: 'center',
  },
  settlementText: { flex: 1, marginLeft: 8 },
  rowTitle: { color: '#FFFFFF', fontSize: 10, fontWeight: '900' },
  rowMeta: { color: '#64748B', fontSize: 7.5, marginTop: 2 },
  rowRight: { alignItems: 'flex-end' },
  rowState: { color: '#94A3B8', fontSize: 7 },
  settlementAmount: {
    color: '#4ADE80',
    fontSize: 10,
    fontWeight: '900',
    marginLeft: 8,
  },
  note: { color: '#94A3B8', fontSize: 8, marginTop: 3 },
  emptyCard: {
    backgroundColor: '#0E1A2A',
    borderRadius: 13,
    padding: 17,
    borderWidth: 1,
    borderColor: '#1B2B40',
  },
  emptyText: { color: '#64748B', fontSize: 8.5, textAlign: 'center' },
  historyTitle: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '900',
    marginTop: 17,
    marginBottom: 8,
  },
  personalToggle: {
    marginTop: 18,
    backgroundColor: '#0E1A2A',
    borderRadius: 14,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#1B2B40',
  },
  personalTitle: { color: '#FFFFFF', fontSize: 10, fontWeight: '900' },
  personalSub: { color: '#64748B', fontSize: 7.5, marginTop: 3 },
  personalArrow: { color: '#94A3B8', fontSize: 16 },
  personalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    marginTop: 9,
  },
  personalTabs: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: '#0E1A2A',
    borderRadius: 11,
    padding: 3,
  },
  personalTab: {
    flex: 1,
    minHeight: 31,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  personalTabBlue: { backgroundColor: '#164E9D' },
  personalTabPink: { backgroundColor: '#7A234A' },
  personalTabText: { color: '#FFFFFF', fontSize: 8, fontWeight: '900' },
  newButton: {
    backgroundColor: '#1D4ED8',
    borderRadius: 10,
    paddingHorizontal: 9,
    paddingVertical: 8,
  },
  newButtonText: { color: '#FFFFFF', fontSize: 8, fontWeight: '900' },
  formCard: {
    backgroundColor: '#0E1A2A',
    borderRadius: 14,
    padding: 12,
    marginTop: 8,
    borderWidth: 1,
    borderColor: '#1B2B40',
  },
  input: {
    backgroundColor: '#07111F',
    color: '#FFFFFF',
    borderRadius: 11,
    padding: 11,
    fontSize: 10,
    marginBottom: 7,
    borderWidth: 1,
    borderColor: '#1B2B40',
  },
  noteInput: { minHeight: 55, textAlignVertical: 'top' },
  saveButton: {
    backgroundColor: '#1677FF',
    borderRadius: 11,
    paddingVertical: 10,
    alignItems: 'center',
  },
  saveText: { color: '#FFFFFF', fontSize: 9, fontWeight: '900' },
  disabled: { opacity: 0.5 },
  debtCard: {
    backgroundColor: '#0E1A2A',
    borderRadius: 13,
    padding: 11,
    borderWidth: 1,
    borderColor: '#1B2B40',
  },
  debtPaid: { opacity: 0.55 },
  debtTop: { flexDirection: 'row', justifyContent: 'space-between' },
  debtText: { flex: 1 },
  debtAmount: { color: '#60A5FA', fontSize: 11, fontWeight: '900' },
  paidText: { textDecorationLine: 'line-through', color: '#64748B' },
  debtActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 9,
    paddingTop: 7,
    borderTopWidth: 1,
    borderTopColor: '#1B2B40',
  },
  markText: { color: '#60A5FA', fontSize: 7.5, fontWeight: '900' },
  deleteText: { color: '#F87171', fontSize: 7.5, fontWeight: '900' },
});
