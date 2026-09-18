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

  const [debtSummary, setDebtSummary] = useState({ meDeben: 0, debo: 0 });

  useEffect(() => {
    if (!authLoading && !user) router.replace('/login');
  }, [authLoading, user]);

  const loadDebtSummary = useCallback(async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from('debts')
      .select('direction, amount')
      .eq('status', 'pendiente');

    if (error) {
      console.warn('No se pudo cargar el resumen de deudas:', error.message);
      return;
    }

    let meDeben = 0;
    let debo = 0;

    for (const row of data ?? []) {
      const amount = Number(row.amount);
      if (row.direction === 'me_deben') meDeben += amount;
      if (row.direction === 'debo') debo += amount;
    }

    setDebtSummary({ meDeben, debo });
  }, [user]);

  useFocusEffect(
    useCallback(() => {
      loadDebtSummary();
    }, [loadDebtSummary])
  );

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

        <Text style={styles.sectionMiniTitle}>¿Qué quieres ver?</Text>

        <View style={styles.modeRow}>
          <TouchableOpacity
            style={[styles.modeCard, styles.myMoneyCard]}
            onPress={() => router.push('/movimientos?filter=personal' as any)}
          >
            <View style={styles.modeIcon}>
              <Text style={styles.modeIconText}>👤</Text>
            </View>
            <Text style={styles.modeTitle}>Mi dinero</Text>
            <Text style={styles.modeSubtitle}>Tus finanzas, solo tuyas</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.modeCard, styles.partnerCard]}
            onPress={() => router.push('/pareja')}
          >
            <View style={styles.modeIcon}>
              <Text style={styles.modeIconText}>👥</Text>
            </View>
            <Text style={styles.modeTitle}>Pareja</Text>
            <Text style={styles.modeSubtitle}>Gastos y saldo compartido</Text>
          </TouchableOpacity>
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

        <TouchableOpacity style={styles.debtCard} onPress={() => router.push('/deudas')}>
          <View style={styles.debtHeader}>
            <View>
              <Text style={styles.debtTitle}>🧾 Deudas</Text>
              <Text style={styles.debtSubtitle}>Mantén claro quién debe a quién</Text>
            </View>
            <Text style={styles.debtArrow}>›</Text>
          </View>

          <View style={styles.debtTotals}>
            <View>
              <Text style={styles.debtLabel}>Me deben</Text>
              <Text style={styles.debtGreen}>S/ {debtSummary.meDeben.toFixed(2)}</Text>
            </View>
            <View style={styles.debtRight}>
              <Text style={styles.debtLabel}>Debo</Text>
              <Text style={styles.debtRed}>S/ {debtSummary.debo.toFixed(2)}</Text>
            </View>
          </View>
        </TouchableOpacity>

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
  sectionMiniTitle: {
    color: '#94A3B8',
    fontSize: 12,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.7,
    marginTop: 22,
    marginBottom: 10,
  },
  modeRow: { flexDirection: 'row', gap: 12 },
  modeCard: {
    flex: 1,
    minHeight: 150,
    borderRadius: 20,
    padding: 16,
    justifyContent: 'flex-end',
  },
  myMoneyCard: {
    backgroundColor: '#1463D8',
    borderWidth: 1,
    borderColor: '#3B82F6',
  },
  partnerCard: {
    backgroundColor: '#16243A',
    borderWidth: 1,
    borderColor: '#29405F',
  },
  modeIcon: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 15,
  },
  modeIconText: { fontSize: 21 },
  modeTitle: { color: '#FFFFFF', fontSize: 18, fontWeight: '900' },
  modeSubtitle: { color: '#CBD5E1', fontSize: 10, marginTop: 4, lineHeight: 14 },
  actionsRow: { flexDirection: 'row', gap: 12, marginTop: 14 },
  actionButton: {
    flex: 1,
    minHeight: 72,
    borderRadius: 18,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  expenseButton: { backgroundColor: '#3A1720' },
  incomeButton: { backgroundColor: '#123323' },
  actionSign: { color: '#FFFFFF', fontSize: 26, fontWeight: '800' },
  actionTitle: { color: '#FFFFFF', fontSize: 15, fontWeight: '800' },
  actionSubtitle: { color: '#94A3B8', fontSize: 10, marginTop: 2 },
  debtCard: {
    marginTop: 14,
    backgroundColor: '#111827',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: '#1E293B',
  },
  debtHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  debtTitle: { color: '#FFFFFF', fontSize: 15, fontWeight: '900' },
  debtSubtitle: { color: '#64748B', fontSize: 10, marginTop: 3 },
  debtArrow: { color: '#64748B', fontSize: 27 },
  debtTotals: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 14,
    paddingTop: 13,
    borderTopWidth: 1,
    borderTopColor: '#1E293B',
  },
  debtRight: { alignItems: 'flex-end' },
  debtLabel: { color: '#64748B', fontSize: 10 },
  debtGreen: { color: '#4ADE80', fontSize: 15, fontWeight: '900', marginTop: 3 },
  debtRed: { color: '#F87171', fontSize: 15, fontWeight: '900', marginTop: 3 },
  sharedCard: {
    marginTop: 14,
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
