import { router } from 'expo-router';
import { useEffect, useMemo } from 'react';
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

export default function HomeScreen() {
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
    totalMyExpenses,
    totalSharedExpenses,
  } = useFinance();

  useEffect(() => {
    if (!authLoading && !user) router.replace('/login');
  }, [authLoading, user]);

  const recentMovements = useMemo(() => {
    const expenseMovements = expenses.map((expense) => {
      const myPart = expense.type === 'compartido' ? expense.amount / 2 : expense.amount;
      const category = categories.find((item) => item.slug === expense.category);
      const payment = paymentMethods.find((item) => item.slug === expense.paymentMethod);

      return {
        id: `expense-${expense.id}`,
        kind: 'expense' as const,
        description: expense.description,
        amount: myPart,
        createdAt: expense.createdAt,
        icon: category?.icon ?? '🧾',
        meta: [
          category?.name ?? expense.category,
          payment?.name ?? expense.paymentMethod,
          expense.type === 'compartido' ? 'Compartido' : null,
        ]
          .filter(Boolean)
          .join(' · '),
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
      .slice(0, 3);
  }, [expenses, incomes, categories, paymentMethods]);

  if (authLoading || !user) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" />
        <Text style={styles.loadingText}>Cargando MiFinanzas...</Text>
      </SafeAreaView>
    );
  }

  const saldo = totalIncome - totalMyExpenses;
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
          <View>
            <Text style={styles.brand}>MiFinanzas</Text>
            <Text style={styles.hello}>Hola, {displayName}</Text>
          </View>
          <TouchableOpacity style={styles.profileButton} onPress={() => router.push('/perfil')}>
            <Text style={styles.profileButtonText}>
              {displayName.slice(0, 1).toUpperCase()}
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.balanceCard}>
          <Text style={styles.balanceLabel}>Saldo disponible</Text>
          <Text style={styles.balance}>S/ {saldo.toFixed(2)}</Text>

          <View style={styles.balanceSummary}>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>Ingresos</Text>
              <Text style={styles.income}>+ S/ {totalIncome.toFixed(2)}</Text>
            </View>
            <View style={styles.summaryItemRight}>
              <Text style={styles.summaryLabel}>Gastos</Text>
              <Text style={styles.expense}>- S/ {totalMyExpenses.toFixed(2)}</Text>
            </View>
          </View>
        </View>

        <View style={styles.actionsRow}>
          <TouchableOpacity
            style={[styles.actionButton, styles.expenseButton]}
            onPress={() => router.push('/nuevo-gasto')}
          >
            <Text style={styles.actionSign}>−</Text>
            <View>
              <Text style={styles.actionTitle}>Gasto</Text>
              <Text style={styles.actionSubtitle}>Registrar compra</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionButton, styles.incomeButton]}
            onPress={() => router.push('/nuevo-ingreso')}
          >
            <Text style={styles.actionSign}>＋</Text>
            <View>
              <Text style={styles.actionTitle}>Ingreso</Text>
              <Text style={styles.actionSubtitle}>Agregar dinero</Text>
            </View>
          </TouchableOpacity>
        </View>

        {totalSharedExpenses > 0 && (
          <TouchableOpacity style={styles.sharedCard} onPress={() => router.push('/pareja')}>
            <View>
              <Text style={styles.sharedTitle}>👥 Nosotros</Text>
              <Text style={styles.sharedText}>Gastos compartidos acumulados</Text>
            </View>
            <Text style={styles.sharedAmount}>S/ {totalSharedExpenses.toFixed(2)}</Text>
          </TouchableOpacity>
        )}

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Últimos movimientos</Text>
          <TouchableOpacity onPress={() => router.push('/movimientos')}>
            <Text style={styles.link}>Ver todos</Text>
          </TouchableOpacity>
        </View>

        {loadingMovements ? (
          <View style={styles.emptyCard}>
            <ActivityIndicator />
          </View>
        ) : recentMovements.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyTitle}>Todavía no tienes movimientos</Text>
            <Text style={styles.emptyText}>Registra tu primer gasto o ingreso.</Text>
          </View>
        ) : (
          <View style={styles.list}>
            {recentMovements.map((movement) => (
              <View key={movement.id} style={styles.movementRow}>
                <View style={styles.movementLeft}>
                  <View style={styles.iconBox}>
                    <Text style={styles.icon}>{movement.icon}</Text>
                  </View>
                  <View style={styles.movementText}>
                    <Text style={styles.movementTitle} numberOfLines={1}>
                      {movement.description}
                    </Text>
                    <Text style={styles.movementMeta} numberOfLines={1}>
                      {movement.meta}
                    </Text>
                  </View>
                </View>

                <Text
                  style={
                    movement.kind === 'income'
                      ? styles.movementIncome
                      : styles.movementExpense
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
  loadingContainer: {
    flex: 1,
    backgroundColor: '#0B1220',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  loadingText: { color: '#94A3B8' },
  content: { padding: 20, paddingBottom: 28 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  brand: { color: '#FFFFFF', fontSize: 24, fontWeight: '800' },
  hello: { color: '#64748B', fontSize: 13, marginTop: 3 },
  profileButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#1D4ED8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileButtonText: { color: '#FFFFFF', fontSize: 17, fontWeight: '800' },
  balanceCard: { backgroundColor: '#111827', borderRadius: 22, padding: 20 },
  balanceLabel: { color: '#94A3B8', fontSize: 13 },
  balance: { color: '#FFFFFF', fontSize: 36, fontWeight: '800', marginTop: 6 },
  balanceSummary: {
    flexDirection: 'row',
    marginTop: 22,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#1E293B',
  },
  summaryItem: { flex: 1 },
  summaryItemRight: { flex: 1, alignItems: 'flex-end' },
  summaryLabel: { color: '#64748B', fontSize: 12 },
  income: { color: '#22C55E', fontSize: 15, fontWeight: '800', marginTop: 4 },
  expense: { color: '#F87171', fontSize: 15, fontWeight: '800', marginTop: 4 },
  actionsRow: { flexDirection: 'row', gap: 12, marginTop: 18 },
  actionButton: {
    flex: 1,
    minHeight: 82,
    borderRadius: 18,
    padding: 15,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  expenseButton: { backgroundColor: '#3A1720' },
  incomeButton: { backgroundColor: '#123323' },
  actionSign: { color: '#FFFFFF', fontSize: 26, fontWeight: '800' },
  actionTitle: { color: '#FFFFFF', fontSize: 16, fontWeight: '800' },
  actionSubtitle: { color: '#94A3B8', fontSize: 10, marginTop: 2 },
  sharedCard: {
    marginTop: 18,
    backgroundColor: '#111827',
    borderRadius: 16,
    padding: 15,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sharedTitle: { color: '#FFFFFF', fontSize: 15, fontWeight: '800' },
  sharedText: { color: '#64748B', fontSize: 11, marginTop: 3 },
  sharedAmount: { color: '#60A5FA', fontSize: 16, fontWeight: '800' },
  sectionHeader: {
    marginTop: 26,
    marginBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sectionTitle: { color: '#FFFFFF', fontSize: 17, fontWeight: '800' },
  link: { color: '#60A5FA', fontSize: 12, fontWeight: '700' },
  emptyCard: {
    backgroundColor: '#111827',
    borderRadius: 16,
    padding: 22,
    alignItems: 'center',
  },
  emptyTitle: { color: '#FFFFFF', fontSize: 15, fontWeight: '700' },
  emptyText: { color: '#64748B', fontSize: 12, marginTop: 5 },
  list: { gap: 9 },
  movementRow: {
    backgroundColor: '#111827',
    borderRadius: 15,
    padding: 13,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  movementLeft: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  iconBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#1E293B',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 11,
  },
  icon: { fontSize: 20 },
  movementText: { flex: 1 },
  movementTitle: { color: '#FFFFFF', fontSize: 14, fontWeight: '700' },
  movementMeta: { color: '#64748B', fontSize: 10, marginTop: 3 },
  movementIncome: {
    color: '#4ADE80',
    fontSize: 13,
    fontWeight: '800',
    marginLeft: 8,
  },
  movementExpense: {
    color: '#F87171',
    fontSize: 13,
    fontWeight: '800',
    marginLeft: 8,
  },
});
