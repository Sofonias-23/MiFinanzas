import { router, useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert,
  Animated,
  KeyboardAvoidingView,
  Platform,
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

type PartnerStatus = {
  partner_name: string | null;
  member_count: number;
};

export default function SaldarDeudaScreen() {
  const {
    user,
    authLoading,
    partnerBalance,
    paymentMethods,
    refreshSettlements,
  } = useFinance();

  const enter = useRef(new Animated.Value(0)).current;
  const [partnerName, setPartnerName] = useState('tu pareja');
  const [amount, setAmount] = useState('');
  const [method, setMethod] = useState('yape');
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    Animated.timing(enter, {
      toValue: 1,
      duration: 240,
      useNativeDriver: true,
    }).start();
  }, [enter]);

  useEffect(() => {
    if (!authLoading && !user) router.replace('/login');
  }, [authLoading, user]);

  const loadPartner = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase.rpc('get_partner_status');
    const status = (data?.[0] ?? null) as PartnerStatus | null;
    if (status?.member_count && status.member_count >= 2) {
      setPartnerName(status.partner_name || 'tu pareja');
    }
  }, [user]);

  useFocusEffect(
    useCallback(() => {
      loadPartner();
      refreshSettlements();
    }, [loadPartner, refreshSettlements])
  );

  useEffect(() => {
    if (!amount && Math.abs(partnerBalance) >= 0.01) {
      setAmount(Math.abs(partnerBalance).toFixed(2));
    }
  }, [partnerBalance, amount]);

  const usefulMethods = useMemo(() => {
    const preferred = ['yape', 'plin', 'transferencia', 'efectivo'];
    const found = preferred
      .map((slug) => paymentMethods.find((item) => item.slug === slug))
      .filter(Boolean) as typeof paymentMethods;

    return found.length > 0 ? found : paymentMethods.slice(0, 4);
  }, [paymentMethods]);

  useEffect(() => {
    if (
      usefulMethods.length > 0 &&
      !usefulMethods.some((item) => item.slug === method)
    ) {
      setMethod(usefulMethods[0].slug);
    }
  }, [usefulMethods, method]);

  const parsedAmount = Number(amount.replace(',', '.'));
  const maxAmount = Math.abs(partnerBalance);
  const validAmount =
    Number.isFinite(parsedAmount) &&
    parsedAmount > 0 &&
    parsedAmount <= maxAmount + 0.001;

  const actionText =
    partnerBalance < -0.005
      ? `Pagar a ${partnerName}`
      : partnerBalance > 0.005
      ? `Registrar pago de ${partnerName}`
      : 'Están al día';

  const save = async () => {
    if (!validAmount) {
      Alert.alert(
        'Monto inválido',
        `El monto debe ser mayor a cero y no superar S/ ${maxAmount.toFixed(2)}.`
      );
      return;
    }

    try {
      setSaving(true);

      const { error } = await supabase.rpc('record_partner_settlement', {
        p_amount: parsedAmount,
        p_payment_method: method,
        p_note: note.trim() || null,
      });

      if (error) throw error;

      await refreshSettlements();

      Alert.alert(
        parsedAmount >= maxAmount - 0.005 ? 'Deuda saldada' : 'Pago registrado',
        parsedAmount >= maxAmount - 0.005
          ? 'El balance entre ustedes quedó en cero.'
          : 'El pago se descontó del balance pendiente.',
        [{ text: 'OK', onPress: () => router.back() }]
      );
    } catch (error: any) {
      Alert.alert(
        'No se pudo registrar',
        error?.message ?? 'Inténtalo nuevamente.'
      );
    } finally {
      setSaving(false);
    }
  };

  if (authLoading || !user) return null;

  const settled = Math.abs(partnerBalance) < 0.01;

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <Animated.View
          style={[
            styles.flex,
            {
              opacity: enter,
              transform: [
                {
                  translateY: enter.interpolate({
                    inputRange: [0, 1],
                    outputRange: [14, 0],
                  }),
                },
              ],
            },
          ]}
        >
          <ScrollView
            contentContainerStyle={styles.content}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <TouchableOpacity onPress={() => router.back()}>
              <Text style={styles.back}>‹ Volver</Text>
            </TouchableOpacity>

            <Text style={styles.title}>Saldar deuda</Text>
            <Text style={styles.subtitle}>
              Registrar un pago reduce el balance, pero no crea un gasto nuevo.
            </Text>

            <View style={[styles.balanceCard, settled && styles.balanceSettled]}>
              <Text style={styles.balanceLabel}>Balance actual</Text>
              <Text style={styles.balanceTitle}>
                {settled
                  ? 'Están al día'
                  : partnerBalance < 0
                  ? `Debes a ${partnerName}`
                  : `${partnerName} te debe`}
              </Text>
              <Text style={[styles.balanceAmount, settled && styles.balanceGreen]}>
                S/ {Math.abs(partnerBalance).toFixed(2)}
              </Text>
            </View>

            {!settled ? (
              <>
                <Text style={styles.step}>1 · ¿Cuánto se pagará?</Text>
                <TextInput
                  value={amount}
                  onChangeText={setAmount}
                  keyboardType="decimal-pad"
                  placeholder="S/ 0.00"
                  placeholderTextColor="#64748B"
                  style={styles.amountInput}
                />

                <TouchableOpacity
                  onPress={() => setAmount(maxAmount.toFixed(2))}
                  style={styles.fullButton}
                >
                  <Text style={styles.fullButtonText}>
                    Usar saldo completo · S/ {maxAmount.toFixed(2)}
                  </Text>
                </TouchableOpacity>

                <Text style={styles.step}>2 · ¿Cómo se pagó?</Text>
                <View style={styles.methods}>
                  {usefulMethods.map((item) => {
                    const active = method === item.slug;
                    return (
                      <TouchableOpacity
                        key={item.id}
                        style={[styles.method, active && styles.methodActive]}
                        onPress={() => setMethod(item.slug)}
                      >
                        <Text style={styles.methodIcon}>{item.icon}</Text>
                        <Text style={[styles.methodText, active && styles.methodTextActive]}>
                          {item.name}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>

                <Text style={styles.step}>3 · Nota opcional</Text>
                <TextInput
                  value={note}
                  onChangeText={setNote}
                  placeholder="Ej. Pago por Yape"
                  placeholderTextColor="#64748B"
                  style={styles.noteInput}
                />

                <TouchableOpacity
                  style={[styles.saveButton, (!validAmount || saving) && styles.disabled]}
                  onPress={save}
                  disabled={!validAmount || saving}
                >
                  <Text style={styles.saveText}>
                    {saving ? 'Registrando...' : actionText}
                  </Text>
                </TouchableOpacity>
              </>
            ) : (
              <View style={styles.doneCard}>
                <Text style={styles.doneIcon}>✓</Text>
                <Text style={styles.doneTitle}>No tienen pagos pendientes</Text>
                <Text style={styles.doneText}>
                  Los nuevos gastos compartidos actualizarán el balance automáticamente.
                </Text>
              </View>
            )}
          </ScrollView>
        </Animated.View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  container: { flex: 1, backgroundColor: '#07111F' },
  content: { padding: 20, paddingBottom: 40 },
  back: { color: '#60A5FA', fontSize: 16, fontWeight: '800' },
  title: { color: '#FFFFFF', fontSize: 30, fontWeight: '900', marginTop: 22 },
  subtitle: {
    color: '#64748B',
    fontSize: 12,
    lineHeight: 18,
    marginTop: 5,
    marginBottom: 20,
  },
  balanceCard: {
    backgroundColor: '#32171D',
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: '#5A232D',
  },
  balanceSettled: { backgroundColor: '#102B26', borderColor: '#1E4A3D' },
  balanceLabel: { color: '#94A3B8', fontSize: 11, fontWeight: '800' },
  balanceTitle: { color: '#FFFFFF', fontSize: 18, fontWeight: '900', marginTop: 6 },
  balanceAmount: { color: '#F87171', fontSize: 34, fontWeight: '900', marginTop: 4 },
  balanceGreen: { color: '#4ADE80' },
  step: { color: '#CBD5E1', fontSize: 13, fontWeight: '900', marginTop: 22, marginBottom: 8 },
  amountInput: {
    backgroundColor: '#0E1A2A',
    color: '#FFFFFF',
    borderRadius: 17,
    padding: 18,
    fontSize: 28,
    fontWeight: '900',
    borderWidth: 1,
    borderColor: '#1B2B40',
  },
  fullButton: { alignSelf: 'flex-start', marginTop: 9 },
  fullButtonText: { color: '#60A5FA', fontSize: 11, fontWeight: '800' },
  methods: { flexDirection: 'row', flexWrap: 'wrap', gap: 9 },
  method: {
    minWidth: '47%',
    flexGrow: 1,
    backgroundColor: '#0E1A2A',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#1B2B40',
    padding: 13,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  methodActive: { backgroundColor: '#132E5B', borderColor: '#3B82F6' },
  methodIcon: { fontSize: 18 },
  methodText: { color: '#94A3B8', fontSize: 12, fontWeight: '800' },
  methodTextActive: { color: '#FFFFFF' },
  noteInput: {
    backgroundColor: '#0E1A2A',
    color: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#1B2B40',
    padding: 14,
  },
  saveButton: {
    backgroundColor: '#F43F75',
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 26,
  },
  saveText: { color: '#FFFFFF', fontSize: 15, fontWeight: '900' },
  disabled: { opacity: 0.45 },
  doneCard: {
    marginTop: 18,
    backgroundColor: '#111827',
    borderRadius: 18,
    padding: 24,
    alignItems: 'center',
  },
  doneIcon: {
    color: '#4ADE80',
    fontSize: 34,
    fontWeight: '900',
  },
  doneTitle: { color: '#FFFFFF', fontSize: 16, fontWeight: '900', marginTop: 8 },
  doneText: { color: '#64748B', fontSize: 11, lineHeight: 16, textAlign: 'center', marginTop: 5 },
});
