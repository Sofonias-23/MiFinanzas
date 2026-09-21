import { router, useFocusEffect } from 'expo-router';
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

import { BottomNav } from '@/components/bottom-nav';
import { useFinance } from '@/context/finance-context';
import { supabase } from '@/lib/supabase';

type BudgetRow = {
  category: string;
  amount: number;
};

function isCurrentMonth(value: string) {
  const date = new Date(value);
  const now = new Date();
  return date.getFullYear() === now.getFullYear() && date.getMonth() === now.getMonth();
}

function monthKey() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
}

export default function MiDineroScreen() {
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

  useEffect(() => {
    if (!authLoading && !user) router.replace('/login');
  }, [authLoading, user]);

  const loadBudgets = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase
      .from('budgets')
      .select('category, amount')
      .eq('scope', 'personal')
      .eq('month', monthKey());

    setBudgets((data ?? []).map((item: any) => ({
      category: item.category,
      amount: Number(item.amount),
    })));
  }, [user]);

  useFocusEffect(
    useCallback(() => {
      refreshExpenses();
      refreshIncomes();
      loadBudgets();
    }, [refreshExpenses, refreshIncomes, loadBudgets])
  );

  const personalExpenses = useMemo(
    () => expenses.filter((expense) => expense.type === 'personal'),
    [expenses]
  );

  const monthExpenses = useMemo(
    () => personalExpenses.filter((expense) => isCurrentMonth(expense.createdAt)),
    [personalExpenses]
  );

  const monthIncomes = useMemo(
    () => incomes.filter((income) => isCurrentMonth(income.createdAt)),
    [incomes]
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
    const expenseMovements = personalExpenses.map((expense) => {
      const category = categories.find((item) => item.slug === expense.category);
      const payment = paymentMethods.find((item) => item.slug === expense.paymentMethod);
      return {
        id: `expense-${expense.id}`,
        expenseId: expense.id,
        kind: 'expense' as const,
        description: expense.description,
        amount: expense.amount,
        createdAt: expense.createdAt,
        icon: category?.icon ?? '🧾',
        meta: payment?.name ?? expense.paymentMethod,
      };
    });

    const incomeMovements = incomes.map((income) => ({
      id: `income-${income.id}`,
      expenseId: null,
      kind: 'income' as const,
      description: income.description,
      amount: income.amount,
      createdAt: income.createdAt,
      icon: '💰',
      meta: 'Ingreso',
    }));

    return [...expenseMovements, ...incomeMovements]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 4);
  }, [personalExpenses, incomes, categories, paymentMethods]);

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
          <View>
            <Text style={styles.eyebrow}>👤 MI DINERO</Text>
            <Text style={styles.hello}>Hola, {displayName}</Text>
          </View>
          <TouchableOpacity style={styles.gear} onPress={() => router.push('/perfil')}>
            <Text style={styles.gearText}>⚙️</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.spaceSwitch}>
          <View style={[styles.spacePill, styles.spacePillActive]}>
            <Text style={styles.spacePillActiveText}>Mi dinero</Text>
          </View>
          <TouchableOpacity
            style={styles.spacePill}
            onPress={() => router.replace('/pareja')}
          >
            <Text style={styles.spacePillText}>Pareja</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.balanceCard}>
          <Text style={styles.cardLabel}>Tu saldo este mes</Text>
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
            <Text style={styles.quickIcon}>＋</Text>
            <Text style={styles.quickText}>Gasto</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.quickCard, styles.quickIncome]}
            onPress={() => router.push('/nuevo-ingreso')}
          >
            <Text style={styles.quickIcon}>＋</Text>
            <Text style={styles.quickText}>Ingreso</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.quickCard, styles.quickShared]}
            onPress={() => router.push('/nuevo-gasto?type=compartido' as any)}
          >
            <Text style={styles.quickIcon}>👥</Text>
            <Text style={styles.quickText}>Compartido</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={styles.budgetCard}
          activeOpacity={0.85}
          onPress={() => router.push('/presupuestos?scope=personal' as any)}
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
          <TouchableOpacity onPress={() => router.push('/movimientos?filter=personal' as any)}>
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
                disabled={movement.kind === 'income'}
                activeOpacity={0.82}
                style={styles.row}
                onPress={() =>
                  movement.expenseId &&
                  router.push(`/detalle-gasto?id=${movement.expenseId}` as any)
                }
              >
                <View style={styles.rowLeft}>
                  <View style={styles.iconBox}>
                    <Text style={styles.icon}>{movement.icon}</Text>
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

        <TouchableOpacity
          style={styles.statsButton}
          onPress={() => router.push('/estadisticas?scope=personal' as any)}
        >
          <Text style={styles.statsIcon}>▥</Text>
          <View style={styles.statsText}>
            <Text style={styles.statsTitle}>Ver mis estadísticas</Text>
            <Text style={styles.statsSub}>Lo importante, explicado fácil.</Text>
          </View>
          <Text style={styles.statsArrow}>›</Text>
        </TouchableOpacity>
      </ScrollView>

      <BottomNav active="inicio" />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  container: { flex: 1, backgroundColor: '#07111F' },
  loading: { flex: 1, backgroundColor: '#07111F', alignItems: 'center', justifyContent: 'center' },
  content: { padding: 18, paddingBottom: 34 },
  topRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  eyebrow: { color: '#60A5FA', fontSize: 10, fontWeight: '900', letterSpacing: 0.8 },
  hello: { color: '#FFFFFF', fontSize: 20, fontWeight: '900', marginTop: 3 },
  gear: { width: 38, height: 38, borderRadius: 12, backgroundColor: '#0E1A2A', alignItems: 'center', justifyContent: 'center' },
  gearText: { fontSize: 17 },
  spaceSwitch: { flexDirection: 'row', backgroundColor: '#0E1A2A', padding: 4, borderRadius: 14, marginTop: 16 },
  spacePill: { flex: 1, minHeight: 38, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  spacePillActive: { backgroundColor: '#1677FF' },
  spacePillText: { color: '#64748B', fontSize: 11, fontWeight: '900' },
  spacePillActiveText: { color: '#FFFFFF', fontSize: 11, fontWeight: '900' },
  balanceCard: { backgroundColor: '#102B55', borderRadius: 22, padding: 19, marginTop: 14, borderWidth: 1, borderColor: '#1E4E91' },
  cardLabel: { color: '#94A3B8', fontSize: 10, fontWeight: '800' },
  balance: { color: '#FFFFFF', fontSize: 35, fontWeight: '900', marginTop: 5 },
  metricsRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 15, paddingTop: 13, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.08)' },
  metricLabel: { color: '#94A3B8', fontSize: 9, fontWeight: '700' },
  metricRight: { alignItems: 'flex-end' },
  income: { color: '#4ADE80', fontSize: 13, fontWeight: '900', marginTop: 3 },
  expense: { color: '#F87171', fontSize: 13, fontWeight: '900', marginTop: 3 },
  quickRow: { flexDirection: 'row', gap: 8, marginTop: 12 },
  quickCard: { flex: 1, minHeight: 74, borderRadius: 17, alignItems: 'center', justifyContent: 'center' },
  quickExpense: { backgroundColor: '#EF3F72' },
  quickIncome: { backgroundColor: '#13A879' },
  quickShared: { backgroundColor: '#273B5C' },
  quickIcon: { color: '#FFFFFF', fontSize: 23, fontWeight: '900' },
  quickText: { color: '#FFFFFF', fontSize: 10, fontWeight: '900', marginTop: 4 },
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
  icon: { fontSize: 18 },
  rowText: { flex: 1 },
  rowTitle: { color: '#FFFFFF', fontSize: 12, fontWeight: '900' },
  rowMeta: { color: '#64748B', fontSize: 8, marginTop: 3 },
  amountIncome: { color: '#4ADE80', fontSize: 11, fontWeight: '900', marginLeft: 8 },
  amountExpense: { color: '#F87171', fontSize: 11, fontWeight: '900', marginLeft: 8 },
  statsButton: { marginTop: 12, backgroundColor: '#0E1A2A', borderRadius: 16, padding: 13, flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: '#1B2B40' },
  statsIcon: { color: '#60A5FA', fontSize: 21, width: 34, textAlign: 'center' },
  statsText: { flex: 1, marginLeft: 7 },
  statsTitle: { color: '#FFFFFF', fontSize: 12, fontWeight: '900' },
  statsSub: { color: '#64748B', fontSize: 8, marginTop: 2 },
  statsArrow: { color: '#64748B', fontSize: 24 },
});
