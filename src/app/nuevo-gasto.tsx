import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import {
  Alert,
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

import { ExpenseCategory, useFinance } from '@/context/finance-context';
import { supabase } from '@/lib/supabase';

type PartnerStatus = {
  household_id: string | null;
  partner_name: string | null;
  member_count: number;
};

export default function NuevoGastoScreen() {
  const {
    user,
    authLoading,
    addExpense,
    categories,
    loadingCategories,
    paymentMethods,
    loadingPaymentMethods,
  } = useFinance();

  const params = useLocalSearchParams<{ type?: string }>();

  const [monto, setMonto] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [tipo, setTipo] = useState<'personal' | 'compartido'>(
    params.type === 'compartido' ? 'compartido' : 'personal'
  );
  const [categoria, setCategoria] = useState<ExpenseCategory>('');
  const [metodoPago, setMetodoPago] = useState('');
  const [saving, setSaving] = useState(false);
  const [partnerName, setPartnerName] = useState('Mi pareja');
  const [partnerId, setPartnerId] = useState<string | null>(null);
  const [payerId, setPayerId] = useState<string>('');

  useEffect(() => {
    if (!authLoading && !user) router.replace('/login');
  }, [authLoading, user]);

  useEffect(() => {
    if (user && !payerId) setPayerId(user.id);
  }, [user, payerId]);

  useEffect(() => {
    if (params.type === 'compartido') setTipo('compartido');
  }, [params.type]);

  const loadPartner = useCallback(async () => {
    if (!user) return;

    const { data, error } = await supabase.rpc('get_partner_status');
    if (error) return;

    const status = (data?.[0] ?? null) as PartnerStatus | null;
    if (!status || status.member_count < 2 || !status.household_id) {
      setPartnerId(null);
      return;
    }

    setPartnerName(status.partner_name || 'Mi pareja');

    const { data: member } = await supabase
      .from('household_members')
      .select('user_id')
      .eq('household_id', status.household_id)
      .neq('user_id', user.id)
      .limit(1)
      .maybeSingle();

    setPartnerId(member?.user_id ?? null);
  }, [user]);

  useFocusEffect(
    useCallback(() => {
      loadPartner();
    }, [loadPartner])
  );

  useEffect(() => {
    if (categories.length > 0 && !categories.some((item) => item.slug === categoria)) {
      setCategoria(categories[0].slug);
    }
  }, [categories, categoria]);

  useEffect(() => {
    if (
      paymentMethods.length > 0 &&
      !paymentMethods.some((item) => item.slug === metodoPago)
    ) {
      const preferred = paymentMethods.find((item) => item.slug === 'efectivo');
      setMetodoPago(preferred?.slug ?? paymentMethods[0].slug);
    }
  }, [paymentMethods, metodoPago]);

  useEffect(() => {
    if (tipo === 'personal' && user) {
      setPayerId(user.id);
    }
  }, [tipo, user]);

  const amount = Number(monto.replace(',', '.'));
  const isValidAmount = Number.isFinite(amount) && amount > 0;

  const guardarGasto = async () => {
    if (!user) return;

    if (!isValidAmount) {
      Alert.alert('Monto inválido', 'Ingresa un monto mayor a 0.');
      return;
    }

    if (!descripcion.trim()) {
      Alert.alert('Falta la descripción', 'Escribe una descripción para el gasto.');
      return;
    }

    if (!categoria) {
      Alert.alert('Falta la categoría', 'Agrega o selecciona una categoría.');
      return;
    }

    if (!metodoPago) {
      Alert.alert('Falta el método de pago', 'Agrega o selecciona un método de pago.');
      return;
    }

    try {
      setSaving(true);
      await addExpense({
        amount,
        description: descripcion.trim(),
        type: tipo,
        category: categoria,
        paymentMethod: metodoPago,
        payerId: tipo === 'compartido' ? payerId || user.id : user.id,
      });
      router.back();
    } catch (error: any) {
      Alert.alert(
        'No se pudo guardar',
        error?.message ?? 'No fue posible guardar el gasto.'
      );
    } finally {
      setSaving(false);
    }
  };

  const unavailable = categories.length === 0 || paymentMethods.length === 0;

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <TouchableOpacity onPress={() => router.back()}>
            <Text style={styles.back}>‹ Volver</Text>
          </TouchableOpacity>

          <Text style={styles.title}>Nuevo gasto</Text>
          <Text style={styles.subtitle}>Completa solo lo necesario.</Text>

          <Text style={styles.step}>1 · ¿Cuánto gastaste?</Text>
          <TextInput
            style={styles.inputMonto}
            placeholder="S/ 0.00"
            placeholderTextColor="#64748B"
            keyboardType="decimal-pad"
            value={monto}
            onChangeText={setMonto}
          />

          <Text style={styles.step}>2 · ¿En qué?</Text>
          <TextInput
            style={styles.input}
            placeholder="Ej. Almuerzo, taxi, supermercado..."
            placeholderTextColor="#64748B"
            value={descripcion}
            onChangeText={setDescripcion}
          />

          <View style={styles.stepHeader}>
            <Text style={styles.stepNoMargin}>3 · Categoría</Text>
            <TouchableOpacity onPress={() => router.push('/categorias')}>
              <Text style={styles.manage}>Editar</Text>
            </TouchableOpacity>
          </View>

          {loadingCategories ? (
            <Text style={styles.status}>Cargando...</Text>
          ) : (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.chips}
            >
              {categories.map((item) => {
                const active = categoria === item.slug;
                return (
                  <TouchableOpacity
                    key={item.id}
                    style={[styles.chip, active && styles.chipActive]}
                    onPress={() => setCategoria(item.slug)}
                  >
                    <Text style={styles.chipIcon}>{item.icon}</Text>
                    <Text style={[styles.chipText, active && styles.chipTextActive]}>
                      {item.name}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          )}

          <View style={styles.stepHeader}>
            <Text style={styles.stepNoMargin}>4 · ¿Cómo pagaron?</Text>
            <TouchableOpacity onPress={() => router.push('/metodos-pago')}>
              <Text style={styles.manage}>Editar</Text>
            </TouchableOpacity>
          </View>

          {loadingPaymentMethods ? (
            <Text style={styles.status}>Cargando...</Text>
          ) : (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.chips}
            >
              {paymentMethods.map((item) => {
                const active = metodoPago === item.slug;
                return (
                  <TouchableOpacity
                    key={item.id}
                    style={[styles.chip, active && styles.chipActive]}
                    onPress={() => setMetodoPago(item.slug)}
                  >
                    <Text style={styles.chipIcon}>{item.icon}</Text>
                    <Text style={[styles.chipText, active && styles.chipTextActive]}>
                      {item.name}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          )}

          <Text style={styles.step}>5 · Tipo</Text>
          <View style={styles.typeRow}>
            <TouchableOpacity
              style={[styles.typeButton, tipo === 'personal' && styles.typeActive]}
              onPress={() => setTipo('personal')}
            >
              <Text style={styles.typeIcon}>👤</Text>
              <View>
                <Text style={styles.typeTitle}>Personal</Text>
                <Text style={styles.typeSub}>Solo tú</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.typeButton, tipo === 'compartido' && styles.typeActive]}
              onPress={() => setTipo('compartido')}
            >
              <Text style={styles.typeIcon}>👥</Text>
              <View>
                <Text style={styles.typeTitle}>Compartido</Text>
                <Text style={styles.typeSub}>Con tu pareja</Text>
              </View>
            </TouchableOpacity>
          </View>

          {tipo === 'compartido' && (
            <>
              <Text style={styles.step}>6 · ¿Quién pagó?</Text>
              <View style={styles.typeRow}>
                <TouchableOpacity
                  style={[styles.typeButton, payerId === user?.id && styles.typeActive]}
                  onPress={() => user && setPayerId(user.id)}
                >
                  <Text style={styles.typeIcon}>👤</Text>
                  <View>
                    <Text style={styles.typeTitle}>Yo</Text>
                    <Text style={styles.typeSub}>Pagaste tú</Text>
                  </View>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.typeButton,
                    payerId === partnerId && styles.typeActive,
                    !partnerId && styles.disabled,
                  ]}
                  onPress={() => partnerId && setPayerId(partnerId)}
                  disabled={!partnerId}
                >
                  <Text style={styles.typeIcon}>👥</Text>
                  <View>
                    <Text style={styles.typeTitle}>{partnerName}</Text>
                    <Text style={styles.typeSub}>
                      {partnerId ? 'Pagó tu pareja' : 'Primero vincula tu pareja'}
                    </Text>
                  </View>
                </TouchableOpacity>
              </View>

              {isValidAmount && (
                <View style={styles.sharedBox}>
                  <Text style={styles.sharedText}>
                    División 50/50 · A cada uno le corresponde S/ {(amount / 2).toFixed(2)}
                  </Text>
                </View>
              )}
            </>
          )}

          <TouchableOpacity
            style={[styles.saveButton, (saving || unavailable) && styles.disabled]}
            onPress={guardarGasto}
            disabled={saving || unavailable}
          >
            <Text style={styles.saveText}>
              {saving ? 'Guardando...' : 'Guardar gasto'}
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  container: { flex: 1, backgroundColor: '#0B1220' },
  content: { paddingHorizontal: 20, paddingTop: 10, paddingBottom: 44 },
  back: { color: '#60A5FA', fontSize: 16 },
  title: { color: '#FFFFFF', fontSize: 29, fontWeight: '800', marginTop: 22 },
  subtitle: { color: '#64748B', fontSize: 13, marginTop: 5, marginBottom: 24 },
  step: {
    color: '#CBD5E1',
    fontSize: 13,
    fontWeight: '800',
    marginTop: 18,
    marginBottom: 8,
  },
  stepNoMargin: { color: '#CBD5E1', fontSize: 13, fontWeight: '800' },
  stepHeader: {
    marginTop: 20,
    marginBottom: 9,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  manage: { color: '#60A5FA', fontSize: 11, fontWeight: '800' },
  inputMonto: {
    backgroundColor: '#111827',
    borderRadius: 16,
    padding: 18,
    color: '#FFFFFF',
    fontSize: 28,
    fontWeight: '800',
  },
  input: {
    backgroundColor: '#111827',
    borderRadius: 15,
    padding: 15,
    color: '#FFFFFF',
    fontSize: 15,
  },
  status: { color: '#64748B', fontSize: 12 },
  chips: { gap: 8, paddingRight: 16 },
  chip: {
    minHeight: 44,
    backgroundColor: '#111827',
    borderRadius: 14,
    paddingHorizontal: 13,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    borderColor: '#1E293B',
  },
  chipActive: { backgroundColor: '#172554', borderColor: '#3B82F6' },
  chipIcon: { fontSize: 17 },
  chipText: { color: '#94A3B8', fontSize: 12, fontWeight: '700' },
  chipTextActive: { color: '#FFFFFF' },
  typeRow: { flexDirection: 'row', gap: 10 },
  typeButton: {
    flex: 1,
    backgroundColor: '#111827',
    borderRadius: 15,
    padding: 14,
    borderWidth: 1,
    borderColor: '#1E293B',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
  },
  typeActive: { backgroundColor: '#172554', borderColor: '#3B82F6' },
  typeIcon: { fontSize: 22 },
  typeTitle: { color: '#FFFFFF', fontSize: 13, fontWeight: '800' },
  typeSub: { color: '#64748B', fontSize: 9, marginTop: 2 },
  sharedBox: {
    marginTop: 10,
    backgroundColor: '#111827',
    borderRadius: 13,
    padding: 12,
  },
  sharedText: { color: '#94A3B8', fontSize: 11, textAlign: 'center' },
  saveButton: {
    backgroundColor: '#2563EB',
    borderRadius: 15,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 26,
  },
  saveText: { color: '#FFFFFF', fontSize: 16, fontWeight: '800' },
  disabled: { opacity: 0.45 },
});
