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

import { useFinance } from '@/context/finance-context';

export default function HomeScreen() {
  const {
    user,
    authLoading,
    expenses,
    incomes,
    loadingExpenses,
    loadingIncomes,
    signOut,
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
      return {
        id: `expense-${expense.id}`,
        kind: 'expense' as const,
        description: expense.description,
        amount: myPart,
        createdAt: expense.createdAt,
        icon: expense.type === 'compartido' ? '👥' : '🧾',
        meta:
          expense.type === 'compartido'
            ? `Compartido · tu parte S/ ${myPart.toFixed(2)}`
            : 'Gasto personal',
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
      .slice(0, 8);
  }, [expenses, incomes]);

  const monthlySummary = useMemo(() => {
    const now = new Date();
    const isThisMonth = (dateText: string) => {
      const date = new Date(dateText);
      return (
        date.getFullYear() === now.getFullYear() &&
        date.getMonth() === now.getMonth()
      );
    };

    const income = incomes
      .filter((item) => isThisMonth(item.createdAt))
      .reduce((total, item) => total + item.amount, 0);

    const expense = expenses
      .filter((item) => isThisMonth(item.createdAt))
      .reduce(
        (total, item) =>
          total + (item.type === 'compartido' ? item.amount / 2 : item.amount),
        0
      );

    return { income, expense, balance: income - expense };
  }, [expenses, incomes]);

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
  const initial = displayName.slice(0, 1).toUpperCase();
  const loadingMovements = loadingExpenses || loadingIncomes;

  const handleSignOut = async () => {
    await signOut();
    router.replace('/login');
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <View>
            <Text style={styles.saludo}>Hola, {displayName}</Text>
            <Text style={styles.subtitulo}>Resumen financiero</Text>
          </View>

          <TouchableOpacity style={styles.avatar} onPress={handleSignOut}>
            <Text style={styles.avatarText}>{initial}</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.balanceCard}>
          <Text style={styles.balanceLabel}>Saldo disponible</Text>
          <Text style={styles.balance}>S/ {saldo.toFixed(2)}</Text>

          <View style={styles.balanceRow}>
            <View>
              <Text style={styles.miniLabel}>Ingresos</Text>
              <Text style={styles.ingreso}>+ S/ {totalIncome.toFixed(2)}</Text>
            </View>

            <View>
              <Text style={styles.miniLabel}>Gastos</Text>
              <Text style={styles.gasto}>- S/ {totalMyExpenses.toFixed(2)}</Text>
            </View>
          </View>
        </View>

        <Text style={styles.sectionTitle}>Acciones rápidas</Text>

        <View style={styles.actionsRow}>
          <TouchableOpacity
            style={styles.actionCard}
            onPress={() => router.push('/nuevo-gasto')}
          >
            <Text style={styles.actionIcon}>＋</Text>
            <Text style={styles.actionTitle}>Gasto</Text>
            <Text style={styles.actionSubtitle}>Registrar</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionCard}
            onPress={() => router.push('/nuevo-ingreso')}
          >
            <Text style={[styles.actionIcon, styles.incomeActionIcon]}>↗</Text>
            <Text style={styles.actionTitle}>Ingreso</Text>
            <Text style={styles.actionSubtitle}>Agregar</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionCard}>
            <Text style={styles.actionIcon}>👥</Text>
            <Text style={styles.actionTitle}>Pareja</Text>
            <Text style={styles.actionSubtitle}>Después</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.sectionTitle}>Este mes</Text>

        <View style={styles.monthCard}>
          <View style={styles.monthRow}>
            <Text style={styles.monthLabel}>Ingresos</Text>
            <Text style={styles.monthIncome}>+ S/ {monthlySummary.income.toFixed(2)}</Text>
          </View>
          <View style={[styles.monthRow, styles.monthRowSpacing]}>
            <Text style={styles.monthLabel}>Gastos</Text>
            <Text style={styles.monthExpense}>- S/ {monthlySummary.expense.toFixed(2)}</Text>
          </View>
          <View style={styles.monthDivider} />
          <View style={styles.monthRow}>
            <Text style={styles.monthBalanceLabel}>Balance del mes</Text>
            <Text
              style={[
                styles.monthBalance,
                monthlySummary.balance < 0 && styles.monthBalanceNegative,
              ]}
            >
              S/ {monthlySummary.balance.toFixed(2)}
            </Text>
          </View>
        </View>

        <Text style={styles.sectionTitle}>Gastos compartidos</Text>

        <TouchableOpacity style={styles.sharedCard}>
          <View style={styles.sharedLeft}>
            <View style={styles.sharedIcon}>
              <Text style={styles.sharedIconText}>👥</Text>
            </View>

            <View>
              <Text style={styles.sharedTitle}>Nosotros</Text>
              <Text style={styles.sharedSubtitle}>
                Total compartido: S/ {totalSharedExpenses.toFixed(2)}
              </Text>
            </View>
          </View>

          <Text style={styles.arrow}>›</Text>
        </TouchableOpacity>

        <Text style={styles.sectionTitle}>Movimientos recientes</Text>

        {loadingMovements ? (
          <View style={styles.emptyCard}>
            <ActivityIndicator />
            <Text style={styles.emptySubtitle}>Cargando movimientos...</Text>
          </View>
        ) : recentMovements.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyIcon}>🧾</Text>
            <Text style={styles.emptyTitle}>Aún no tienes movimientos</Text>
            <Text style={styles.emptySubtitle}>
              Tus ingresos y gastos aparecerán aquí.
            </Text>
          </View>
        ) : (
          <View style={styles.movementsList}>
            {recentMovements.map((movement) => (
              <View key={movement.id} style={styles.movementCard}>
                <View style={styles.movementLeft}>
                  <View style={styles.movementIcon}>
                    <Text>{movement.icon}</Text>
                  </View>
                  <View style={styles.movementTextWrap}>
                    <Text style={styles.movementTitle} numberOfLines={1}>
                      {movement.description}
                    </Text>
                    <Text style={styles.movementMeta}>{movement.meta}</Text>
                  </View>
                </View>

                <Text
                  style={
                    movement.kind === 'income'
                      ? styles.movementIncomeAmount
                      : styles.movementExpenseAmount
                  }
                >
                  {movement.kind === 'income' ? '+' : '-'} S/ {movement.amount.toFixed(2)}
                </Text>
              </View>
            ))}
          </View>
        )}

        <TouchableOpacity style={styles.logoutButton} onPress={handleSignOut}>
          <Text style={styles.logoutText}>Cerrar sesión</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    backgroundColor: '#0B1220',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  loadingText: { color: '#94A3B8' },
  container: { flex: 1, backgroundColor: '#0B1220' },
  content: { padding: 20, paddingBottom: 40 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 24,
  },
  saludo: { color: '#FFFFFF', fontSize: 26, fontWeight: '700' },
  subtitulo: { color: '#94A3B8', fontSize: 14, marginTop: 4 },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#2563EB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { color: '#FFFFFF', fontSize: 18, fontWeight: '700' },
  balanceCard: { backgroundColor: '#111C30', borderRadius: 24, padding: 22 },
  balanceLabel: { color: '#94A3B8', fontSize: 14 },
  balance: {
    color: '#FFFFFF',
    fontSize: 38,
    fontWeight: '800',
    marginTop: 6,
    marginBottom: 24,
  },
  balanceRow: { flexDirection: 'row', justifyContent: 'space-between' },
  miniLabel: { color: '#64748B', fontSize: 13 },
  ingreso: { color: '#22C55E', fontSize: 17, fontWeight: '700', marginTop: 4 },
  gasto: { color: '#F87171', fontSize: 17, fontWeight: '700', marginTop: 4 },
  sectionTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
    marginTop: 28,
    marginBottom: 14,
  },
  actionsRow: { flexDirection: 'row', gap: 10 },
  actionCard: {
    flex: 1,
    backgroundColor: '#111827',
    borderRadius: 18,
    paddingVertical: 18,
    alignItems: 'center',
  },
  actionIcon: {
    color: '#60A5FA',
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 8,
  },
  incomeActionIcon: { color: '#4ADE80' },
  actionTitle: { color: '#FFFFFF', fontSize: 15, fontWeight: '700' },
  actionSubtitle: { color: '#64748B', fontSize: 11, marginTop: 3 },
  monthCard: { backgroundColor: '#111827', borderRadius: 18, padding: 18 },
  monthRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  monthRowSpacing: { marginTop: 10 },
  monthLabel: { color: '#CBD5E1', fontSize: 14 },
  monthIncome: { color: '#22C55E', fontSize: 14, fontWeight: '700' },
  monthExpense: { color: '#F87171', fontSize: 14, fontWeight: '700' },
  monthDivider: { height: 1, backgroundColor: '#1E293B', marginVertical: 16 },
  monthBalanceLabel: { color: '#FFFFFF', fontSize: 15, fontWeight: '700' },
  monthBalance: { color: '#FFFFFF', fontSize: 17, fontWeight: '800' },
  monthBalanceNegative: { color: '#F87171' },
  sharedCard: {
    backgroundColor: '#111827',
    borderRadius: 18,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sharedLeft: { flexDirection: 'row', alignItems: 'center' },
  sharedIcon: {
    width: 46,
    height: 46,
    borderRadius: 14,
    backgroundColor: '#1E293B',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  sharedIconText: { fontSize: 22 },
  sharedTitle: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' },
  sharedSubtitle: { color: '#64748B', fontSize: 12, marginTop: 3 },
  arrow: { color: '#64748B', fontSize: 30 },
  emptyCard: {
    backgroundColor: '#111827',
    borderRadius: 18,
    padding: 24,
    alignItems: 'center',
    gap: 6,
  },
  emptyIcon: { fontSize: 32, marginBottom: 10 },
  emptyTitle: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' },
  emptySubtitle: {
    color: '#64748B',
    fontSize: 13,
    textAlign: 'center',
    marginTop: 6,
  },
  movementsList: { gap: 10 },
  movementCard: {
    backgroundColor: '#111827',
    borderRadius: 16,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  movementLeft: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  movementIcon: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: '#1E293B',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  movementTextWrap: { flex: 1 },
  movementTitle: { color: '#FFFFFF', fontSize: 15, fontWeight: '700' },
  movementMeta: { color: '#64748B', fontSize: 11, marginTop: 4 },
  movementExpenseAmount: {
    color: '#F87171',
    fontSize: 14,
    fontWeight: '700',
    marginLeft: 10,
  },
  movementIncomeAmount: {
    color: '#4ADE80',
    fontSize: 14,
    fontWeight: '700',
    marginLeft: 10,
  },
  logoutButton: { marginTop: 28, padding: 16, alignItems: 'center' },
  logoutText: { color: '#94A3B8', fontWeight: '700' },
});
