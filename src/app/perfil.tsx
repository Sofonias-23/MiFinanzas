import { router, useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BottomNav } from '@/components/bottom-nav';
import { useFinance } from '@/context/finance-context';
import { supabase } from '@/lib/supabase';

type PartnerStatus = {
  household_id: string | null;
  my_role: string | null;
  partner_name: string | null;
  member_count: number;
  invite_code: string | null;
};

export default function PerfilScreen() {
  const {
    user,
    authLoading,
    signOut,
    resetFinanceData,
  } = useFinance();

  const [partnerStatus, setPartnerStatus] = useState<PartnerStatus | null>(null);
  const [resetting, setResetting] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) router.replace('/login');
  }, [authLoading, user]);

  const loadPartnerStatus = useCallback(async () => {
    if (!user) return;

    const { data, error } = await supabase.rpc('get_partner_status');
    if (error) {
      console.warn('No se pudo cargar el estado de pareja:', error.message);
      return;
    }

    setPartnerStatus((data?.[0] ?? null) as PartnerStatus | null);
  }, [user]);

  useFocusEffect(
    useCallback(() => {
      loadPartnerStatus();
    }, [loadPartnerStatus])
  );

  if (authLoading || !user) return null;

  const displayName =
    user.user_metadata?.display_name || user.email?.split('@')[0] || 'Usuario';

  const handleReset = () => {
    Alert.alert(
      'Empezar de cero',
      'Se borrarán solo tus datos personales: gastos personales, ingresos, deudas, categorías y métodos de pago. Los gastos compartidos y la vinculación con tu pareja se conservarán. Esta acción no se puede deshacer.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Borrar mis datos',
          style: 'destructive',
          onPress: async () => {
            try {
              setResetting(true);
              await resetFinanceData();
              Alert.alert('Listo', 'Tus datos personales se reiniciaron. Tus gastos compartidos y tu vinculación de pareja se conservaron.');
            } catch (error: any) {
              Alert.alert(
                'No se pudo reiniciar',
                error?.message ?? 'Inténtalo nuevamente.'
              );
            } finally {
              setResetting(false);
            }
          },
        },
      ]
    );
  };

  const handleSignOut = async () => {
    await signOut();
    router.replace('/login');
  };

  const linked = (partnerStatus?.member_count ?? 0) >= 2;

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <ScrollView
        style={styles.flex}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.title}>Mi cuenta</Text>

        <View style={styles.profileCard}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{displayName.slice(0, 1).toUpperCase()}</Text>
          </View>
          <View style={styles.profileText}>
            <Text style={styles.name}>{displayName}</Text>
            <Text style={styles.email}>{user.email}</Text>
          </View>
        </View>

        <Text style={styles.sectionTitle}>Configuración</Text>

        <View style={styles.menuCard}>
          <MenuRow
            icon="🏷️"
            title="Categorías"
            subtitle="Organiza tus gastos"
            onPress={() => router.push('/categorias')}
          />
          <Divider />
          <MenuRow
            icon="💳"
            title="Métodos de pago"
            subtitle="Yape, efectivo, tarjetas..."
            onPress={() => router.push('/metodos-pago')}
          />
          <Divider />
          <MenuRow
            icon="🧾"
            title="Deudas"
            subtitle="Lo que te deben y lo que debes"
            onPress={() => router.push('/deudas')}
          />
          <Divider />
          <MenuRow
            icon="👥"
            title="Pareja"
            subtitle={
              linked
                ? `Vinculado con ${partnerStatus?.partner_name ?? 'tu pareja'}`
                : partnerStatus?.invite_code
                ? 'Invitación pendiente'
                : 'No vinculada'
            }
            onPress={() => router.push('/pareja')}
          />
        </View>

        <Text style={styles.sectionTitle}>Tus datos</Text>

        <View style={styles.dangerCard}>
          <Text style={styles.dangerTitle}>⚠️ Empezar de cero</Text>
          <Text style={styles.dangerText}>
            Borra solo tus datos personales. Los gastos compartidos y la vinculación con tu pareja se conservan.
          </Text>
          <TouchableOpacity
            style={[styles.resetButton, resetting && styles.disabled]}
            onPress={handleReset}
            disabled={resetting}
          >
            <Text style={styles.resetText}>
              {resetting ? 'Borrando...' : 'Reiniciar mis datos'}
            </Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.logoutButton} onPress={handleSignOut}>
          <Text style={styles.logoutText}>Cerrar sesión</Text>
        </TouchableOpacity>
      </ScrollView>

      <BottomNav active="perfil" />
    </SafeAreaView>
  );
}

function MenuRow({
  icon,
  title,
  subtitle,
  onPress,
}: {
  icon: string;
  title: string;
  subtitle: string;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity style={styles.menuRow} onPress={onPress}>
      <View style={styles.menuLeft}>
        <Text style={styles.menuIcon}>{icon}</Text>
        <View style={styles.menuText}>
          <Text style={styles.menuTitle}>{title}</Text>
          <Text style={styles.menuSubtitle}>{subtitle}</Text>
        </View>
      </View>
      <Text style={styles.arrow}>›</Text>
    </TouchableOpacity>
  );
}

function Divider() {
  return <View style={styles.divider} />;
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  container: { flex: 1, backgroundColor: '#0B1220' },
  content: { padding: 20, paddingBottom: 34 },
  title: { color: '#FFFFFF', fontSize: 28, fontWeight: '800', marginBottom: 18 },
  profileCard: {
    backgroundColor: '#111827',
    borderRadius: 18,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: '#1D4ED8',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 13,
  },
  avatarText: { color: '#FFFFFF', fontSize: 21, fontWeight: '800' },
  profileText: { flex: 1 },
  name: { color: '#FFFFFF', fontSize: 17, fontWeight: '800' },
  email: { color: '#64748B', fontSize: 12, marginTop: 3 },
  sectionTitle: {
    color: '#94A3B8',
    fontSize: 12,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.7,
    marginTop: 24,
    marginBottom: 9,
  },
  menuCard: { backgroundColor: '#111827', borderRadius: 17, overflow: 'hidden' },
  menuRow: {
    minHeight: 68,
    paddingHorizontal: 15,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  menuLeft: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  menuIcon: { fontSize: 21, width: 34 },
  menuText: { flex: 1 },
  menuTitle: { color: '#FFFFFF', fontSize: 14, fontWeight: '700' },
  menuSubtitle: { color: '#64748B', fontSize: 10, marginTop: 2 },
  arrow: { color: '#64748B', fontSize: 25 },
  divider: { height: 1, backgroundColor: '#1E293B', marginLeft: 49 },
  dangerCard: {
    backgroundColor: '#241318',
    borderRadius: 17,
    padding: 16,
    borderWidth: 1,
    borderColor: '#4A1D27',
  },
  dangerTitle: { color: '#FCA5A5', fontSize: 15, fontWeight: '800' },
  dangerText: { color: '#94A3B8', fontSize: 11, lineHeight: 17, marginTop: 6 },
  resetButton: {
    marginTop: 14,
    borderRadius: 13,
    paddingVertical: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#7F1D1D',
    backgroundColor: '#3A171C',
  },
  resetText: { color: '#FCA5A5', fontSize: 13, fontWeight: '800' },
  disabled: { opacity: 0.6 },
  logoutButton: {
    marginTop: 18,
    borderRadius: 14,
    backgroundColor: '#111827',
    paddingVertical: 14,
    alignItems: 'center',
  },
  logoutText: { color: '#CBD5E1', fontSize: 13, fontWeight: '800' },
});
