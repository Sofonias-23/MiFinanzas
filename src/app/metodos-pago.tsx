import { router } from 'expo-router';
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

const ICONS = ['💵', '📱', '📲', '💳', '🏦', '💰', '🪙', '🧾', '🏧', '💸', '❔'];

export default function MetodosPagoScreen() {
  const {
    user,
    authLoading,
    paymentMethods,
    addPaymentMethod,
    deletePaymentMethod,
  } = useFinance();

  const [name, setName] = useState('');
  const [icon, setIcon] = useState('💳');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) router.replace('/login');
  }, [authLoading, user]);

  const handleAdd = async () => {
    if (!name.trim()) {
      Alert.alert('Falta el nombre', 'Escribe un nombre para el método de pago.');
      return;
    }

    try {
      setSaving(true);
      await addPaymentMethod(name, icon);
      setName('');
      setIcon('💳');
    } catch (error: any) {
      Alert.alert(
        'No se pudo crear',
        error?.message ?? 'No fue posible crear el método de pago.'
      );
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = (id: string, methodName: string) => {
    Alert.alert(
      'Eliminar método de pago',
      `¿Eliminar “${methodName}”? Tus gastos anteriores conservarán ese método en su historial.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            try {
              await deletePaymentMethod(id);
            } catch (error: any) {
              Alert.alert('No se pudo eliminar', error?.message ?? 'Inténtalo nuevamente.');
            }
          },
        },
      ]
    );
  };

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

          <Text style={styles.title}>Métodos de pago</Text>
          <Text style={styles.subtitle}>
            Crea tus propios métodos y elimina los que no uses.
          </Text>

          <View style={styles.createCard}>
            <Text style={styles.label}>Nombre</Text>
            <TextInput
              style={styles.input}
              placeholder="Ej. Yape, Visa BBVA, Efectivo..."
              placeholderTextColor="#64748B"
              value={name}
              onChangeText={setName}
              maxLength={30}
            />

            <Text style={styles.label}>Icono</Text>
            <View style={styles.iconGrid}>
              {ICONS.map((item) => (
                <TouchableOpacity
                  key={item}
                  style={[styles.iconButton, icon === item && styles.iconButtonActive]}
                  onPress={() => setIcon(item)}
                >
                  <Text style={styles.iconText}>{item}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <TouchableOpacity
              style={[styles.addButton, saving && styles.disabled]}
              onPress={handleAdd}
              disabled={saving}
            >
              <Text style={styles.addButtonText}>
                {saving ? 'Creando...' : '＋ Agregar método'}
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.headerRow}>
            <Text style={styles.sectionTitle}>Mis métodos</Text>
            <Text style={styles.count}>{paymentMethods.length}</Text>
          </View>

          <View style={styles.list}>
            {paymentMethods.map((method) => (
              <View key={method.id} style={styles.methodRow}>
                <View style={styles.methodLeft}>
                  <View style={styles.methodIconBox}>
                    <Text style={styles.methodIcon}>{method.icon}</Text>
                  </View>
                  <Text style={styles.methodName}>{method.name}</Text>
                </View>

                <TouchableOpacity
                  style={styles.deleteButton}
                  onPress={() => confirmDelete(method.id, method.name)}
                >
                  <Text style={styles.deleteText}>Eliminar</Text>
                </TouchableOpacity>
              </View>
            ))}
          </View>

          <Text style={styles.note}>
            Debes conservar al menos un método. Eliminarlo no modifica tus gastos anteriores.
          </Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  container: { flex: 1, backgroundColor: '#0B1220' },
  content: { paddingHorizontal: 20, paddingTop: 10, paddingBottom: 50 },
  back: { color: '#60A5FA', fontSize: 16, marginTop: 4 },
  title: { color: '#FFFFFF', fontSize: 30, fontWeight: '800', marginTop: 24 },
  subtitle: { color: '#64748B', fontSize: 14, marginTop: 6, marginBottom: 24 },
  createCard: { backgroundColor: '#111827', borderRadius: 20, padding: 18 },
  label: { color: '#CBD5E1', fontSize: 14, fontWeight: '700', marginBottom: 8, marginTop: 8 },
  input: { backgroundColor: '#0F172A', borderRadius: 14, padding: 15, color: '#FFFFFF', fontSize: 16 },
  iconGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 9, marginTop: 2 },
  iconButton: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#0F172A',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#1E293B',
  },
  iconButtonActive: { borderColor: '#3B82F6', backgroundColor: '#172554' },
  iconText: { fontSize: 21 },
  addButton: {
    backgroundColor: '#2563EB',
    borderRadius: 14,
    padding: 15,
    alignItems: 'center',
    marginTop: 20,
  },
  addButtonText: { color: '#FFFFFF', fontWeight: '800', fontSize: 15 },
  disabled: { opacity: 0.6 },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 28,
    marginBottom: 12,
  },
  sectionTitle: { color: '#FFFFFF', fontSize: 18, fontWeight: '800' },
  count: {
    color: '#94A3B8',
    backgroundColor: '#1E293B',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    overflow: 'hidden',
  },
  list: { gap: 10 },
  methodRow: {
    backgroundColor: '#111827',
    borderRadius: 16,
    padding: 13,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  methodLeft: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  methodIconBox: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: '#1E293B',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  methodIcon: { fontSize: 21 },
  methodName: { color: '#FFFFFF', fontSize: 15, fontWeight: '700', flex: 1 },
  deleteButton: { paddingVertical: 8, paddingHorizontal: 10 },
  deleteText: { color: '#F87171', fontSize: 13, fontWeight: '700' },
  note: {
    color: '#64748B',
    fontSize: 12,
    lineHeight: 18,
    marginTop: 18,
    textAlign: 'center',
  },
});
