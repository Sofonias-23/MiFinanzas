import { router } from 'expo-router';
import { useEffect, useRef } from 'react';
import {
  ActivityIndicator,
  Animated,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useFinance } from '@/context/finance-context';

export default function HomeScreen() {
  const { user, authLoading } = useFinance();

  const intro = useRef(new Animated.Value(0)).current;
  const cards = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.timing(intro, {
        toValue: 1,
        duration: 260,
        useNativeDriver: true,
      }),
      Animated.spring(cards, {
        toValue: 1,
        damping: 14,
        stiffness: 145,
        mass: 0.8,
        useNativeDriver: true,
      }),
    ]).start();
  }, [intro, cards]);

  useEffect(() => {
    if (!authLoading && !user) router.replace('/login');
  }, [authLoading, user]);

  if (authLoading || !user) {
    return (
      <SafeAreaView style={styles.loading}>
        <ActivityIndicator size="large" />
        <Text style={styles.loadingText}>Cargando MiFinanzas...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <View style={styles.content}>
        <Animated.View
          style={{
            opacity: intro,
            transform: [
              {
                translateY: intro.interpolate({
                  inputRange: [0, 1],
                  outputRange: [12, 0],
                }),
              },
            ],
          }}
        >
          <Text style={styles.brand}>MiFinanzas</Text>
          <Text style={styles.tagline}>Tu dinero, en equilibrio</Text>

          <View style={styles.heroIcon}>
            <Text style={styles.wallet}>👛</Text>
            <Text style={styles.coin}>🪙</Text>
            <Text style={styles.heart}>♥</Text>
          </View>

          <Text style={styles.question}>¿Qué quieres ver hoy?</Text>
        </Animated.View>

        <Animated.View
          style={[
            styles.cardsRow,
            {
              opacity: cards,
              transform: [
                {
                  translateY: cards.interpolate({
                    inputRange: [0, 1],
                    outputRange: [18, 0],
                  }),
                },
                {
                  scale: cards.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0.96, 1],
                  }),
                },
              ],
            },
          ]}
        >
          <TouchableOpacity
            activeOpacity={0.86}
            style={[styles.spaceCard, styles.personalCard]}
            onPress={() => router.push('/mi-dinero')}
          >
            <View style={styles.iconCircle}>
              <Text style={styles.spaceIcon}>👤</Text>
            </View>
            <View>
              <Text style={styles.spaceTitle}>Mi dinero</Text>
              <Text style={styles.spaceSubtitle}>Solo tus finanzas personales</Text>
            </View>
            <Text style={styles.arrow}>›</Text>
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.86}
            style={[styles.spaceCard, styles.coupleCard]}
            onPress={() => router.push('/pareja')}
          >
            <View style={styles.iconCircle}>
              <Text style={styles.spaceIcon}>👥</Text>
            </View>
            <View>
              <Text style={styles.spaceTitle}>Pareja</Text>
              <Text style={styles.spaceSubtitle}>Finanzas compartidas con tu pareja</Text>
            </View>
            <Text style={styles.arrow}>›</Text>
          </TouchableOpacity>
        </Animated.View>

        <Text style={styles.footerText}>“Juntos por un mejor futuro”</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#07111F' },
  loading: {
    flex: 1,
    backgroundColor: '#07111F',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  loadingText: { color: '#94A3B8' },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 42,
    paddingBottom: 28,
    justifyContent: 'center',
  },
  brand: {
    color: '#FFFFFF',
    fontSize: 31,
    fontWeight: '900',
    textAlign: 'center',
    letterSpacing: -0.7,
  },
  tagline: {
    color: '#94A3B8',
    fontSize: 12,
    textAlign: 'center',
    marginTop: 5,
  },
  heroIcon: {
    height: 145,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
    position: 'relative',
  },
  wallet: { fontSize: 82 },
  coin: { position: 'absolute', fontSize: 34, top: 17, left: '31%' },
  heart: {
    position: 'absolute',
    fontSize: 52,
    color: '#F43F75',
    right: '28%',
    bottom: 14,
  },
  question: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '900',
    marginTop: 6,
    marginBottom: 18,
  },
  cardsRow: { flexDirection: 'row', gap: 12 },
  spaceCard: {
    flex: 1,
    minHeight: 205,
    borderRadius: 23,
    padding: 16,
    justifyContent: 'space-between',
    borderWidth: 1,
  },
  personalCard: {
    backgroundColor: '#1677FF',
    borderColor: '#4A9AFF',
  },
  coupleCard: {
    backgroundColor: '#D9366F',
    borderColor: '#F05C8E',
  },
  iconCircle: {
    width: 52,
    height: 52,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  spaceIcon: { fontSize: 27 },
  spaceTitle: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '900',
  },
  spaceSubtitle: {
    color: 'rgba(255,255,255,0.82)',
    fontSize: 11,
    lineHeight: 16,
    marginTop: 5,
  },
  arrow: {
    color: '#FFFFFF',
    fontSize: 34,
    alignSelf: 'flex-end',
    lineHeight: 34,
  },
  footerText: {
    color: '#64748B',
    fontSize: 11,
    fontStyle: 'italic',
    textAlign: 'center',
    marginTop: 42,
  },
});
