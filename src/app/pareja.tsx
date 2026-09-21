import { router, useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Alert,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TextInput,
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

function isCurrentMonth(value: string) {
  const date = new Date(value);
  const now = new Date();
  return date.getFullYear() === now.getFullYear() && date.getMonth() === now.getMonth();
}

export default function ParejaScreen() {
  const {
    user,
    authLoading,
    expenses,
    partnerBalance,
    refreshExpenses,
    refreshSettlements,
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
      refreshExpenses();
      refreshSettlements();
    }, [loadStatus, refreshExpenses, refreshSettlements])
  );

  const generateInvite = async () => {
    try {
      setBusy(true);
      const { data, error } = await supabase.rpc('create_partner_invite');
      if (error) throw error;
      setInviteCode(String(data ?? ''));
      await loadStatus();
    } catch (error: any) {
      Alert.alert('No se pudo generar', error?.message ?? 'Inténtalo nuevamente.');
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
      Alert.alert('Listo', 'Ya pueden compartir gastos.');
    } catch (error: any) {
      Alert.alert('No se pudo vincular', error?.message ?? 'Revisa el código.');
    } finally {
      setBusy(false);
    }
  };

  const shareInvite = async () => {
    if (!inviteCode) return;
    await Share.share({
      message: `Únete a mi grupo en MiFinanzas. Código: ${inviteCode}`,
    });
  };

  const linked = (status?.member_count ?? 0) >= 2;
  const partnerName = status?.partner_name ?? 'tu pareja';
  const myName =
    user?.user_metadata?.display_name || user?.email?.split('@')[0] || 'Tú';

  const monthShared = useMemo(
    () =>
      expenses.filter(
        (expense) =>
          expense.type === 'compartido' && isCurrentMonth(expense.createdAt)
      ),
    [expenses]
  );

  const monthTotal = useMemo(
    () => monthShared.reduce((sum, expense) => sum + expense.amount, 0),
    [monthShared]
  );

  const paidByMe = useMemo(
    () =>
      monthShared
        .filter((expense) => expense.payerId === user?.id)
        .reduce((sum, expense) => sum + expense.amount, 0),
    [monthShared, user]
  );

  const paidByPartner = Math.max(0, monthTotal - paidByMe);

  const recentShared = useMemo(
    () => expenses.filter((expense) => expense.type === 'compartido').slice(0, 4),
    [expenses]
  );

  const balanceAbs = Math.abs(partnerBalance);
  const balanceText =
    partnerBalance > 0.005
      ? `${partnerName} te debe`
      : partnerBalance < -0.005
      ? `Debes a ${partnerName}`
      : 'Están al día';

  if (authLoading || !user) return null;

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <ScrollView
        style={styles.flex}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.topRow}>
          <View>
            <Text style={styles.eyebrow}>🩷 PAREJA</Text>
            <Text style={styles.title}>Juntos, pero claro</Text>
          </View>
          <TouchableOpacity style={styles.gear} onPress={() => router.push('/perfil')}>
            <Text style={styles.gearText}>⚙️</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.spaceSwitch}>
          <TouchableOpacity style={styles.spacePill} onPress={() => router.replace('/mi-dinero')}>
            <Text style={styles.spacePillText}>Mi dinero</Text>
          </TouchableOpacity>
          <View style={[styles.spacePill, styles.spacePillActive]}>
            <Text style={styles.spacePillActiveText}>Pareja</Text>
          </View>
        </View>

        {linked ? (
          <>
            <View style={styles.peopleCard}>
              <View style={styles.person}>
                <View style={[styles.avatar, styles.avatarBlue]}>
                  <Text style={styles.avatarText}>{myName.slice(0, 1).toUpperCase()}</Text>
                </View>
                <Text style={styles.personName}>{myName}</Text>
              </View>
              <Text style={styles.heart}>♥</Text>
              <View style={styles.person}>
                <View style={[styles.avatar, styles.avatarPink]}>
                  <Text style={styles.avatarText}>{partnerName.slice(0, 1).toUpperCase()}</Text>
                </View>
                <Text style={styles.personName}>{partnerName}</Text>
              </View>
            </View>

            <View style={styles.balanceCard}>
              <Text style={styles.balanceLabel}>Balance actual</Text>
              <Text style={styles.balanceTitle}>{balanceText}</Text>
              <Text
                style={[
                  styles.balanceAmount,
                  partnerBalance > 0.005 && styles.balanceGreen,
                  partnerBalance < -0.005 && styles.balanceRed,
                ]}
              >
                S/ {balanceAbs.toFixed(2)}
              </Text>

              <View style={styles.balanceActions}>
                <TouchableOpacity
                  style={[styles.mainAction, styles.sharedAction]}
                  onPress={() => router.push('/nuevo-gasto?type=compartido' as any)}
                >
                  <Text style={styles.mainActionText}>＋ Compartido</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.mainAction, styles.settleAction]}
                  onPress={() =>
                    balanceAbs >= 0.01
                      ? router.push('/saldar-deuda')
                      : router.push('/deudas')
                  }
                >
                  <Text style={styles.mainActionText}>▣ {balanceAbs >= 0.01 ? 'Saldar' : 'Historial'}</Text>
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.monthCard}>
              <View style={styles.monthHeader}>
                <View>
                  <Text style={styles.monthLabel}>Gastado juntos este mes</Text>
                  <Text style={styles.monthAmount}>S/ {monthTotal.toFixed(2)}</Text>
                </View>
                <TouchableOpacity onPress={() => router.push('/estadisticas?scope=pareja' as any)}>
                  <Text style={styles.link}>Ver estadísticas</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.payRow}>
                <View style={styles.payCard}>
                  <Text style={styles.payIcon}>👤</Text>
                  <Text style={styles.payLabel}>Pagaste tú</Text>
                  <Text style={styles.payBlue}>S/ {paidByMe.toFixed(2)}</Text>
                </View>
                <View style={styles.payCard}>
                  <Text style={styles.payIcon}>🩷</Text>
                  <Text style={styles.payLabel}>Pagó {partnerName}</Text>
                  <Text style={styles.payPink}>S/ {paidByPartner.toFixed(2)}</Text>
                </View>
              </View>
            </View>

            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Últimos gastos</Text>
              <TouchableOpacity onPress={() => router.push('/movimientos?filter=compartido' as any)}>
                <Text style={styles.link}>Ver todos</Text>
              </TouchableOpacity>
            </View>

            {recentShared.length === 0 ? (
              <View style={styles.emptyCard}>
                <Text style={styles.emptyTitle}>Aún no hay gastos juntos</Text>
                <Text style={styles.emptyText}>Registra el primero en “＋ Compartido”.</Text>
              </View>
            ) : (
              <View style={styles.list}>
                {recentShared.map((expense) => {
                  const payer = expense.payerId === user.id ? 'Tú' : partnerName;
                  const myPart =
                    expense.createdBy === user.id
                      ? expense.myShare
                      : expense.partnerShare;

                  return (
                    <View key={expense.id} style={styles.expenseRow}>
                      <TouchableOpacity
                        style={styles.expenseMain}
                        onPress={() => router.push(`/detalle-gasto?id=${expense.id}` as any)}
                      >
                        <View style={styles.expenseText}>
                          <Text style={styles.expenseTitle}>{expense.description}</Text>
                          <Text style={styles.expenseMeta}>
                            Pagó {payer} · Tu parte S/ {myPart.toFixed(2)}
                          </Text>
                          <Text style={styles.expenseDate}>
                            {new Date(expense.createdAt).toLocaleDateString('es-PE')}
                          </Text>
                        </View>
                        <Text style={styles.expenseAmount}>S/ {expense.amount.toFixed(2)}</Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={styles.chatMini}
                        onPress={() => router.push(`/chat-gasto?id=${expense.id}` as any)}
                      >
                        <Text style={styles.chatMiniText}>💬 Chat</Text>
                      </TouchableOpacity>
                    </View>
                  );
                })}
              </View>
            )}

            <View style={styles.shortcutRow}>
              <TouchableOpacity
                style={styles.shortcut}
                onPress={() => router.push('/presupuestos?scope=pareja' as any)}
              >
                <Text style={styles.shortcutIcon}>📊</Text>
                <Text style={styles.shortcutText}>Presupuesto</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.shortcut}
                onPress={() => router.push('/deudas')}
              >
                <Text style={styles.shortcutIcon}>⚖️</Text>
                <Text style={styles.shortcutText}>Deudas</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.shortcut}
                onPress={() => router.push('/estadisticas?scope=pareja' as any)}
              >
                <Text style={styles.shortcutIcon}>▥</Text>
                <Text style={styles.shortcutText}>Estadísticas</Text>
              </TouchableOpacity>
            </View>
          </>
        ) : (
          <>
            <View style={styles.linkCard}>
              <Text style={styles.linkCardIcon}>👥</Text>
              <Text style={styles.linkCardTitle}>Vincula a tu pareja</Text>
              <Text style={styles.linkCardText}>
                Cada uno mantiene su cuenta. Solo compartirán lo que registren como “Compartido”.
              </Text>

              {inviteCode ? (
                <>
                  <View style={styles.codeBox}>
                    <Text style={styles.code}>{inviteCode}</Text>
                  </View>
                  <TouchableOpacity style={styles.primaryButton} onPress={shareInvite}>
                    <Text style={styles.primaryText}>Compartir código</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={generateInvite} disabled={busy}>
                    <Text style={styles.secondaryText}>Generar otro</Text>
                  </TouchableOpacity>
                </>
              ) : (
                <TouchableOpacity style={styles.primaryButton} onPress={generateInvite} disabled={busy}>
                  <Text style={styles.primaryText}>{busy ? 'Generando...' : 'Generar código'}</Text>
                </TouchableOpacity>
              )}
            </View>

            <View style={styles.orRow}>
              <View style={styles.line} />
              <Text style={styles.orText}>o</Text>
              <View style={styles.line} />
            </View>

            <View style={styles.linkCard}>
              <Text style={styles.linkCardTitle}>Tengo un código</Text>
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
                <Text style={styles.primaryText}>{busy ? 'Vinculando...' : 'Vincular cuentas'}</Text>
              </TouchableOpacity>
            </View>
          </>
        )}
      </ScrollView>

      <BottomNav active="inicio" />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  container: { flex: 1, backgroundColor: '#07111F' },
  content: { padding: 18, paddingBottom: 34 },
  topRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  eyebrow: { color: '#F472B6', fontSize: 10, fontWeight: '900', letterSpacing: 0.8 },
  title: { color: '#FFFFFF', fontSize: 20, fontWeight: '900', marginTop: 3 },
  gear: { width: 38, height: 38, borderRadius: 12, backgroundColor: '#0E1A2A', alignItems: 'center', justifyContent: 'center' },
  gearText: { fontSize: 17 },
  spaceSwitch: { flexDirection: 'row', backgroundColor: '#0E1A2A', padding: 4, borderRadius: 14, marginTop: 16 },
  spacePill: { flex: 1, minHeight: 38, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  spacePillActive: { backgroundColor: '#D9366F' },
  spacePillText: { color: '#64748B', fontSize: 11, fontWeight: '900' },
  spacePillActiveText: { color: '#FFFFFF', fontSize: 11, fontWeight: '900' },
  peopleCard: { marginTop: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 18, paddingVertical: 13 },
  person: { alignItems: 'center' },
  avatar: { width: 50, height: 50, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  avatarBlue: { backgroundColor: '#1677FF' },
  avatarPink: { backgroundColor: '#D9366F' },
  avatarText: { color: '#FFFFFF', fontSize: 18, fontWeight: '900' },
  personName: { color: '#CBD5E1', fontSize: 10, fontWeight: '900', marginTop: 5, maxWidth: 90 },
  heart: { color: '#F43F75', fontSize: 25 },
  balanceCard: { backgroundColor: '#34172A', borderRadius: 22, padding: 18, borderWidth: 1, borderColor: '#5C294B' },
  balanceLabel: { color: '#C9A8B9', fontSize: 9, fontWeight: '800' },
  balanceTitle: { color: '#FFFFFF', fontSize: 15, fontWeight: '900', marginTop: 5 },
  balanceAmount: { color: '#CBD5E1', fontSize: 33, fontWeight: '900', marginTop: 3 },
  balanceGreen: { color: '#4ADE80' },
  balanceRed: { color: '#F472B6' },
  balanceActions: { flexDirection: 'row', gap: 8, marginTop: 14 },
  mainAction: { flex: 1, borderRadius: 13, minHeight: 46, alignItems: 'center', justifyContent: 'center' },
  sharedAction: { backgroundColor: '#F43F75' },
  settleAction: { backgroundColor: '#273B5C' },
  mainActionText: { color: '#FFFFFF', fontSize: 11, fontWeight: '900' },
  monthCard: { backgroundColor: '#0E1A2A', borderRadius: 18, padding: 15, marginTop: 12, borderWidth: 1, borderColor: '#1B2B40' },
  monthHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  monthLabel: { color: '#94A3B8', fontSize: 9, fontWeight: '800' },
  monthAmount: { color: '#FFFFFF', fontSize: 22, fontWeight: '900', marginTop: 4 },
  link: { color: '#60A5FA', fontSize: 9, fontWeight: '900' },
  payRow: { flexDirection: 'row', gap: 8, marginTop: 12 },
  payCard: { flex: 1, borderRadius: 14, padding: 11, backgroundColor: '#101A29' },
  payIcon: { fontSize: 18 },
  payLabel: { color: '#64748B', fontSize: 8, marginTop: 5 },
  payBlue: { color: '#60A5FA', fontSize: 13, fontWeight: '900', marginTop: 2 },
  payPink: { color: '#F472B6', fontSize: 13, fontWeight: '900', marginTop: 2 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 20, marginBottom: 8 },
  sectionTitle: { color: '#FFFFFF', fontSize: 15, fontWeight: '900' },
  emptyCard: { backgroundColor: '#0E1A2A', borderRadius: 16, padding: 20, alignItems: 'center' },
  emptyTitle: { color: '#FFFFFF', fontSize: 13, fontWeight: '900' },
  emptyText: { color: '#64748B', fontSize: 9, marginTop: 4 },
  list: { gap: 8 },
  expenseRow: { backgroundColor: '#0E1A2A', borderRadius: 15, borderWidth: 1, borderColor: '#1B2B40', overflow: 'hidden' },
  expenseMain: { padding: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  expenseText: { flex: 1, paddingRight: 10 },
  expenseTitle: { color: '#FFFFFF', fontSize: 12, fontWeight: '900' },
  expenseMeta: { color: '#94A3B8', fontSize: 8, marginTop: 3 },
  expenseDate: { color: '#475569', fontSize: 8, marginTop: 2 },
  expenseAmount: { color: '#FFFFFF', fontSize: 12, fontWeight: '900' },
  chatMini: { borderTopWidth: 1, borderTopColor: '#1B2B40', paddingVertical: 8, alignItems: 'center' },
  chatMiniText: { color: '#F472B6', fontSize: 9, fontWeight: '900' },
  shortcutRow: { flexDirection: 'row', gap: 8, marginTop: 12 },
  shortcut: { flex: 1, backgroundColor: '#0E1A2A', borderRadius: 14, paddingVertical: 12, alignItems: 'center', borderWidth: 1, borderColor: '#1B2B40' },
  shortcutIcon: { fontSize: 17 },
  shortcutText: { color: '#CBD5E1', fontSize: 8, fontWeight: '900', marginTop: 4 },
  linkCard: { backgroundColor: '#0E1A2A', borderRadius: 18, padding: 18, marginTop: 14, borderWidth: 1, borderColor: '#1B2B40' },
  linkCardIcon: { fontSize: 31, textAlign: 'center' },
  linkCardTitle: { color: '#FFFFFF', fontSize: 17, fontWeight: '900', textAlign: 'center' },
  linkCardText: { color: '#64748B', fontSize: 10, lineHeight: 15, textAlign: 'center', marginTop: 6 },
  codeBox: { backgroundColor: '#07111F', borderRadius: 13, paddingVertical: 14, alignItems: 'center', marginTop: 15, borderWidth: 1, borderColor: '#EC4899' },
  code: { color: '#FFFFFF', fontSize: 24, fontWeight: '900', letterSpacing: 4 },
  primaryButton: { backgroundColor: '#1677FF', borderRadius: 13, paddingVertical: 13, alignItems: 'center', marginTop: 14 },
  primaryText: { color: '#FFFFFF', fontSize: 11, fontWeight: '900' },
  secondaryText: { color: '#60A5FA', fontSize: 9, fontWeight: '900', textAlign: 'center', marginTop: 12 },
  orRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginVertical: 13 },
  line: { flex: 1, height: 1, backgroundColor: '#1B2B40' },
  orText: { color: '#475569', fontSize: 9 },
  input: { backgroundColor: '#07111F', color: '#FFFFFF', borderRadius: 13, padding: 14, fontSize: 18, fontWeight: '900', letterSpacing: 3, textAlign: 'center', marginTop: 13 },
  disabled: { opacity: 0.5 },
});
