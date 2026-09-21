import { StyleProp, StyleSheet, Text, View, ViewStyle } from 'react-native';

import { AppIcon } from '@/components/app-icon';
import { paymentIconName } from '@/lib/icon-map';

export function PaymentBrandIcon({
  slug,
  size = 42,
  selected = false,
  style,
}: {
  slug: string;
  size?: number;
  selected?: boolean;
  style?: StyleProp<ViewStyle>;
}) {
  if (slug === 'yape') {
    return (
      <View
        style={[
          styles.base,
          {
            width: size,
            height: size,
            borderRadius: Math.round(size * 0.28),
            backgroundColor: '#6F2DBD',
          },
          selected && styles.selected,
          style,
        ]}
      >
        <Text style={[styles.brandWord, { fontSize: Math.max(9, Math.round(size * 0.22)) }]}>Yape</Text>
      </View>
    );
  }

  if (slug === 'plin') {
    return (
      <View
        style={[
          styles.base,
          {
            width: size,
            height: size,
            borderRadius: Math.round(size * 0.28),
            backgroundColor: '#00A7C7',
          },
          selected && styles.selected,
          style,
        ]}
      >
        <Text style={[styles.brandWord, { fontSize: Math.max(9, Math.round(size * 0.22)) }]}>Plin</Text>
      </View>
    );
  }

  return (
    <View
      style={[
        styles.base,
        styles.generic,
        {
          width: size,
          height: size,
          borderRadius: Math.round(size * 0.28),
        },
        selected && styles.selected,
        style,
      ]}
    >
      <AppIcon
        name={paymentIconName(slug)}
        size={Math.round(size * 0.48)}
        color={selected ? '#23A7FF' : '#CBD5E1'}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  generic: {
    backgroundColor: '#0E1A2A',
    borderColor: '#24415F',
  },
  selected: {
    borderColor: '#23A7FF',
    borderWidth: 2,
  },
  brandWord: {
    color: '#FFFFFF',
    fontWeight: '900',
    letterSpacing: -0.3,
  },
});
