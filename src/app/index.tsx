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

  useEffect(() => {
    Animated.spring(intro, {
      toValue: 1,
      damping: 15,
      stiffness: 145,
      useNativeDriver: true,
    }).start();
  }, [intro]);

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
      <View pointerEvents="none" style={styles.scenery}>
        <View style={styles.moon} />
        <View style={[styles.mountain, styles.mountainBack]} />
        <View style={[styles.mountain, styles.mountainFront]} />
        <View style={styles.glowBlue} />
        <View style={styles.glowPink} />
      </View>

      <Animated.View
        style={[
          styles.content,
          {
            opacity: intro,
            transform: [
              {
                translateY: intro.interpolate({
                  inputRange: [0, 1],
                  outputRange: [12, 0],
                }),
              },
            ],
          },
        ]}
      >
        <View style={styles.logo}>
          <Text style={styles.logoIcon}>▥</Text>
        </View>

        <Text style={styles.brand}>MiFinanzas</Text>
        <Text style={styles.tagline}>Tu dinero, en armonía</Text>

        <Text style={styles.question}>¿Qué quieres ver?</Text>
        <Text style={styles.helper}>Puedes cambiar de espacio cuando quieras.</Text>

        <TouchableOpacity
          activeOpacity={0.86}
          style={[styles.spaceCard, styles.personalCard]}
          onPress={() => router.push('/mi-dinero')}
        >
          <View style={[styles.iconCircle, styles.iconBlue]}>
            <Text style={styles.spaceIcon}>👤</Text>
          </View>
          <View style={styles.cardText}>
            <Text style={styles.spaceTitle}>Mi dinero</Text>
            <Text style={styles.spaceSubtitle}>Mis gastos, ingresos y metas. Solo para mí.</Text>
          </View>
          <Text style={styles.arrow}>›</Text>
        </TouchableOpacity>

        <TouchableOpacity
          activeOpacity={0.86}
          style={[styles.spaceCard, styles.coupleCard]}
          onPress={() => router.push('/pareja')}
        >
          <View style={[styles.iconCircle, styles.iconPink]}>
            <Text style={styles.spaceIcon}>♥</Text>
          </View>
          <View style={styles.cardText}>
            <Text style={styles.spaceTitle}>Pareja</Text>
            <Text style={styles.spaceSubtitle}>Gastos compartidos para llegar más lejos.</Text>
          </View>
          <Text style={styles.arrow}>›</Text>
        </TouchableOpacity>

        <View style={styles.privacy}>
          <Text style={styles.privacyIcon}>🔒</Text>
          <Text style={styles.privacyText}>
            Tus finanzas personales siguen privadas aunque uses el espacio de pareja.
          </Text>
        </View>

        <View style={styles.promiseRow}>
          <View style={styles.promiseItem}>
            <Text style={styles.promiseIcon}>⚡</Text>
            <Text style={styles.promiseText}>Simple y rápido</Text>
          </View>
          <View style={styles.promiseItem}>
            <Text style={styles.promiseIcon}>👥</Text>
            <Text style={styles.promiseText}>Todo en un lugar</Text>
          </View>
        </View>

        <Text style={styles.footer}>Pequeñas decisiones, grandes planes ♡</Text>
      </Animated.View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#07111F' },
  scenery: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
  },
  moon: {
    position: 'absolute',
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: '#0B2C4F',
    opacity: 0.32,
    right: -20,
    top: 60,
  },
  mountain: {
    position: 'absolute',
    width: 360,
    height: 210,
    backgroundColor: '#0A243B',
    transform: [{ rotate: '45deg' }],
    borderRadius: 28,
  },
  mountainBack: {
    left: -120,
    bottom: -110,
    opacity: 0.72,
  },
  mountainFront: {
    right: -150,
    bottom: -80,
    backgroundColor: '#091C30',
    opacity: 0.92,
  },
  glowBlue: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: '#0F6BEF',
    opacity: 0.08,
    left: -70,
    top: 100,
  },
  glowPink: {
    position: 'absolute',
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: '#F43F75',
    opacity: 0.06,
    right: -80,
    bottom: 150,
  },
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
  logo: {
    width: 64,
    height: 64,
    borderRadius: 20,
    alignSelf: 'center',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1677FF',
    shadowColor: '#1677FF',
    shadowOpacity: 0.25,
    shadowRadius: 18,
  },
  logoIcon: { color: '#FFFFFF', fontSize: 30, fontWeight: '900' },
  brand: {
    color: '#FFFFFF',
    fontSize: 31,
    fontWeight: '900',
    textAlign: 'center',
    letterSpacing: -0.7,
    marginTop: 14,
  },
  tagline: {
    color: '#94A3B8',
    fontSize: 12,
    textAlign: 'center',
    marginTop: 4,
  },
  question: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '900',
    marginTop: 35,
  },
  helper: { color: '#64748B', fontSize: 10, marginTop: 4, marginBottom: 13 },
  spaceCard: {
    minHeight: 115,
    borderRadius: 22,
    padding: 15,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    marginBottom: 11,
  },
  personalCard: {
    backgroundColor: '#102B55',
    borderColor: '#1E65AA',
  },
  coupleCard: {
    backgroundColor: '#34172A',
    borderColor: '#7A2F62',
  },
  iconCircle: {
    width: 58,
    height: 58,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconBlue: { backgroundColor: '#1677FF' },
  iconPink: { backgroundColor: '#D9366F' },
  spaceIcon: { color: '#FFFFFF', fontSize: 27 },
  cardText: { flex: 1, marginLeft: 13 },
  spaceTitle: { color: '#FFFFFF', fontSize: 18, fontWeight: '900' },
  spaceSubtitle: { color: '#94A3B8', fontSize: 9, lineHeight: 14, marginTop: 4 },
  arrow: { color: '#FFFFFF', fontSize: 30, marginLeft: 7 },
  privacy: {
    marginTop: 5,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0E1A2A',
    borderRadius: 14,
    padding: 11,
    borderWidth: 1,
    borderColor: '#1B2B40',
  },
  privacyIcon: { fontSize: 16 },
  privacyText: { color: '#64748B', fontSize: 8, lineHeight: 13, marginLeft: 8, flex: 1 },
  promiseRow: {
    marginTop: 10,
    flexDirection: 'row',
    gap: 8,
  },
  promiseItem: {
    flex: 1,
    backgroundColor: 'rgba(14,26,42,0.88)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#1B2B40',
    paddingVertical: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  promiseIcon: { fontSize: 14 },
  promiseText: { color: '#94A3B8', fontSize: 7.5, fontWeight: '800', marginTop: 3 },
  footer: {
    color: '#64748B',
    fontSize: 10,
    fontStyle: 'italic',
    textAlign: 'center',
    marginTop: 27,
  },
});
