import { router } from 'expo-router';
import { useEffect, useMemo } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BottomNav } from '@/components/bottom-nav';
import { useFinance } from '@/context/finance-context';

export default function EstadisticasScreen() {
  const {
    user,
    authLoading,
    expenses,
    incomes,
    categories,
    paymentMethods,
  } = useFinance();

  useEffect(() => {
    if (!authLoading && !user) router.replace('/login');
  }, [authLoading, user]);

  const stats = useMemo(() => {
    const now = new Date();
    const monthExpenses = expenses.filter((expense) => {
      const date = new Date(expense.createdAt);
      return (
        date.getFullYear() === now.getFullYear() &&
        date.getMonth() === now.getMonth()
      );
    });

    const monthIncomes = incomes.filter((income) => {
      const date = new Date(income.createdAt);
      return (
        date.getFullYear() === now.getFullYear() &&
        date.getMonth() === now.getMonth()
      );
    });

    const totalExpense = monthExpenses.reduce(
      (sum, item) => sum + (item.type === 'compartido' ? item.amount / 2 : item.amount),
      0
    );

    const totalIncome = monthIncomes.reduce((sum, item) => sum + item.amount, 0);

    const byCategory = new Map<string, number>();
    for (const expense of monthExpenses) {
      const amount = expense.type === 'compartido' ? expense.amount / 2 : expense.amount;
      byCategory.set(expense.category, (byCategory.get(expense.category) ?? 0) + amount);
    }

    const byPayment = new Map<string, { count: number; total: number }>();
    for (const expense of monthExpenses) {
      if (expense.paymentMethod === 'sin-especificar') continue;
      const current = byPayment.get(expense.paymentMethod) ?? { count: 0, total: 0 };
      current.count += 1;
      current.total += expense.amount;
      byPayment.set(expense.paymentMethod, current);
    }

    const categoriesOrdered = [...byCategory.entries()].sort((a, b) => b[1] - a[1]);
    const paymentsOrdered = [...byPayment.entries()].sort(
      (a, b) => b[1].count - a[1].count || b[1].total - a[1].total
    );

    return {
      totalExpense,
      totalIncome,
      balance: totalIncome - totalExpense,
      categoriesOrdered,
      paymentsOrdered,
    };
  }, [expenses, incomes]);

  if (authLoading || !user) return null;

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <ScrollView
        style={styles.flex}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.title}>Estadísticas</Text>
        <Text style={styles.subtitle}>Este mes</Text>

        <View style={styles.summaryCard}>
          <View style={styles.summaryRow}>
            <View>
              <Text style={styles.smallLabel}>Ingresos</Text>
              <Text style={styles.income}>S/ {stats.totalIncome.toFixed(2)}</Text>
            </View>
            <View style={styles.right}>
              <Text style={styles.smallLabel}>Gastos</Text>
              <Text style={styles.expense}>S/ {stats.totalExpense.toFixed(2)}</Text>
            </View>
          </View>
          <View style={styles.divider} />
          <View style={styles.summaryRow}>
            <Text style={styles.balanceLabel}>Balance</Text>
            <Text style={[styles.balance, stats.balance < 0 && styles.negative]}>
              S/ {stats.balance.toFixed(2)}
            </Text>
          </View>
        </View>

        <Text style={styles.sectionTitle}>Dónde gastas más</Text>
        <View style={styles.card}>
          {stats.categoriesOrdered.length === 0 ? (
            <Text style={styles.emptyText}>Aún no hay gastos este mes.</Text>
          ) : (
            stats.categoriesOrdered.slice(0, 5).map(([slug, amount], index) => {
              const category = categories.find((item) => item.slug === slug);
              const pct =
                stats.totalExpense > 0
                  ? Math.round((amount / stats.totalExpense) * 100)
                  : 0;

              return (
                <View
                  key={slug}
                  style={[
                    styles.statRow,
                    index < Math.min(stats.categoriesOrdered.length, 5) - 1 &&
                      styles.rowBorder,
                  ]}
                >
                  <View style={styles.statLeft}>
                    <Text style={styles.statIcon}>{category?.icon ?? '📦'}</Text>
                    <View>
                      <Text style={styles.statName}>{category?.name ?? slug}</Text>
                      <Text style={styles.statSub}>{pct}% del gasto del mes</Text>
                    </View>
                  </View>
                  <Text style={styles.statAmount}>S/ {amount.toFixed(2)}</Text>
                </View>
              );
            })
          )}
        </View>

        <Text style={styles.sectionTitle}>Cómo pagas</Text>
        <View style={styles.card}>
          {stats.paymentsOrdered.length === 0 ? (
            <Text style={styles.emptyText}>
              Registra métodos de pago para ver tus hábitos.
            </Text>
          ) : (
            stats.paymentsOrdered.slice(0, 5).map(([slug, values], index) => {
              const method = paymentMethods.find((item) => item.slug === slug);
              const totalCount = stats.paymentsOrdered.reduce(
                (sum, [, item]) => sum + item.count,
                0
              );
              const pct =
                totalCount > 0 ? Math.round((values.count / totalCount) * 100) : 0;

              return (
                <View
                  key={slug}
                  style={[
                    styles.statRow,
                    index < Math.min(stats.paymentsOrdered.length, 5) - 1 &&
                      styles.rowBorder,
                  ]}
                >
                  <View style={styles.statLeft}>
                    <Text style={styles.statIcon}>{method?.icon ?? '💳'}</Text>
                    <View>
                      <Text style={styles.statName}>{method?.name ?? slug}</Text>
                      <Text style={styles.statSub}>
                        {values.count} pagos · {pct}%
                      </Text>
                    </View>
                  </View>
                  <Text style={styles.statAmount}>S/ {values.total.toFixed(2)}</Text>
                </View>
              );
            })
          )}
        </View>
      </ScrollView>

      <BottomNav active="estadisticas" />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  container: { flex: 1, backgroundColor: '#0B1220' },
  content: { padding: 20, paddingBottom: 30 },
  title: { color: '#FFFFFF', fontSize: 28, fontWeight: '800' },
  subtitle: { color: '#64748B', fontSize: 13, marginTop: 4, marginBottom: 18 },
  summaryCard: { backgroundColor: '#111827', borderRadius: 18, padding: 18 },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  smallLabel: { color: '#64748B', fontSize: 11 },
  income: { color: '#22C55E', fontSize: 18, fontWeight: '800', marginTop: 4 },
  expense: { color: '#F87171', fontSize: 18, fontWeight: '800', marginTop: 4 },
  right: { alignItems: 'flex-end' },
  divider: { height: 1, backgroundColor: '#1E293B', marginVertical: 15 },
  balanceLabel: { color: '#CBD5E1', fontSize: 14, fontWeight: '700' },
  balance: { color: '#FFFFFF', fontSize: 20, fontWeight: '800' },
  negative: { color: '#F87171' },
  sectionTitle: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '800',
    marginTop: 24,
    marginBottom: 10,
  },
  card: { backgroundColor: '#111827', borderRadius: 17, paddingHorizontal: 14 },
  statRow: {
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  rowBorder: { borderBottomWidth: 1, borderBottomColor: '#1E293B' },
  statLeft: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  statIcon: { fontSize: 22, marginRight: 11 },
  statName: { color: '#FFFFFF', fontSize: 14, fontWeight: '700' },
  statSub: { color: '#64748B', fontSize: 10, marginTop: 2 },
  statAmount: { color: '#CBD5E1', fontSize: 13, fontWeight: '700', marginLeft: 10 },
  emptyText: { color: '#64748B', fontSize: 12, paddingVertical: 18, textAlign: 'center' },
});
