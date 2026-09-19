import { router, useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useMemo } from 'react';
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
    totalIncome,
    refreshExpenses,
    refreshIncomes,
  } = useFinance();

  useEffect(() => {
    if (!authLoading && !user) router.replace('/login');
  }, [authLoading, user]);

  useFocusEffect(
    useCallback(() => {
      refreshExpenses();
      refreshIncomes();
    }, [refreshExpenses, refreshIncomes])
  );

  const personalExpenses = useMemo(
    () => expenses.filter((expense) => expense.type === 'personal'),
    [expenses]
  );

  const totalPersonalExpenses = useMemo(
    () => personalExpenses.reduce((total, expense) => total + expense.amount, 0),
    [personalExpenses]
  );

  const recentMovements = useMemo(() => {
    const expenseMovements = personalExpenses.map((expense) => {
      const category = categories.find((item) => item.slug === expense.category);
      const payment = paymentMethods.find((item) => item.slug === expense.paymentMethod);

      return {
        id: `expense-${expense.id}`,
        kind: 'expense' as const,
        description: expense.description,
        amount: expense.amount,
        createdAt: expense.createdAt,
        icon: category?.icon ?? '🧾',
        meta: [
          category?.name ?? expense.category,
          payment?.name ?? expense.paymentMethod,
        ].join(' · '),
      };
    });

    const incomeMovements = incomes.map((income) => ({
      id: `income-${income.id}`,
      kind: 'income' as const,
      description: income.description,
      amount: income.amount,
      createdAt: income.createdAt,
      icon: '💰',
      meta: 'Ingreso',
    }));

    return [...expenseMovements, ...incomeMovements]
      .sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      )
      .slice(0, 5);
  }, [personalExpenses, incomes, categories, paymentMethods]);

  if (authLoading || !user) {
    return (
      <SafeAreaView style={styles.loading}>
        <ActivityIndicator size="large" />
      </SafeAreaView>
    );
  }

  const saldo = totalIncome - totalPersonalExpenses;
  const displayName =
    user.user_metadata?.display_name || user.email?.split('@')[0] || 'Usuario';
  const loadingMovements = loadingExpenses || loadingIncomes;

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <ScrollView
        style={styles.flex}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.replace('/')}>
            <Text style={styles.back}>‹ Espacios</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => router.push('/perfil')}>
            <Text style={styles.profile}>👤</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.title}>Mi dinero</Text>
        <Text style={styles.subtitle}>Solo tú puedes ver este espacio, {displayName}.</Text>

        <View style={styles.balanceCard}>
          <Text style={styles.balanceLabel}>Saldo personal</Text>
          <Text style={styles.balance}>S/ {saldo.toFixed(2)}</Text>

          <View style={styles.summary}>
            <View>
              <Text style={styles.summaryLabel}>Ingresos</Text>
              <Text style={styles.income}>+ S/ {totalIncome.toFixed(2)}</Text>
            </View>
            <View style={styles.summaryRight}>
              <Text style={styles.summaryLabel}>Gastos personales</Text>
              <Text style={styles.expense}>- S/ {totalPersonalExpenses.toFixed(2)}</Text>
            </View>
          </View>
        </View>

        <View style={styles.actions}>
          <TouchableOpacity
            style={[styles.action, styles.expenseAction]}
            onPress={() => router.push('/nuevo-gasto')}
          >
            <Text style={styles.actionIcon}>−</Text>
            <Text style={styles.actionText}>Gasto</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.action, styles.incomeAction]}
            onPress={() => router.push('/nuevo-ingreso')}
          >
            <Text style={styles.actionIcon}>＋</Text>
            <Text style={styles.actionText}>Ingreso</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Movimientos personales</Text>
          <TouchableOpacity onPress={() => router.push('/movimientos?filter=personal' as any)}>
            <Text style={styles.link}>Ver todos</Text>
          </TouchableOpacity>
        </View>

        {loadingMovements ? (
          <View style={styles.emptyCard}>
            <ActivityIndicator />
          </View>
        ) : recentMovements.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyTitle}>Aún no hay movimientos personales</Text>
            <Text style={styles.emptyText}>Registra tu primer gasto o ingreso.</Text>
          </View>
        ) : (
          <View style={styles.list}>
            {recentMovements.map((movement) => (
              <View key={movement.id} style={styles.row}>
                <View style={styles.rowLeft}>
                  <View style={styles.iconBox}>
                    <Text style={styles.icon}>{movement.icon}</Text>
                  </View>
                  <View style={styles.rowText}>
                    <Text style={styles.rowTitle} numberOfLines={1}>
                      {movement.description}
                    </Text>
                    <Text style={styles.rowMeta} numberOfLines={1}>
                      {movement.meta}
                    </Text>
                  </View>
                </View>
                <Text
                  style={
                    movement.kind === 'income'
                      ? styles.amountIncome
                      : styles.amountExpense
                  }
                >
                  {movement.kind === 'income' ? '+' : '-'} S/ {movement.amount.toFixed(2)}
                </Text>
              </View>
            ))}
          </View>
        )}
      </ScrollView>

      <BottomNav active="inicio" />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  container: { flex: 1, backgroundColor: '#0B1220' },
  loading: { flex: 1, backgroundColor: '#0B1220', alignItems: 'center', justifyContent: 'center' },
  content: { padding: 20, paddingBottom: 30 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  back: { color: '#60A5FA', fontSize: 15, fontWeight: '800' },
  profile: { fontSize: 21 },
  title: { color: '#FFFFFF', fontSize: 30, fontWeight: '900', marginTop: 20 },
  subtitle: { color: '#64748B', fontSize: 12, marginTop: 5, marginBottom: 20 },
  balanceCard: { backgroundColor: '#111827', borderRadius: 22, padding: 20 },
  balanceLabel: { color: '#94A3B8', fontSize: 12 },
  balance: { color: '#FFFFFF', fontSize: 36, fontWeight: '900', marginTop: 6 },
  summary: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: '#1E293B',
  },
  summaryRight: { alignItems: 'flex-end' },
  summaryLabel: { color: '#64748B', fontSize: 10 },
  income: { color: '#4ADE80', fontSize: 14, fontWeight: '900', marginTop: 3 },
  expense: { color: '#F87171', fontSize: 14, fontWeight: '900', marginTop: 3 },
  actions: { flexDirection: 'row', gap: 10, marginTop: 14 },
  action: {
    flex: 1,
    borderRadius: 17,
    minHeight: 68,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  expenseAction: { backgroundColor: '#3A1720' },
  incomeAction: { backgroundColor: '#123323' },
  actionIcon: { color: '#FFFFFF', fontSize: 24, fontWeight: '800' },
  actionText: { color: '#FFFFFF', fontSize: 14, fontWeight: '900' },
  sectionHeader: {
    marginTop: 25,
    marginBottom: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sectionTitle: { color: '#FFFFFF', fontSize: 16, fontWeight: '900' },
  link: { color: '#60A5FA', fontSize: 11, fontWeight: '800' },
  emptyCard: { backgroundColor: '#111827', borderRadius: 16, padding: 22, alignItems: 'center' },
  emptyTitle: { color: '#FFFFFF', fontSize: 14, fontWeight: '800' },
  emptyText: { color: '#64748B', fontSize: 11, marginTop: 4 },
  list: { gap: 9 },
  row: {
    backgroundColor: '#111827',
    borderRadius: 15,
    padding: 13,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  rowLeft: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  iconBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#1E293B',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  icon: { fontSize: 19 },
  rowText: { flex: 1 },
  rowTitle: { color: '#FFFFFF', fontSize: 13, fontWeight: '800' },
  rowMeta: { color: '#64748B', fontSize: 9, marginTop: 3 },
  amountIncome: { color: '#4ADE80', fontSize: 12, fontWeight: '900', marginLeft: 8 },
  amountExpense: { color: '#F87171', fontSize: 12, fontWeight: '900', marginLeft: 8 },
});
