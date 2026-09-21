import { router, useLocalSearchParams } from 'expo-router';
import { useMemo, useState } from 'react';
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

import { AppIcon } from '@/components/app-icon';
import { ExpenseCategory, useFinance } from '@/context/finance-context';
import { categoryIconName } from '@/lib/icon-map';

type SplitMode = 'half' | 'exact' | 'percentage';

export default function DividirGastoScreen() {
  const params = useLocalSearchParams<{
    amount?: string;
    description?: string;
    category?: string;
    paymentMethod?: string;
    payerId?: string;
    partnerName?: string;
  }>();

  const { user, addExpense } = useFinance();

  const amount = Number(
    (Array.isArray(params.amount) ? params.amount[0] : params.amount) ?? '0'
  );
  const description =
    (Array.isArray(params.description) ? params.description[0] : params.description) ??
    'Gasto compartido';
  const category =
    (Array.isArray(params.category) ? params.category[0] : params.category) ?? 'otros';
  const paymentMethod =
    (Array.isArray(params.paymentMethod)
      ? params.paymentMethod[0]
      : params.paymentMethod) ?? 'efectivo';
  const payerId =
    (Array.isArray(params.payerId) ? params.payerId[0] : params.payerId) ??
    user?.id ??
    '';
  const partnerName =
    (Array.isArray(params.partnerName) ? params.partnerName[0] : params.partnerName) ??
    'Jhane';

  const [mode, setMode] = useState<SplitMode>('half');
  const [exactMine, setExactMine] = useState((amount / 2).toFixed(2));
  const [percentMine, setPercentMine] = useState('50');
  const [saving, setSaving] = useState(false);

  const split = useMemo(() => {
    if (!Number.isFinite(amount) || amount <= 0) {
      return { mine: 0, partner: 0, valid: false };
    }

    if (mode === 'half') {
      const mine = Math.round((amount / 2) * 100) / 100;
      return {
        mine,
        partner: Math.round((amount - mine) * 100) / 100,
        valid: true,
      };
    }

    if (mode === 'exact') {
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

    const percent = Number(percentMine.replace(',', '.'));
    if (!Number.isFinite(percent) || percent < 0 || percent > 100) {
      return { mine: 0, partner: 0, valid: false };
    }

    const mine = Math.round(amount * (percent / 100) * 100) / 100;
    return {
      mine,
      partner: Math.round((amount - mine) * 100) / 100,
      valid: true,
    };
  }, [amount, mode, exactMine, percentMine]);

  const save = async () => {
    if (!user || !split.valid) {
      Alert.alert('Revisa la división', 'La división debe sumar el total del gasto.');
      return;
    }

    try {
      setSaving(true);
      await addExpense({
        amount,
        description,
        type: 'compartido',
        category: category as ExpenseCategory,
        paymentMethod,
        payerId,
        myShare: split.mine,
        partnerShare: split.partner,
      });

      router.replace('/pareja');
    } catch (error: any) {
      Alert.alert('No se pudo guardar', error?.message ?? 'Inténtalo nuevamente.');
    } finally {
      setSaving(false);
    }
  };

  if (!user) return null;

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
            <Text style={styles.headerTitle}>Dividir gasto</Text>
            <View style={styles.headerSpacer} />
          </View>

          <View style={styles.expenseCard}>
            <View style={styles.expenseIcon}>
              <AppIcon
                name={categoryIconName(category)}
                size={22}
                color="#FFFFFF"
              />
            </View>
            <View style={styles.expenseText}>
              <Text style={styles.expenseName}>{description}</Text>
              <Text style={styles.expenseAmount}>S/ {amount.toFixed(2)}</Text>
              <Text style={styles.expenseMeta}>
                {payerId === user.id ? 'Pagado por Sofonías' : `Pagado por ${partnerName}`}
              </Text>
            </View>
          </View>

          <Text style={styles.question}>¿Cómo lo dividimos?</Text>

          <SplitOption
            active={mode === 'half'}
            title="50/50"
            subtitle="Ambos pagan lo mismo"
            onPress={() => setMode('half')}
          />

          <SplitOption
            active={mode === 'exact'}
            title="Monto exacto"
            subtitle="Indica cuánto pagas tú"
            onPress={() => setMode('exact')}
          />

          {mode === 'exact' ? (
            <View style={styles.editor}>
              <Text style={styles.editorLabel}>Tu parte</Text>
              <TextInput
                value={exactMine}
                onChangeText={setExactMine}
                keyboardType="decimal-pad"
                style={styles.editorInput}
              />
            </View>
          ) : null}

          <SplitOption
            active={mode === 'percentage'}
            title="Porcentaje"
            subtitle="Ej. 60% / 40%"
            onPress={() => setMode('percentage')}
          />

          {mode === 'percentage' ? (
            <View style={styles.editor}>
              <Text style={styles.editorLabel}>Tu porcentaje</Text>
              <View style={styles.percentRow}>
                <TextInput
                  value={percentMine}
                  onChangeText={setPercentMine}
                  keyboardType="decimal-pad"
                  style={[styles.editorInput, styles.percentInput]}
                />
                <Text style={styles.percentSymbol}>%</Text>
              </View>
            </View>
          ) : null}

          <Text style={styles.previewTitle}>Vista previa</Text>

          <View style={styles.previewCard}>
            <View style={styles.previewPerson}>
              <View style={[styles.avatar, styles.avatarBlue]}>
                <AppIcon name="profile" size={21} color="#FFFFFF" />
              </View>
              <View style={styles.previewText}>
                <Text style={styles.previewName}>Tú (Sofonías)</Text>
                <Text style={styles.previewAmount}>S/ {split.mine.toFixed(2)}</Text>
              </View>
            </View>

            <View style={styles.previewDivider} />

            <View style={styles.previewPerson}>
              <View style={[styles.avatar, styles.avatarPink]}>
                <AppIcon name="profile" size={21} color="#FFFFFF" />
              </View>
              <View style={styles.previewText}>
                <Text style={styles.previewName}>{partnerName}</Text>
                <Text style={styles.previewAmount}>S/ {split.partner.toFixed(2)}</Text>
              </View>
            </View>
          </View>

          <TouchableOpacity
            style={[styles.confirmButton, (!split.valid || saving) && styles.disabled]}
            disabled={!split.valid || saving}
            onPress={save}
          >
            <Text style={styles.confirmText}>
              {saving ? 'Guardando...' : 'Confirmar división'}
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function SplitOption({
  active,
  title,
  subtitle,
  onPress,
}: {
  active: boolean;
  title: string;
  subtitle: string;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      style={[styles.option, active && styles.optionActive]}
      onPress={onPress}
      activeOpacity={0.85}
    >
      <View style={[styles.radio, active && styles.radioActive]}>
        {active ? <View style={styles.radioDot} /> : null}
      </View>
      <View>
        <Text style={styles.optionTitle}>{title}</Text>
        <Text style={styles.optionSub}>{subtitle}</Text>
      </View>
    </TouchableOpacity>
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
  expenseCard: {
    marginTop: 15,
    backgroundColor: '#0E1A2A',
    borderRadius: 15,
    borderWidth: 1,
    borderColor: '#24415F',
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
  expenseIcon: {
    width: 48,
    height: 48,
    borderRadius: 13,
    backgroundColor: '#F43F75',
    alignItems: 'center',
    justifyContent: 'center',
  },
  expenseText: { flex: 1, marginLeft: 10 },
  expenseName: { color: '#CBD5E1', fontSize: 9, fontWeight: '800' },
  expenseAmount: { color: '#FFFFFF', fontSize: 22, fontWeight: '900', marginTop: 2 },
  expenseMeta: { color: '#64748B', fontSize: 7.5, marginTop: 3 },
  question: { color: '#FFFFFF', fontSize: 13, fontWeight: '900', marginTop: 18, marginBottom: 8 },
  option: {
    minHeight: 62,
    borderRadius: 14,
    backgroundColor: '#0E1A2A',
    borderWidth: 1,
    borderColor: '#24415F',
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 8,
  },
  optionActive: { backgroundColor: '#0E78F5', borderColor: '#23A7FF' },
  radio: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: '#64748B',
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioActive: { borderColor: '#FFFFFF' },
  radioDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#FFFFFF' },
  optionTitle: { color: '#FFFFFF', fontSize: 11, fontWeight: '900' },
  optionSub: { color: '#94A3B8', fontSize: 7.5, marginTop: 2 },
  editor: {
    marginTop: -2,
    marginBottom: 8,
    backgroundColor: '#0B1726',
    borderRadius: 12,
    padding: 10,
    borderWidth: 1,
    borderColor: '#1B2B40',
  },
  editorLabel: { color: '#94A3B8', fontSize: 8, fontWeight: '800' },
  editorInput: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '900',
    paddingVertical: 7,
  },
  percentRow: { flexDirection: 'row', alignItems: 'center' },
  percentInput: { flex: 1 },
  percentSymbol: { color: '#FFFFFF', fontSize: 18, fontWeight: '900' },
  previewTitle: { color: '#FFFFFF', fontSize: 11, fontWeight: '900', marginTop: 10, marginBottom: 7 },
  previewCard: {
    backgroundColor: '#0E1A2A',
    borderRadius: 15,
    borderWidth: 1,
    borderColor: '#24415F',
    padding: 12,
  },
  previewPerson: { flexDirection: 'row', alignItems: 'center' },
  avatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarBlue: { backgroundColor: '#1677FF' },
  avatarPink: { backgroundColor: '#D9366F' },
  previewText: { marginLeft: 9 },
  previewName: { color: '#94A3B8', fontSize: 8, fontWeight: '800' },
  previewAmount: { color: '#FFFFFF', fontSize: 17, fontWeight: '900', marginTop: 2 },
  previewDivider: { height: 1, backgroundColor: '#1B2B40', marginVertical: 10 },
  confirmButton: {
    marginTop: 18,
    minHeight: 48,
    borderRadius: 13,
    backgroundColor: '#1677FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmText: { color: '#FFFFFF', fontSize: 11, fontWeight: '900' },
  disabled: { opacity: 0.45 },
});
