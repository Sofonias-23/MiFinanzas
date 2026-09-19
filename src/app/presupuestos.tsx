import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert,
  Animated,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useFinance } from '@/context/finance-context';
import { supabase } from '@/lib/supabase';

type BudgetScope = 'personal' | 'pareja';

type Budget = {
  id: string;
  scope: BudgetScope;
  user_id: string | null;
  household_id: string | null;
  category: string;
  amount: number;
  month: string;
};

type PartnerStatus = {
  household_id: string | null;
  member_count: number;
};

function currentMonthKey() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}-01`;
}

function isCurrentMonth(dateValue: string) {
  const date = new Date(dateValue);
  const now = new Date();
  return (
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth()
  );
}

function BudgetProgress({ value, tone }: { value: number; tone: 'ok' | 'warn' | 'danger' }) {
  const animated = useRef(new Animated.Value(0)).current;
  const capped = Math.min(Math.max(value, 0), 100);

  useEffect(() => {
    Animated.timing(animated, {
      toValue: capped,
      duration: 520,
      useNativeDriver: false,
    }).start();
  }, [animated, capped]);

  const width = animated.interpolate({
    inputRange: [0, 100],
    outputRange: ['0%', '100%'],
  });

  return (
    <View style={styles.progressTrack}>
      <Animated.View
        style={[
          styles.progressFill,
          tone === 'warn' && styles.progressWarn,
          tone === 'danger' && styles.progressDanger,
          { width },
        ]}
      />
    </View>
  );
}

export default function PresupuestosScreen() {
  const params = useLocalSearchParams<{ scope?: string }>();
  const {
    user,
    authLoading,
    expenses,
    categories,
    refreshExpenses,
  } = useFinance();

  const [scope, setScope] = useState<BudgetScope>(
    params.scope === 'pareja' ? 'pareja' : 'personal'
  );
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [householdId, setHouseholdId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [category, setCategory] = useState('');
  const [amount, setAmount] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) router.replace('/login');
  }, [authLoading, user]);

  useEffect(() => {
    if (params.scope === 'pareja' || params.scope === 'personal') {
      setScope(params.scope);
    }
  }, [params.scope]);

  useEffect(() => {
    if (!category && categories.length > 0) {
      setCategory(categories[0].slug);
    }
  }, [categories, category]);

  const loadPartner = useCallback(async () => {
    if (!user) return;

    const { data } = await supabase.rpc('get_partner_status');
    const status = (data?.[0] ?? null) as PartnerStatus | null;
    setHouseholdId(
      status && status.member_count >= 2 ? status.household_id : null
    );
  }, [user]);

  const loadBudgets = useCallback(async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from('budgets')
      .select('id, scope, user_id, household_id, category, amount, month')
      .eq('month', currentMonthKey())
      .order('created_at', { ascending: true });

    if (error) {
      Alert.alert('No se pudieron cargar los presupuestos', error.message);
      return;
    }

    setBudgets(
      (data ?? []).map((row: any) => ({
        ...row,
        amount: Number(row.amount),
      }))
    );
  }, [user]);

  useFocusEffect(
    useCallback(() => {
      loadPartner();
      loadBudgets();
      refreshExpenses();
    }, [loadPartner, loadBudgets, refreshExpenses])
  );

  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel(`budgets-${user.id}`)
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

  const visibleBudgets = useMemo(
    () => budgets.filter((budget) => budget.scope === scope),
    [budgets, scope]
  );

  const spentByCategory = useMemo(() => {
    const result: Record<string, number> = {};

    for (const expense of expenses) {
      if (!isCurrentMonth(expense.createdAt)) continue;

      if (scope === 'personal' && expense.type !== 'personal') continue;
      if (scope === 'pareja' && expense.type !== 'compartido') continue;

      result[expense.category] =
        (result[expense.category] ?? 0) + expense.amount;
    }

    return result;
  }, [expenses, scope]);

  const totalBudget = useMemo(
    () => visibleBudgets.reduce((total, item) => total + item.amount, 0),
    [visibleBudgets]
  );

  const totalSpent = useMemo(
    () =>
      visibleBudgets.reduce(
        (total, item) => total + (spentByCategory[item.category] ?? 0),
        0
      ),
    [visibleBudgets, spentByCategory]
  );

  const overallPercent = totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0;

  const monthLabel = new Intl.DateTimeFormat('es-PE', {
    month: 'long',
    year: 'numeric',
  }).format(new Date());

  const resetForm = () => {
    setEditingId(null);
    setAmount('');
    setCategory(categories[0]?.slug ?? '');
    setShowForm(false);
  };

  const startEdit = (budget: Budget) => {
    setEditingId(budget.id);
    setCategory(budget.category);
    setAmount(budget.amount.toFixed(2));
    setShowForm(true);
  };

  const saveBudget = async () => {
    if (!user) return;

    const parsedAmount = Number(amount.replace(',', '.'));

    if (!category) {
      Alert.alert('Falta la categoría', 'Selecciona una categoría.');
      return;
    }

    if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
      Alert.alert('Monto inválido', 'Escribe un presupuesto mayor a cero.');
      return;
    }

    if (scope === 'pareja' && !householdId) {
      Alert.alert(
        'Pareja no vinculada',
        'Primero vincula a tu pareja para crear un presupuesto compartido.'
      );
      return;
    }

    const duplicate = visibleBudgets.find(
      (item) => item.category === category && item.id !== editingId
    );

    if (duplicate) {
      Alert.alert(
        'Ya existe',
        'Ya tienes un presupuesto para esta categoría este mes. Puedes editarlo.'
      );
      return;
    }

    try {
      setBusy(true);

      if (editingId) {
        const { error } = await supabase
          .from('budgets')
          .update({
            category,
            amount: parsedAmount,
            updated_at: new Date().toISOString(),
          })
          .eq('id', editingId);

        if (error) throw error;
      } else if (scope === 'personal') {
        const { error } = await supabase.from('budgets').insert({
          scope: 'personal',
          user_id: user.id,
          household_id: null,
          category,
          amount: parsedAmount,
          month: currentMonthKey(),
          created_by: user.id,
        });

        if (error) throw error;
      } else {
        if (!householdId) {
          throw new Error('Primero vincula a tu pareja.');
        }

        const { error } = await supabase.from('budgets').insert({
          scope: 'pareja',
          user_id: null,
          household_id: householdId,
          category,
          amount: parsedAmount,
          month: currentMonthKey(),
          created_by: user.id,
        });

        if (error) throw error;
      }

      await loadBudgets();
      resetForm();
    } catch (error: any) {
      Alert.alert(
        'No se pudo guardar',
        error?.message ?? 'Inténtalo nuevamente.'
      );
    } finally {
      setBusy(false);
    }
  };

  const deleteBudget = (budget: Budget) => {
    Alert.alert(
      'Eliminar presupuesto',
      'Se eliminará solo el límite configurado. Tus gastos no se borrarán.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            const { error } = await supabase
              .from('budgets')
              .delete()
              .eq('id', budget.id);

            if (error) {
              Alert.alert('No se pudo eliminar', error.message);
              return;
            }

            await loadBudgets();
          },
        },
      ]
    );
  };

  if (authLoading || !user) return null;

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Text style={styles.back}>‹ Volver</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.addButton}
            onPress={() => {
              if (showForm) {
                resetForm();
              } else {
                setShowForm(true);
              }
            }}
          >
            <Text style={styles.addButtonText}>
              {showForm ? 'Cerrar' : '＋ Nuevo'}
            </Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.title}>Presupuestos</Text>
        <Text style={styles.subtitle}>
          Controla cuánto quieres gastar durante {monthLabel}.
        </Text>

        <View style={styles.tabs}>
          <TouchableOpacity
            style={[styles.tab, scope === 'personal' && styles.tabPersonal]}
            onPress={() => {
              setScope('personal');
              resetForm();
            }}
          >
            <Text style={[styles.tabText, scope === 'personal' && styles.tabTextActive]}>
              👤 Mi dinero
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tab, scope === 'pareja' && styles.tabPartner]}
            onPress={() => {
              setScope('pareja');
              resetForm();
            }}
          >
            <Text style={[styles.tabText, scope === 'pareja' && styles.tabTextActive]}>
              👥 Pareja
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.summaryCard}>
          <Text style={styles.summaryLabel}>
            Presupuesto {scope === 'personal' ? 'personal' : 'de pareja'}
          </Text>
          <View style={styles.summaryAmounts}>
            <Text style={styles.summarySpent}>S/ {totalSpent.toFixed(2)}</Text>
            <Text style={styles.summaryBudget}>de S/ {totalBudget.toFixed(2)}</Text>
          </View>
          <BudgetProgress
            value={overallPercent}
            tone={
              overallPercent >= 100
                ? 'danger'
                : overallPercent >= 75
                ? 'warn'
                : 'ok'
            }
          />
          <Text style={styles.summaryPercent}>
            {totalBudget > 0
              ? `${Math.round(overallPercent)}% utilizado`
              : 'Configura tu primer límite'}
          </Text>
        </View>

        {scope === 'pareja' && !householdId ? (
          <View style={styles.noticeCard}>
            <Text style={styles.noticeTitle}>Primero vincula a tu pareja</Text>
            <Text style={styles.noticeText}>
              Los presupuestos compartidos son visibles y editables por ambos.
            </Text>
            <TouchableOpacity onPress={() => router.push('/pareja')}>
              <Text style={styles.noticeLink}>Ir a Pareja →</Text>
            </TouchableOpacity>
          </View>
        ) : null}

        {showForm ? (
          <View style={styles.formCard}>
            <Text style={styles.formTitle}>
              {editingId ? 'Editar presupuesto' : 'Nuevo presupuesto'}
            </Text>

            <Text style={styles.formLabel}>Categoría</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.chips}
            >
              {categories.map((item) => {
                const active = category === item.slug;
                return (
                  <TouchableOpacity
                    key={item.id}
                    style={[styles.chip, active && styles.chipActive]}
                    onPress={() => setCategory(item.slug)}
                  >
                    <Text style={styles.chipIcon}>{item.icon}</Text>
                    <Text style={[styles.chipText, active && styles.chipTextActive]}>
                      {item.name}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            <Text style={styles.formLabel}>Límite mensual</Text>
            <TextInput
              value={amount}
              onChangeText={setAmount}
              placeholder="S/ 0.00"
              placeholderTextColor="#475569"
              keyboardType="decimal-pad"
              style={styles.amountInput}
            />

            <TouchableOpacity
              style={[styles.saveButton, busy && styles.disabled]}
              onPress={saveBudget}
              disabled={busy}
            >
              <Text style={styles.saveText}>
                {busy ? 'Guardando...' : editingId ? 'Guardar cambios' : 'Crear presupuesto'}
              </Text>
            </TouchableOpacity>
          </View>
        ) : null}

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Categorías</Text>
          <Text style={styles.sectionCount}>{visibleBudgets.length}</Text>
        </View>

        {visibleBudgets.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyIcon}>📊</Text>
            <Text style={styles.emptyTitle}>Sin presupuestos todavía</Text>
            <Text style={styles.emptyText}>
              Crea límites para Comida, Transporte, Ocio u otras categorías.
            </Text>
          </View>
        ) : (
          <View style={styles.list}>
            {visibleBudgets.map((budget) => {
              const spent = spentByCategory[budget.category] ?? 0;
              const percent = budget.amount > 0 ? (spent / budget.amount) * 100 : 0;
              const categoryInfo = categories.find(
                (item) => item.slug === budget.category
              );
              const tone =
                percent >= 100 ? 'danger' : percent >= 75 ? 'warn' : 'ok';

              return (
                <View key={budget.id} style={styles.budgetCard}>
                  <View style={styles.budgetTop}>
                    <View style={styles.budgetIdentity}>
                      <View style={styles.categoryIcon}>
                        <Text style={styles.categoryIconText}>
                          {categoryInfo?.icon ?? '📦'}
                        </Text>
                      </View>
                      <View style={styles.budgetText}>
                        <Text style={styles.budgetTitle}>
                          {categoryInfo?.name ?? budget.category}
                        </Text>
                        <Text
                          style={[
                            styles.statusText,
                            tone === 'warn' && styles.statusWarn,
                            tone === 'danger' && styles.statusDanger,
                          ]}
                        >
                          {tone === 'danger'
                            ? 'Límite superado'
                            : tone === 'warn'
                            ? 'Atención: ya superaste 75%'
                            : 'Dentro del presupuesto'}
                        </Text>
                      </View>
                    </View>

                    <Text style={styles.budgetAmounts}>
                      S/ {spent.toFixed(2)} / S/ {budget.amount.toFixed(2)}
                    </Text>
                  </View>

                  <BudgetProgress value={percent} tone={tone} />

                  <View style={styles.cardFooter}>
                    <Text style={styles.percentText}>
                      {Math.round(percent)}%
                    </Text>
                    <View style={styles.cardActions}>
                      <TouchableOpacity onPress={() => startEdit(budget)}>
                        <Text style={styles.editText}>Editar</Text>
                      </TouchableOpacity>
                      <TouchableOpacity onPress={() => deleteBudget(budget)}>
                        <Text style={styles.deleteText}>Eliminar</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              );
            })}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#07111F' },
  content: { padding: 20, paddingBottom: 42 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  back: { color: '#60A5FA', fontSize: 15, fontWeight: '800' },
  addButton: {
    backgroundColor: '#1D4ED8',
    borderRadius: 13,
    paddingHorizontal: 13,
    paddingVertical: 9,
  },
  addButtonText: { color: '#FFFFFF', fontSize: 11, fontWeight: '900' },
  title: { color: '#FFFFFF', fontSize: 30, fontWeight: '900', marginTop: 20 },
  subtitle: {
    color: '#64748B',
    fontSize: 12,
    lineHeight: 18,
    marginTop: 5,
    textTransform: 'capitalize',
  },
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
  summaryCard: {
    backgroundColor: '#0E1A2A',
    borderRadius: 20,
    padding: 18,
    marginTop: 16,
    borderWidth: 1,
    borderColor: '#1B2B40',
  },
  summaryLabel: { color: '#94A3B8', fontSize: 11, fontWeight: '800' },
  summaryAmounts: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 5,
    marginTop: 5,
    marginBottom: 14,
  },
  summarySpent: { color: '#FFFFFF', fontSize: 27, fontWeight: '900' },
  summaryBudget: { color: '#64748B', fontSize: 11 },
  summaryPercent: { color: '#94A3B8', fontSize: 10, marginTop: 8 },
  progressTrack: {
    height: 9,
    backgroundColor: '#16263A',
    borderRadius: 7,
    overflow: 'hidden',
  },
  progressFill: {
    height: 9,
    borderRadius: 7,
    backgroundColor: '#3B82F6',
  },
  progressWarn: { backgroundColor: '#F59E0B' },
  progressDanger: { backgroundColor: '#EF4444' },
  noticeCard: {
    backgroundColor: '#26192B',
    borderRadius: 17,
    padding: 16,
    marginTop: 14,
    borderWidth: 1,
    borderColor: '#4C2649',
  },
  noticeTitle: { color: '#FFFFFF', fontSize: 14, fontWeight: '900' },
  noticeText: { color: '#94A3B8', fontSize: 10, lineHeight: 15, marginTop: 4 },
  noticeLink: { color: '#F472B6', fontSize: 11, fontWeight: '900', marginTop: 10 },
  formCard: {
    backgroundColor: '#0E1A2A',
    borderRadius: 20,
    padding: 17,
    marginTop: 16,
    borderWidth: 1,
    borderColor: '#1B2B40',
  },
  formTitle: { color: '#FFFFFF', fontSize: 17, fontWeight: '900' },
  formLabel: {
    color: '#94A3B8',
    fontSize: 11,
    fontWeight: '800',
    marginTop: 15,
    marginBottom: 8,
  },
  chips: { gap: 8, paddingRight: 16 },
  chip: {
    minHeight: 42,
    backgroundColor: '#07111F',
    borderRadius: 13,
    borderWidth: 1,
    borderColor: '#1B2B40',
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  chipActive: { backgroundColor: '#132E5B', borderColor: '#3B82F6' },
  chipIcon: { fontSize: 16 },
  chipText: { color: '#94A3B8', fontSize: 11, fontWeight: '800' },
  chipTextActive: { color: '#FFFFFF' },
  amountInput: {
    backgroundColor: '#07111F',
    color: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#20334B',
    padding: 15,
    fontSize: 23,
    fontWeight: '900',
  },
  saveButton: {
    backgroundColor: '#1677FF',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 15,
  },
  saveText: { color: '#FFFFFF', fontSize: 13, fontWeight: '900' },
  disabled: { opacity: 0.5 },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 24,
    marginBottom: 10,
  },
  sectionTitle: { color: '#FFFFFF', fontSize: 16, fontWeight: '900' },
  sectionCount: { color: '#64748B', fontSize: 11, fontWeight: '800' },
  emptyCard: {
    backgroundColor: '#0E1A2A',
    borderRadius: 18,
    padding: 25,
    alignItems: 'center',
  },
  emptyIcon: { fontSize: 31 },
  emptyTitle: { color: '#FFFFFF', fontSize: 15, fontWeight: '900', marginTop: 9 },
  emptyText: {
    color: '#64748B',
    fontSize: 10,
    lineHeight: 15,
    textAlign: 'center',
    marginTop: 5,
  },
  list: { gap: 10 },
  budgetCard: {
    backgroundColor: '#0E1A2A',
    borderRadius: 18,
    padding: 15,
    borderWidth: 1,
    borderColor: '#1B2B40',
  },
  budgetTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  budgetIdentity: { flex: 1, flexDirection: 'row', alignItems: 'center' },
  categoryIcon: {
    width: 42,
    height: 42,
    borderRadius: 13,
    backgroundColor: '#16263A',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  categoryIconText: { fontSize: 19 },
  budgetText: { flex: 1 },
  budgetTitle: { color: '#FFFFFF', fontSize: 14, fontWeight: '900' },
  statusText: { color: '#60A5FA', fontSize: 9, marginTop: 3 },
  statusWarn: { color: '#F59E0B' },
  statusDanger: { color: '#F87171' },
  budgetAmounts: { color: '#CBD5E1', fontSize: 11, fontWeight: '900', marginLeft: 10 },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  percentText: { color: '#64748B', fontSize: 10, fontWeight: '800' },
  cardActions: { flexDirection: 'row', gap: 14 },
  editText: { color: '#60A5FA', fontSize: 10, fontWeight: '900' },
  deleteText: { color: '#F87171', fontSize: 10, fontWeight: '900' },
});
