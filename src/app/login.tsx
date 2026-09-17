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

export default function LoginScreen() {
  const { user, authLoading, signIn, signUp } = useFinance();
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!authLoading && user) router.replace('/');
  }, [authLoading, user]);

  const submit = async () => {
    if (!email.trim() || !password) {
      Alert.alert('Faltan datos', 'Ingresa tu correo y contraseña.');
      return;
    }

    if (password.length < 6) {
      Alert.alert('Contraseña corta', 'Usa al menos 6 caracteres.');
      return;
    }

    try {
      setBusy(true);
      if (mode === 'login') {
        await signIn(email.trim().toLowerCase(), password);
        router.replace('/');
      } else {
        const loggedIn = await signUp(email.trim().toLowerCase(), password, name);
        if (loggedIn) {
          router.replace('/');
        } else {
          Alert.alert(
            'Revisa tu correo',
            'Supabase envió un mensaje de confirmación. Confirma tu cuenta y luego inicia sesión.'
          );
          setMode('login');
        }
      }
    } catch (error: any) {
      Alert.alert('No se pudo continuar', error?.message ?? 'Ocurrió un error.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <View style={styles.logoCircle}>
            <Text style={styles.logoText}>M</Text>
          </View>

          <Text style={styles.title}>MiFinanzas</Text>
          <Text style={styles.subtitle}>
            Tus gastos personales son privados. Los compartidos podrán sincronizarse con tu pareja.
          </Text>

          <View style={styles.switchRow}>
            <TouchableOpacity
              style={[styles.switchButton, mode === 'login' && styles.switchActive]}
              onPress={() => setMode('login')}
            >
              <Text style={[styles.switchText, mode === 'login' && styles.switchTextActive]}>
                Ingresar
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.switchButton, mode === 'register' && styles.switchActive]}
              onPress={() => setMode('register')}
            >
              <Text style={[styles.switchText, mode === 'register' && styles.switchTextActive]}>
                Crear cuenta
              </Text>
            </TouchableOpacity>
          </View>

          {mode === 'register' && (
            <>
              <Text style={styles.label}>Nombre</Text>
              <TextInput
                style={styles.input}
                placeholder="Tu nombre"
                placeholderTextColor="#64748B"
                value={name}
                onChangeText={setName}
              />
            </>
          )}

          <Text style={styles.label}>Correo</Text>
          <TextInput
            style={styles.input}
            placeholder="correo@ejemplo.com"
            placeholderTextColor="#64748B"
            autoCapitalize="none"
            keyboardType="email-address"
            value={email}
            onChangeText={setEmail}
          />

          <Text style={styles.label}>Contraseña</Text>
          <TextInput
            style={styles.input}
            placeholder="Mínimo 6 caracteres"
            placeholderTextColor="#64748B"
            secureTextEntry
            value={password}
            onChangeText={setPassword}
          />

          <TouchableOpacity style={styles.primaryButton} onPress={submit} disabled={busy}>
            <Text style={styles.primaryButtonText}>
              {busy ? 'Procesando...' : mode === 'login' ? 'Ingresar' : 'Crear cuenta'}
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
  content: { flexGrow: 1, justifyContent: 'center', padding: 24, paddingBottom: 48 },
  logoCircle: {
    width: 70,
    height: 70,
    borderRadius: 22,
    backgroundColor: '#2563EB',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  logoText: { color: '#FFFFFF', fontSize: 34, fontWeight: '800' },
  title: { color: '#FFFFFF', fontSize: 34, fontWeight: '800' },
  subtitle: { color: '#94A3B8', fontSize: 15, lineHeight: 22, marginTop: 8, marginBottom: 26 },
  switchRow: { flexDirection: 'row', backgroundColor: '#111827', padding: 4, borderRadius: 14, marginBottom: 20 },
  switchButton: { flex: 1, alignItems: 'center', paddingVertical: 12, borderRadius: 11 },
  switchActive: { backgroundColor: '#1D4ED8' },
  switchText: { color: '#64748B', fontWeight: '700' },
  switchTextActive: { color: '#FFFFFF' },
  label: { color: '#CBD5E1', fontSize: 14, fontWeight: '700', marginTop: 16, marginBottom: 8 },
  input: { backgroundColor: '#111827', color: '#FFFFFF', borderRadius: 15, padding: 16, fontSize: 16 },
  primaryButton: { backgroundColor: '#2563EB', borderRadius: 16, padding: 18, alignItems: 'center', marginTop: 28 },
  primaryButtonText: { color: '#FFFFFF', fontSize: 17, fontWeight: '800' },
});
