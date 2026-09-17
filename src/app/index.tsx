import { router } from 'expo-router';
import {
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

export default function HomeScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <View>
            <Text style={styles.saludo}>Hola, Sofonías</Text>
            <Text style={styles.subtitulo}>Resumen financiero</Text>
          </View>

          <TouchableOpacity style={styles.avatar}>
            <Text style={styles.avatarText}>S</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.balanceCard}>
          <Text style={styles.balanceLabel}>Saldo disponible</Text>
          <Text style={styles.balance}>S/ 0.00</Text>

          <View style={styles.balanceRow}>
            <View>
              <Text style={styles.miniLabel}>Ingresos</Text>
              <Text style={styles.ingreso}>+ S/ 0.00</Text>
            </View>

            <View>
              <Text style={styles.miniLabel}>Gastos</Text>
              <Text style={styles.gasto}>- S/ 0.00</Text>
            </View>
          </View>
        </View>

        <Text style={styles.sectionTitle}>Acciones rápidas</Text>

        <View style={styles.actionsRow}>
          <TouchableOpacity
  style={styles.actionCard}
  onPress={() => router.push('/nuevo-gasto')}
>
            <Text style={styles.actionIcon}>＋</Text>
            <Text style={styles.actionTitle}>Gasto</Text>
            <Text style={styles.actionSubtitle}>Registrar</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionCard}>
            <Text style={styles.actionIcon}>↗</Text>
            <Text style={styles.actionTitle}>Ingreso</Text>
            <Text style={styles.actionSubtitle}>Agregar</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionCard}>
            <Text style={styles.actionIcon}>👥</Text>
            <Text style={styles.actionTitle}>Pareja</Text>
            <Text style={styles.actionSubtitle}>Compartidos</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.sectionTitle}>Este mes</Text>

        <View style={styles.monthCard}>
          <View style={styles.monthRow}>
            <Text style={styles.monthLabel}>Presupuesto utilizado</Text>
            <Text style={styles.monthValue}>0%</Text>
          </View>

          <View style={styles.progressBackground}>
            <View style={styles.progressBar} />
          </View>

          <Text style={styles.monthFooter}>
            S/ 0.00 de S/ 0.00
          </Text>
        </View>

        <Text style={styles.sectionTitle}>Gastos compartidos</Text>

        <TouchableOpacity style={styles.sharedCard}>
          <View style={styles.sharedLeft}>
            <View style={styles.sharedIcon}>
              <Text style={styles.sharedIconText}>👥</Text>
            </View>

            <View>
              <Text style={styles.sharedTitle}>Nosotros</Text>
              <Text style={styles.sharedSubtitle}>
                Gastos con tu pareja
              </Text>
            </View>
          </View>

          <Text style={styles.arrow}>›</Text>
        </TouchableOpacity>

        <Text style={styles.sectionTitle}>Movimientos recientes</Text>

        <View style={styles.emptyCard}>
          <Text style={styles.emptyIcon}>🧾</Text>
          <Text style={styles.emptyTitle}>Aún no tienes movimientos</Text>
          <Text style={styles.emptySubtitle}>
            Tus gastos e ingresos aparecerán aquí.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0B1220',
  },

  content: {
    padding: 20,
    paddingBottom: 40,
  },

  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 24,
  },

  saludo: {
    color: '#FFFFFF',
    fontSize: 26,
    fontWeight: '700',
  },

  subtitulo: {
    color: '#94A3B8',
    fontSize: 14,
    marginTop: 4,
  },

  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#2563EB',
    alignItems: 'center',
    justifyContent: 'center',
  },

  avatarText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
  },

  balanceCard: {
    backgroundColor: '#111C30',
    borderRadius: 24,
    padding: 22,
  },

  balanceLabel: {
    color: '#94A3B8',
    fontSize: 14,
  },

  balance: {
    color: '#FFFFFF',
    fontSize: 38,
    fontWeight: '800',
    marginTop: 6,
    marginBottom: 24,
  },

  balanceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },

  miniLabel: {
    color: '#64748B',
    fontSize: 13,
  },

  ingreso: {
    color: '#22C55E',
    fontSize: 17,
    fontWeight: '700',
    marginTop: 4,
  },

  gasto: {
    color: '#F87171',
    fontSize: 17,
    fontWeight: '700',
    marginTop: 4,
  },

  sectionTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
    marginTop: 28,
    marginBottom: 14,
  },

  actionsRow: {
    flexDirection: 'row',
    gap: 10,
  },

  actionCard: {
    flex: 1,
    backgroundColor: '#111827',
    borderRadius: 18,
    paddingVertical: 18,
    alignItems: 'center',
  },

  actionIcon: {
    color: '#60A5FA',
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 8,
  },

  actionTitle: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },

  actionSubtitle: {
    color: '#64748B',
    fontSize: 11,
    marginTop: 3,
  },

  monthCard: {
    backgroundColor: '#111827',
    borderRadius: 18,
    padding: 18,
  },

  monthRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },

  monthLabel: {
    color: '#CBD5E1',
    fontSize: 14,
  },

  monthValue: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },

  progressBackground: {
    height: 10,
    backgroundColor: '#1E293B',
    borderRadius: 20,
    marginTop: 14,
    overflow: 'hidden',
  },

  progressBar: {
    width: '0%',
    height: '100%',
    backgroundColor: '#3B82F6',
  },

  monthFooter: {
    color: '#64748B',
    fontSize: 12,
    marginTop: 10,
  },

  sharedCard: {
    backgroundColor: '#111827',
    borderRadius: 18,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  sharedLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  sharedIcon: {
    width: 46,
    height: 46,
    borderRadius: 14,
    backgroundColor: '#1E293B',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },

  sharedIconText: {
    fontSize: 22,
  },

  sharedTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },

  sharedSubtitle: {
    color: '#64748B',
    fontSize: 12,
    marginTop: 3,
  },

  arrow: {
    color: '#64748B',
    fontSize: 30,
  },

  emptyCard: {
    backgroundColor: '#111827',
    borderRadius: 18,
    padding: 24,
    alignItems: 'center',
  },

  emptyIcon: {
    fontSize: 32,
    marginBottom: 10,
  },

  emptyTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },

  emptySubtitle: {
    color: '#64748B',
    fontSize: 13,
    textAlign: 'center',
    marginTop: 6,
  },
});