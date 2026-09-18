import { router, useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  Share,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useFinance } from '@/context/finance-context';
import { supabase } from '@/lib/supabase';

type PartnerStatus = {
  household_id: string | null;
  my_role: string | null;
  partner_name: string | null;
  member_count: number;
  invite_code: string | null;
};

export default function ParejaScreen() {
  const {
    user,
    authLoading,
    totalSharedExpenses,
    refreshExpenses,
  } = useFinance();

  const [status, setStatus] = useState<PartnerStatus | null>(null);
  const [code, setCode] = useState('');
  const [inviteCode, setInviteCode] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) router.replace('/login');
  }, [authLoading, user]);

  const loadStatus = useCallback(async () => {
    if (!user) return;

    const { data, error } = await supabase.rpc('get_partner_status');
    if (error) {
      Alert.alert('No se pudo cargar', error.message);
      return;
    }

    const next = (data?.[0] ?? null) as PartnerStatus | null;
    setStatus(next);
    setInviteCode(next?.invite_code ?? '');
  }, [user]);

  useFocusEffect(
    useCallback(() => {
      loadStatus();
    }, [loadStatus])
  );

  const generateInvite = async () => {
    try {
      setBusy(true);
      const { data, error } = await supabase.rpc('create_partner_invite');
      if (error) throw error;

      const generated = String(data ?? '');
      setInviteCode(generated);
      await loadStatus();
    } catch (error: any) {
      Alert.alert(
        'No se pudo generar',
        error?.message ?? 'Inténtalo nuevamente.'
      );
    } finally {
      setBusy(false);
    }
  };

  const joinWithCode = async () => {
    const normalized = code.trim().toUpperCase();

    if (normalized.length !== 8) {
      Alert.alert('Código incompleto', 'El código debe tener 8 caracteres.');
      return;
    }

    try {
      setBusy(true);
      const { error } = await supabase.rpc('join_household_by_code', {
        p_code: normalized,
      });
      if (error) throw error;

      setCode('');
      await Promise.all([loadStatus(), refreshExpenses()]);
      Alert.alert('Vinculación completada', 'Ya pueden compartir gastos en MiFinanzas.');
    } catch (error: any) {
      Alert.alert(
        'No se pudo vincular',
        error?.message ?? 'Revisa el código e inténtalo nuevamente.'
      );
    } finally {
      setBusy(false);
    }
  };

  const shareInvite = async () => {
    if (!inviteCode) return;

    await Share.share({
      message:
        `Únete a mi grupo en MiFinanzas. Tu código de invitación es: ${inviteCode}`,
    });
  };

  if (authLoading || !user) return null;

  const linked = (status?.member_count ?? 0) >= 2;

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.back}>‹ Volver</Text>
        </TouchableOpacity>

        <Text style={styles.title}>Pareja</Text>
        <Text style={styles.subtitle}>
          Tus gastos personales siguen siendo privados. Solo se comparten los movimientos que marques como “Compartido”.
        </Text>

        {linked ? (
          <>
            <View style={styles.linkedCard}>
              <View style={styles.peopleIcon}>
                <Text style={styles.peopleIconText}>👥</Text>
              </View>
              <Text style={styles.linkedLabel}>Vinculación activa</Text>
              <Text style={styles.partnerName}>
                Tú + {status?.partner_name ?? 'tu pareja'}
              </Text>
              <Text style={styles.linkedText}>
                Ambos pueden ver los gastos compartidos. Los gastos e ingresos personales siguen siendo privados.
              </Text>
            </View>

            <View style={styles.sharedCard}>
              <Text style={styles.sharedLabel}>Gastos compartidos</Text>
              <Text style={styles.sharedAmount}>
                S/ {totalSharedExpenses.toFixed(2)}
              </Text>
              <TouchableOpacity onPress={() => router.push('/movimientos')}>
                <Text style={styles.sharedLink}>Ver movimientos →</Text>
              </TouchableOpacity>
            </View>
          </>
        ) : (
          <>
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Invitar a mi pareja</Text>
              <Text style={styles.cardText}>
                Genera un código y envíaselo. Tu pareja crea su propia cuenta y escribe ese código.
              </Text>

              {inviteCode ? (
                <>
                  <Text style={styles.codeLabel}>Tu código</Text>
                  <View style={styles.codeBox}>
                    <Text style={styles.code}>{inviteCode}</Text>
                  </View>
                  <Text style={styles.expiry}>Válido durante 7 días.</Text>

                  <TouchableOpacity style={styles.primaryButton} onPress={shareInvite}>
                    <Text style={styles.primaryText}>Compartir código</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.secondaryButton}
                    onPress={generateInvite}
                    disabled={busy}
                  >
                    <Text style={styles.secondaryText}>Generar otro código</Text>
                  </TouchableOpacity>
                </>
              ) : (
                <TouchableOpacity
                  style={styles.primaryButton}
                  onPress={generateInvite}
                  disabled={busy}
                >
                  <Text style={styles.primaryText}>
                    {busy ? 'Generando...' : 'Generar código'}
                  </Text>
                </TouchableOpacity>
              )}
            </View>

            <View style={styles.orRow}>
              <View style={styles.line} />
              <Text style={styles.orText}>o</Text>
              <View style={styles.line} />
            </View>

            <View style={styles.card}>
              <Text style={styles.cardTitle}>Tengo un código</Text>
              <Text style={styles.cardText}>
                Escribe el código que te envió tu pareja.
              </Text>

              <TextInput
                style={styles.input}
                value={code}
                onChangeText={(value) => setCode(value.toUpperCase())}
                placeholder="A1B2C3D4"
                placeholderTextColor="#475569"
                autoCapitalize="characters"
                maxLength={8}
              />

              <TouchableOpacity
                style={[styles.primaryButton, busy && styles.disabled]}
                onPress={joinWithCode}
                disabled={busy}
              >
                <Text style={styles.primaryText}>
                  {busy ? 'Vinculando...' : 'Vincular cuentas'}
                </Text>
              </TouchableOpacity>
            </View>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0B1220' },
  content: { padding: 20, paddingBottom: 40 },
  back: { color: '#60A5FA', fontSize: 16 },
  title: { color: '#FFFFFF', fontSize: 30, fontWeight: '800', marginTop: 22 },
  subtitle: {
    color: '#64748B',
    fontSize: 13,
    lineHeight: 19,
    marginTop: 7,
    marginBottom: 22,
  },
  card: {
    backgroundColor: '#111827',
    borderRadius: 18,
    padding: 18,
  },
  cardTitle: { color: '#FFFFFF', fontSize: 17, fontWeight: '800' },
  cardText: { color: '#64748B', fontSize: 12, lineHeight: 18, marginTop: 6 },
  codeLabel: { color: '#94A3B8', fontSize: 11, marginTop: 20, marginBottom: 7 },
  codeBox: {
    backgroundColor: '#0F172A',
    borderRadius: 15,
    paddingVertical: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#1D4ED8',
  },
  code: {
    color: '#FFFFFF',
    fontSize: 27,
    fontWeight: '900',
    letterSpacing: 4,
  },
  expiry: { color: '#64748B', fontSize: 10, textAlign: 'center', marginTop: 7 },
  primaryButton: {
    backgroundColor: '#2563EB',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 16,
  },
  primaryText: { color: '#FFFFFF', fontSize: 14, fontWeight: '800' },
  secondaryButton: {
    borderRadius: 14,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  secondaryText: { color: '#60A5FA', fontSize: 12, fontWeight: '700' },
  orRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 18,
    gap: 10,
  },
  line: { flex: 1, height: 1, backgroundColor: '#1E293B' },
  orText: { color: '#475569', fontSize: 12 },
  input: {
    backgroundColor: '#0F172A',
    color: '#FFFFFF',
    borderRadius: 14,
    padding: 15,
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: 3,
    textAlign: 'center',
    marginTop: 16,
  },
  disabled: { opacity: 0.6 },
  linkedCard: {
    backgroundColor: '#111827',
    borderRadius: 20,
    padding: 22,
    alignItems: 'center',
  },
  peopleIcon: {
    width: 62,
    height: 62,
    borderRadius: 31,
    backgroundColor: '#172554',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 13,
  },
  peopleIconText: { fontSize: 28 },
  linkedLabel: { color: '#4ADE80', fontSize: 11, fontWeight: '800' },
  partnerName: { color: '#FFFFFF', fontSize: 21, fontWeight: '800', marginTop: 4 },
  linkedText: {
    color: '#64748B',
    fontSize: 12,
    lineHeight: 18,
    textAlign: 'center',
    marginTop: 9,
  },
  sharedCard: {
    backgroundColor: '#111827',
    borderRadius: 18,
    padding: 18,
    marginTop: 14,
  },
  sharedLabel: { color: '#64748B', fontSize: 11 },
  sharedAmount: { color: '#FFFFFF', fontSize: 28, fontWeight: '800', marginTop: 5 },
  sharedLink: { color: '#60A5FA', fontSize: 12, fontWeight: '700', marginTop: 12 },
});
