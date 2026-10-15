import { router } from 'expo-router';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const sections = [
  {
    title: 'Qué es SFIQ',
    text: 'SFIQ organiza ingresos, gastos, presupuestos, estadísticas y gastos compartidos en un mismo espacio.',
  },
  {
    title: 'Personal y Pareja',
    text: 'Los movimientos personales permanecen separados. En Pareja solo aparece lo que registras expresamente como compartido.',
  },
  {
    title: 'Contenido educativo',
    text: 'Las guías y calculadoras ayudan a entender decisiones financieras cotidianas. No sustituyen asesoría financiera, contable, tributaria, legal o de inversión.',
  },
  {
    title: 'Proyecto independiente',
    text: 'SFIQ no es un banco, financiera ni plataforma de inversión. El producto se desarrolla como una herramienta independiente de organización financiera.',
  },
];

export default function AcercaScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.back}>‹ Volver</Text>
        </TouchableOpacity>
        <Text style={styles.kicker}>SFIQ · ACERCA</Text>
        <Text style={styles.title}>Finanzas cotidianas, con menos fricción.</Text>
        <Text style={styles.intro}>
          SFIQ ayuda a personas y parejas a registrar, entender y conversar mejor sobre su dinero.
        </Text>

        {sections.map((section) => (
          <View style={styles.card} key={section.title}>
            <Text style={styles.cardTitle}>{section.title}</Text>
            <Text style={styles.cardText}>{section.text}</Text>
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#07111F' },
  content: { padding: 20, paddingBottom: 44 },
  back: { color: '#60A5FA', fontSize: 15, fontWeight: '800' },
  kicker: { color: '#60A5FA', fontSize: 10, fontWeight: '900', letterSpacing: 1.2, marginTop: 24 },
  title: { color: '#FFFFFF', fontSize: 30, lineHeight: 35, fontWeight: '900', marginTop: 10 },
  intro: { color: '#94A3B8', fontSize: 13, lineHeight: 20, marginTop: 10, marginBottom: 10 },
  card: { backgroundColor: '#0E1A2A', borderWidth: 1, borderColor: '#1B2B40', borderRadius: 18, padding: 16, marginTop: 12 },
  cardTitle: { color: '#FFFFFF', fontSize: 14, fontWeight: '900' },
  cardText: { color: '#94A3B8', fontSize: 11, lineHeight: 18, marginTop: 6 },
});
