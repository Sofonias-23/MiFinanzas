import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BottomNav } from '@/components/bottom-nav';
import { useFinance } from '@/context/finance-context';
import { supabase } from '@/lib/supabase';

type Scope = 'personal' | 'pareja';

type PartnerStatus = {
  partner_name: string | null;
  member_count: number;
};

const CHART_COLORS = ['#23A7FF', '#F43F75', '#FFB454', '#8B5CF6', '#54D6C5'];

function isCurrentMonth(value: string) {
  const date = new Date(value);
  const now = new Date();
  return date.getFullYear() === now.getFullYear() && date.getMonth() === now.getMonth();
}

export default function EstadisticasScreen() {
  const params = useLocalSearchParams<{ scope?: string }>();
  const {
    user,
    authLoading,
    expenses,
    incomes,
    categories,
    paymentMethods,
    partnerBalance,
    refreshExpenses,
    refreshIncomes,
    refreshSettlements,
  } = useFinance();

  const [scope, setScope] = useState<Scope>(
    params.scope === 'pareja' ? 'pareja' : 'personal'
  );
  const [partnerName, setPartnerName] = useState('tu pareja');

  useEffect(() => {
    if (!authLoading && !user) router.replace('/login');
  }, [authLoading, user]);

  useEffect(() => {
    if (params.scope === 'pareja' || params.scope === 'personal') {
      setScope(params.scope);
    }
  }, [params.scope]);

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
      refreshExpenses();
      refreshIncomes();
      refreshSettlements();
      loadPartner();
    }, [refreshExpenses, refreshIncomes, refreshSettlements, loadPartner])
  );

  const monthExpenses = useMemo(
    () =>
      expenses.filter(
        (expense) =>
          isCurrentMonth(expense.createdAt) &&
          (scope === 'personal'
            ? expense.type === 'personal'
            : expense.type === 'compartido')
      ),
    [expenses, scope]
  );

  const totalSpent = useMemo(
    () => monthExpenses.reduce((sum, expense) => sum + expense.amount, 0),
    [monthExpenses]
  );

  const totalIncome = useMemo(
    () =>
      scope === 'personal'
        ? incomes
            .filter((income) => isCurrentMonth(income.createdAt))
            .reduce((sum, income) => sum + income.amount, 0)
        : 0,
    [incomes, scope]
  );

  const paidByMe = useMemo(
    () =>
      scope === 'pareja'
        ? monthExpenses
            .filter((expense) => expense.payerId === user?.id)
            .reduce((sum, expense) => sum + expense.amount, 0)
        : 0,
    [monthExpenses, scope, user]
  );

  const paidByPartner = scope === 'pareja' ? Math.max(0, totalSpent - paidByMe) : 0;

  const categoryStats = useMemo(() => {
    const totals = new Map<string, number>();
    monthExpenses.forEach((expense) => {
      totals.set(expense.category, (totals.get(expense.category) ?? 0) + expense.amount);
    });

    return [...totals.entries()]
      .map(([slug, amount]) => {
        const category = categories.find((item) => item.slug === slug);
        return {
          slug,
          amount,
          name: category?.name ?? slug,
          icon: category?.icon ?? '📦',
          percent: totalSpent > 0 ? (amount / totalSpent) * 100 : 0,
        };
      })
      .sort((a, b) => b.amount - a.amount);
  }, [monthExpenses, categories, totalSpent]);

  const paymentStats = useMemo(() => {
    const totals = new Map<string, number>();
    monthExpenses.forEach((expense) => {
      totals.set(
        expense.paymentMethod,
        (totals.get(expense.paymentMethod) ?? 0) + expense.amount
      );
    });

    return [...totals.entries()]
      .map(([slug, amount]) => {
        const payment = paymentMethods.find((item) => item.slug === slug);
        return {
          slug,
          amount,
          name: payment?.name ?? slug,
          icon: payment?.icon ?? '💳',
          percent: totalSpent > 0 ? (amount / totalSpent) * 100 : 0,
        };
      })
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 4);
  }, [monthExpenses, paymentMethods, totalSpent]);

  if (authLoading || !user) return null;

  const monthName = new Intl.DateTimeFormat('es-PE', {
    month: 'long',
  }).format(new Date());

  const topCategory = categoryStats[0];

  const donutSegments = useMemo(() => {
    const segmentCount = 24;
    const result: string[] = [];
    let cursor = 0;
    const normalized = categoryStats.slice(0, 5).map((item, index) => ({
      limit: cursor += item.percent,
      color: CHART_COLORS[index] ?? '#64748B',
    }));

    for (let i = 0; i < segmentCount; i += 1) {
      const percent = ((i + 0.5) / segmentCount) * 100;
      const match = normalized.find((item) => percent <= item.limit);
      result.push(match?.color ?? '#213147');
    }

    return result;
  }, [categoryStats]);

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <ScrollView
        style={styles.flex}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.title}>Estadísticas</Text>
        <Text style={styles.subtitle}>Lo importante, sin números complicados.</Text>

        <View style={styles.tabs}>
          <TouchableOpacity
            style={[styles.tab, scope === 'personal' && styles.tabBlue]}
            onPress={() => setScope('personal')}
          >
            <Text style={[styles.tabText, scope === 'personal' && styles.tabTextActive]}>
              👤 Mi dinero
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, scope === 'pareja' && styles.tabPink]}
            onPress={() => setScope('pareja')}
          >
            <Text style={[styles.tabText, scope === 'pareja' && styles.tabTextActive]}>
              🩷 Pareja
            </Text>
          </TouchableOpacity>
        </View>

        <View style={[styles.hero, scope === 'pareja' && styles.heroPink]}>
          <Text style={styles.heroLabel}>
            {scope === 'personal' ? `Gastaste en ${monthName}` : `Gastaron juntos en ${monthName}`}
          </Text>

          <View style={styles.heroMain}>
            <View style={styles.donut}>
              {donutSegments.map((color, index) => {
                const angle = (360 / donutSegments.length) * index;
                return (
                  <View
                    key={`${color}-${index}`}
                    style={[
                      styles.donutSegment,
                      {
                        backgroundColor: color,
                        transform: [
                          { rotate: `${angle}deg` },
                          { translateY: -39 },
                        ],
                      },
                    ]}
                  />
                );
              })}
              <View style={styles.donutHole}>
                <Text style={styles.donutAmount}>S/ {totalSpent.toFixed(0)}</Text>
                <Text style={styles.donutLabel}>Total</Text>
              </View>
            </View>

            <View style={styles.heroAmountWrap}>
              <Text style={styles.heroAmount}>S/ {totalSpent.toFixed(2)}</Text>
              <Text style={styles.heroAmountHint}>
                {topCategory
                  ? `Mayor gasto: ${topCategory.icon} ${topCategory.name}`
                  : 'Aún sin movimientos'}
              </Text>
            </View>
          </View>

          {scope === 'personal' ? (
            <View style={styles.heroBottom}>
              <View>
                <Text style={styles.smallLabel}>Ingresaste</Text>
                <Text style={styles.green}>S/ {totalIncome.toFixed(2)}</Text>
              </View>
              <View style={styles.right}>
                <Text style={styles.smallLabel}>Te queda</Text>
                <Text
                  style={[
                    styles.whiteAmount,
                    totalIncome - totalSpent < 0 && styles.red,
                  ]}
                >
                  S/ {(totalIncome - totalSpent).toFixed(2)}
                </Text>
              </View>
            </View>
          ) : (
            <View style={styles.heroBottom}>
              <View>
                <Text style={styles.smallLabel}>Pagaste tú</Text>
                <Text style={styles.blue}>S/ {paidByMe.toFixed(2)}</Text>
              </View>
              <View style={styles.right}>
                <Text style={styles.smallLabel}>Pagó {partnerName}</Text>
                <Text style={styles.pink}>S/ {paidByPartner.toFixed(2)}</Text>
              </View>
            </View>
          )}
        </View>

        {scope === 'pareja' ? (
          <TouchableOpacity style={styles.balanceCard} onPress={() => router.push('/deudas')}>
            <View>
              <Text style={styles.balanceLabel}>Balance actual</Text>
              <Text style={styles.balanceText}>
                {partnerBalance > 0.005
                  ? `${partnerName} te debe`
                  : partnerBalance < -0.005
                  ? `Debes a ${partnerName}`
                  : 'Están al día'}
              </Text>
            </View>
            <Text
              style={[
                styles.balanceAmount,
                partnerBalance > 0.005 && styles.green,
                partnerBalance < -0.005 && styles.pink,
              ]}
            >
              S/ {Math.abs(partnerBalance).toFixed(2)}
            </Text>
          </TouchableOpacity>
        ) : null}

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>¿En qué gastaron más?</Text>
          <Text style={styles.period}>Este mes</Text>
        </View>

        {categoryStats.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyText}>Todavía no hay gastos para analizar.</Text>
          </View>
        ) : (
          <View style={styles.card}>
            {categoryStats.slice(0, 5).map((item, index) => (
              <View key={item.slug} style={styles.statBlock}>
                <View style={styles.statTop}>
                  <View style={styles.statNameWrap}>
                    <View style={styles.iconBox}>
                      <Text style={styles.icon}>{item.icon}</Text>
                    </View>
                    <View>
                      <Text style={styles.statName}>{item.name}</Text>
                      <Text style={styles.statPercent}>{Math.round(item.percent)}%</Text>
                    </View>
                  </View>
                  <Text style={styles.statAmount}>S/ {item.amount.toFixed(2)}</Text>
                </View>
                <View style={styles.track}>
                  <View
                    style={[
                      styles.fill,
                      {
                        width: `${Math.min(100, item.percent)}%`,
                        backgroundColor: CHART_COLORS[index] ?? '#3B82F6',
                      },
                    ]}
                  />
                </View>
                {index < categoryStats.slice(0, 5).length - 1 ? (
                  <View style={styles.divider} />
                ) : null}
              </View>
            ))}
          </View>
        )}

        {topCategory ? (
          <View style={styles.insight}>
            <Text style={styles.insightIcon}>🏆</Text>
            <View style={styles.insightText}>
              <Text style={styles.insightTitle}>Lo más importante del mes</Text>
              <Text style={styles.insightSub}>
                {scope === 'personal' ? 'Gastaste' : 'Gastaron'} más en {topCategory.name}: S/ {topCategory.amount.toFixed(2)}.
              </Text>
            </View>
          </View>
        ) : null}

        <Text style={styles.sectionTitleStandalone}>¿Cómo pagaron?</Text>
        <View style={styles.paymentGrid}>
          {paymentStats.length === 0 ? (
            <View style={styles.emptyPayment}>
              <Text style={styles.emptyText}>Aún no hay métodos de pago para mostrar.</Text>
            </View>
          ) : (
            paymentStats.map((item) => (
              <View key={item.slug} style={styles.paymentCard}>
                <Text style={styles.paymentIcon}>{item.icon}</Text>
                <Text style={styles.paymentName} numberOfLines={1}>{item.name}</Text>
                <Text style={styles.paymentPct}>{Math.round(item.percent)}%</Text>
              </View>
            ))
          )}
        </View>

        {scope === 'pareja' ? (
          <View style={styles.compareCard}>
            <Text style={styles.compareTitle}>¿Quién pagó más?</Text>
            <View style={styles.compareLine}>
              <Text style={styles.compareName}>Tú</Text>
              <Text style={styles.compareValue}>
                {totalSpent > 0 ? Math.round((paidByMe / totalSpent) * 100) : 0}%
              </Text>
            </View>
            <View style={styles.compareTrack}>
              <View
                style={[
                  styles.compareBlue,
                  {
                    width: `${
                      totalSpent > 0 ? Math.min(100, (paidByMe / totalSpent) * 100) : 0
                    }%`,
                  },
                ]}
              />
            </View>

            <View style={[styles.compareLine, styles.compareSecond]}>
              <Text style={styles.compareName}>{partnerName}</Text>
              <Text style={styles.compareValue}>
                {totalSpent > 0 ? Math.round((paidByPartner / totalSpent) * 100) : 0}%
              </Text>
            </View>
            <View style={styles.compareTrack}>
              <View
                style={[
                  styles.comparePink,
                  {
                    width: `${
                      totalSpent > 0
                        ? Math.min(100, (paidByPartner / totalSpent) * 100)
                        : 0
                    }%`,
                  },
                ]}
              />
            </View>
          </View>
        ) : null}

        <TouchableOpacity
          style={styles.budgetButton}
          onPress={() =>
            router.push(
              `/presupuestos?scope=${scope === 'pareja' ? 'pareja' : 'personal'}` as any
            )
          }
        >
          <Text style={styles.budgetIcon}>📊</Text>
          <View style={styles.budgetText}>
            <Text style={styles.budgetTitle}>Ver presupuesto</Text>
            <Text style={styles.budgetSub}>Compara tus límites con lo que ya gastaste.</Text>
          </View>
          <Text style={styles.budgetArrow}>›</Text>
        </TouchableOpacity>
      </ScrollView>

      <BottomNav active="estadisticas" />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  container: { flex: 1, backgroundColor: '#07111F' },
  content: { padding: 18, paddingBottom: 34 },
  title: { color: '#FFFFFF', fontSize: 27, fontWeight: '900' },
  subtitle: { color: '#64748B', fontSize: 10, marginTop: 4 },
  tabs: { flexDirection: 'row', backgroundColor: '#0E1A2A', borderRadius: 14, padding: 4, marginTop: 16 },
  tab: { flex: 1, minHeight: 38, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  tabBlue: { backgroundColor: '#1677FF' },
  tabPink: { backgroundColor: '#D9366F' },
  tabText: { color: '#64748B', fontSize: 10, fontWeight: '900' },
  tabTextActive: { color: '#FFFFFF' },
  hero: { marginTop: 14, backgroundColor: '#102B55', borderRadius: 21, padding: 18, borderWidth: 1, borderColor: '#1E4E91' },
  heroPink: { backgroundColor: '#34172A', borderColor: '#5C294B' },
  heroLabel: { color: '#94A3B8', fontSize: 10, fontWeight: '800', textTransform: 'capitalize' },
  heroMain: { flexDirection: 'row', alignItems: 'center', marginTop: 12, gap: 16 },
  donut: {
    width: 110,
    height: 110,
    borderRadius: 55,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  donutSegment: {
    position: 'absolute',
    width: 12,
    height: 18,
    borderRadius: 6,
    left: 49,
    top: 46,
  },
  donutHole: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: '#0B1726',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#20324A',
  },
  donutAmount: { color: '#FFFFFF', fontSize: 15, fontWeight: '900' },
  donutLabel: { color: '#94A3B8', fontSize: 8, marginTop: 1 },
  heroAmountWrap: { flex: 1 },
  heroAmount: { color: '#FFFFFF', fontSize: 26, fontWeight: '900' },
  heroAmountHint: { color: '#94A3B8', fontSize: 8, lineHeight: 13, marginTop: 5 },
  heroBottom: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 14, paddingTop: 12, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.08)' },
  smallLabel: { color: '#94A3B8', fontSize: 8 },
  right: { alignItems: 'flex-end' },
  green: { color: '#4ADE80', fontSize: 13, fontWeight: '900', marginTop: 3 },
  blue: { color: '#60A5FA', fontSize: 13, fontWeight: '900', marginTop: 3 },
  pink: { color: '#F472B6', fontSize: 13, fontWeight: '900', marginTop: 3 },
  whiteAmount: { color: '#FFFFFF', fontSize: 13, fontWeight: '900', marginTop: 3 },
  red: { color: '#F87171' },
  balanceCard: { marginTop: 10, backgroundColor: '#0E1A2A', borderRadius: 16, padding: 14, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderWidth: 1, borderColor: '#1B2B40' },
  balanceLabel: { color: '#64748B', fontSize: 8, fontWeight: '800' },
  balanceText: { color: '#FFFFFF', fontSize: 12, fontWeight: '900', marginTop: 3 },
  balanceAmount: { color: '#CBD5E1', fontSize: 16, fontWeight: '900' },
  sectionHeader: { marginTop: 22, marginBottom: 8, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  sectionTitle: { color: '#FFFFFF', fontSize: 15, fontWeight: '900' },
  period: { color: '#64748B', fontSize: 8, fontWeight: '800' },
  sectionTitleStandalone: { color: '#FFFFFF', fontSize: 15, fontWeight: '900', marginTop: 22, marginBottom: 8 },
  card: { backgroundColor: '#0E1A2A', borderRadius: 17, padding: 13, borderWidth: 1, borderColor: '#1B2B40' },
  statBlock: { paddingVertical: 4 },
  statTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  statNameWrap: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  iconBox: { width: 37, height: 37, borderRadius: 11, backgroundColor: '#16263A', alignItems: 'center', justifyContent: 'center', marginRight: 9 },
  icon: { fontSize: 17 },
  statName: { color: '#FFFFFF', fontSize: 11, fontWeight: '900' },
  statPercent: { color: '#64748B', fontSize: 8, marginTop: 2 },
  statAmount: { color: '#CBD5E1', fontSize: 10, fontWeight: '900' },
  track: { height: 7, backgroundColor: '#16263A', borderRadius: 5, overflow: 'hidden', marginTop: 8 },
  fill: { height: 7, borderRadius: 5, backgroundColor: '#3B82F6' },
  fillPink: { backgroundColor: '#EC4899' },
  divider: { height: 1, backgroundColor: '#1B2B40', marginVertical: 10 },
  insight: { marginTop: 9, backgroundColor: '#171B35', borderRadius: 15, padding: 12, flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: '#343663' },
  insightIcon: { fontSize: 20 },
  insightText: { flex: 1, marginLeft: 9 },
  insightTitle: { color: '#FFFFFF', fontSize: 10, fontWeight: '900' },
  insightSub: { color: '#A5B4FC', fontSize: 8, marginTop: 3 },
  paymentGrid: { flexDirection: 'row', gap: 7 },
  paymentCard: { flex: 1, minHeight: 86, backgroundColor: '#0E1A2A', borderRadius: 14, borderWidth: 1, borderColor: '#1B2B40', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 4 },
  paymentIcon: { fontSize: 20 },
  paymentName: { color: '#CBD5E1', fontSize: 8, fontWeight: '800', marginTop: 5, maxWidth: '95%' },
  paymentPct: { color: '#60A5FA', fontSize: 11, fontWeight: '900', marginTop: 3 },
  emptyPayment: { flex: 1, backgroundColor: '#0E1A2A', borderRadius: 14, padding: 16 },
  emptyCard: { backgroundColor: '#0E1A2A', borderRadius: 16, padding: 20 },
  emptyText: { color: '#64748B', fontSize: 9, textAlign: 'center' },
  compareCard: { marginTop: 18, backgroundColor: '#0E1A2A', borderRadius: 17, padding: 14, borderWidth: 1, borderColor: '#1B2B40' },
  compareTitle: { color: '#FFFFFF', fontSize: 13, fontWeight: '900', marginBottom: 12 },
  compareLine: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  compareSecond: { marginTop: 12 },
  compareName: { color: '#CBD5E1', fontSize: 10, fontWeight: '800' },
  compareValue: { color: '#FFFFFF', fontSize: 10, fontWeight: '900' },
  compareTrack: { height: 9, borderRadius: 6, backgroundColor: '#16263A', overflow: 'hidden', marginTop: 6 },
  compareBlue: { height: 9, borderRadius: 6, backgroundColor: '#3B82F6' },
  comparePink: { height: 9, borderRadius: 6, backgroundColor: '#EC4899' },
  budgetButton: { marginTop: 12, backgroundColor: '#0E1A2A', borderRadius: 16, padding: 13, flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: '#1B2B40' },
  budgetIcon: { fontSize: 20, width: 34, textAlign: 'center' },
  budgetText: { flex: 1, marginLeft: 6 },
  budgetTitle: { color: '#FFFFFF', fontSize: 11, fontWeight: '900' },
  budgetSub: { color: '#64748B', fontSize: 8, marginTop: 2 },
  budgetArrow: { color: '#64748B', fontSize: 23 },
});
