import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
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

type StatsScope = 'personal' | 'pareja';

type BudgetRow = {
  id: string;
  scope: StatsScope;
  category: string;
  amount: number;
  month: string;
};

type PartnerStatus = {
  partner_name: string | null;
  member_count: number;
};

function isSameMonth(dateValue: string, target: Date) {
  const date = new Date(dateValue);
  return (
    date.getFullYear() === target.getFullYear() &&
    date.getMonth() === target.getMonth()
  );
}

function monthKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-01`;
}

function AnimatedBar({
  percent,
  tone = 'blue',
  height = 8,
}: {
  percent: number;
  tone?: 'blue' | 'pink' | 'green' | 'orange' | 'red';
  height?: number;
}) {
  const progress = useRef(new Animated.Value(0)).current;
  const safePercent = Math.max(0, Math.min(percent, 100));

  useEffect(() => {
    Animated.timing(progress, {
      toValue: safePercent,
      duration: 520,
      useNativeDriver: false,
    }).start();
  }, [progress, safePercent]);

  const width = progress.interpolate({
    inputRange: [0, 100],
    outputRange: ['0%', '100%'],
  });

  return (
    <View style={[styles.progressTrack, { height }]}>
      <Animated.View
        style={[
          styles.progressFill,
          tone === 'pink' && styles.progressPink,
          tone === 'green' && styles.progressGreen,
          tone === 'orange' && styles.progressOrange,
          tone === 'red' && styles.progressRed,
          { width, height },
        ]}
      />
    </View>
  );
}

function MoneyBar({
  label,
  amount,
  max,
  tone,
}: {
  label: string;
  amount: number;
  max: number;
  tone: 'blue' | 'pink';
}) {
  const percent = max > 0 ? (amount / max) * 100 : 0;

  return (
    <View style={styles.monthItem}>
      <View style={styles.monthHeader}>
        <Text style={styles.monthLabel}>{label}</Text>
        <Text style={styles.monthAmount}>S/ {amount.toFixed(2)}</Text>
      </View>
      <AnimatedBar percent={percent} tone={tone} height={10} />
    </View>
  );
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

  const [scope, setScope] = useState<StatsScope>(
    params.scope === 'pareja' ? 'pareja' : 'personal'
  );
  const [budgets, setBudgets] = useState<BudgetRow[]>([]);
  const [partnerName, setPartnerName] = useState('tu pareja');

  const intro = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(intro, {
      toValue: 1,
      duration: 280,
      useNativeDriver: true,
    }).start();
  }, [intro]);

  useEffect(() => {
    if (!authLoading && !user) router.replace('/login');
  }, [authLoading, user]);

  useEffect(() => {
    if (params.scope === 'personal' || params.scope === 'pareja') {
      setScope(params.scope);
    }
  }, [params.scope]);

  const loadBudgets = useCallback(async () => {
    if (!user) return;

    const { data } = await supabase
      .from('budgets')
      .select('id, scope, category, amount, month')
      .eq('month', monthKey(new Date()));

    setBudgets(
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
      refreshExpenses();
      refreshIncomes();
      refreshSettlements();
      loadBudgets();
      loadPartner();
    }, [
      refreshExpenses,
      refreshIncomes,
      refreshSettlements,
      loadBudgets,
      loadPartner,
    ])
  );

  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel(`stats-budgets-${user.id}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'budgets' },
        () => loadBudgets()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, loadBudgets]);

  const now = useMemo(() => new Date(), []);

  const stats = useMemo(() => {
    const selectedExpenses = expenses.filter((expense) =>
      scope === 'personal'
        ? expense.type === 'personal'
        : expense.type === 'compartido'
    );

    const monthExpenses = selectedExpenses.filter((expense) =>
      isSameMonth(expense.createdAt, now)
    );

    const monthIncomes =
      scope === 'personal'
        ? incomes.filter((income) => isSameMonth(income.createdAt, now))
        : [];

    const totalExpense = monthExpenses.reduce(
      (sum, item) => sum + item.amount,
      0
    );

    const totalIncome = monthIncomes.reduce(
      (sum, item) => sum + item.amount,
      0
    );

    const byCategory = new Map<string, number>();
    for (const expense of monthExpenses) {
      byCategory.set(
        expense.category,
        (byCategory.get(expense.category) ?? 0) + expense.amount
      );
    }

    const categoriesOrdered = [...byCategory.entries()].sort(
      (a, b) => b[1] - a[1]
    );

    const byPayment = new Map<string, { count: number; total: number }>();
    for (const expense of monthExpenses) {
      if (expense.paymentMethod === 'sin-especificar') continue;

      const current = byPayment.get(expense.paymentMethod) ?? {
        count: 0,
        total: 0,
      };
      current.count += 1;
      current.total += expense.amount;
      byPayment.set(expense.paymentMethod, current);
    }

    const paymentsOrdered = [...byPayment.entries()].sort(
      (a, b) => b[1].total - a[1].total
    );

    let paidByMe = 0;
    let paidByPartner = 0;

    if (scope === 'pareja' && user) {
      for (const expense of monthExpenses) {
        if (expense.payerId === user.id) {
          paidByMe += expense.amount;
        } else {
          paidByPartner += expense.amount;
        }
      }
    }

    const monthlyEvolution = Array.from({ length: 6 }, (_, index) => {
      const date = new Date(
        now.getFullYear(),
        now.getMonth() - (5 - index),
        1
      );

      const total = selectedExpenses
        .filter((expense) => isSameMonth(expense.createdAt, date))
        .reduce((sum, expense) => sum + expense.amount, 0);

      return {
        key: `${date.getFullYear()}-${date.getMonth()}`,
        label: new Intl.DateTimeFormat('es-PE', {
          month: 'short',
        })
          .format(date)
          .replace('.', ''),
        total,
      };
    });

    return {
      monthExpenses,
      totalExpense,
      totalIncome,
      balance: totalIncome - totalExpense,
      categoriesOrdered,
      paymentsOrdered,
      paidByMe,
      paidByPartner,
      monthlyEvolution,
    };
  }, [expenses, incomes, scope, now, user]);

  const budgetStats = useMemo(() => {
    const visible = budgets.filter((budget) => budget.scope === scope);
    const limit = visible.reduce((sum, budget) => sum + budget.amount, 0);

    const spent = visible.reduce((sum, budget) => {
      const categorySpent =
        stats.categoriesOrdered.find(([slug]) => slug === budget.category)?.[1] ??
        0;
      return sum + categorySpent;
    }, 0);

    return {
      count: visible.length,
      limit,
      spent,
      percent: limit > 0 ? (spent / limit) * 100 : 0,
    };
  }, [budgets, scope, stats.categoriesOrdered]);

  const maxMonthly = Math.max(
    1,
    ...stats.monthlyEvolution.map((item) => item.total)
  );

  const monthLabel = new Intl.DateTimeFormat('es-PE', {
    month: 'long',
    year: 'numeric',
  }).format(now);

  if (authLoading || !user) return null;

  const balanceLabel =
    partnerBalance > 0.005
      ? `${partnerName} te debe`
      : partnerBalance < -0.005
      ? `Debes a ${partnerName}`
      : 'Están al día';

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <Animated.View
        style={[
          styles.flex,
          {
            opacity: intro,
            transform: [
              {
                translateY: intro.interpolate({
                  inputRange: [0, 1],
                  outputRange: [10, 0],
                }),
              },
            ],
          },
        ]}
      >
        <ScrollView
          style={styles.flex}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.title}>Estadísticas</Text>
          <Text style={styles.subtitle}>Analiza tus hábitos sin mezclar espacios.</Text>

          <View style={styles.tabs}>
            <TouchableOpacity
              style={[styles.tab, scope === 'personal' && styles.tabPersonal]}
              onPress={() => setScope('personal')}
            >
              <Text
                style={[
                  styles.tabText,
                  scope === 'personal' && styles.tabTextActive,
                ]}
              >
                👤 Mi dinero
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.tab, scope === 'pareja' && styles.tabPartner]}
              onPress={() => setScope('pareja')}
            >
              <Text
                style={[
                  styles.tabText,
                  scope === 'pareja' && styles.tabTextActive,
                ]}
              >
                👥 Pareja
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.periodRow}>
            <View>
              <Text style={styles.periodLabel}>Periodo</Text>
              <Text style={styles.periodValue}>{monthLabel}</Text>
            </View>
            <Text style={styles.spaceBadge}>
              {scope === 'personal' ? 'Privado' : 'Compartido'}
            </Text>
          </View>

          {scope === 'personal' ? (
            <View style={styles.heroCard}>
              <Text style={styles.heroLabel}>Gasto personal este mes</Text>
              <Text style={styles.heroAmount}>
                S/ {stats.totalExpense.toFixed(2)}
              </Text>

              <View style={styles.heroMetrics}>
                <View>
                  <Text style={styles.metricLabel}>Ingresos</Text>
                  <Text style={styles.metricGreen}>
                    + S/ {stats.totalIncome.toFixed(2)}
                  </Text>
                </View>

                <View style={styles.metricRight}>
                  <Text style={styles.metricLabel}>Balance</Text>
                  <Text
                    style={[
                      styles.metricValue,
                      stats.balance < 0 && styles.metricRed,
                    ]}
                  >
                    S/ {stats.balance.toFixed(2)}
                  </Text>
                </View>
              </View>
            </View>
          ) : (
            <>
              <View style={[styles.heroCard, styles.heroPartner]}>
                <Text style={styles.heroLabel}>Gasto compartido este mes</Text>
                <Text style={styles.heroAmount}>
                  S/ {stats.totalExpense.toFixed(2)}
                </Text>

                <View style={styles.heroMetrics}>
                  <View>
                    <Text style={styles.metricLabel}>Pagaste tú</Text>
                    <Text style={styles.metricBlue}>
                      S/ {stats.paidByMe.toFixed(2)}
                    </Text>
                  </View>

                  <View style={styles.metricRight}>
                    <Text style={styles.metricLabel}>Pagó {partnerName}</Text>
                    <Text style={styles.metricPink}>
                      S/ {stats.paidByPartner.toFixed(2)}
                    </Text>
                  </View>
                </View>
              </View>

              <TouchableOpacity
                style={styles.balanceCard}
                onPress={() => router.push('/pareja')}
              >
                <View>
                  <Text style={styles.balanceSmall}>Balance actual</Text>
                  <Text style={styles.balanceTitle}>{balanceLabel}</Text>
                </View>
                <Text
                  style={[
                    styles.balanceAmount,
                    partnerBalance > 0.005 && styles.balanceGreen,
                    partnerBalance < -0.005 && styles.balanceRed,
                  ]}
                >
                  S/ {Math.abs(partnerBalance).toFixed(2)}
                </Text>
              </TouchableOpacity>
            </>
          )}

          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Presupuesto</Text>
            <TouchableOpacity
              onPress={() =>
                router.push(
                  `/presupuestos?scope=${scope === 'personal' ? 'personal' : 'pareja'}` as any
                )
              }
            >
              <Text style={styles.linkText}>Administrar</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.budgetCard}>
            {budgetStats.count === 0 ? (
              <>
                <Text style={styles.emptyTitle}>Aún no configuraste límites</Text>
                <Text style={styles.emptyText}>
                  Crea presupuestos por categoría para comparar gasto vs límite.
                </Text>
              </>
            ) : (
              <>
                <View style={styles.budgetHeader}>
                  <Text style={styles.budgetSpent}>
                    S/ {budgetStats.spent.toFixed(2)}
                  </Text>
                  <Text style={styles.budgetLimit}>
                    de S/ {budgetStats.limit.toFixed(2)}
                  </Text>
                </View>
                <AnimatedBar
                  percent={budgetStats.percent}
                  tone={
                    budgetStats.percent >= 100
                      ? 'red'
                      : budgetStats.percent >= 75
                      ? 'orange'
                      : scope === 'pareja'
                      ? 'pink'
                      : 'blue'
                  }
                  height={10}
                />
                <Text style={styles.budgetStatus}>
                  {Math.round(budgetStats.percent)}% utilizado · {budgetStats.count}{' '}
                  {budgetStats.count === 1 ? 'categoría' : 'categorías'}
                </Text>
              </>
            )}
          </View>

          <Text style={styles.sectionTitleStandalone}>Dónde gastas más</Text>
          <View style={styles.card}>
            {stats.categoriesOrdered.length === 0 ? (
              <Text style={styles.emptyText}>
                Aún no hay gastos en este espacio durante el mes.
              </Text>
            ) : (
              stats.categoriesOrdered.slice(0, 6).map(([slug, amount]) => {
                const category = categories.find((item) => item.slug === slug);
                const pct =
                  stats.totalExpense > 0
                    ? (amount / stats.totalExpense) * 100
                    : 0;

                return (
                  <View key={slug} style={styles.categoryBlock}>
                    <View style={styles.statRow}>
                      <View style={styles.statLeft}>
                        <View style={styles.iconBox}>
                          <Text style={styles.statIcon}>
                            {category?.icon ?? '📦'}
                          </Text>
                        </View>
                        <View style={styles.statText}>
                          <Text style={styles.statName}>
                            {category?.name ?? slug}
                          </Text>
                          <Text style={styles.statSub}>
                            {Math.round(pct)}% del gasto del mes
                          </Text>
                        </View>
                      </View>
                      <Text style={styles.statAmount}>
                        S/ {amount.toFixed(2)}
                      </Text>
                    </View>
                    <AnimatedBar
                      percent={pct}
                      tone={scope === 'pareja' ? 'pink' : 'blue'}
                    />
                  </View>
                );
              })
            )}
          </View>

          <Text style={styles.sectionTitleStandalone}>Evolución · 6 meses</Text>
          <View style={styles.card}>
            {stats.monthlyEvolution.map((item) => (
              <MoneyBar
                key={item.key}
                label={item.label}
                amount={item.total}
                max={maxMonthly}
                tone={scope === 'pareja' ? 'pink' : 'blue'}
              />
            ))}
          </View>

          <Text style={styles.sectionTitleStandalone}>Cómo pagas</Text>
          <View style={styles.card}>
            {stats.paymentsOrdered.length === 0 ? (
              <Text style={styles.emptyText}>
                Registra métodos de pago para analizar tus hábitos.
              </Text>
            ) : (
              stats.paymentsOrdered.slice(0, 5).map(([slug, values]) => {
                const method = paymentMethods.find(
                  (item) => item.slug === slug
                );
                const pct =
                  stats.totalExpense > 0
                    ? (values.total / stats.totalExpense) * 100
                    : 0;

                return (
                  <View key={slug} style={styles.paymentRow}>
                    <View style={styles.statLeft}>
                      <Text style={styles.paymentIcon}>
                        {method?.icon ?? '💳'}
                      </Text>
                      <View>
                        <Text style={styles.statName}>
                          {method?.name ?? slug}
                        </Text>
                        <Text style={styles.statSub}>
                          {values.count} {values.count === 1 ? 'movimiento' : 'movimientos'} ·{' '}
                          {Math.round(pct)}%
                        </Text>
                      </View>
                    </View>
                    <Text style={styles.statAmount}>
                      S/ {values.total.toFixed(2)}
                    </Text>
                  </View>
                );
              })
            )}
          </View>
        </ScrollView>

        <BottomNav active="estadisticas" />
      </Animated.View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  container: { flex: 1, backgroundColor: '#07111F' },
  content: { padding: 20, paddingBottom: 32 },
  title: { color: '#FFFFFF', fontSize: 30, fontWeight: '900' },
  subtitle: { color: '#64748B', fontSize: 12, marginTop: 5 },

  tabs: {
    flexDirection: 'row',
    backgroundColor: '#0E1A2A',
    borderRadius: 15,
    padding: 4,
    marginTop: 18,
  },
  tab: {
    flex: 1,
    paddingVertical: 11,
    borderRadius: 12,
    alignItems: 'center',
  },
  tabPersonal: { backgroundColor: '#164E9D' },
  tabPartner: { backgroundColor: '#A82E5B' },
  tabText: { color: '#64748B', fontSize: 11, fontWeight: '900' },
  tabTextActive: { color: '#FFFFFF' },

  periodRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 18,
    marginBottom: 10,
  },
  periodLabel: { color: '#64748B', fontSize: 9, fontWeight: '800' },
  periodValue: {
    color: '#CBD5E1',
    fontSize: 13,
    fontWeight: '900',
    marginTop: 2,
    textTransform: 'capitalize',
  },
  spaceBadge: {
    color: '#94A3B8',
    backgroundColor: '#111827',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 6,
    fontSize: 9,
    fontWeight: '900',
    overflow: 'hidden',
  },

  heroCard: {
    backgroundColor: '#102B55',
    borderRadius: 21,
    padding: 19,
    borderWidth: 1,
    borderColor: '#1E4E91',
  },
  heroPartner: {
    backgroundColor: '#34172A',
    borderColor: '#5C294B',
  },
  heroLabel: { color: '#94A3B8', fontSize: 11, fontWeight: '800' },
  heroAmount: { color: '#FFFFFF', fontSize: 34, fontWeight: '900', marginTop: 5 },
  heroMetrics: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.08)',
    marginTop: 17,
    paddingTop: 14,
  },
  metricLabel: { color: '#94A3B8', fontSize: 9, fontWeight: '700' },
  metricValue: { color: '#FFFFFF', fontSize: 14, fontWeight: '900', marginTop: 3 },
  metricGreen: { color: '#4ADE80', fontSize: 14, fontWeight: '900', marginTop: 3 },
  metricBlue: { color: '#60A5FA', fontSize: 14, fontWeight: '900', marginTop: 3 },
  metricPink: { color: '#F472B6', fontSize: 14, fontWeight: '900', marginTop: 3 },
  metricRed: { color: '#F87171' },
  metricRight: { alignItems: 'flex-end' },

  balanceCard: {
    marginTop: 10,
    backgroundColor: '#0E1A2A',
    borderRadius: 17,
    borderWidth: 1,
    borderColor: '#1B2B40',
    padding: 15,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  balanceSmall: { color: '#64748B', fontSize: 9, fontWeight: '800' },
  balanceTitle: { color: '#FFFFFF', fontSize: 13, fontWeight: '900', marginTop: 3 },
  balanceAmount: { color: '#CBD5E1', fontSize: 17, fontWeight: '900' },
  balanceGreen: { color: '#4ADE80' },
  balanceRed: { color: '#F87171' },

  sectionHeader: {
    marginTop: 23,
    marginBottom: 9,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sectionTitle: { color: '#FFFFFF', fontSize: 16, fontWeight: '900' },
  sectionTitleStandalone: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '900',
    marginTop: 23,
    marginBottom: 9,
  },
  linkText: { color: '#60A5FA', fontSize: 10, fontWeight: '900' },

  budgetCard: {
    backgroundColor: '#0E1A2A',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: '#1B2B40',
  },
  budgetHeader: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 5,
    marginBottom: 12,
  },
  budgetSpent: { color: '#FFFFFF', fontSize: 22, fontWeight: '900' },
  budgetLimit: { color: '#64748B', fontSize: 10 },
  budgetStatus: { color: '#94A3B8', fontSize: 9, marginTop: 8 },

  card: {
    backgroundColor: '#0E1A2A',
    borderRadius: 18,
    padding: 15,
    borderWidth: 1,
    borderColor: '#1B2B40',
  },
  categoryBlock: { marginBottom: 15 },
  statRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  statLeft: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  statText: { flex: 1 },
  iconBox: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: '#16263A',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  statIcon: { fontSize: 18 },
  statName: { color: '#FFFFFF', fontSize: 13, fontWeight: '900' },
  statSub: { color: '#64748B', fontSize: 9, marginTop: 2 },
  statAmount: {
    color: '#CBD5E1',
    fontSize: 11,
    fontWeight: '900',
    marginLeft: 10,
  },

  progressTrack: {
    width: '100%',
    backgroundColor: '#16263A',
    borderRadius: 8,
    overflow: 'hidden',
  },
  progressFill: { borderRadius: 8, backgroundColor: '#3B82F6' },
  progressPink: { backgroundColor: '#EC4899' },
  progressGreen: { backgroundColor: '#22C55E' },
  progressOrange: { backgroundColor: '#F59E0B' },
  progressRed: { backgroundColor: '#EF4444' },

  monthItem: { marginBottom: 14 },
  monthHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  monthLabel: {
    color: '#94A3B8',
    fontSize: 10,
    fontWeight: '900',
    textTransform: 'capitalize',
  },
  monthAmount: { color: '#CBD5E1', fontSize: 10, fontWeight: '900' },

  paymentRow: {
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#1B2B40',
  },
  paymentIcon: { fontSize: 19, marginRight: 10 },

  emptyTitle: { color: '#FFFFFF', fontSize: 13, fontWeight: '900' },
  emptyText: {
    color: '#64748B',
    fontSize: 10,
    lineHeight: 15,
    paddingVertical: 8,
  },
});
