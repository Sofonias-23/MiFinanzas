import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
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

import { useFinance } from '@/context/finance-context';
import { editableDateTime, parseEditableDateTime } from '@/lib/months';
import { supabase } from '@/lib/supabase';

type IncomeRow = {
  id: string;
  created_by: string;
  amount: number;
  description: string;
  created_at: string;
};

export default function DetalleIngresoScreen() {
  const params = useLocalSearchParams<{ id?: string | string[] }>();
  const incomeId = Array.isArray(params.id) ? params.id[0] : params.id;
  const { user, authLoading, refreshIncomes } = useFinance();

  const [income, setIncome] = useState<IncomeRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [dateTime, setDateTime] = useState('');

  useEffect(() => {
    if (!authLoading && !user) router.replace('/login');
  }, [authLoading, user]);

  useEffect(() => {
    let active = true;

    async function load() {
      if (!user || !incomeId) {
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from('incomes')
        .select('id, created_by, amount, description, created_at')
        .eq('id', incomeId)
        .maybeSingle();

      if (!active) return;

      if (error) {
        Alert.alert('No se pudo cargar el ingreso', error.message);
        setLoading(false);
        return;
      }

      const row = data as IncomeRow | null;
      setIncome(row ? { ...row, amount: Number(row.amount) } : null);

      if (row) {
        setDescription(row.description);
        setAmount(Number(row.amount).toFixed(2));
        setDateTime(editableDateTime(row.created_at));
      }

      setLoading(false);
    }

    void load();
    return () => {
      active = false;
    };
  }, [incomeId, user]);

  const canEdit = Boolean(user && income && income.created_by === user.id);

  async function saveIncome() {
    if (!user || !income || !canEdit) return;

    const parsedAmount = Number(amount.replace(',', '.'));
    const parsedDate = parseEditableDateTime(dateTime);

    if (!description.trim()) {
      Alert.alert('Falta la descripción', 'Escribe una descripción.');
      return;
    }

    if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
      Alert.alert('Monto inválido', 'El monto debe ser mayor a cero.');
      return;
    }

    if (!parsedDate) {
      Alert.alert(
        'Fecha inválida',
        'Usa el formato AAAA-MM-DD HH:mm. Ejemplo: 2026-10-02 14:30.'
      );
      return;
    }

    try {
      setSaving(true);
      const { error } = await supabase
        .from('incomes')
        .update({
          description: description.trim(),
          amount: Math.round(parsedAmount * 100) / 100,
          created_at: parsedDate.toISOString(),
        })
        .eq('id', income.id)
        .eq('created_by', user.id);

      if (error) throw error;

      setIncome({
        ...income,
        description: description.trim(),
        amount: Math.round(parsedAmount * 100) / 100,
        created_at: parsedDate.toISOString(),
      });

      await refreshIncomes();
      setEditing(false);
    } catch (error: any) {
      Alert.alert(
        'No se pudo guardar',
        error?.message ?? 'Inténtalo nuevamente.'
      );
    } finally {
      setSaving(false);
    }
  }

  function deleteIncome() {
    if (!user || !income || !canEdit) return;

    Alert.alert(
      'Eliminar ingreso',
      'Se eliminará de tus movimientos. Esta acción no se puede deshacer.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            const { error } = await supabase
              .from('incomes')
              .delete()
              .eq('id', income.id)
              .eq('created_by', user.id);

            if (error) {
              Alert.alert('No se pudo eliminar', error.message);
              return;
            }

            await refreshIncomes();
            router.back();
          },
        },
      ]
    );
  }

  if (authLoading || loading || !user) return null;

  if (!income) {
    return (
      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
        <View style={styles.notFound}>
          <Text style={styles.notFoundTitle}>Ingreso no disponible</Text>
          <Text style={styles.notFoundText}>
            Puede haberse eliminado o todavía estar sincronizando.
          </Text>
          <TouchableOpacity style={styles.primaryButton} onPress={() => router.back()}>
            <Text style={styles.primaryButtonText}>Volver</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

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
          <View style={styles.header}>
            <TouchableOpacity onPress={() => router.back()}>
              <Text style={styles.back}>‹ Volver</Text>
            </TouchableOpacity>

            {canEdit ? (
              <TouchableOpacity onPress={() => setEditing((value) => !value)}>
                <Text style={styles.editLink}>{editing ? 'Cancelar' : 'Editar'}</Text>
              </TouchableOpacity>
            ) : null}
          </View>

          {!editing ? (
            <>
              <View style={styles.heroCard}>
                <Text style={styles.heroIcon}>💰</Text>
                <Text style={styles.typeBadge}>Ingreso personal</Text>
                <Text style={styles.description}>{income.description}</Text>
                <Text style={styles.amount}>+ S/ {income.amount.toFixed(2)}</Text>
                <Text style={styles.date}>
                  {new Date(income.created_at).toLocaleString('es-PE', {
                    day: '2-digit',
                    month: 'long',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </Text>
              </View>

              <View style={styles.card}>
                <Text style={styles.infoLabel}>Tipo</Text>
                <Text style={styles.infoValue}>Ingreso personal</Text>
              </View>

              {canEdit ? (
                <TouchableOpacity style={styles.deleteButton} onPress={deleteIncome}>
                  <Text style={styles.deleteText}>Eliminar ingreso</Text>
                </TouchableOpacity>
              ) : null}
            </>
          ) : (
            <View style={styles.formCard}>
              <Text style={styles.formTitle}>Modificar ingreso</Text>

              <Text style={styles.label}>Descripción</Text>
              <TextInput
                value={description}
                onChangeText={setDescription}
                style={styles.input}
                placeholderTextColor="#64748B"
                maxLength={120}
              />

              <Text style={styles.label}>Monto</Text>
              <TextInput
                value={amount}
                onChangeText={setAmount}
                style={styles.input}
                keyboardType="decimal-pad"
                placeholderTextColor="#64748B"
              />

              <Text style={styles.label}>Fecha y hora</Text>
              <TextInput
                value={dateTime}
                onChangeText={setDateTime}
                style={styles.input}
                autoCapitalize="none"
                placeholder="2026-10-02 14:30"
                placeholderTextColor="#64748B"
              />
              <Text style={styles.hint}>Formato: AAAA-MM-DD HH:mm</Text>

              <TouchableOpacity
                style={[styles.primaryButton, saving && styles.disabled]}
                disabled={saving}
                onPress={saveIncome}
              >
                <Text style={styles.primaryButtonText}>
                  {saving ? 'Guardando...' : 'Guardar cambios'}
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  container: { flex: 1, backgroundColor: '#07111F' },
  content: { padding: 20, paddingBottom: 44 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  back: { color: '#60A5FA', fontSize: 15, fontWeight: '800' },
  editLink: { color: '#60A5FA', fontSize: 13, fontWeight: '900' },
  heroCard: {
    marginTop: 20,
    backgroundColor: '#103326',
    borderRadius: 23,
    padding: 21,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#1D5B43',
  },
  heroIcon: { fontSize: 34 },
  typeBadge: {
    color: '#86EFAC',
    fontSize: 10,
    fontWeight: '900',
    marginTop: 10,
  },
  description: {
    color: '#FFFFFF',
    fontSize: 21,
    fontWeight: '900',
    textAlign: 'center',
    marginTop: 5,
  },
  amount: { color: '#4ADE80', fontSize: 35, fontWeight: '900', marginTop: 7 },
  date: { color: '#7FA998', fontSize: 9, marginTop: 7, textTransform: 'capitalize' },
  card: {
    marginTop: 15,
    backgroundColor: '#0E1A2A',
    borderRadius: 17,
    padding: 15,
    borderWidth: 1,
    borderColor: '#1B2B40',
  },
  infoLabel: { color: '#64748B', fontSize: 9, fontWeight: '800' },
  infoValue: { color: '#FFFFFF', fontSize: 12, fontWeight: '900', marginTop: 4 },
  deleteButton: {
    marginTop: 14,
    paddingVertical: 13,
    alignItems: 'center',
    borderRadius: 13,
    borderWidth: 1,
    borderColor: '#5A2931',
    backgroundColor: '#241419',
  },
  deleteText: { color: '#F87171', fontSize: 11, fontWeight: '900' },
  formCard: {
    marginTop: 20,
    backgroundColor: '#0E1A2A',
    borderRadius: 20,
    padding: 17,
    borderWidth: 1,
    borderColor: '#1B2B40',
  },
  formTitle: { color: '#FFFFFF', fontSize: 20, fontWeight: '900' },
  label: {
    color: '#94A3B8',
    fontSize: 10,
    fontWeight: '800',
    marginTop: 15,
    marginBottom: 7,
  },
  input: {
    minHeight: 48,
    borderRadius: 13,
    borderWidth: 1,
    borderColor: '#20334B',
    backgroundColor: '#07111F',
    color: '#FFFFFF',
    paddingHorizontal: 13,
    fontSize: 12,
  },
  hint: { color: '#64748B', fontSize: 8, marginTop: 5 },
  primaryButton: {
    marginTop: 18,
    minHeight: 48,
    borderRadius: 14,
    backgroundColor: '#1677FF',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  primaryButtonText: { color: '#FFFFFF', fontSize: 12, fontWeight: '900' },
  disabled: { opacity: 0.5 },
  notFound: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  notFoundTitle: { color: '#FFFFFF', fontSize: 22, fontWeight: '900' },
  notFoundText: {
    color: '#64748B',
    fontSize: 11,
    textAlign: 'center',
    marginTop: 7,
    lineHeight: 17,
  },
});
