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

import { ExpenseCategory, useFinance } from '@/context/finance-context';

export default function NuevoGastoScreen() {
  const { user, authLoading, addExpense, categories, loadingCategories } = useFinance();
  const [monto, setMonto] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [tipo, setTipo] = useState<'personal' | 'compartido'>('personal');
  const [categoria, setCategoria] = useState<ExpenseCategory>('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) router.replace('/login');
  }, [authLoading, user]);

  useEffect(() => {
    if (categories.length > 0 && !categories.some((item) => item.slug === categoria)) {
      setCategoria(categories[0].slug);
    }
  }, [categories, categoria]);

  const amount = Number(monto.replace(',', '.'));
  const isValidAmount = Number.isFinite(amount) && amount > 0;

  const guardarGasto = async () => {
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

    try {
      setSaving(true);
      await addExpense({
        amount,
        description: descripcion.trim(),
        type: tipo,
        category: categoria,
      });
      router.back();
    } catch (error: any) {
      Alert.alert(
        'No se pudo guardar',
        error?.message ?? 'No fue posible guardar el gasto en Supabase.'
      );
    } finally {
      setSaving(false);
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

          <Text style={styles.title}>Nuevo gasto</Text>
          <Text style={styles.subtitle}>Se guardará en tu cuenta de MiFinanzas.</Text>

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
            placeholder="Ej. Cine, supermercado, taxi..."
            placeholderTextColor="#64748B"
            value={descripcion}
            onChangeText={setDescripcion}
          />

          <View style={styles.categoryHeader}>
            <Text style={styles.labelNoMargin}>Categoría</Text>
            <TouchableOpacity onPress={() => router.push('/categorias')}>
              <Text style={styles.manageText}>Administrar</Text>
            </TouchableOpacity>
          </View>

          {loadingCategories ? (
            <Text style={styles.categoryStatus}>Cargando categorías...</Text>
          ) : categories.length === 0 ? (
            <TouchableOpacity style={styles.emptyCategories} onPress={() => router.push('/categorias')}>
              <Text style={styles.emptyCategoriesTitle}>No tienes categorías</Text>
              <Text style={styles.emptyCategoriesText}>Toca aquí para crear la primera.</Text>
            </TouchableOpacity>
          ) : (
            <View style={styles.categoryGrid}>
              {categories.map((item) => {
                const selected = categoria === item.slug;
                return (
                  <TouchableOpacity
                    key={item.id}
                    style={[styles.categoryButton, selected && styles.categoryButtonActive]}
                    onPress={() => setCategoria(item.slug)}
                  >
                    <Text style={styles.categoryIcon}>{item.icon}</Text>
                    <Text style={[styles.categoryText, selected && styles.categoryTextActive]}>
                      {item.name}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          )}

          <Text style={styles.label}>Tipo de gasto</Text>
          <View style={styles.tipoRow}>
            <TouchableOpacity
              style={[styles.tipoButton, tipo === 'personal' && styles.tipoActivo]}
              onPress={() => setTipo('personal')}
            >
              <Text style={styles.tipoIcon}>👤</Text>
              <Text style={[styles.tipoText, tipo === 'personal' && styles.tipoTextActivo]}>
                Personal
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.tipoButton, tipo === 'compartido' && styles.tipoActivo]}
              onPress={() => setTipo('compartido')}
            >
              <Text style={styles.tipoIcon}>👥</Text>
              <Text style={[styles.tipoText, tipo === 'compartido' && styles.tipoTextActivo]}>
                Compartido
              </Text>
            </TouchableOpacity>
          </View>

          {tipo === 'compartido' && (
            <View style={styles.sharedBox}>
              <Text style={styles.sharedTitle}>División</Text>
              <Text style={styles.sharedText}>
                Se dividirá 50% / 50%. Más adelante podrás cambiar el porcentaje.
              </Text>

              {isValidAmount && (
                <>
                  <Text style={styles.sharedAmount}>Tu parte: S/ {(amount / 2).toFixed(2)}</Text>
                  <Text style={styles.sharedAmount}>Pareja: S/ {(amount / 2).toFixed(2)}</Text>
                </>
              )}
            </View>
          )}

          <TouchableOpacity
            style={[styles.saveButton, (saving || categories.length === 0) && styles.saveButtonDisabled]}
            onPress={guardarGasto}
            disabled={saving || categories.length === 0}
          >
            <Text style={styles.saveButtonText}>{saving ? 'Guardando...' : 'Guardar gasto'}</Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  container: { flex: 1, backgroundColor: '#0B1220' },
  content: { paddingHorizontal: 20, paddingTop: 10, paddingBottom: 48 },
  back: { color: '#60A5FA', fontSize: 16, marginTop: 4 },
  title: { color: '#FFFFFF', fontSize: 30, fontWeight: '800', marginTop: 25 },
  subtitle: { color: '#64748B', fontSize: 14, marginTop: 6, marginBottom: 30 },
  label: { color: '#CBD5E1', fontSize: 14, fontWeight: '600', marginBottom: 8, marginTop: 18 },
  labelNoMargin: { color: '#CBD5E1', fontSize: 14, fontWeight: '600' },
  inputMonto: { backgroundColor: '#111827', borderRadius: 18, padding: 20, color: '#FFFFFF', fontSize: 30, fontWeight: '700' },
  input: { backgroundColor: '#111827', borderRadius: 16, padding: 16, color: '#FFFFFF', fontSize: 16 },
  categoryHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 18, marginBottom: 10 },
  manageText: { color: '#60A5FA', fontSize: 13, fontWeight: '700' },
  categoryStatus: { color: '#64748B', fontSize: 13 },
  emptyCategories: { backgroundColor: '#111827', borderRadius: 16, padding: 18, alignItems: 'center' },
  emptyCategoriesTitle: { color: '#FFFFFF', fontSize: 15, fontWeight: '700' },
  emptyCategoriesText: { color: '#64748B', fontSize: 12, marginTop: 4 },
  categoryGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  categoryButton: {
    width: '31%',
    minHeight: 78,
    backgroundColor: '#111827',
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#1E293B',
    paddingHorizontal: 6,
    paddingVertical: 10,
  },
  categoryButtonActive: { borderColor: '#3B82F6', backgroundColor: '#172554' },
  categoryIcon: { fontSize: 22, marginBottom: 5 },
  categoryText: { color: '#94A3B8', fontSize: 11, fontWeight: '700', textAlign: 'center' },
  categoryTextActive: { color: '#FFFFFF' },
  tipoRow: { flexDirection: 'row', gap: 12 },
  tipoButton: { flex: 1, backgroundColor: '#111827', borderRadius: 16, padding: 18, alignItems: 'center', borderWidth: 1, borderColor: '#1E293B' },
  tipoActivo: { borderColor: '#3B82F6', backgroundColor: '#172554' },
  tipoIcon: { fontSize: 26, marginBottom: 8 },
  tipoText: { color: '#94A3B8', fontSize: 15, fontWeight: '600' },
  tipoTextActivo: { color: '#FFFFFF' },
  sharedBox: { backgroundColor: '#111827', borderRadius: 16, padding: 16, marginTop: 20 },
  sharedTitle: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' },
  sharedText: { color: '#64748B', marginTop: 4, marginBottom: 12 },
  sharedAmount: { color: '#CBD5E1', fontSize: 14, marginTop: 4 },
  saveButton: { backgroundColor: '#2563EB', borderRadius: 16, padding: 18, alignItems: 'center', marginTop: 30, marginBottom: 10 },
  saveButtonDisabled: { opacity: 0.6 },
  saveButtonText: { color: '#FFFFFF', fontSize: 17, fontWeight: '700' },
});
