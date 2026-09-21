import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert,
  Animated,
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

import { ExpenseCategory, useFinance } from '@/context/finance-context';
import { supabase } from '@/lib/supabase';

type PartnerStatus = {
  household_id: string | null;
  partner_name: string | null;
  member_count: number;
};

type SplitMode = 'half' | 'exact' | 'percentage' | 'custom';

const splitLabels: Record<SplitMode, string> = {
  half: 'Mitad y mitad (50/50)',
  exact: 'Cantidad exacta',
  percentage: 'Porcentaje',
  custom: 'Personalizado',
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
  const enter = useRef(new Animated.Value(0)).current;

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

  const [splitModal, setSplitModal] = useState(false);
  const [splitMode, setSplitMode] = useState<SplitMode>('half');
  const [draftSplitMode, setDraftSplitMode] = useState<SplitMode>('half');
  const [exactMine, setExactMine] = useState('');
  const [percentMine, setPercentMine] = useState('50');
  const [customMine, setCustomMine] = useState('');
  const [customPartner, setCustomPartner] = useState('');

  useEffect(() => {
    Animated.timing(enter, {
      toValue: 1,
      duration: 260,
      useNativeDriver: true,
    }).start();
  }, [enter]);

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

  const split = useMemo(() => {
    if (!isValidAmount) return { mine: 0, partner: 0, valid: false };

    if (splitMode === 'half') {
      const mine = Math.round((amount / 2) * 100) / 100;
      return { mine, partner: Math.round((amount - mine) * 100) / 100, valid: true };
    }

    if (splitMode === 'exact') {
      const mine = Number(exactMine.replace(',', '.'));
      if (!Number.isFinite(mine) || mine < 0 || mine > amount) {
        return { mine: 0, partner: 0, valid: false };
      }
      return {
        mine: Math.round(mine * 100) / 100,
        partner: Math.round((amount - mine) * 100) / 100,
        valid: true,
      };
    }

    if (splitMode === 'percentage') {
      const percent = Number(percentMine.replace(',', '.'));
      if (!Number.isFinite(percent) || percent < 0 || percent > 100) {
        return { mine: 0, partner: 0, valid: false };
      }
      const mine = Math.round((amount * (percent / 100)) * 100) / 100;
      return { mine, partner: Math.round((amount - mine) * 100) / 100, valid: true };
    }

    const mine = Number(customMine.replace(',', '.'));
    const partner = Number(customPartner.replace(',', '.'));
    const valid =
      Number.isFinite(mine) &&
      Number.isFinite(partner) &&
      mine >= 0 &&
      partner >= 0 &&
      Math.abs(mine + partner - amount) <= 0.01;

    return {
      mine: valid ? Math.round(mine * 100) / 100 : 0,
      partner: valid ? Math.round(partner * 100) / 100 : 0,
      valid,
    };
  }, [
    amount,
    isValidAmount,
    splitMode,
    exactMine,
    percentMine,
    customMine,
    customPartner,
  ]);

  const draftSplit = useMemo(() => {
    if (!isValidAmount) return { mine: 0, partner: 0, valid: false };

    if (draftSplitMode === 'half') {
      const mine = Math.round((amount / 2) * 100) / 100;
      return { mine, partner: Math.round((amount - mine) * 100) / 100, valid: true };
    }

    if (draftSplitMode === 'exact') {
      const mine = Number(exactMine.replace(',', '.'));
      if (!Number.isFinite(mine) || mine < 0 || mine > amount) {
        return { mine: 0, partner: 0, valid: false };
      }
      return {
        mine: Math.round(mine * 100) / 100,
        partner: Math.round((amount - mine) * 100) / 100,
        valid: true,
      };
    }

    if (draftSplitMode === 'percentage') {
      const percent = Number(percentMine.replace(',', '.'));
      if (!Number.isFinite(percent) || percent < 0 || percent > 100) {
        return { mine: 0, partner: 0, valid: false };
      }
      const mine = Math.round((amount * (percent / 100)) * 100) / 100;
      return { mine, partner: Math.round((amount - mine) * 100) / 100, valid: true };
    }

    const mine = Number(customMine.replace(',', '.'));
    const partner = Number(customPartner.replace(',', '.'));
    const valid =
      Number.isFinite(mine) &&
      Number.isFinite(partner) &&
      mine >= 0 &&
      partner >= 0 &&
      Math.abs(mine + partner - amount) <= 0.01;

    return {
      mine: valid ? Math.round(mine * 100) / 100 : 0,
      partner: valid ? Math.round(partner * 100) / 100 : 0,
      valid,
    };
  }, [
    amount,
    isValidAmount,
    draftSplitMode,
    exactMine,
    percentMine,
    customMine,
    customPartner,
  ]);

  const openSplit = () => {
    if (!isValidAmount) {
      Alert.alert('Primero ingresa el monto', 'Necesitamos el total para calcular la división.');
      return;
    }

    setDraftSplitMode(splitMode);
    if (!exactMine) setExactMine((amount / 2).toFixed(2));
    if (!customMine) setCustomMine((amount / 2).toFixed(2));
    if (!customPartner) setCustomPartner((amount - amount / 2).toFixed(2));
    setSplitModal(true);
  };

  const applySplit = () => {
    if (!draftSplit.valid) {
      Alert.alert('Revisa la división', 'Las partes deben sumar exactamente el total del gasto.');
      return;
    }
    setSplitMode(draftSplitMode);
    setSplitModal(false);
  };

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

    if (tipo === 'compartido' && !partnerId) {
      Alert.alert('Pareja no vinculada', 'Primero vincula a tu pareja para registrar gastos compartidos.');
      return;
    }

    if (tipo === 'compartido' && !split.valid) {
      Alert.alert('División inválida', 'Revisa cómo se dividirá el gasto.');
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
        myShare: tipo === 'compartido' ? split.mine : amount,
        partnerShare: tipo === 'compartido' ? split.partner : 0,
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
        <Animated.View
          style={[
            styles.flex,
            {
              opacity: enter,
              transform: [
                {
                  translateY: enter.interpolate({
                    inputRange: [0, 1],
                    outputRange: [12, 0],
                  }),
                },
              ],
            },
          ]}
        >
          <ScrollView
            contentContainerStyle={styles.content}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            <TouchableOpacity onPress={() => router.back()}>
              <Text style={styles.back}>‹ Volver</Text>
            </TouchableOpacity>

            <Text style={styles.title}>
              {tipo === 'compartido' ? 'Nuevo gasto compartido' : 'Nuevo gasto'}
            </Text>
            <Text style={styles.subtitle}>Rápido, claro y sin pasos innecesarios.</Text>

            <Text style={styles.step}>1 · ¿Cuánto?</Text>
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
              placeholder="Ej. Cine, almuerzo, supermercado..."
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
              <Text style={styles.stepNoMargin}>4 · ¿Cómo pagaste?</Text>
              <TouchableOpacity onPress={() => router.push('/metodos-pago')}>
                <Text style={styles.manage}>Administrar</Text>
              </TouchableOpacity>
            </View>

            {loadingPaymentMethods ? (
              <Text style={styles.status}>Cargando...</Text>
            ) : (
              <View style={styles.paymentGrid}>
                {paymentMethods.slice(0, 6).map((item) => {
                  const active = metodoPago === item.slug;
                  return (
                    <TouchableOpacity
                      key={item.id}
                      style={[styles.paymentCard, active && styles.paymentCardActive]}
                      onPress={() => setMetodoPago(item.slug)}
                    >
                      <Text style={styles.paymentIcon}>{item.icon}</Text>
                      <Text
                        style={[
                          styles.paymentName,
                          active && styles.paymentNameActive,
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
                style={[styles.typeButton, tipo === 'compartido' && styles.typeActivePink]}
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
                      payerId === partnerId && styles.typeActivePink,
                      !partnerId && styles.disabled,
                    ]}
                    onPress={() => partnerId && setPayerId(partnerId)}
                    disabled={!partnerId}
                  >
                    <Text style={styles.typeIcon}>💗</Text>
                    <View style={styles.partnerTextWrap}>
                      <Text style={styles.typeTitle} numberOfLines={1}>{partnerName}</Text>
                      <Text style={styles.typeSub}>
                        {partnerId ? 'Pagó tu pareja' : 'Primero vincula tu pareja'}
                      </Text>
                    </View>
                  </TouchableOpacity>
                </View>

                <TouchableOpacity style={styles.splitCard} onPress={openSplit}>
                  <View>
                    <Text style={styles.splitLabel}>7 · ¿Cómo dividir?</Text>
                    <Text style={styles.splitTitle}>{splitLabels[splitMode]}</Text>
                    {isValidAmount && split.valid ? (
                      <Text style={styles.splitPreview}>
                        Tu parte S/ {split.mine.toFixed(2)} · {partnerName} S/ {split.partner.toFixed(2)}
                      </Text>
                    ) : null}
                  </View>
                  <Text style={styles.splitArrow}>›</Text>
                </TouchableOpacity>
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
        </Animated.View>
      </KeyboardAvoidingView>

      <Modal
        visible={splitModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setSplitModal(false)}
      >
        <SafeAreaView style={styles.modalContainer} edges={['top', 'bottom']}>
          <ScrollView contentContainerStyle={styles.modalContent} keyboardShouldPersistTaps="handled">
            <View style={styles.modalHeader}>
              <TouchableOpacity onPress={() => setSplitModal(false)}>
                <Text style={styles.back}>‹ Volver</Text>
              </TouchableOpacity>
              <Text style={styles.modalHeaderTitle}>Dividir gasto</Text>
              <View style={styles.modalHeaderSpacer} />
            </View>

            {([
              ['half', 'Mitad y mitad (50/50)', 'Ambos pagan lo mismo'],
              ['exact', 'Cantidad exacta', 'Indica cuánto te corresponde a ti'],
              ['percentage', 'Porcentaje', 'Ej. 60% / 40%'],
              ['custom', 'Personalizado', 'Escribe ambas partes'],
            ] as [SplitMode, string, string][]).map(([value, title, sub]) => {
              const active = draftSplitMode === value;
              return (
                <TouchableOpacity
                  key={value}
                  style={[styles.splitOption, active && styles.splitOptionActive]}
                  onPress={() => setDraftSplitMode(value)}
                >
                  <View style={[styles.radio, active && styles.radioActive]}>
                    {active ? <View style={styles.radioDot} /> : null}
                  </View>
                  <View style={styles.splitOptionText}>
                    <Text style={styles.splitOptionTitle}>{title}</Text>
                    <Text style={styles.splitOptionSub}>{sub}</Text>
                  </View>
                </TouchableOpacity>
              );
            })}

            {draftSplitMode === 'exact' ? (
              <View style={styles.editorCard}>
                <Text style={styles.editorLabel}>Tu parte</Text>
                <TextInput
                  value={exactMine}
                  onChangeText={setExactMine}
                  keyboardType="decimal-pad"
                  placeholder="0.00"
                  placeholderTextColor="#475569"
                  style={styles.editorInput}
                />
                <Text style={styles.editorHint}>
                  {partnerName}: S/ {draftSplit.valid ? draftSplit.partner.toFixed(2) : '0.00'}
                </Text>
              </View>
            ) : null}

            {draftSplitMode === 'percentage' ? (
              <View style={styles.editorCard}>
                <Text style={styles.editorLabel}>Tu porcentaje</Text>
                <View style={styles.percentRow}>
                  <TextInput
                    value={percentMine}
                    onChangeText={setPercentMine}
                    keyboardType="decimal-pad"
                    placeholder="50"
                    placeholderTextColor="#475569"
                    style={[styles.editorInput, styles.percentInput]}
                  />
                  <Text style={styles.percentSymbol}>%</Text>
                </View>
                <Text style={styles.editorHint}>
                  {partnerName}: {Number.isFinite(Number(percentMine)) ? Math.max(0, 100 - Number(percentMine)).toFixed(0) : '0'}%
                </Text>
              </View>
            ) : null}

            {draftSplitMode === 'custom' ? (
              <View style={styles.editorCard}>
                <Text style={styles.editorLabel}>Tu parte</Text>
                <TextInput
                  value={customMine}
                  onChangeText={setCustomMine}
                  keyboardType="decimal-pad"
                  placeholder="0.00"
                  placeholderTextColor="#475569"
                  style={styles.editorInput}
                />
                <Text style={[styles.editorLabel, styles.editorSecondLabel]}>{partnerName}</Text>
                <TextInput
                  value={customPartner}
                  onChangeText={setCustomPartner}
                  keyboardType="decimal-pad"
                  placeholder="0.00"
                  placeholderTextColor="#475569"
                  style={styles.editorInput}
                />
              </View>
            ) : null}

            <View style={styles.previewCard}>
              <Text style={styles.previewLabel}>Vista previa</Text>
              <Text style={styles.previewTotal}>Total: S/ {isValidAmount ? amount.toFixed(2) : '0.00'}</Text>
              <View style={styles.previewLine} />
              <Text style={styles.previewPerson}>
                Tú: S/ {draftSplit.valid ? draftSplit.mine.toFixed(2) : '0.00'}
              </Text>
              <Text style={styles.previewPerson}>
                {partnerName}: S/ {draftSplit.valid ? draftSplit.partner.toFixed(2) : '0.00'}
              </Text>
            </View>

            <TouchableOpacity
              style={[styles.saveButton, !draftSplit.valid && styles.disabled]}
              onPress={applySplit}
              disabled={!draftSplit.valid}
            >
              <Text style={styles.saveText}>Aplicar división</Text>
            </TouchableOpacity>
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  container: { flex: 1, backgroundColor: '#07111F' },
  content: { paddingHorizontal: 20, paddingTop: 10, paddingBottom: 44 },
  back: { color: '#60A5FA', fontSize: 16, fontWeight: '800' },
  title: { color: '#FFFFFF', fontSize: 29, fontWeight: '900', marginTop: 22 },
  subtitle: { color: '#64748B', fontSize: 13, marginTop: 5, marginBottom: 20 },
  step: {
    color: '#CBD5E1',
    fontSize: 13,
    fontWeight: '900',
    marginTop: 18,
    marginBottom: 8,
  },
  stepNoMargin: { color: '#CBD5E1', fontSize: 13, fontWeight: '900' },
  stepHeader: {
    marginTop: 20,
    marginBottom: 9,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  manage: { color: '#60A5FA', fontSize: 11, fontWeight: '800' },
  inputMonto: {
    backgroundColor: '#0E1A2A',
    borderRadius: 17,
    padding: 18,
    color: '#FFFFFF',
    fontSize: 28,
    fontWeight: '900',
    borderWidth: 1,
    borderColor: '#16263A',
  },
  input: {
    backgroundColor: '#0E1A2A',
    borderRadius: 15,
    padding: 15,
    color: '#FFFFFF',
    fontSize: 15,
    borderWidth: 1,
    borderColor: '#16263A',
  },
  status: { color: '#64748B', fontSize: 12 },
  chips: { gap: 8, paddingRight: 16 },
  chip: {
    minHeight: 44,
    backgroundColor: '#0E1A2A',
    borderRadius: 14,
    paddingHorizontal: 13,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    borderColor: '#1B2B40',
  },
  chipActive: { backgroundColor: '#132E5B', borderColor: '#3B82F6' },
  chipIcon: { fontSize: 17 },
  chipText: { color: '#94A3B8', fontSize: 12, fontWeight: '700' },
  chipTextActive: { color: '#FFFFFF' },
  paymentGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  paymentCard: {
    width: '31.5%',
    minHeight: 76,
    backgroundColor: '#0E1A2A',
    borderRadius: 15,
    borderWidth: 1,
    borderColor: '#1B2B40',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  paymentCardActive: {
    backgroundColor: '#132E5B',
    borderColor: '#3B82F6',
    borderWidth: 2,
  },
  paymentIcon: { fontSize: 23 },
  paymentName: {
    color: '#94A3B8',
    fontSize: 9,
    fontWeight: '800',
    marginTop: 6,
    maxWidth: '95%',
  },
  paymentNameActive: { color: '#FFFFFF' },
  typeRow: { flexDirection: 'row', gap: 10 },
  typeButton: {
    flex: 1,
    minHeight: 72,
    backgroundColor: '#0E1A2A',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#1B2B40',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
  },
  typeActive: { backgroundColor: '#132E5B', borderColor: '#3B82F6' },
  typeActivePink: { backgroundColor: '#3A1830', borderColor: '#EC4899' },
  typeIcon: { fontSize: 22 },
  typeTitle: { color: '#FFFFFF', fontSize: 13, fontWeight: '900' },
  typeSub: { color: '#64748B', fontSize: 9, marginTop: 2 },
  partnerTextWrap: { flex: 1 },
  splitCard: {
    marginTop: 16,
    backgroundColor: '#0E1A2A',
    borderRadius: 17,
    borderWidth: 1,
    borderColor: '#23446E',
    padding: 15,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  splitLabel: { color: '#64748B', fontSize: 10, fontWeight: '800' },
  splitTitle: { color: '#FFFFFF', fontSize: 14, fontWeight: '900', marginTop: 4 },
  splitPreview: { color: '#60A5FA', fontSize: 10, marginTop: 5 },
  splitArrow: { color: '#60A5FA', fontSize: 30 },
  saveButton: {
    backgroundColor: '#1677FF',
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 26,
  },
  saveText: { color: '#FFFFFF', fontSize: 15, fontWeight: '900' },
  disabled: { opacity: 0.45 },

  modalContainer: { flex: 1, backgroundColor: '#07111F' },
  modalContent: { padding: 20, paddingBottom: 40 },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  modalHeaderTitle: { color: '#FFFFFF', fontSize: 18, fontWeight: '900' },
  modalHeaderSpacer: { width: 55 },
  splitOption: {
    backgroundColor: '#0E1A2A',
    borderRadius: 17,
    padding: 15,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#1B2B40',
    marginBottom: 10,
  },
  splitOptionActive: { borderColor: '#3B82F6', backgroundColor: '#10264A' },
  radio: {
    width: 23,
    height: 23,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#64748B',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  radioActive: { borderColor: '#3B82F6' },
  radioDot: { width: 11, height: 11, borderRadius: 6, backgroundColor: '#3B82F6' },
  splitOptionText: { flex: 1 },
  splitOptionTitle: { color: '#FFFFFF', fontSize: 14, fontWeight: '900' },
  splitOptionSub: { color: '#64748B', fontSize: 10, marginTop: 3 },
  editorCard: {
    backgroundColor: '#0E1A2A',
    borderRadius: 17,
    padding: 15,
    marginTop: 8,
    borderWidth: 1,
    borderColor: '#1B2B40',
  },
  editorLabel: { color: '#94A3B8', fontSize: 11, fontWeight: '800', marginBottom: 7 },
  editorSecondLabel: { marginTop: 12 },
  editorInput: {
    backgroundColor: '#07111F',
    color: '#FFFFFF',
    borderRadius: 13,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 18,
    fontWeight: '900',
    borderWidth: 1,
    borderColor: '#20334B',
  },
  editorHint: { color: '#60A5FA', fontSize: 10, marginTop: 8 },
  percentRow: { flexDirection: 'row', alignItems: 'center' },
  percentInput: { flex: 1 },
  percentSymbol: { color: '#FFFFFF', fontSize: 20, fontWeight: '900', marginLeft: 10 },
  previewCard: {
    backgroundColor: '#0E1A2A',
    borderRadius: 17,
    padding: 16,
    marginTop: 16,
    borderWidth: 1,
    borderColor: '#1B2B40',
  },
  previewLabel: { color: '#94A3B8', fontSize: 11, fontWeight: '800' },
  previewTotal: { color: '#FFFFFF', fontSize: 20, fontWeight: '900', marginTop: 5 },
  previewLine: { height: 1, backgroundColor: '#1B2B40', marginVertical: 12 },
  previewPerson: { color: '#CBD5E1', fontSize: 12, marginTop: 5 },
});
