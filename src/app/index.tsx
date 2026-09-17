import { router } from 'expo-router';
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useFinance } from '@/context/finance-context';

export default function HomeScreen() {
  const { expenses, totalMyExpenses, totalSharedExpenses } = useFinance();
  const ingresos = 0;
  const saldo = ingresos - totalMyExpenses;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
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
          <Text style={styles.balance}>S/ {saldo.toFixed(2)}</Text>

          <View style={styles.balanceRow}>
            <View>
              <Text style={styles.miniLabel}>Ingresos</Text>
              <Text style={styles.ingreso}>+ S/ {ingresos.toFixed(2)}</Text>
            </View>

            <View>
              <Text style={styles.miniLabel}>Gastos</Text>
              <Text style={styles.gasto}>- S/ {totalMyExpenses.toFixed(2)}</Text>
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
            <Text style={styles.monthLabel}>Gastos registrados</Text>
            <Text style={styles.monthValue}>S/ {totalMyExpenses.toFixed(2)}</Text>
          </View>

          <View style={styles.progressBackground}>
            <View style={styles.progressBar} />
          </View>

          <Text style={styles.monthFooter}>
            Configuraremos tu presupuesto mensual más adelante.
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
                Total compartido: S/ {totalSharedExpenses.toFixed(2)}
              </Text>
            </View>
          </View>

          <Text style={styles.arrow}>›</Text>
        </TouchableOpacity>

        <Text style={styles.sectionTitle}>Movimientos recientes</Text>

        {expenses.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyIcon}>🧾</Text>
            <Text style={styles.emptyTitle}>Aún no tienes movimientos</Text>
            <Text style={styles.emptySubtitle}>
              Tus gastos e ingresos aparecerán aquí.
            </Text>
          </View>
        ) : (
          <View style={styles.movementsList}>
            {expenses.slice(0, 6).map((expense) => {
              const myPart =
                expense.type === 'compartido' ? expense.amount / 2 : expense.amount;

              return (
                <View key={expense.id} style={styles.movementCard}>
                  <View style={styles.movementLeft}>
                    <View style={styles.movementIcon}>
                      <Text>{expense.type === 'compartido' ? '👥' : '🧾'}</Text>
                    </View>
                    <View style={styles.movementTextWrap}>
                      <Text style={styles.movementTitle} numberOfLines={1}>
                        {expense.description}
                      </Text>
                      <Text style={styles.movementMeta}>
                        {expense.type === 'compartido'
                          ? `Compartido · tu parte S/ ${myPart.toFixed(2)}`
                          : 'Personal'}
                      </Text>
                    </View>
                  </View>

                  <Text style={styles.movementAmount}>
                    - S/ {myPart.toFixed(2)}
                  </Text>
                </View>
              );
            })}
          </View>
        )}
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
  movementsList: {
    gap: 10,
  },
  movementCard: {
    backgroundColor: '#111827',
    borderRadius: 16,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  movementLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  movementIcon: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: '#1E293B',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  movementTextWrap: {
    flex: 1,
  },
  movementTitle: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  movementMeta: {
    color: '#64748B',
    fontSize: 11,
    marginTop: 4,
  },
  movementAmount: {
    color: '#F87171',
    fontSize: 14,
    fontWeight: '700',
    marginLeft: 10,
  },
});
