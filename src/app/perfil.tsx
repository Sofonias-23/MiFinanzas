import * as ImagePicker from 'expo-image-picker';
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
import { ProfileAvatar } from '@/components/profile-avatar';
import { useFinance } from '@/context/finance-context';
import { getAvatarUrl, uploadAvatar } from '@/lib/avatar';
import { supabase } from '@/lib/supabase';

type PartnerStatus = {
  household_id: string | null;
  my_role: string | null;
  partner_name: string | null;
  member_count: number;
  invite_code: string | null;
};

type ProfilePreferences = {
  display_name: string | null;
  currency: string;
  budget_alerts_enabled: boolean;
  partner_activity_enabled: boolean;
  avatar_path: string | null;
};

export default function PerfilScreen() {
  const {
    user,
    authLoading,
    signOut,
    resetFinanceData,
  } = useFinance();

  const [partnerStatus, setPartnerStatus] = useState<PartnerStatus | null>(null);
  const [preferences, setPreferences] = useState<ProfilePreferences | null>(null);
  const [resetting, setResetting] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [avatarBusy, setAvatarBusy] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) router.replace('/login');
  }, [authLoading, user]);

  const loadData = useCallback(async () => {
    if (!user) return;

    const [partnerResult, profileResult] = await Promise.all([
      supabase.rpc('get_partner_status'),
      supabase
        .from('profiles')
        .select('display_name, currency, budget_alerts_enabled, partner_activity_enabled, avatar_path')
        .eq('id', user.id)
        .single(),
    ]);

    if (!partnerResult.error) {
      setPartnerStatus((partnerResult.data?.[0] ?? null) as PartnerStatus | null);
    }

    if (!profileResult.error) {
      const next = profileResult.data as ProfilePreferences;
      setPreferences(next);
      setAvatarUrl(await getAvatarUrl(next.avatar_path));
    }
  }, [user]);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  if (authLoading || !user) return null;

  const displayName =
    preferences?.display_name ||
    user.user_metadata?.display_name ||
    user.email?.split('@')[0] ||
    'Usuario';

  const linked = (partnerStatus?.member_count ?? 0) >= 2;

  const pickAvatar = async (source: 'library' | 'camera') => {
    if (!user) return;

    try {
      setAvatarBusy(true);

      if (source === 'library') {
        const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (!permission.granted) {
          Alert.alert(
            'Permiso necesario',
            'Activa el acceso a Fotos para elegir una imagen de perfil.'
          );
          return;
        }
      } else {
        const permission = await ImagePicker.requestCameraPermissionsAsync();
        if (!permission.granted) {
          Alert.alert(
            'Permiso necesario',
            'Activa el acceso a la cámara para tomar una foto.'
          );
          return;
        }
      }

      const result =
        source === 'library'
          ? await ImagePicker.launchImageLibraryAsync({
              mediaTypes: ['images'],
              allowsEditing: true,
              aspect: [1, 1],
              quality: 0.8,
            })
          : await ImagePicker.launchCameraAsync({
              mediaTypes: ['images'],
              allowsEditing: true,
              aspect: [1, 1],
              quality: 0.8,
            });

      if (result.canceled || !result.assets[0]) return;

      const asset = result.assets[0];
      const path = await uploadAvatar({
        userId: user.id,
        uri: asset.uri,
        mimeType: asset.mimeType,
        previousPath: preferences?.avatar_path,
      });

      setPreferences((current) =>
        current ? { ...current, avatar_path: path } : current
      );
      setAvatarUrl(await getAvatarUrl(path));
    } catch (error: any) {
      Alert.alert(
        'No se pudo actualizar la foto',
        error?.message ?? 'Inténtalo nuevamente.'
      );
    } finally {
      setAvatarBusy(false);
    }
  };

  const changeAvatar = () => {
    Alert.alert('Foto de perfil', 'Elige cómo quieres actualizarla.', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Tomar foto', onPress: () => pickAvatar('camera') },
      { text: 'Elegir de Fotos', onPress: () => pickAvatar('library') },
    ]);
  };

  const handleReset = () => {
    Alert.alert(
      'Empezar de cero',
      'Se borrarán solo tus datos personales: gastos personales, ingresos, deudas, presupuestos personales, categorías y métodos de pago. Los gastos compartidos, liquidaciones, presupuestos de pareja y la vinculación con tu pareja se conservarán. Esta acción no se puede deshacer.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Borrar mis datos',
          style: 'destructive',
          onPress: async () => {
            try {
              setResetting(true);
              await resetFinanceData();
              Alert.alert(
                'Datos personales reiniciados',
                'Tu información personal quedó limpia. El espacio de pareja se conservó.'
              );
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

  const handleSignOut = () => {
    Alert.alert(
      'Cerrar sesión',
      '¿Quieres salir de MiFinanzas en este dispositivo?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Cerrar sesión',
          style: 'destructive',
          onPress: async () => {
            try {
              await signOut();
              router.replace('/login');
            } catch (error: any) {
              Alert.alert(
                'No se pudo cerrar sesión',
                error?.message ?? 'Inténtalo nuevamente.'
              );
            }
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <ScrollView
        style={styles.flex}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.title}>Perfil</Text>
        <Text style={styles.subtitle}>Cuenta, privacidad y organización.</Text>

        <TouchableOpacity
          activeOpacity={0.86}
          style={styles.profileCard}
          onPress={changeAvatar}
          disabled={avatarBusy}
        >
          <View style={styles.avatarWrap}>
            <ProfileAvatar
              uri={avatarUrl}
              size={58}
              color="#1677FF"
            />
            <View style={styles.cameraBadge}>
              <Text style={styles.cameraBadgeText}>＋</Text>
            </View>
          </View>

          <View style={styles.profileText}>
            <Text style={styles.name}>{displayName}</Text>
            <Text style={styles.email}>{user.email}</Text>
            <Text style={styles.profileMeta}>
              {avatarBusy ? 'Actualizando foto...' : 'Toca la foto para cambiarla'}
            </Text>
          </View>

          <Text style={styles.arrow}>›</Text>
        </TouchableOpacity>

        <Text style={styles.sectionTitle}>Finanzas</Text>
        <View style={styles.menuCard}>
          <MenuRow
            icon="📊"
            title="Presupuestos"
            subtitle="Límites personales y compartidos"
            onPress={() => router.push('/presupuestos')}
          />
          <Divider />
          <MenuRow
            icon="🏷️"
            title="Categorías"
            subtitle="Organiza en qué gastas"
            onPress={() => router.push('/categorias')}
          />
          <Divider />
          <MenuRow
            icon="💳"
            title="Métodos de pago"
            subtitle="Yape, Plin, efectivo, tarjetas..."
            onPress={() => router.push('/metodos-pago')}
          />
          <Divider />
          <MenuRow
            icon="🧾"
            title="Deudas"
            subtitle="Deudas privadas e historial de liquidaciones"
            onPress={() => router.push('/deudas')}
          />
        </View>

        <Text style={styles.sectionTitle}>Compartido</Text>
        <View style={styles.menuCard}>
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
            accent={linked ? 'green' : undefined}
          />
        </View>

        <Text style={styles.sectionTitle}>Preferencias y privacidad</Text>
        <View style={styles.menuCard}>
          <MenuRow
            icon="⚙️"
            title="Cuenta y preferencias"
            subtitle="Nombre, moneda, avisos y privacidad"
            onPress={() => router.push('/ajustes')}
          />
          <Divider />
          <View style={styles.infoRow}>
            <Text style={styles.infoIcon}>🔒</Text>
            <View style={styles.infoText}>
              <Text style={styles.infoTitle}>Tus datos personales son privados</Text>
              <Text style={styles.infoSubtitle}>
                Solo se comparte aquello que registras expresamente dentro de Pareja.
              </Text>
            </View>
          </View>
        </View>

        <Text style={styles.sectionTitle}>Tus datos</Text>
        <View style={styles.dangerCard}>
          <Text style={styles.dangerTitle}>Empezar de cero</Text>
          <Text style={styles.dangerText}>
            Borra solo tu información personal. El historial y la configuración compartida con tu pareja se mantienen.
          </Text>

          <TouchableOpacity
            style={[styles.resetButton, resetting && styles.disabled]}
            onPress={handleReset}
            disabled={resetting}
          >
            <Text style={styles.resetText}>
              {resetting ? 'Reiniciando...' : 'Reiniciar mis datos personales'}
            </Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={styles.logoutButton}
          onPress={handleSignOut}
        >
          <Text style={styles.logoutText}>Cerrar sesión</Text>
        </TouchableOpacity>

        <Text style={styles.version}>MiFinanzas · desarrollo</Text>
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
  accent,
}: {
  icon: string;
  title: string;
  subtitle: string;
  onPress: () => void;
  accent?: 'green';
}) {
  return (
    <TouchableOpacity style={styles.menuRow} onPress={onPress}>
      <View style={styles.menuLeft}>
        <View style={styles.menuIconBox}>
          <Text style={styles.menuIcon}>{icon}</Text>
        </View>
        <View style={styles.menuText}>
          <Text style={styles.menuTitle}>{title}</Text>
          <Text
            style={[
              styles.menuSubtitle,
              accent === 'green' && styles.menuSubtitleGreen,
            ]}
          >
            {subtitle}
          </Text>
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
  container: { flex: 1, backgroundColor: '#07111F' },
  content: { padding: 20, paddingBottom: 38 },

  title: { color: '#FFFFFF', fontSize: 30, fontWeight: '900' },
  subtitle: { color: '#64748B', fontSize: 12, marginTop: 4 },

  profileCard: {
    marginTop: 18,
    backgroundColor: '#102B55',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: '#1E4E91',
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarWrap: {
    marginRight: 13,
    position: 'relative',
  },
  cameraBadge: {
    position: 'absolute',
    right: -2,
    bottom: -2,
    width: 21,
    height: 21,
    borderRadius: 11,
    backgroundColor: '#23A7FF',
    borderWidth: 2,
    borderColor: '#102B55',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cameraBadgeText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '900',
    lineHeight: 15,
  },
  profileText: { flex: 1 },
  name: { color: '#FFFFFF', fontSize: 17, fontWeight: '900' },
  email: { color: '#94A3B8', fontSize: 10, marginTop: 3 },
  profileMeta: { color: '#60A5FA', fontSize: 9, fontWeight: '800', marginTop: 5 },

  sectionTitle: {
    color: '#94A3B8',
    fontSize: 10,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginTop: 24,
    marginBottom: 8,
  },

  menuCard: {
    backgroundColor: '#0E1A2A',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#1B2B40',
    overflow: 'hidden',
  },
  menuRow: {
    minHeight: 70,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  menuLeft: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  menuIconBox: {
    width: 39,
    height: 39,
    borderRadius: 12,
    backgroundColor: '#16263A',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  menuIcon: { fontSize: 19 },
  menuText: { flex: 1 },
  menuTitle: { color: '#FFFFFF', fontSize: 13, fontWeight: '900' },
  menuSubtitle: { color: '#64748B', fontSize: 9, lineHeight: 14, marginTop: 3 },
  menuSubtitleGreen: { color: '#4ADE80' },
  arrow: { color: '#64748B', fontSize: 28, marginLeft: 8 },
  divider: { height: 1, backgroundColor: '#1B2B40', marginLeft: 63 },

  infoRow: {
    minHeight: 74,
    paddingHorizontal: 15,
    flexDirection: 'row',
    alignItems: 'center',
  },
  infoIcon: { fontSize: 21, width: 39 },
  infoText: { flex: 1 },
  infoTitle: { color: '#FFFFFF', fontSize: 12, fontWeight: '900' },
  infoSubtitle: { color: '#64748B', fontSize: 9, lineHeight: 14, marginTop: 3 },

  dangerCard: {
    backgroundColor: '#241318',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: '#4A1D27',
  },
  dangerTitle: { color: '#FCA5A5', fontSize: 14, fontWeight: '900' },
  dangerText: {
    color: '#94A3B8',
    fontSize: 10,
    lineHeight: 16,
    marginTop: 5,
  },
  resetButton: {
    marginTop: 13,
    borderRadius: 13,
    paddingVertical: 12,
    alignItems: 'center',
    backgroundColor: '#3A171C',
    borderWidth: 1,
    borderColor: '#7F1D1D',
  },
  resetText: { color: '#FCA5A5', fontSize: 11, fontWeight: '900' },
  disabled: { opacity: 0.5 },

  logoutButton: {
    marginTop: 17,
    backgroundColor: '#0E1A2A',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#1B2B40',
    paddingVertical: 14,
    alignItems: 'center',
  },
  logoutText: { color: '#CBD5E1', fontSize: 12, fontWeight: '900' },
  version: {
    color: '#475569',
    fontSize: 9,
    textAlign: 'center',
    marginTop: 16,
  },
});
