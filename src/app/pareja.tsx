import { router, useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Alert,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppIcon } from '@/components/app-icon';
import { BottomNav } from '@/components/bottom-nav';
import { useFinance } from '@/context/finance-context';
import { categoryIconName } from '@/lib/icon-map';
import { supabase } from '@/lib/supabase';

type PartnerStatus = {
  household_id: string | null;
  my_role: string | null;
  partner_name: string | null;
  member_count: number;
  invite_code: string | null;
};

function isCurrentMonth(value: string) {
  const date = new Date(value);
  const now = new Date();
  return date.getFullYear() === now.getFullYear() && date.getMonth() === now.getMonth();
}

export default function ParejaScreen() {
  const {
    user,
    authLoading,
    expenses,
    categories,
    partnerBalance,
    refreshExpenses,
    refreshSettlements,
  } = useFinance();

  const [status, setStatus] = useState<PartnerStatus | null>(null);
  const [code, setCode] = useState('');
  const [inviteCode, setInviteCode] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) router.replace('/login');
  }, [authLoading, user]);

  const loadStatus = useCallback(async () => {
    if (!user) return;
    const { data, error } = await supabase.rpc('get_partner_status');
    if (error) {
      Alert.alert('No se pudo cargar', error.message);
      return;
    }
    const next = (data?.[0] ?? null) as PartnerStatus | null;
    setStatus(next);
    setInviteCode(next?.invite_code ?? '');
  }, [user]);

  useFocusEffect(
    useCallback(() => {
      loadStatus();
      refreshExpenses();
      refreshSettlements();
    }, [loadStatus, refreshExpenses, refreshSettlements])
  );

  const generateInvite = async () => {
    try {
      setBusy(true);
      const { data, error } = await supabase.rpc('create_partner_invite');
      if (error) throw error;
      setInviteCode(String(data ?? ''));
      await loadStatus();
    } catch (error: any) {
      Alert.alert('No se pudo generar', error?.message ?? 'Inténtalo nuevamente.');
    } finally {
      setBusy(false);
    }
  };

  const joinWithCode = async () => {
    const normalized = code.trim().toUpperCase();
    if (normalized.length !== 8) {
      Alert.alert('Código incompleto', 'El código debe tener 8 caracteres.');
      return;
    }

    try {
      setBusy(true);
      const { error } = await supabase.rpc('join_household_by_code', {
        p_code: normalized,
      });
      if (error) throw error;
      setCode('');
      await Promise.all([loadStatus(), refreshExpenses()]);
      Alert.alert('Listo', 'Ya pueden compartir gastos.');
    } catch (error: any) {
      Alert.alert('No se pudo vincular', error?.message ?? 'Revisa el código.');
    } finally {
      setBusy(false);
    }
  };

  const shareInvite = async () => {
    if (!inviteCode) return;
    await Share.share({
      message: `Únete a mi grupo en MiFinanzas. Código: ${inviteCode}`,
    });
  };

  const linked = (status?.member_count ?? 0) >= 2;
  const partnerName = status?.partner_name ?? 'tu pareja';
  const myName =
    user?.user_metadata?.display_name || user?.email?.split('@')[0] || 'Tú';

  const monthShared = useMemo(
    () =>
      expenses.filter(
        (expense) =>
          expense.type === 'compartido' && isCurrentMonth(expense.createdAt)
      ),
    [expenses]
  );

  const monthTotal = useMemo(
    () => monthShared.reduce((sum, expense) => sum + expense.amount, 0),
    [monthShared]
  );

  const paidByMe = useMemo(
    () =>
      monthShared
        .filter((expense) => expense.payerId === user?.id)
        .reduce((sum, expense) => sum + expense.amount, 0),
    [monthShared, user]
  );

  const paidByPartner = Math.max(0, monthTotal - paidByMe);

  const recentShared = useMemo(
    () => expenses.filter((expense) => expense.type === 'compartido').slice(0, 4),
    [expenses]
  );

  const categorySummary = useMemo(() => {
    const totals = new Map<string, number>();
    monthShared.forEach((expense) => {
      totals.set(expense.category, (totals.get(expense.category) ?? 0) + expense.amount);
    });

    return [...totals.entries()]
      .map(([slug, amount], index) => {
        const category = categories.find((item) => item.slug === slug);
        return {
          slug,
          amount,
          icon: category?.icon ?? '📦',
          name: category?.name ?? slug,
          percent: monthTotal > 0 ? (amount / monthTotal) * 100 : 0,
          color: ['#23D5D5', '#2F8CFF', '#F43F75', '#8B5CF6', '#94A3B8'][index % 5],
        };
      })
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 5);
  }, [monthShared, categories, monthTotal]);

  const balanceAbs = Math.abs(partnerBalance);
  const balanceText =
    partnerBalance > 0.005
      ? `${partnerName} te debe`
      : partnerBalance < -0.005
      ? `Debes a ${partnerName}`
      : 'Están al día';

  if (authLoading || !user) return null;

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <ScrollView
        style={styles.flex}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.topRow}>
          <View style={styles.headerLeft}>
            <View style={styles.headerIcon}>
              <AppIcon name="heart" size={18} color="#FFFFFF" />
            </View>
            <View>
              <Text style={styles.headerTitle}>Pareja</Text>
              <Text style={styles.headerSub}>Finanzas compartidas</Text>
            </View>
          </View>
          <TouchableOpacity style={styles.gear} onPress={() => router.push('/perfil')}>
            <AppIcon name="settings" size={20} color="#CBD5E1" />
          </TouchableOpacity>
        </View>

        {linked ? (
          <>
            <View style={styles.peopleCard}>
              <View style={styles.person}>
                <View style={[styles.avatar, styles.avatarBlue]}>
                  <AppIcon name="profile" size={24} color="#FFFFFF" />
                </View>
                <Text style={styles.personName}>{myName}</Text>
              </View>
              <AppIcon name="heart" size={20} color="#F43F75" />
              <View style={styles.person}>
                <View style={[styles.avatar, styles.avatarPink]}>
                  <AppIcon name="profile" size={24} color="#FFFFFF" />
                </View>
                <Text style={styles.personName}>{partnerName}</Text>
              </View>
            </View>

            <View style={styles.sharedBalanceCard}>
              <View>
                <Text style={styles.sharedBalanceLabel}>Balance compartido</Text>
                <Text style={styles.sharedBalanceAmount}>S/ {monthTotal.toFixed(2)}</Text>
              </View>
              <AppIcon name="people" size={21} color="#23A7FF" />
            </View>

            <TouchableOpacity
              style={styles.debtCard}
              activeOpacity={0.85}
              onPress={() =>
                balanceAbs >= 0.01 ? router.push('/saldar-deuda') : router.push('/deudas')
              }
            >
              <View>
                <Text style={styles.debtTitle}>{balanceText}</Text>
                <Text style={styles.debtAmount}>S/ {balanceAbs.toFixed(2)}</Text>
                <Text style={styles.debtSub}>
                  {partnerBalance < -0.005
                    ? `a ${partnerName}`
                    : partnerBalance > 0.005
                    ? 'a tu favor'
                    : 'Sin pagos pendientes'}
                </Text>
              </View>
              <Text style={styles.debtArrow}>›</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.newSharedButton}
              onPress={() => router.push('/nuevo-gasto?type=compartido' as any)}
            >
              <AppIcon name="add" size={18} color="#FFFFFF" />
              <Text style={styles.newSharedText}>Nuevo gasto</Text>
            </TouchableOpacity>

            <View style={styles.actionRow}>
              <TouchableOpacity
                style={styles.actionTile}
                onPress={() =>
                  balanceAbs >= 0.01 ? router.push('/saldar-deuda') : router.push('/deudas')
                }
              >
                <AppIcon name="settle" size={22} color="#CBD5E1" />
                <Text style={styles.actionTileText}>Liquidar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.actionTile}
                onPress={() => {
                  const first = recentShared[0];
                  if (first) router.push(`/chat-gasto?id=${first.id}` as any);
                }}
              >
                <AppIcon name="chat" size={22} color="#CBD5E1" />
                <Text style={styles.actionTileText}>Chat</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.monthCard}>
              <View style={styles.monthHeader}>
                <View>
                  <Text style={styles.monthLabel}>Gastado juntos este mes</Text>
                  <Text style={styles.monthAmount}>S/ {monthTotal.toFixed(2)}</Text>
                </View>
                <TouchableOpacity onPress={() => router.push('/estadisticas?scope=pareja' as any)}>
                  <Text style={styles.link}>Ver estadísticas</Text>
                </TouchableOpacity>
              </View>

              {categorySummary.length > 0 ? (
                <>
                  <View style={styles.stackBar}>
                    {categorySummary.map((item) => (
                      <View
                        key={item.slug}
                        style={{
                          flex: Math.max(item.percent, 4),
                          backgroundColor: item.color,
                        }}
                      />
                    ))}
                  </View>
                  <View style={styles.legend}>
                    {categorySummary.slice(0, 4).map((item) => (
                      <View key={item.slug} style={styles.legendItem}>
                        <View style={[styles.legendDot, { backgroundColor: item.color }]} />
                        <Text style={styles.legendText}>
                          {item.icon} {item.name} {Math.round(item.percent)}%
                        </Text>
                      </View>
                    ))}
                  </View>
                </>
              ) : null}

              <View style={styles.payRow}>
                <View style={styles.payCard}>
                  <Text style={styles.payIcon}>👤</Text>
                  <Text style={styles.payLabel}>Pagaste tú</Text>
                  <Text style={styles.payBlue}>S/ {paidByMe.toFixed(2)}</Text>
                </View>
                <View style={styles.payCard}>
                  <Text style={styles.payIcon}>🩷</Text>
                  <Text style={styles.payLabel}>Pagó {partnerName}</Text>
                  <Text style={styles.payPink}>S/ {paidByPartner.toFixed(2)}</Text>
                </View>
              </View>
            </View>

            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Últimos gastos</Text>
              <TouchableOpacity onPress={() => router.push('/movimientos?filter=compartido' as any)}>
                <Text style={styles.link}>Ver todos</Text>
              </TouchableOpacity>
            </View>

            {recentShared.length === 0 ? (
              <View style={styles.emptyCard}>
                <Text style={styles.emptyTitle}>Aún no hay gastos juntos</Text>
                <Text style={styles.emptyText}>Registra el primero en “＋ Compartido”.</Text>
              </View>
            ) : (
              <View style={styles.list}>
                {recentShared.map((expense) => {
                  const payer = expense.payerId === user.id ? 'Tú' : partnerName;
                  const myPart =
                    expense.createdBy === user.id
                      ? expense.myShare
                      : expense.partnerShare;

                  return (
                    <View key={expense.id} style={styles.expenseRow}>
                      <TouchableOpacity
                        style={styles.expenseMain}
                        onPress={() => router.push(`/detalle-gasto?id=${expense.id}` as any)}
                      >
                        <View style={styles.expenseCategoryIcon}>
                          <AppIcon
                            name={categoryIconName(expense.category)}
                            size={18}
                            color="#F472B6"
                          />
                        </View>
                        <View style={styles.expenseText}>
                          <Text style={styles.expenseTitle}>{expense.description}</Text>
                          <Text style={styles.expenseMeta}>
                            Pagó {payer} · Tu parte S/ {myPart.toFixed(2)}
                          </Text>
                          <Text style={styles.expenseDate}>
                            {new Date(expense.createdAt).toLocaleDateString('es-PE')}
                          </Text>
                        </View>
                        <Text style={styles.expenseAmount}>S/ {expense.amount.toFixed(2)}</Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={styles.chatMini}
                        onPress={() => router.push(`/chat-gasto?id=${expense.id}` as any)}
                      >
                        <Text style={styles.chatMiniText}>💬 Chat</Text>
                      </TouchableOpacity>
                    </View>
                  );
                })}
              </View>
            )}

            <View style={styles.shortcutRow}>
              <TouchableOpacity
                style={styles.shortcut}
                onPress={() => router.push('/presupuestos?scope=pareja' as any)}
              >
                <Text style={styles.shortcutIcon}>📊</Text>
                <Text style={styles.shortcutText}>Presupuesto</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.shortcut}
                onPress={() => router.push('/deudas')}
              >
                <Text style={styles.shortcutIcon}>⚖️</Text>
                <Text style={styles.shortcutText}>Deudas</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.shortcut}
                onPress={() => router.push('/estadisticas?scope=pareja' as any)}
              >
                <Text style={styles.shortcutIcon}>▥</Text>
                <Text style={styles.shortcutText}>Estadísticas</Text>
              </TouchableOpacity>
            </View>
          </>
        ) : (
          <>
            <View style={styles.linkCard}>
              <Text style={styles.linkCardIcon}>👥</Text>
              <Text style={styles.linkCardTitle}>Vincula a tu pareja</Text>
              <Text style={styles.linkCardText}>
                Cada uno mantiene su cuenta. Solo compartirán lo que registren como “Compartido”.
              </Text>

              {inviteCode ? (
                <>
                  <View style={styles.codeBox}>
                    <Text style={styles.code}>{inviteCode}</Text>
                  </View>
                  <TouchableOpacity style={styles.primaryButton} onPress={shareInvite}>
                    <Text style={styles.primaryText}>Compartir código</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={generateInvite} disabled={busy}>
                    <Text style={styles.secondaryText}>Generar otro</Text>
                  </TouchableOpacity>
                </>
              ) : (
                <TouchableOpacity style={styles.primaryButton} onPress={generateInvite} disabled={busy}>
                  <Text style={styles.primaryText}>{busy ? 'Generando...' : 'Generar código'}</Text>
                </TouchableOpacity>
              )}
            </View>

            <View style={styles.orRow}>
              <View style={styles.line} />
              <Text style={styles.orText}>o</Text>
              <View style={styles.line} />
            </View>

            <View style={styles.linkCard}>
              <Text style={styles.linkCardTitle}>Tengo un código</Text>
              <TextInput
                style={styles.input}
                value={code}
                onChangeText={(value) => setCode(value.toUpperCase())}
                placeholder="A1B2C3D4"
                placeholderTextColor="#475569"
                autoCapitalize="characters"
                maxLength={8}
              />
              <TouchableOpacity
                style={[styles.primaryButton, busy && styles.disabled]}
                onPress={joinWithCode}
                disabled={busy}
              >
                <Text style={styles.primaryText}>{busy ? 'Vinculando...' : 'Vincular cuentas'}</Text>
              </TouchableOpacity>
            </View>
          </>
        )}
      </ScrollView>

      <BottomNav active="inicio" mode="pareja" />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  container: { flex: 1, backgroundColor: '#07111F' },
  content: { padding: 18, paddingBottom: 34 },
  topRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  headerIcon: {
    width: 34,
    height: 34,
    borderRadius: 11,
    backgroundColor: '#F43F75',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: { color: '#FFFFFF', fontSize: 15, fontWeight: '900' },
  headerSub: { color: '#64748B', fontSize: 8, marginTop: 2 },
  gear: { width: 36, height: 36, borderRadius: 11, backgroundColor: '#0E1A2A', alignItems: 'center', justifyContent: 'center' },
  peopleCard: { marginTop: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 18, paddingVertical: 13 },
  person: { alignItems: 'center' },
  avatar: { width: 50, height: 50, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  avatarBlue: { backgroundColor: '#1677FF' },
  avatarPink: { backgroundColor: '#D9366F' },
  personName: { color: '#CBD5E1', fontSize: 10, fontWeight: '900', marginTop: 5, maxWidth: 90 },
  sharedBalanceCard: {
    backgroundColor: '#0E1A2A',
    borderRadius: 17,
    padding: 14,
    borderWidth: 1,
    borderColor: '#1B2B40',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sharedBalanceLabel: { color: '#94A3B8', fontSize: 8, fontWeight: '800' },
  sharedBalanceAmount: { color: '#FFFFFF', fontSize: 24, fontWeight: '900', marginTop: 3 },
  debtCard: {
    marginTop: 8,
    backgroundColor: '#A82E5F',
    borderRadius: 15,
    paddingHorizontal: 14,
    paddingVertical: 11,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  debtTitle: { color: '#FFE2EC', fontSize: 9, fontWeight: '900' },
  debtAmount: { color: '#FFFFFF', fontSize: 18, fontWeight: '900', marginTop: 1 },
  debtSub: { color: '#FBCFE8', fontSize: 8, marginTop: 1 },
  debtArrow: { color: '#FFFFFF', fontSize: 26 },
  newSharedButton: {
    marginTop: 10,
    minHeight: 46,
    borderRadius: 14,
    backgroundColor: '#F43F75',
    flexDirection: 'row',
    gap: 7,
    alignItems: 'center',
    justifyContent: 'center',
  },
  newSharedText: { color: '#FFFFFF', fontSize: 11, fontWeight: '900' },
  actionRow: { flexDirection: 'row', gap: 8, marginTop: 8 },
  actionTile: {
    flex: 1,
    minHeight: 58,
    backgroundColor: '#0E1A2A',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#1B2B40',
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionTileText: { color: '#CBD5E1', fontSize: 9, fontWeight: '900', marginTop: 4 },
  monthCard: { backgroundColor: '#0E1A2A', borderRadius: 18, padding: 15, marginTop: 12, borderWidth: 1, borderColor: '#1B2B40' },
  monthHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  monthLabel: { color: '#94A3B8', fontSize: 9, fontWeight: '800' },
  monthAmount: { color: '#FFFFFF', fontSize: 22, fontWeight: '900', marginTop: 4 },
  link: { color: '#60A5FA', fontSize: 9, fontWeight: '900' },
  stackBar: {
    height: 10,
    flexDirection: 'row',
    borderRadius: 6,
    overflow: 'hidden',
    backgroundColor: '#16263A',
    marginTop: 12,
  },
  legend: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 7,
    marginTop: 8,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    minWidth: '45%',
  },
  legendDot: { width: 7, height: 7, borderRadius: 4, marginRight: 5 },
  legendText: { color: '#94A3B8', fontSize: 7.5, fontWeight: '700' },
  payRow: { flexDirection: 'row', gap: 8, marginTop: 12 },
  payCard: { flex: 1, borderRadius: 14, padding: 11, backgroundColor: '#101A29' },
  payIcon: { fontSize: 18 },
  payLabel: { color: '#64748B', fontSize: 8, marginTop: 5 },
  payBlue: { color: '#60A5FA', fontSize: 13, fontWeight: '900', marginTop: 2 },
  payPink: { color: '#F472B6', fontSize: 13, fontWeight: '900', marginTop: 2 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 20, marginBottom: 8 },
  sectionTitle: { color: '#FFFFFF', fontSize: 15, fontWeight: '900' },
  emptyCard: { backgroundColor: '#0E1A2A', borderRadius: 16, padding: 20, alignItems: 'center' },
  emptyTitle: { color: '#FFFFFF', fontSize: 13, fontWeight: '900' },
  emptyText: { color: '#64748B', fontSize: 9, marginTop: 4 },
  list: { gap: 8 },
  expenseRow: { backgroundColor: '#0E1A2A', borderRadius: 15, borderWidth: 1, borderColor: '#1B2B40', overflow: 'hidden' },
  expenseMain: { padding: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  expenseCategoryIcon: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: '#34172A',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 9,
  },
  expenseText: { flex: 1, paddingRight: 10 },
  expenseTitle: { color: '#FFFFFF', fontSize: 12, fontWeight: '900' },
  expenseMeta: { color: '#94A3B8', fontSize: 8, marginTop: 3 },
  expenseDate: { color: '#475569', fontSize: 8, marginTop: 2 },
  expenseAmount: { color: '#FFFFFF', fontSize: 12, fontWeight: '900' },
  chatMini: { borderTopWidth: 1, borderTopColor: '#1B2B40', paddingVertical: 8, alignItems: 'center' },
  chatMiniText: { color: '#F472B6', fontSize: 9, fontWeight: '900' },
  shortcutRow: { flexDirection: 'row', gap: 8, marginTop: 12 },
  shortcut: { flex: 1, backgroundColor: '#0E1A2A', borderRadius: 14, paddingVertical: 12, alignItems: 'center', borderWidth: 1, borderColor: '#1B2B40' },
  shortcutIcon: { fontSize: 17 },
  shortcutText: { color: '#CBD5E1', fontSize: 8, fontWeight: '900', marginTop: 4 },
  linkCard: { backgroundColor: '#0E1A2A', borderRadius: 18, padding: 18, marginTop: 14, borderWidth: 1, borderColor: '#1B2B40' },
  linkCardIcon: { fontSize: 31, textAlign: 'center' },
  linkCardTitle: { color: '#FFFFFF', fontSize: 17, fontWeight: '900', textAlign: 'center' },
  linkCardText: { color: '#64748B', fontSize: 10, lineHeight: 15, textAlign: 'center', marginTop: 6 },
  codeBox: { backgroundColor: '#07111F', borderRadius: 13, paddingVertical: 14, alignItems: 'center', marginTop: 15, borderWidth: 1, borderColor: '#EC4899' },
  code: { color: '#FFFFFF', fontSize: 24, fontWeight: '900', letterSpacing: 4 },
  primaryButton: { backgroundColor: '#1677FF', borderRadius: 13, paddingVertical: 13, alignItems: 'center', marginTop: 14 },
  primaryText: { color: '#FFFFFF', fontSize: 11, fontWeight: '900' },
  secondaryText: { color: '#60A5FA', fontSize: 9, fontWeight: '900', textAlign: 'center', marginTop: 12 },
  orRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginVertical: 13 },
  line: { flex: 1, height: 1, backgroundColor: '#1B2B40' },
  orText: { color: '#475569', fontSize: 9 },
  input: { backgroundColor: '#07111F', color: '#FFFFFF', borderRadius: 13, padding: 14, fontSize: 18, fontWeight: '900', letterSpacing: 3, textAlign: 'center', marginTop: 13 },
  disabled: { opacity: 0.5 },
});
