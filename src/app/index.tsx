import { router, useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
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
    partnerBalance,
    refreshExpenses,
  } = useFinance();

  const [manualDebt, setManualDebt] = useState({ meDeben: 0, debo: 0 });

  useEffect(() => {
    if (!authLoading && !user) router.replace('/login');
  }, [authLoading, user]);

  const loadDebtSummary = useCallback(async () => {
    if (!user) return;

    const { data } = await supabase
      .from('debts')
      .select('direction, amount')
      .eq('status', 'pendiente');

    let meDeben = 0;
    let debo = 0;

    for (const row of data ?? []) {
      const amount = Number(row.amount);
      if (row.direction === 'me_deben') meDeben += amount;
      if (row.direction === 'debo') debo += amount;
    }

    setManualDebt({ meDeben, debo });
  }, [user]);

  useFocusEffect(
    useCallback(() => {
      refreshExpenses();
      loadDebtSummary();
    }, [refreshExpenses, loadDebtSummary])
  );

  if (authLoading || !user) {
    return (
      <SafeAreaView style={styles.loading}>
        <ActivityIndicator size="large" />
        <Text style={styles.loadingText}>Cargando MiFinanzas...</Text>
      </SafeAreaView>
    );
  }

  const displayName =
    user.user_metadata?.display_name || user.email?.split('@')[0] || 'Usuario';

  const totalMeDeben = manualDebt.meDeben + Math.max(partnerBalance, 0);
  const totalDebo = manualDebt.debo + Math.max(-partnerBalance, 0);

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <View style={styles.content}>
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

        <Text style={styles.question}>¿Qué espacio quieres abrir?</Text>
        <Text style={styles.helper}>
          Tus finanzas personales y las de pareja permanecen separadas.
        </Text>

        <TouchableOpacity
          style={[styles.spaceCard, styles.personalCard]}
          onPress={() => router.push('/mi-dinero')}
        >
          <View style={styles.spaceIcon}>
            <Text style={styles.spaceIconText}>👤</Text>
          </View>
          <View style={styles.spaceContent}>
            <Text style={styles.spaceTitle}>Mi dinero</Text>
            <Text style={styles.spaceSubtitle}>
              Ingresos, gastos personales y saldo solo para ti.
            </Text>
          </View>
          <Text style={styles.arrow}>›</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.spaceCard, styles.coupleCard]}
          onPress={() => router.push('/pareja')}
        >
          <View style={styles.spaceIcon}>
            <Text style={styles.spaceIconText}>👥</Text>
          </View>
          <View style={styles.spaceContent}>
            <Text style={styles.spaceTitle}>Pareja</Text>
            <Text style={styles.spaceSubtitle}>
              Gastos compartidos, quién pagó y balance entre ambos.
            </Text>
          </View>
          <Text style={styles.arrow}>›</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.debtCard} onPress={() => router.push('/deudas')}>
          <View>
            <Text style={styles.debtTitle}>🧾 Deudas</Text>
            <Text style={styles.debtSubtitle}>Personales + balance de pareja</Text>
          </View>
          <View style={styles.debtAmounts}>
            <Text style={styles.debtGreen}>Me deben S/ {totalMeDeben.toFixed(2)}</Text>
            <Text style={styles.debtRed}>Debo S/ {totalDebo.toFixed(2)}</Text>
          </View>
        </TouchableOpacity>

        <Text style={styles.privacy}>
          🔒 Lo personal no se comparte. En Pareja solo aparecen los movimientos marcados como compartidos.
        </Text>
      </View>

      <BottomNav active="inicio" />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0B1220' },
  loading: {
    flex: 1,
    backgroundColor: '#0B1220',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  loadingText: { color: '#94A3B8' },
  content: { flex: 1, padding: 20 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 34,
  },
  brand: { color: '#FFFFFF', fontSize: 24, fontWeight: '900' },
  hello: { color: '#64748B', fontSize: 12, marginTop: 3 },
  profileButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#1D4ED8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileButtonText: { color: '#FFFFFF', fontSize: 17, fontWeight: '900' },
  question: { color: '#FFFFFF', fontSize: 26, fontWeight: '900' },
  helper: { color: '#64748B', fontSize: 12, lineHeight: 18, marginTop: 6, marginBottom: 20 },
  spaceCard: {
    minHeight: 150,
    borderRadius: 23,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
    borderWidth: 1,
  },
  personalCard: { backgroundColor: '#1459C7', borderColor: '#3B82F6' },
  coupleCard: { backgroundColor: '#16243A', borderColor: '#2E4666' },
  spaceIcon: {
    width: 58,
    height: 58,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 15,
  },
  spaceIconText: { fontSize: 28 },
  spaceContent: { flex: 1 },
  spaceTitle: { color: '#FFFFFF', fontSize: 21, fontWeight: '900' },
  spaceSubtitle: { color: '#CBD5E1', fontSize: 11, lineHeight: 16, marginTop: 5 },
  arrow: { color: '#CBD5E1', fontSize: 34, marginLeft: 8 },
  debtCard: {
    backgroundColor: '#111827',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: '#1E293B',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  debtTitle: { color: '#FFFFFF', fontSize: 15, fontWeight: '900' },
  debtSubtitle: { color: '#64748B', fontSize: 10, marginTop: 3 },
  debtAmounts: { alignItems: 'flex-end', gap: 3 },
  debtGreen: { color: '#4ADE80', fontSize: 11, fontWeight: '800' },
  debtRed: { color: '#F87171', fontSize: 11, fontWeight: '800' },
  privacy: {
    color: '#64748B',
    fontSize: 10,
    lineHeight: 15,
    marginTop: 18,
    textAlign: 'center',
  },
});
