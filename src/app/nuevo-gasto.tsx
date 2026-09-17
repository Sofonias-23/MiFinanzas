import { router } from 'expo-router';
import { useState } from 'react';
import {
    SafeAreaView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';

export default function NuevoGastoScreen() {
  const [monto, setMonto] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [tipo, setTipo] = useState<'personal' | 'compartido'>('personal');

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.back}>‹ Volver</Text>
        </TouchableOpacity>

        <Text style={styles.title}>Nuevo gasto</Text>
        <Text style={styles.subtitle}>
          Registra un gasto personal o compartido.
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
          placeholder="Ej. Cine, supermercado, taxi..."
          placeholderTextColor="#64748B"
          value={descripcion}
          onChangeText={setDescripcion}
        />

        <Text style={styles.label}>Tipo de gasto</Text>

        <View style={styles.tipoRow}>
          <TouchableOpacity
            style={[
              styles.tipoButton,
              tipo === 'personal' && styles.tipoActivo,
            ]}
            onPress={() => setTipo('personal')}
          >
            <Text style={styles.tipoIcon}>👤</Text>

            <Text
              style={[
                styles.tipoText,
                tipo === 'personal' && styles.tipoTextActivo,
              ]}
            >
              Personal
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.tipoButton,
              tipo === 'compartido' && styles.tipoActivo,
            ]}
            onPress={() => setTipo('compartido')}
          >
            <Text style={styles.tipoIcon}>👥</Text>

            <Text
              style={[
                styles.tipoText,
                tipo === 'compartido' && styles.tipoTextActivo,
              ]}
            >
              Compartido
            </Text>
          </TouchableOpacity>
        </View>

        {tipo === 'compartido' && (
          <View style={styles.sharedBox}>
            <Text style={styles.sharedTitle}>División</Text>
            <Text style={styles.sharedText}>
              Por ahora se dividirá 50% / 50%.
            </Text>

            {monto !== '' && !isNaN(Number(monto)) && (
              <>
                <Text style={styles.sharedAmount}>
                  Tu parte: S/ {(Number(monto) / 2).toFixed(2)}
                </Text>

                <Text style={styles.sharedAmount}>
                  Pareja: S/ {(Number(monto) / 2).toFixed(2)}
                </Text>
              </>
            )}
          </View>
        )}

        <TouchableOpacity
          style={styles.saveButton}
          onPress={() => {
            console.log({
              monto,
              descripcion,
              tipo,
            });
          }}
        >
          <Text style={styles.saveButtonText}>Guardar gasto</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0B1220',
  },

  content: {
    flex: 1,
    padding: 20,
  },

  back: {
    color: '#60A5FA',
    fontSize: 16,
    marginTop: 10,
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

  tipoRow: {
    flexDirection: 'row',
    gap: 12,
  },

  tipoButton: {
    flex: 1,
    backgroundColor: '#111827',
    borderRadius: 16,
    padding: 18,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#1E293B',
  },

  tipoActivo: {
    borderColor: '#3B82F6',
    backgroundColor: '#172554',
  },

  tipoIcon: {
    fontSize: 26,
    marginBottom: 8,
  },

  tipoText: {
    color: '#94A3B8',
    fontSize: 15,
    fontWeight: '600',
  },

  tipoTextActivo: {
    color: '#FFFFFF',
  },

  sharedBox: {
    backgroundColor: '#111827',
    borderRadius: 16,
    padding: 16,
    marginTop: 20,
  },

  sharedTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },

  sharedText: {
    color: '#64748B',
    marginTop: 4,
    marginBottom: 12,
  },

  sharedAmount: {
    color: '#CBD5E1',
    fontSize: 14,
    marginTop: 4,
  },

  saveButton: {
    backgroundColor: '#2563EB',
    borderRadius: 16,
    padding: 18,
    alignItems: 'center',
    marginTop: 30,
  },

  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '700',
  },
});