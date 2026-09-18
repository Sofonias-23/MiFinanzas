import { router } from 'expo-router';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

type TabKey = 'inicio' | 'movimientos' | 'estadisticas' | 'perfil';

const ITEMS: { key: TabKey; label: string; icon: string; route: string }[] = [
  { key: 'inicio', label: 'Inicio', icon: '⌂', route: '/' },
  { key: 'movimientos', label: 'Movimientos', icon: '▤', route: '/movimientos' },
  { key: 'estadisticas', label: 'Estadísticas', icon: '▥', route: '/estadisticas' },
  { key: 'perfil', label: 'Perfil', icon: '●', route: '/perfil' },
];

export function BottomNav({ active }: { active: TabKey }) {
  return (
    <View style={styles.container}>
      {ITEMS.map((item) => {
        const selected = item.key === active;
        return (
          <TouchableOpacity
            key={item.key}
            style={styles.item}
            onPress={() => {
              if (!selected) router.replace(item.route as any);
            }}
          >
            <Text style={[styles.icon, selected && styles.iconActive]}>{item.icon}</Text>
            <Text style={[styles.label, selected && styles.labelActive]}>{item.label}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: '#0F172A',
    borderTopWidth: 1,
    borderTopColor: '#1E293B',
    paddingTop: 9,
    paddingBottom: 8,
    paddingHorizontal: 8,
  },
  item: {
    flex: 1,
    alignItems: 'center',
    gap: 3,
  },
  icon: {
    color: '#64748B',
    fontSize: 19,
    fontWeight: '800',
  },
  iconActive: {
    color: '#60A5FA',
  },
  label: {
    color: '#64748B',
    fontSize: 10,
    fontWeight: '700',
  },
  labelActive: {
    color: '#60A5FA',
  },
});
