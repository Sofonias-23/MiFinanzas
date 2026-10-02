import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import {
  isCurrentMonthKey,
  monthLabel,
  shiftMonthKey,
} from '@/lib/months';

type Props = {
  month: string;
  onChange: (month: string) => void;
};

export function MonthNavigator({ month, onChange }: Props) {
  const previousMonth = shiftMonthKey(month, -1);
  const nextMonth = shiftMonthKey(month, 1);
  const disableNext = isCurrentMonthKey(month);

  return (
    <View style={styles.wrap}>
      <TouchableOpacity
        style={styles.arrow}
        activeOpacity={0.8}
        onPress={() => onChange(previousMonth)}
      >
        <Text style={styles.arrowText}>‹</Text>
      </TouchableOpacity>

      <View style={styles.center}>
        <Text style={styles.caption}>PERIODO</Text>
        <Text style={styles.month}>{monthLabel(month)}</Text>
      </View>

      <TouchableOpacity
        style={[styles.arrow, disableNext && styles.disabled]}
        activeOpacity={0.8}
        disabled={disableNext}
        onPress={() => onChange(nextMonth)}
      >
        <Text style={styles.arrowText}>›</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 14,
    marginBottom: 2,
    padding: 9,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: '#1B2B40',
    backgroundColor: '#0E1A2A',
  },
  arrow: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#20334B',
    backgroundColor: '#07111F',
  },
  disabled: { opacity: 0.3 },
  arrowText: { color: '#E2E8F0', fontSize: 26, lineHeight: 28, fontWeight: '700' },
  center: { flex: 1, alignItems: 'center' },
  caption: {
    color: '#64748B',
    fontSize: 8,
    letterSpacing: 1.2,
    fontWeight: '900',
  },
  month: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '900',
    marginTop: 2,
    textTransform: 'capitalize',
  },
});
