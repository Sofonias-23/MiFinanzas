import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { type ReactNode, useCallback, useEffect, useMemo, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppIcon } from '@/components/app-icon';
import { ExpenseCategory, useFinance } from '@/context/finance-context';
import { categoryIconName, paymentIconName } from '@/lib/icon-map';
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
  const [payerId, setPayerId] = useState('');
  const [partnerName, setPartnerName] = useState('Jhane');
  const [partnerId, setPartnerId] = useState<string | null>(null);
  const [categoryModal, setCategoryModal] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) router.replace('/login');
  }, [authLoading, user]);

  useEffect(() => {
    if (user && !payerId) setPayerId(user.id);
  }, [user, payerId]);

  useEffect(() => {
    if (params.type === 'compartido') setTipo('compartido');
  }, [params.type]);

  useEffect(() => {
    if (categories.length > 0 && !categories.some((item) => item.slug === categoria)) {
      const preferred =
        categories.find((item) => item.slug === 'ocio') ??
        categories.find((item) => item.slug === 'comida') ??
        categories[0];
      setCategoria(preferred.slug);
    }
  }, [categories, categoria]);

  useEffect(() => {
    if (
      paymentMethods.length > 0 &&
      !paymentMethods.some((item) => item.slug === metodoPago)
    ) {
      const preferred =
        paymentMethods.find((item) => item.slug === 'debito') ??
        paymentMethods.find((item) => item.slug === 'efectivo') ??
        paymentMethods[0];
      setMetodoPago(preferred.slug);
    }
  }, [paymentMethods, metodoPago]);

  const loadPartner = useCallback(async () => {
    if (!user) return;

    const { data } = await supabase.rpc('get_partner_status');
    const status = (data?.[0] ?? null) as PartnerStatus | null;

    if (!status || status.member_count < 2 || !status.household_id) {
      setPartnerId(null);
      return;
    }

    setPartnerName(status.partner_name || 'Jhane');

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
    if (tipo === 'personal' && user) setPayerId(user.id);
  }, [tipo, user]);

  const selectedCategory = categories.find((item) => item.slug === categoria);

  const visiblePaymentMethods = useMemo(() => {
    const preferred = ['efectivo', 'debito', 'credito', 'transferencia'];
    const ordered = preferred
      .map((slug) => paymentMethods.find((item) => item.slug === slug))
      .filter(Boolean) as typeof paymentMethods;

    return ordered.length >= 4 ? ordered.slice(0, 4) : paymentMethods.slice(0, 4);
  }, [paymentMethods]);

  const amount = Number(monto.replace(',', '.'));
  const validAmount = Number.isFinite(amount) && amount > 0;

  const validateBase = () => {
    if (!validAmount) {
      Alert.alert('Monto inválido', 'Ingresa un monto mayor a cero.');
      return false;
    }

    if (!descripcion.trim()) {
      Alert.alert('Falta la descripción', 'Escribe en qué fue el gasto.');
      return false;
    }

    if (!categoria || !metodoPago) {
      Alert.alert('Faltan datos', 'Selecciona categoría y método de pago.');
      return false;
    }

    if (tipo === 'compartido' && !partnerId) {
      Alert.alert('Pareja no vinculada', 'Primero vincula a tu pareja.');
      return false;
    }

    return true;
  };

  const continueFlow = async () => {
    if (!user || !validateBase()) return;

    if (tipo === 'compartido') {
      router.push({
        pathname: '/dividir-gasto',
        params: {
          amount: amount.toFixed(2),
          description: descripcion.trim(),
          category: categoria,
          paymentMethod: metodoPago,
          payerId: payerId || user.id,
          partnerName,
        },
      } as any);
      return;
    }

    try {
      setSaving(true);
      await addExpense({
        amount,
        description: descripcion.trim(),
        type: 'personal',
        category: categoria,
        paymentMethod: metodoPago,
        payerId: user.id,
        myShare: amount,
        partnerShare: 0,
      });
      router.back();
    } catch (error: any) {
      Alert.alert('No se pudo guardar', error?.message ?? 'Inténtalo nuevamente.');
    } finally {
      setSaving(false);
    }
  };

  if (authLoading || !user) return null;

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.header}>
            <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
              <AppIcon name="back" size={17} color="#23A7FF" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Nuevo gasto</Text>
            <View style={styles.headerSpacer} />
          </View>

          <Step number={1} title="¿Cuánto?">
            <TextInput
              style={styles.amountInput}
              value={monto}
              onChangeText={setMonto}
              keyboardType="decimal-pad"
              placeholder="S/ 0.00"
              placeholderTextColor="#64748B"
            />
          </Step>

          <Step number={2} title="¿En qué?">
            <TextInput
              style={styles.textInput}
              value={descripcion}
              onChangeText={setDescripcion}
              placeholder="Cine en el Mall"
              placeholderTextColor="#64748B"
            />
          </Step>

          <Step number={3} title="Categoría">
            <TouchableOpacity
              style={styles.selectRow}
              onPress={() => setCategoryModal(true)}
            >
              <View style={styles.selectLeft}>
                <View style={styles.selectIconPink}>
                  <AppIcon
                    name={categoryIconName(categoria)}
                    size={19}
                    color="#FFFFFF"
                  />
                </View>
                <Text style={styles.selectText}>
                  {selectedCategory?.name ?? 'Seleccionar'}
                </Text>
              </View>
              <Text style={styles.chevron}>›</Text>
            </TouchableOpacity>
          </Step>

          <Step number={4} title="¿Cómo pagaste?">
            {loadingPaymentMethods ? (
              <Text style={styles.loadingText}>Cargando...</Text>
            ) : (
              <View style={styles.paymentRow}>
                {visiblePaymentMethods.map((item) => {
                  const active = metodoPago === item.slug;
                  return (
                    <TouchableOpacity
                      key={item.id}
                      style={[styles.paymentItem, active && styles.paymentItemActive]}
                      onPress={() => setMetodoPago(item.slug)}
                    >
                      <View style={[styles.paymentIconBox, active && styles.paymentIconBoxActive]}>
                        <AppIcon
                          name={paymentIconName(item.slug)}
                          size={20}
                          color={active ? '#23A7FF' : '#CBD5E1'}
                        />
                      </View>
                      <Text
                        style={[
                          styles.paymentLabel,
                          active && styles.paymentLabelActive,
                        ]}
                        numberOfLines={1}
                      >
                        {item.name}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}
          </Step>

          <Step number={5} title="¿Quién pagó?">
            <View style={styles.payerRow}>
              <TouchableOpacity
                style={[
                  styles.payerButton,
                  payerId === user.id && styles.payerActiveBlue,
                ]}
                onPress={() => setPayerId(user.id)}
              >
                <View style={[styles.payerAvatar, styles.avatarBlue]}>
                  <AppIcon name="profile" size={18} color="#FFFFFF" />
                </View>
                <Text style={styles.payerName}>Sofonías</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.payerButton,
                  payerId === partnerId && styles.payerActivePink,
                  !partnerId && styles.disabled,
                ]}
                disabled={!partnerId || tipo === 'personal'}
                onPress={() => partnerId && setPayerId(partnerId)}
              >
                <View style={[styles.payerAvatar, styles.avatarPink]}>
                  <AppIcon name="profile" size={18} color="#FFFFFF" />
                </View>
                <Text style={styles.payerName}>{partnerName}</Text>
              </TouchableOpacity>
            </View>
          </Step>

          <Step number={6} title="Tipo de gasto">
            <View style={styles.typeRow}>
              <TouchableOpacity
                style={[styles.typeCard, tipo === 'personal' && styles.typeCardBlue]}
                onPress={() => setTipo('personal')}
              >
                <AppIcon name="profile" size={17} color="#CBD5E1" />
                <View>
                  <Text style={styles.typeTitle}>Personal</Text>
                  <Text style={styles.typeSub}>Solo tú lo ves</Text>
                </View>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.typeCard, tipo === 'compartido' && styles.typeCardPink]}
                onPress={() => setTipo('compartido')}
              >
                <AppIcon name="people" size={17} color="#F472B6" />
                <View>
                  <Text style={styles.typeTitle}>Compartido</Text>
                  <Text style={styles.typeSub}>Lo vemos ambos</Text>
                </View>
              </TouchableOpacity>
            </View>
          </Step>

          <TouchableOpacity
            style={[styles.saveButton, saving && styles.disabled]}
            onPress={continueFlow}
            disabled={saving}
          >
            <Text style={styles.saveText}>
              {saving ? 'Guardando...' : 'Guardar gasto'}
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>

      <Modal
        visible={categoryModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setCategoryModal(false)}
      >
        <SafeAreaView style={styles.modal} edges={['top', 'bottom']}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setCategoryModal(false)}>
              <Text style={styles.modalClose}>Cerrar</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Categoría</Text>
            <View style={styles.modalSpacer} />
          </View>

          <ScrollView contentContainerStyle={styles.categoryGrid}>
            {loadingCategories ? (
              <Text style={styles.loadingText}>Cargando...</Text>
            ) : (
              categories.map((item) => {
                const active = categoria === item.slug;
                return (
                  <TouchableOpacity
                    key={item.id}
                    style={[styles.categoryCard, active && styles.categoryCardActive]}
                    onPress={() => {
                      setCategoria(item.slug);
                      setCategoryModal(false);
                    }}
                  >
                    <View style={styles.categoryIconBox}>
                      <AppIcon
                        name={categoryIconName(item.slug)}
                        size={22}
                        color={active ? '#23A7FF' : '#CBD5E1'}
                      />
                    </View>
                    <Text
                      style={[
                        styles.categoryName,
                        active && styles.categoryNameActive,
                      ]}
                    >
                      {item.name}
                    </Text>
                  </TouchableOpacity>
                );
              })
            )}
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

function Step({
  number,
  title,
  children,
}: {
  number: number;
  title: string;
  children: ReactNode;
}) {
  return (
    <View style={styles.stepBlock}>
      <View style={styles.stepHeader}>
        <View style={styles.stepCircle}>
          <Text style={styles.stepNumber}>{number}</Text>
        </View>
        <Text style={styles.stepTitle}>{title}</Text>
      </View>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  container: { flex: 1, backgroundColor: '#07111F' },
  content: { padding: 18, paddingBottom: 34 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  backButton: {
    width: 34,
    height: 34,
    borderRadius: 11,
    backgroundColor: '#0E1A2A',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: { color: '#FFFFFF', fontSize: 17, fontWeight: '900' },
  headerSpacer: { width: 34 },
  stepBlock: { marginTop: 14 },
  stepHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 7 },
  stepCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#173A6D',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepNumber: { color: '#60A5FA', fontSize: 10, fontWeight: '900' },
  stepTitle: { color: '#FFFFFF', fontSize: 11, fontWeight: '900' },
  amountInput: {
    backgroundColor: '#0E1A2A',
    borderRadius: 13,
    borderWidth: 1,
    borderColor: '#24415F',
    paddingHorizontal: 14,
    paddingVertical: 11,
    color: '#FFFFFF',
    fontSize: 23,
    fontWeight: '900',
  },
  textInput: {
    backgroundColor: '#0E1A2A',
    borderRadius: 13,
    borderWidth: 1,
    borderColor: '#24415F',
    paddingHorizontal: 13,
    paddingVertical: 11,
    color: '#FFFFFF',
    fontSize: 12,
  },
  selectRow: {
    backgroundColor: '#0E1A2A',
    borderRadius: 13,
    borderWidth: 1,
    borderColor: '#24415F',
    padding: 10,
    minHeight: 50,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  selectLeft: { flexDirection: 'row', alignItems: 'center', gap: 9 },
  selectIconPink: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: '#F43F75',
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectText: { color: '#FFFFFF', fontSize: 11, fontWeight: '900' },
  chevron: { color: '#94A3B8', fontSize: 23 },
  paymentRow: { flexDirection: 'row', gap: 7 },
  paymentItem: { flex: 1, alignItems: 'center' },
  paymentIconBox: {
    width: 48,
    height: 42,
    borderRadius: 11,
    backgroundColor: '#0E1A2A',
    borderWidth: 1,
    borderColor: '#24415F',
    alignItems: 'center',
    justifyContent: 'center',
  },
  paymentIconBoxActive: {
    backgroundColor: '#12345F',
    borderColor: '#23A7FF',
    borderWidth: 2,
  },
  paymentItemActive: {},
  paymentLabel: {
    color: '#64748B',
    fontSize: 7,
    fontWeight: '800',
    marginTop: 4,
    maxWidth: 55,
  },
  paymentLabelActive: { color: '#FFFFFF' },
  payerRow: { flexDirection: 'row', gap: 8 },
  payerButton: {
    flex: 1,
    minHeight: 54,
    borderRadius: 13,
    backgroundColor: '#0E1A2A',
    borderWidth: 1,
    borderColor: '#24415F',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 11,
    gap: 8,
  },
  payerActiveBlue: { borderColor: '#23A7FF', backgroundColor: '#12345F' },
  payerActivePink: { borderColor: '#F43F75', backgroundColor: '#34172A' },
  payerAvatar: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarBlue: { backgroundColor: '#1677FF' },
  avatarPink: { backgroundColor: '#D9366F' },
  payerName: { color: '#FFFFFF', fontSize: 9, fontWeight: '900' },
  typeRow: { flexDirection: 'row', gap: 8 },
  typeCard: {
    flex: 1,
    minHeight: 57,
    borderRadius: 13,
    backgroundColor: '#0E1A2A',
    borderWidth: 1,
    borderColor: '#24415F',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    gap: 7,
  },
  typeCardBlue: { borderColor: '#23A7FF', backgroundColor: '#12345F' },
  typeCardPink: { borderColor: '#F43F75', backgroundColor: '#34172A' },
  typeTitle: { color: '#FFFFFF', fontSize: 9, fontWeight: '900' },
  typeSub: { color: '#64748B', fontSize: 7, marginTop: 2 },
  saveButton: {
    marginTop: 20,
    minHeight: 48,
    borderRadius: 13,
    backgroundColor: '#1677FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveText: { color: '#FFFFFF', fontSize: 11, fontWeight: '900' },
  disabled: { opacity: 0.45 },
  loadingText: { color: '#64748B', fontSize: 9 },
  modal: { flex: 1, backgroundColor: '#07111F' },
  modalHeader: {
    minHeight: 52,
    paddingHorizontal: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: '#1B2B40',
  },
  modalClose: { color: '#60A5FA', fontSize: 10, fontWeight: '900' },
  modalTitle: { color: '#FFFFFF', fontSize: 14, fontWeight: '900' },
  modalSpacer: { width: 40 },
  categoryGrid: {
    padding: 18,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 9,
  },
  categoryCard: {
    width: '31%',
    minHeight: 86,
    borderRadius: 14,
    backgroundColor: '#0E1A2A',
    borderWidth: 1,
    borderColor: '#1B2B40',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 8,
  },
  categoryCardActive: { borderColor: '#23A7FF', backgroundColor: '#12345F' },
  categoryIconBox: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: '#16263A',
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoryName: { color: '#94A3B8', fontSize: 8, fontWeight: '800', marginTop: 6 },
  categoryNameActive: { color: '#FFFFFF' },
});
