import { router, useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useFinance } from '@/context/finance-context';
import { supabase } from '@/lib/supabase';

type ProfilePreferences = {
  display_name: string | null;
  currency: string;
  budget_alerts_enabled: boolean;
  partner_activity_enabled: boolean;
};

export default function AjustesScreen() {
  const { user, authLoading } = useFinance();

  const [preferences, setPreferences] = useState<ProfilePreferences | null>(null);
  const [name, setName] = useState('');
  const [savingName, setSavingName] = useState(false);
  const [savingPreference, setSavingPreference] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) router.replace('/login');
  }, [authLoading, user]);

  const loadPreferences = useCallback(async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from('profiles')
      .select('display_name, currency, budget_alerts_enabled, partner_activity_enabled')
      .eq('id', user.id)
      .single();

    if (error) {
      Alert.alert('No se pudo cargar', error.message);
      return;
    }

    const next = data as ProfilePreferences;
    setPreferences(next);
    setName(
      next.display_name ||
        user.user_metadata?.display_name ||
        user.email?.split('@')[0] ||
        ''
    );
  }, [user]);

  useFocusEffect(
    useCallback(() => {
      loadPreferences();
    }, [loadPreferences])
  );

  const saveName = async () => {
    if (!user) return;

    const clean = name.trim();
    if (clean.length < 2) {
      Alert.alert('Nombre muy corto', 'Escribe al menos 2 caracteres.');
      return;
    }

    try {
      setSavingName(true);

      const { error: profileError } = await supabase
        .from('profiles')
        .update({ display_name: clean })
        .eq('id', user.id);

      if (profileError) throw profileError;

      const { error: authError } = await supabase.auth.updateUser({
        data: { display_name: clean },
      });

      if (authError) throw authError;

      setPreferences((current) =>
        current ? { ...current, display_name: clean } : current
      );

      Alert.alert('Guardado', 'Tu nombre se actualizó correctamente.');
    } catch (error: any) {
      Alert.alert(
        'No se pudo guardar',
        error?.message ?? 'Inténtalo nuevamente.'
      );
    } finally {
      setSavingName(false);
    }
  };

  const updateToggle = async (
    field: 'budget_alerts_enabled' | 'partner_activity_enabled',
    value: boolean
  ) => {
    if (!user || !preferences || savingPreference) return;

    const previous = preferences[field];
    setPreferences({ ...preferences, [field]: value });

    try {
      setSavingPreference(true);

      const { error } = await supabase
        .from('profiles')
        .update({ [field]: value })
        .eq('id', user.id);

      if (error) throw error;
    } catch (error: any) {
      setPreferences((current) =>
        current ? { ...current, [field]: previous } : current
      );
      Alert.alert(
        'No se pudo actualizar',
        error?.message ?? 'Inténtalo nuevamente.'
      );
    } finally {
      setSavingPreference(false);
    }
  };

  if (authLoading || !user || !preferences) return null;

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

        <Text style={styles.title}>Cuenta y preferencias</Text>
        <Text style={styles.subtitle}>
          Configura cómo quieres usar MiFinanzas.
        </Text>

        <Text style={styles.sectionTitle}>Mi cuenta</Text>
        <View style={styles.card}>
          <Text style={styles.label}>Nombre visible</Text>
          <TextInput
            value={name}
            onChangeText={setName}
            placeholder="Tu nombre"
            placeholderTextColor="#64748B"
            maxLength={40}
            style={styles.input}
          />

          <Text style={styles.emailLabel}>Correo</Text>
          <Text style={styles.email}>{user.email}</Text>

          <TouchableOpacity
            style={[styles.saveButton, savingName && styles.disabled]}
            onPress={saveName}
            disabled={savingName}
          >
            <Text style={styles.saveText}>
              {savingName ? 'Guardando...' : 'Guardar nombre'}
            </Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.sectionTitle}>Moneda</Text>
        <View style={styles.card}>
          <View style={styles.row}>
            <View style={styles.rowLeft}>
              <Text style={styles.icon}>🇵🇪</Text>
              <View>
                <Text style={styles.rowTitle}>Sol peruano</Text>
                <Text style={styles.rowSubtitle}>PEN · Símbolo S/</Text>
              </View>
            </View>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>Predeterminada</Text>
            </View>
          </View>
          <Text style={styles.helper}>
            Por ahora MiFinanzas trabaja en soles. Más adelante podremos añadir
            múltiples monedas sin mezclar los cálculos actuales.
          </Text>
        </View>

        <Text style={styles.sectionTitle}>Avisos</Text>
        <View style={styles.card}>
          <SettingSwitch
            icon="📊"
            title="Alertas de presupuesto"
            subtitle="Avisos cuando te acerques o superes un límite."
            value={preferences.budget_alerts_enabled}
            onChange={(value) =>
              updateToggle('budget_alerts_enabled', value)
            }
          />
          <Divider />
          <SettingSwitch
            icon="👥"
            title="Actividad de pareja"
            subtitle="Preferencia para avisos de gastos y pagos compartidos."
            value={preferences.partner_activity_enabled}
            onChange={(value) =>
              updateToggle('partner_activity_enabled', value)
            }
          />
        </View>

        <Text style={styles.sectionTitle}>Privacidad</Text>
        <View style={styles.privacyCard}>
          <Text style={styles.privacyTitle}>🔒 Separación por diseño</Text>
          <Text style={styles.privacyText}>
            Tus ingresos, gastos personales, deudas privadas y presupuestos
            personales solo pertenecen a tu cuenta.
          </Text>

          <View style={styles.privacyDivider} />

          <Text style={styles.privacyTitle}>👥 En Pareja</Text>
          <Text style={styles.privacyText}>
            Solo se comparte lo que registras expresamente como “Compartido”:
            gastos de pareja, balance, liquidaciones y presupuestos compartidos.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function SettingSwitch({
  icon,
  title,
  subtitle,
  value,
  onChange,
}: {
  icon: string;
  title: string;
  subtitle: string;
  value: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <View style={styles.switchRow}>
      <View style={styles.rowLeft}>
        <Text style={styles.icon}>{icon}</Text>
        <View style={styles.switchText}>
          <Text style={styles.rowTitle}>{title}</Text>
          <Text style={styles.rowSubtitle}>{subtitle}</Text>
        </View>
      </View>
      <Switch value={value} onValueChange={onChange} />
    </View>
  );
}

function Divider() {
  return <View style={styles.divider} />;
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#07111F' },
  content: { padding: 20, paddingBottom: 44 },
  back: { color: '#60A5FA', fontSize: 15, fontWeight: '800' },
  title: { color: '#FFFFFF', fontSize: 29, fontWeight: '900', marginTop: 21 },
  subtitle: { color: '#64748B', fontSize: 12, marginTop: 5 },

  sectionTitle: {
    color: '#94A3B8',
    fontSize: 10,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginTop: 23,
    marginBottom: 8,
  },

  card: {
    backgroundColor: '#0E1A2A',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: '#1B2B40',
  },
  label: { color: '#CBD5E1', fontSize: 11, fontWeight: '900' },
  input: {
    marginTop: 8,
    backgroundColor: '#07111F',
    color: '#FFFFFF',
    borderRadius: 13,
    borderWidth: 1,
    borderColor: '#20334B',
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    fontWeight: '800',
  },
  emailLabel: {
    color: '#64748B',
    fontSize: 9,
    fontWeight: '800',
    marginTop: 14,
  },
  email: { color: '#CBD5E1', fontSize: 12, marginTop: 3 },
  saveButton: {
    marginTop: 15,
    backgroundColor: '#1677FF',
    borderRadius: 13,
    paddingVertical: 13,
    alignItems: 'center',
  },
  saveText: { color: '#FFFFFF', fontSize: 12, fontWeight: '900' },
  disabled: { opacity: 0.5 },

  row: {
    minHeight: 52,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  switchRow: {
    minHeight: 68,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  rowLeft: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  switchText: { flex: 1, paddingRight: 12 },
  icon: { fontSize: 21, width: 36 },
  rowTitle: { color: '#FFFFFF', fontSize: 13, fontWeight: '900' },
  rowSubtitle: {
    color: '#64748B',
    fontSize: 9,
    lineHeight: 14,
    marginTop: 3,
  },
  badge: {
    backgroundColor: '#12382D',
    borderRadius: 9,
    paddingHorizontal: 9,
    paddingVertical: 5,
  },
  badgeText: { color: '#4ADE80', fontSize: 8, fontWeight: '900' },
  helper: {
    color: '#64748B',
    fontSize: 9,
    lineHeight: 14,
    marginTop: 9,
  },
  divider: { height: 1, backgroundColor: '#1B2B40', marginLeft: 36 },

  privacyCard: {
    backgroundColor: '#101A29',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: '#1B2B40',
  },
  privacyTitle: { color: '#FFFFFF', fontSize: 13, fontWeight: '900' },
  privacyText: {
    color: '#94A3B8',
    fontSize: 10,
    lineHeight: 16,
    marginTop: 5,
  },
  privacyDivider: {
    height: 1,
    backgroundColor: '#1B2B40',
    marginVertical: 14,
  },
});
