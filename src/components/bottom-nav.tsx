import { router } from 'expo-router';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { AppIcon, AppIconName } from '@/components/app-icon';

type TabKey = 'inicio' | 'movimientos' | 'estadisticas' | 'perfil';
type Mode = 'personal' | 'pareja';

type NavItem = {
  key: TabKey;
  label: string;
  icon: AppIconName;
  route: string;
};

const PERSONAL_ITEMS: NavItem[] = [
  { key: 'inicio', label: 'Inicio', icon: 'home', route: '/mi-dinero' },
  { key: 'movimientos', label: 'Categorías', icon: 'categories', route: '/categorias' },
  { key: 'estadisticas', label: 'Estadísticas', icon: 'stats', route: '/estadisticas?scope=personal' },
  { key: 'perfil', label: 'Perfil', icon: 'profile', route: '/perfil' },
];

const COUPLE_ITEMS: NavItem[] = [
  { key: 'inicio', label: 'Inicio', icon: 'home', route: '/pareja' },
  { key: 'movimientos', label: 'Gastos', icon: 'expenses', route: '/movimientos?filter=compartido' },
  { key: 'estadisticas', label: 'Estadísticas', icon: 'stats', route: '/estadisticas?scope=pareja' },
  { key: 'perfil', label: 'Deudas', icon: 'debts', route: '/deudas' },
];

export function BottomNav({
  active,
  mode = 'personal',
}: {
  active: TabKey;
  mode?: Mode;
}) {
  const items = mode === 'pareja' ? COUPLE_ITEMS : PERSONAL_ITEMS;
  const activeColor = mode === 'pareja' ? '#F43F75' : '#23A7FF';

  return (
    <View style={styles.container}>
      {items.map((item) => {
        const selected = item.key === active;
        return (
          <TouchableOpacity
            key={item.key}
            style={styles.item}
            activeOpacity={0.8}
            onPress={() => {
              if (!selected) router.replace(item.route as any);
            }}
          >
            <View
              style={[
                styles.iconWrap,
                selected && { backgroundColor: activeColor + '22' },
              ]}
            >
              <AppIcon
                name={item.icon}
                size={20}
                color={selected ? activeColor : '#64748B'}
              />
            </View>
            <Text style={[styles.label, selected && { color: activeColor }]}>
              {item.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#081421',
    borderTopWidth: 1,
    borderTopColor: '#17304A',
    paddingTop: 6,
    paddingBottom: 8,
    paddingHorizontal: 6,
  },
  item: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
  },
  iconWrap: {
    width: 30,
    height: 27,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    color: '#64748B',
    fontSize: 8,
    fontWeight: '800',
    marginTop: 2,
  },
});
