import { router } from 'expo-router';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const sections = [
  ['Propósito', 'Las guías de SFIQ explican decisiones financieras cotidianas con ejemplos claros y límites explícitos.'],
  ['No es asesoría personalizada', 'El contenido es educativo y no constituye asesoría financiera, contable, tributaria, legal o de inversión.'],
  ['Cómo se prepara', 'Se parte de una pregunta concreta, se revisan conceptos, cálculos y ejemplos y se eliminan afirmaciones que no se puedan sostener.'],
  ['Actualidad y fuentes', 'Cuando un tema depende de normas, tasas, productos o instituciones, se priorizan fuentes oficiales o primarias y se revisa la fecha.'],
  ['Herramientas automáticas e IA', 'Pueden apoyar estructura, edición o detección de inconsistencias, pero el contenido se revisa antes de publicarse.'],
  ['Correcciones', 'Los errores materiales se corrigen y se actualiza la fecha cuando el cambio modifica de forma relevante la explicación.'],
  ['Publicidad', 'La publicidad no determina las conclusiones editoriales ni implica una recomendación de SFIQ.'],
];

export default function PoliticaEditorialScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.back}>‹ Volver</Text>
        </TouchableOpacity>
        <Text style={styles.kicker}>SFIQ · EDITORIAL</Text>
        <Text style={styles.title}>Política editorial</Text>
        <Text style={styles.intro}>
          Cómo elaboramos, revisamos y corregimos el contenido educativo de SFIQ.
        </Text>
        {sections.map(([title, text]) => (
          <View style={styles.card} key={title}>
            <Text style={styles.cardTitle}>{title}</Text>
            <Text style={styles.cardText}>{text}</Text>
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
  title: { color: '#FFFFFF', fontSize: 30, fontWeight: '900', marginTop: 10 },
  intro: { color: '#94A3B8', fontSize: 13, lineHeight: 20, marginTop: 10, marginBottom: 10 },
  card: { backgroundColor: '#0E1A2A', borderWidth: 1, borderColor: '#1B2B40', borderRadius: 18, padding: 16, marginTop: 12 },
  cardTitle: { color: '#FFFFFF', fontSize: 14, fontWeight: '900' },
  cardText: { color: '#94A3B8', fontSize: 11, lineHeight: 18, marginTop: 6 },
});
