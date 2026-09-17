import { router } from 'expo-router';
import { useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useFinance } from '@/context/finance-context';

export default function NuevoIngresoScreen() {
  const { addIncome } = useFinance();
  const [monto, setMonto] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [guardando, setGuardando] = useState(false);

  const amount = Number(monto.replace(',', '.'));
  const isValidAmount = Number.isFinite(amount) && amount > 0;

  const guardarIngreso = async () => {
    if (!isValidAmount) {
      Alert.alert('Monto inválido', 'Ingresa un monto mayor a 0.');
      return;
    }

    if (!descripcion.trim()) {
      Alert.alert('Falta la descripción', 'Escribe de dónde proviene este ingreso.');
      return;
    }

    try {
      setGuardando(true);
      await addIncome({
        amount,
        description: descripcion.trim(),
      });
      router.back();
    } catch (error: any) {
      Alert.alert('No se pudo guardar', error?.message ?? 'Ocurrió un error al guardar el ingreso.');
    } finally {
      setGuardando(false);
    }
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

          <Text style={styles.title}>Nuevo ingreso</Text>
          <Text style={styles.subtitle}>
            Registra dinero que entra a tu cuenta personal.
          </Text>

          <Text style={styles.label}>Monto</Text>
          <TextInput
            style={styles.inputMonto}
            placeholder="S/ 0.00"
            placeholderTextColor="#64748B"
            keyboardType="decimal-pad"
            value={monto}
            onChangeText={setMonto}
          />

          <Text style={styles.label}>Descripción</Text>
          <TextInput
            style={styles.input}
            placeholder="Ej. Sueldo, transferencia, venta..."
            placeholderTextColor="#64748B"
            value={descripcion}
            onChangeText={setDescripcion}
          />

          <TouchableOpacity
            style={[styles.saveButton, guardando && styles.saveButtonDisabled]}
            onPress={guardarIngreso}
            disabled={guardando}
          >
            <Text style={styles.saveButtonText}>
              {guardando ? 'Guardando...' : 'Guardar ingreso'}
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
  content: {
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 48,
  },
  back: {
    color: '#60A5FA',
    fontSize: 16,
    marginTop: 4,
  },
  title: {
    color: '#FFFFFF',
    fontSize: 30,
    fontWeight: '800',
    marginTop: 25,
  },
  subtitle: {
    color: '#64748B',
    fontSize: 14,
    marginTop: 6,
    marginBottom: 30,
  },
  label: {
    color: '#CBD5E1',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
    marginTop: 18,
  },
  inputMonto: {
    backgroundColor: '#111827',
    borderRadius: 18,
    padding: 20,
    color: '#FFFFFF',
    fontSize: 30,
    fontWeight: '700',
  },
  input: {
    backgroundColor: '#111827',
    borderRadius: 16,
    padding: 16,
    color: '#FFFFFF',
    fontSize: 16,
  },
  saveButton: {
    backgroundColor: '#16A34A',
    borderRadius: 16,
    padding: 18,
    alignItems: 'center',
    marginTop: 30,
  },
  saveButtonDisabled: { opacity: 0.6 },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '700',
  },
});
