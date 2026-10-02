import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppIcon } from '@/components/app-icon';
import { BottomNav } from '@/components/bottom-nav';
import { MonthNavigator } from '@/components/month-navigator';
import { ProfileAvatar } from '@/components/profile-avatar';
import { useFinance } from '@/context/finance-context';
import { getAvatarUrl, getProfiles } from '@/lib/avatar';
import { categoryIconName } from '@/lib/icon-map';
import { isInMonth, monthLabel, normalizeMonthKey } from '@/lib/months';
import { supabase } from '@/lib/supabase';

type BudgetRow = {
  category: string;
  amount: number;
};

export default function MiDineroScreen() {
  const params = useLocalSearchParams<{ month?: string | string[] }>();
  const [selectedMonth, setSelectedMonth] = useState(() => normalizeMonthKey(params.month));

  const {
    user,
    authLoading,
    expenses,
    incomes,
    categories,
    paymentMethods,
    loadingExpenses,
    loadingIncomes,
    refreshExpenses,
    refreshIncomes,
  } = useFinance();

  const [budgets, setBudgets] = useState<BudgetRow[]>([]);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

  useEffect(() => {
    setSelectedMonth(normalizeMonthKey(params.month));
  }, [params.month]);

  useEffect(() => {
    if (!authLoading && !user) router.replace('/login');
  }, [authLoading, user]);

  const loadBudgets = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase
      .from('budgets')
      .select('category, amount')
      .eq('scope', 'personal')
      .eq('month', selectedMonth);

    setBudgets((data ?? []).map((item: any) => ({
      category: item.category,
      amount: Number(item.amount),
    })));
  }, [user, selectedMonth]);

  const loadAvatar = useCallback(async () => {
    if (!user) return;
    try {
      const profiles = await getProfiles([user.id]);
      setAvatarUrl(await getAvatarUrl(profiles[0]?.avatar_path));
    } catch {
      setAvatarUrl(null);
    }
  }, [user]);

  useFocusEffect(
    useCallback(() => {
      refreshExpenses();
      refreshIncomes();
      loadBudgets();
      loadAvatar();
    }, [refreshExpenses, refreshIncomes, loadBudgets, loadAvatar])
  );

  const personalExpenses = useMemo(
    () => expenses.filter((expense) => expense.type === 'personal'),
    [expenses]
  );

  const monthExpenses = useMemo(
    () => personalExpenses.filter((expense) => isInMonth(expense.createdAt, selectedMonth)),
    [personalExpenses, selectedMonth]
  );

  const monthIncomes = useMemo(
    () => incomes.filter((income) => isInMonth(income.createdAt, selectedMonth)),
    [incomes, selectedMonth]
  );

  const totalExpense = useMemo(
    () => monthExpenses.reduce((sum, item) => sum + item.amount, 0),
    [monthExpenses]
  );

  const totalIncome = useMemo(
    () => monthIncomes.reduce((sum, item) => sum + item.amount, 0),
    [monthIncomes]
  );

  const balance = totalIncome - totalExpense;

  const budgetTotal = useMemo(
    () => budgets.reduce((sum, item) => sum + item.amount, 0),
    [budgets]
  );

  const budgetSpent = useMemo(
    () =>
      budgets.reduce((sum, budget) => {
        const spent = monthExpenses
          .filter((expense) => expense.category === budget.category)
          .reduce((acc, expense) => acc + expense.amount, 0);
        return sum + spent;
      }, 0),
    [budgets, monthExpenses]
  );

  const budgetPercent = budgetTotal > 0 ? Math.min(100, (budgetSpent / budgetTotal) * 100) : 0;

  const recentMovements = useMemo(() => {
    const expenseMovements = monthExpenses.map((expense) => {
      const category = categories.find((item) => item.slug === expense.category);
      const payment = paymentMethods.find((item) => item.slug === expense.paymentMethod);
      return {
        id: `expense-${expense.id}`,
        expenseId: expense.id,
        incomeId: null,
        kind: 'expense' as const,
        description: expense.description,
        amount: expense.amount,
        createdAt: expense.createdAt,
        icon: categoryIconName(expense.category),
        meta: payment?.name ?? expense.paymentMethod,
      };
    });

    const incomeMovements = monthIncomes.map((income) => ({
      id: `income-${income.id}`,
      expenseId: null,
      kind: 'income' as const,
      description: income.description,
      amount: income.amount,
      createdAt: income.createdAt,
      icon: 'income' as const,
      meta: 'Ingreso',
    }));

    return [...expenseMovements, ...incomeMovements]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 4);
  }, [monthExpenses, monthIncomes, categories, paymentMethods]);

  const categoryTotals = useMemo(() => {
    const totals = new Map<string, number>();

    monthExpenses.forEach((expense) => {
      const slug = expense.category || 'otros';
      totals.set(slug, (totals.get(slug) ?? 0) + expense.amount);
    });

    return [...totals.entries()]
      .map(([slug, amount]) => {
        const category = categories.find((item) => item.slug === slug);
        return {
          slug,
          name: category?.name ?? slug,
          icon: category?.icon ?? '📦',
          amount,
          percent: totalExpense > 0 ? Math.round((amount / totalExpense) * 100) : 0,
        };
      })
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 4);
  }, [monthExpenses, categories, totalExpense]);

  if (authLoading || !user) {
    return (
      <SafeAreaView style={styles.loading}>
        <ActivityIndicator size="large" />
      </SafeAreaView>
    );
  }

  const displayName =
    user.user_metadata?.display_name || user.email?.split('@')[0] || 'Usuario';
  const loading = loadingExpenses || loadingIncomes;

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <ScrollView
        style={styles.flex}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.topRow}>
          <View style={styles.headerLeft}>
            <ProfileAvatar
              uri={avatarUrl}
              size={34}
              color="#1677FF"
              style={styles.headerIcon}
            />
            <View>
              <Text style={styles.headerTitle}>Mi dinero</Text>
              <Text style={styles.hello}>Hola, {displayName}</Text>
            </View>
          </View>
          <TouchableOpacity style={styles.gear} onPress={() => router.push('/perfil')}>
            <AppIcon name="settings" size={20} color="#CBD5E1" />
          </TouchableOpacity>
        </View>

        <MonthNavigator month={selectedMonth} onChange={setSelectedMonth} />

        <View style={styles.balanceCard}>
          <View style={styles.balanceTop}>
            <Text style={styles.cardLabel}>Saldo actual</Text>
            <AppIcon name="eye" size={17} color="#94A3B8" />
          </View>
          <Text style={styles.balance}>S/ {balance.toFixed(2)}</Text>
          <View style={styles.metricsRow}>
            <View>
              <Text style={styles.metricLabel}>Ingresos</Text>
              <Text style={styles.income}>+ S/ {totalIncome.toFixed(2)}</Text>
            </View>
            <View style={styles.metricRight}>
              <Text style={styles.metricLabel}>Gastos</Text>
              <Text style={styles.expense}>- S/ {totalExpense.toFixed(2)}</Text>
            </View>
          </View>
        </View>

        <View style={styles.quickRow}>
          <TouchableOpacity
            style={[styles.quickCard, styles.quickExpense]}
            onPress={() => router.push('/nuevo-gasto')}
          >
            <AppIcon name="add" size={17} color="#FFFFFF" />
            <Text style={styles.quickText}>Gasto</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.quickCard, styles.quickIncome]}
            onPress={() => router.push('/nuevo-ingreso')}
          >
            <AppIcon name="add" size={17} color="#FFFFFF" />
            <Text style={styles.quickText}>Ingreso</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={styles.budgetCard}
          activeOpacity={0.85}
          onPress={() => router.push(`/presupuestos?scope=personal&month=${selectedMonth}` as any)}
        >
          <View style={styles.budgetHeader}>
            <View>
              <Text style={styles.sectionMini}>Presupuesto del mes</Text>
              <Text style={styles.budgetAmount}>
                {budgetTotal > 0
                  ? `S/ ${budgetSpent.toFixed(0)} / S/ ${budgetTotal.toFixed(0)}`
                  : 'Configurar presupuesto'}
              </Text>
            </View>
            <Text style={styles.budgetPct}>
              {budgetTotal > 0 ? `${Math.round((budgetSpent / budgetTotal) * 100)}%` : '›'}
            </Text>
          </View>
          {budgetTotal > 0 ? (
            <View style={styles.track}>
              <View style={[styles.fill, { width: `${budgetPercent}%` }]} />
            </View>
          ) : null}
        </TouchableOpacity>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Últimos movimientos</Text>
          <TouchableOpacity onPress={() => router.push(`/movimientos?filter=personal&month=${selectedMonth}` as any)}>
            <Text style={styles.link}>Ver todos</Text>
          </TouchableOpacity>
        </View>

        {loading ? (
          <View style={styles.emptyCard}><ActivityIndicator /></View>
        ) : recentMovements.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyTitle}>Todo empieza con el primer movimiento</Text>
            <Text style={styles.emptyText}>Usa los botones de arriba para registrar en segundos.</Text>
          </View>
        ) : (
          <View style={styles.list}>
            {recentMovements.map((movement) => (
              <TouchableOpacity
                key={movement.id}
                activeOpacity={0.82}
                style={styles.row}
                onPress={() => {
                  if (movement.kind === 'expense' && movement.expenseId) {
                    router.push(`/detalle-gasto?id=${movement.expenseId}` as any);
                  } else if (movement.kind === 'income' && movement.incomeId) {
                    router.push(`/detalle-ingreso?id=${movement.incomeId}` as any);
                  }
                }}
              >
                <View style={styles.rowLeft}>
                  <View style={styles.iconBox}>
                    <AppIcon
                      name={movement.icon}
                      size={18}
                      color={movement.kind === 'income' ? '#4ADE80' : '#23A7FF'}
                    />
                  </View>
                  <View style={styles.rowText}>
                    <Text style={styles.rowTitle} numberOfLines={1}>{movement.description}</Text>
                    <Text style={styles.rowMeta}>
                      {movement.meta} · {new Date(movement.createdAt).toLocaleDateString('es-PE')}
                    </Text>
                  </View>
                </View>
                <Text style={movement.kind === 'income' ? styles.amountIncome : styles.amountExpense}>
                  {movement.kind === 'income' ? '+' : '-'} S/ {movement.amount.toFixed(2)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Gastos por categoría</Text>
          <Text style={styles.periodLabel}>{monthLabel(selectedMonth, false)}</Text>
        </View>

        {categoryTotals.length ? (
          <View style={styles.categoryList}>
            {categoryTotals.map((item) => (
              <TouchableOpacity
                key={item.slug}
                style={styles.categoryRow}
                activeOpacity={0.82}
                onPress={() =>
                  router.push(
                    `/movimientos?filter=personal&category=${encodeURIComponent(item.slug)}&month=${selectedMonth}` as any
                  )
                }
              >
                <View style={styles.categoryLeft}>
                  <Text style={styles.categoryIcon}>{item.icon}</Text>
                  <View>
                    <Text style={styles.categoryName}>{item.name}</Text>
                    <Text style={styles.categoryAmount}>S/ {item.amount.toFixed(2)}</Text>
                  </View>
                </View>
                <View style={styles.categoryRight}>
                  <Text style={styles.categoryPercent}>{item.percent}%</Text>
                  <Text style={styles.categoryArrow}>›</Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        ) : (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyText}>Aún no hay gastos en este periodo.</Text>
          </View>
        )}

        <TouchableOpacity
          style={styles.statsButton}
          onPress={() => router.push(`/estadisticas?scope=personal&month=${selectedMonth}` as any)}
        >
          <Text style={styles.statsIcon}>▥</Text>
          <View style={styles.statsText}>
            <Text style={styles.statsTitle}>Ver mis estadísticas</Text>
            <Text style={styles.statsSub}>Lo importante, explicado fácil.</Text>
          </View>
          <Text style={styles.statsArrow}>›</Text>
        </TouchableOpacity>
      </ScrollView>

      <BottomNav active="inicio" mode="personal" />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  container: { flex: 1, backgroundColor: '#07111F' },
  loading: { flex: 1, backgroundColor: '#07111F', alignItems: 'center', justifyContent: 'center' },
  content: { padding: 18, paddingBottom: 34 },
  topRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  headerIcon: {
    borderWidth: 1,
    borderColor: '#60A5FA',
  },
  headerTitle: { color: '#FFFFFF', fontSize: 15, fontWeight: '900' },
  hello: { color: '#94A3B8', fontSize: 9, marginTop: 2 },
  gear: { width: 36, height: 36, borderRadius: 11, backgroundColor: '#0E1A2A', alignItems: 'center', justifyContent: 'center' },
  balanceCard: { backgroundColor: '#102B55', borderRadius: 22, padding: 19, marginTop: 14, borderWidth: 1, borderColor: '#1E4E91' },
  balanceTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  cardLabel: { color: '#94A3B8', fontSize: 10, fontWeight: '800' },
  balance: { color: '#FFFFFF', fontSize: 35, fontWeight: '900', marginTop: 5 },
  metricsRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 15, paddingTop: 13, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.08)' },
  metricLabel: { color: '#94A3B8', fontSize: 9, fontWeight: '700' },
  metricRight: { alignItems: 'flex-end' },
  income: { color: '#4ADE80', fontSize: 13, fontWeight: '900', marginTop: 3 },
  expense: { color: '#F87171', fontSize: 13, fontWeight: '900', marginTop: 3 },
  quickRow: { flexDirection: 'row', gap: 8, marginTop: 12 },
  quickCard: {
    flex: 1,
    minHeight: 45,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 6,
  },
  quickExpense: { backgroundColor: '#1677FF' },
  quickIncome: { backgroundColor: '#253A5A' },
  quickText: { color: '#FFFFFF', fontSize: 10, fontWeight: '900' },
  budgetCard: { backgroundColor: '#0E1A2A', borderRadius: 17, padding: 15, marginTop: 12, borderWidth: 1, borderColor: '#1B2B40' },
  budgetHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  sectionMini: { color: '#94A3B8', fontSize: 9, fontWeight: '800' },
  budgetAmount: { color: '#FFFFFF', fontSize: 13, fontWeight: '900', marginTop: 3 },
  budgetPct: { color: '#60A5FA', fontSize: 12, fontWeight: '900' },
  track: { height: 7, borderRadius: 5, backgroundColor: '#16263A', overflow: 'hidden', marginTop: 10 },
  fill: { height: 7, backgroundColor: '#3B82F6', borderRadius: 5 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 22, marginBottom: 8 },
  sectionTitle: { color: '#FFFFFF', fontSize: 15, fontWeight: '900' },
  link: { color: '#60A5FA', fontSize: 10, fontWeight: '900' },
  emptyCard: { backgroundColor: '#0E1A2A', borderRadius: 16, padding: 22, alignItems: 'center' },
  emptyTitle: { color: '#FFFFFF', fontSize: 13, fontWeight: '900', textAlign: 'center' },
  emptyText: { color: '#64748B', fontSize: 9, textAlign: 'center', marginTop: 5, lineHeight: 14 },
  list: { gap: 7 },
  row: { backgroundColor: '#0E1A2A', borderRadius: 14, padding: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  rowLeft: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  iconBox: { width: 39, height: 39, borderRadius: 12, backgroundColor: '#16263A', alignItems: 'center', justifyContent: 'center', marginRight: 10 },
  rowText: { flex: 1 },
  rowTitle: { color: '#FFFFFF', fontSize: 12, fontWeight: '900' },
  rowMeta: { color: '#64748B', fontSize: 8, marginTop: 3 },
  amountIncome: { color: '#4ADE80', fontSize: 11, fontWeight: '900', marginLeft: 8 },
  amountExpense: { color: '#F87171', fontSize: 11, fontWeight: '900', marginLeft: 8 },
  periodLabel: { color: '#64748B', fontSize: 9, fontWeight: '800', textTransform: 'capitalize' },
  categoryList: { gap: 7 },
  categoryRow: { backgroundColor: '#0E1A2A', borderRadius: 14, padding: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderWidth: 1, borderColor: '#1B2B40' },
  categoryLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  categoryIcon: { fontSize: 20 },
  categoryName: { color: '#FFFFFF', fontSize: 11, fontWeight: '900' },
  categoryAmount: { color: '#64748B', fontSize: 8, marginTop: 2 },
  categoryRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  categoryPercent: { color: '#60A5FA', fontSize: 11, fontWeight: '900' },
  categoryArrow: { color: '#64748B', fontSize: 21 },
  statsButton: { marginTop: 12, backgroundColor: '#0E1A2A', borderRadius: 16, padding: 13, flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: '#1B2B40' },
  statsIcon: { color: '#60A5FA', fontSize: 21, width: 34, textAlign: 'center' },
  statsText: { flex: 1, marginLeft: 7 },
  statsTitle: { color: '#FFFFFF', fontSize: 12, fontWeight: '900' },
  statsSub: { color: '#64748B', fontSize: 8, marginTop: 2 },
  statsArrow: { color: '#64748B', fontSize: 24 },
});
