import { router } from 'expo-router';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

type TabKey = 'inicio' | 'movimientos' | 'estadisticas' | 'perfil';

const ITEMS: { key: TabKey; label: string; icon: string; route: string }[] = [
  { key: 'inicio', label: 'Inicio', icon: '⌂', route: '/mi-dinero' },
  { key: 'movimientos', label: 'Movimientos', icon: '▤', route: '/movimientos' },
  { key: 'estadisticas', label: 'Estadísticas', icon: '▥', route: '/estadisticas' },
  { key: 'perfil', label: 'Perfil', icon: '●', route: '/perfil' },
];

export function BottomNav({ active }: { active: TabKey }) {
  return (
    <View style={styles.container}>
      {ITEMS.slice(0, 2).map((item) => (
        <NavItem key={item.key} item={item} selected={item.key === active} />
      ))}

      <TouchableOpacity
        activeOpacity={0.85}
        style={styles.quickButtonWrap}
        onPress={() => router.push('/nuevo-gasto')}
      >
        <View style={styles.quickButton}>
          <Text style={styles.quickPlus}>＋</Text>
        </View>
        <Text style={styles.quickLabel}>Registrar</Text>
      </TouchableOpacity>

      {ITEMS.slice(2).map((item) => (
        <NavItem key={item.key} item={item} selected={item.key === active} />
      ))}
    </View>
  );
}

function NavItem({
  item,
  selected,
}: {
  item: (typeof ITEMS)[number];
  selected: boolean;
}) {
  return (
    <TouchableOpacity
      style={styles.item}
      onPress={() => {
        if (!selected) router.replace(item.route as any);
      }}
    >
      <Text style={[styles.icon, selected && styles.iconActive]}>{item.icon}</Text>
      <Text style={[styles.label, selected && styles.labelActive]}>{item.label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    backgroundColor: '#0C1626',
    borderTopWidth: 1,
    borderTopColor: '#1B2B40',
    paddingTop: 7,
    paddingBottom: 7,
    paddingHorizontal: 4,
  },
  item: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 46,
    gap: 2,
  },
  icon: {
    color: '#64748B',
    fontSize: 20,
    fontWeight: '900',
  },
  iconActive: { color: '#2F8CFF' },
  label: {
    color: '#64748B',
    fontSize: 8,
    fontWeight: '800',
  },
  labelActive: { color: '#60A5FA' },
  quickButtonWrap: {
    width: 66,
    alignItems: 'center',
    marginTop: -26,
  },
  quickButton: {
    width: 54,
    height: 54,
    borderRadius: 18,
    backgroundColor: '#1677FF',
    borderWidth: 4,
    borderColor: '#0C1626',
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickPlus: {
    color: '#FFFFFF',
    fontSize: 30,
    lineHeight: 34,
    fontWeight: '500',
  },
  quickLabel: {
    color: '#60A5FA',
    fontSize: 8,
    fontWeight: '900',
    marginTop: 2,
  },
});
