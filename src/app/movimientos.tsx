import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BottomNav } from '@/components/bottom-nav';
import { useFinance } from '@/context/finance-context';

type Filter = 'todos' | 'personal' | 'compartido';

function normalizeFilter(value: string | string[] | undefined): Filter {
  const selected = Array.isArray(value) ? value[0] : value;
  if (selected === 'personal' || selected === 'compartido') return selected;
  return 'todos';
}

export default function MovimientosScreen() {
  const {
    user,
    authLoading,
    expenses,
    incomes,
    categories,
    paymentMethods,
    refreshExpenses,
    refreshIncomes,
  } = useFinance();

  const params = useLocalSearchParams<{ filter?: string | string[] }>();
  const [filter, setFilter] = useState<Filter>(() => normalizeFilter(params.filter));
  const [search, setSearch] = useState('');

  useEffect(() => {
    if (!authLoading && !user) router.replace('/login');
  }, [authLoading, user]);

  useEffect(() => {
    setFilter(normalizeFilter(params.filter));
  }, [params.filter]);

  useFocusEffect(
    useCallback(() => {
      refreshExpenses();
      refreshIncomes();
    }, [refreshExpenses, refreshIncomes])
  );

  const movements = useMemo(() => {
    const query = search.trim().toLowerCase();

    const expenseMovements = expenses
      .filter((expense) => {
        if (filter === 'personal' && expense.type !== 'personal') return false;
        if (filter === 'compartido' && expense.type !== 'compartido') return false;
        if (query && !expense.description.toLowerCase().includes(query)) return false;
        return true;
      })
      .map((expense) => {
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
            expense.type === 'compartido' ? 'Compartido' : 'Personal',
          ].join(' · '),
        };
      });

    const incomeMovements =
      filter === 'compartido'
        ? []
        : incomes
            .filter((income) =>
              query ? income.description.toLowerCase().includes(query) : true
            )
            .map((income) => ({
              id: `income-${income.id}`,
              kind: 'income' as const,
              description: income.description,
              amount: income.amount,
              createdAt: income.createdAt,
              icon: '💰',
              meta: 'Ingreso personal',
            }));

    return [...expenseMovements, ...incomeMovements].sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }, [expenses, incomes, categories, paymentMethods, filter, search]);

  if (authLoading || !user) return null;

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <Text style={styles.title}>Movimientos</Text>
        <TouchableOpacity onPress={() => router.push('/nuevo-gasto')}>
          <Text style={styles.add}>＋</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.searchWrap}>
        <TextInput
          value={search}
          onChangeText={setSearch}
          placeholder="Buscar movimiento..."
          placeholderTextColor="#64748B"
          style={styles.search}
        />
      </View>

      <View style={styles.filters}>
        {[
          ['todos', 'Todos'],
          ['personal', 'Mi dinero'],
          ['compartido', 'Pareja'],
        ].map(([value, label]) => {
          const active = filter === value;
          return (
            <TouchableOpacity
              key={value}
              style={[styles.filterButton, active && styles.filterActive]}
              onPress={() => setFilter(value as Filter)}
            >
              <Text style={[styles.filterText, active && styles.filterTextActive]}>
                {label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <ScrollView
        style={styles.flex}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {movements.length === 0 ? (
          <View style={styles.empty}>
            <Text style={styles.emptyTitle}>No hay movimientos</Text>
            <Text style={styles.emptyText}>
              Prueba otro filtro o registra un nuevo movimiento.
            </Text>
          </View>
        ) : (
          <View style={styles.list}>
            {movements.map((movement) => (
              <View key={movement.id} style={styles.row}>
                <View style={styles.left}>
                  <View style={styles.iconBox}>
                    <Text style={styles.icon}>{movement.icon}</Text>
                  </View>
                  <View style={styles.textWrap}>
                    <Text style={styles.name} numberOfLines={1}>
                      {movement.description}
                    </Text>
                    <Text style={styles.meta} numberOfLines={1}>
                      {movement.meta}
                    </Text>
                    <Text style={styles.date}>
                      {new Date(movement.createdAt).toLocaleDateString('es-PE')}
                    </Text>
                  </View>
                </View>

                <Text
                  style={
                    movement.kind === 'income'
                      ? styles.incomeAmount
                      : styles.expenseAmount
                  }
                >
                  {movement.kind === 'income' ? '+' : '-'} S/ {movement.amount.toFixed(2)}
                </Text>
              </View>
            ))}
          </View>
        )}
      </ScrollView>

      <BottomNav active="movimientos" />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  container: { flex: 1, backgroundColor: '#0B1220' },
  header: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: { color: '#FFFFFF', fontSize: 28, fontWeight: '800' },
  add: { color: '#60A5FA', fontSize: 30, fontWeight: '500' },
  searchWrap: { paddingHorizontal: 20 },
  search: {
    backgroundColor: '#111827',
    color: '#FFFFFF',
    borderRadius: 14,
    paddingHorizontal: 15,
    paddingVertical: 13,
    fontSize: 14,
  },
  filters: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 20,
    marginTop: 12,
    marginBottom: 4,
  },
  filterButton: {
    flex: 1,
    backgroundColor: '#111827',
    borderRadius: 12,
    paddingVertical: 10,
    alignItems: 'center',
  },
  filterActive: { backgroundColor: '#1D4ED8' },
  filterText: { color: '#64748B', fontSize: 11, fontWeight: '700' },
  filterTextActive: { color: '#FFFFFF' },
  content: { padding: 20, paddingTop: 12, paddingBottom: 28 },
  list: { gap: 9 },
  row: {
    backgroundColor: '#111827',
    borderRadius: 15,
    padding: 13,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  left: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  iconBox: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: '#1E293B',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 11,
  },
  icon: { fontSize: 20 },
  textWrap: { flex: 1 },
  name: { color: '#FFFFFF', fontSize: 14, fontWeight: '700' },
  meta: { color: '#64748B', fontSize: 10, marginTop: 3 },
  date: { color: '#475569', fontSize: 9, marginTop: 2 },
  incomeAmount: { color: '#4ADE80', fontSize: 13, fontWeight: '800', marginLeft: 8 },
  expenseAmount: { color: '#F87171', fontSize: 13, fontWeight: '800', marginLeft: 8 },
  empty: {
    marginTop: 40,
    backgroundColor: '#111827',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
  },
  emptyTitle: { color: '#FFFFFF', fontSize: 16, fontWeight: '800' },
  emptyText: { color: '#64748B', fontSize: 12, marginTop: 5, textAlign: 'center' },
});
