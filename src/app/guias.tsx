import { router } from 'expo-router';
import { Linking, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const guides = [
  ['AHORRO', 'Fondo de emergencia: cómo empezar y cuánto ahorrar', 'fondo-emergencia'],
  ['PAREJA', 'Cómo dividir gastos en pareja sin asumir que todo debe ser 50/50', 'gastos-pareja'],
  ['PRESUPUESTO', 'Regla 50/30/20: úsala como referencia, no como obligación', 'regla-50-30-20'],
  ['CONTROL', 'Cómo revisar tus gastos mensuales sin analizar cada compra una por una', 'control-gastos-mensuales'],
  ['PRESUPUESTO', 'Cómo hacer un presupuesto mensual paso a paso', 'presupuesto-mensual'],
  ['AHORRO', 'Cuánto ahorrar al mes: cómo definir una meta realista', 'cuanto-ahorrar-al-mes'],
  ['CONTROL', 'Gastos hormiga: qué son, ejemplos y cómo controlarlos', 'gastos-hormiga'],
  ['DEUDAS', 'Cómo salir de deudas sin desordenar todo tu presupuesto', 'salir-de-deudas'],
  ['CONTROL', 'Cómo controlar gastos variables sin revisar cada compra', 'controlar-gastos-variables'],
  ['PRESUPUESTO', 'Cómo organizar tu presupuesto si tienes sueldo fijo', 'presupuesto-con-sueldo-fijo'],
  ['CRÉDITO', 'Cómo usar una tarjeta de crédito sin perder el control', 'usar-tarjeta-credito'],
  ['ANÁLISIS', 'Cómo detectar en qué se va tu dinero cada mes', 'detectar-en-que-se-va-tu-dinero'],
] as const;

export default function GuiasScreen() {
  async function openGuide(slug: string) {
    await Linking.openURL('https://sfiq.app/guias/' + slug);
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.back}>‹ Volver</Text>
        </TouchableOpacity>

        <Text style={styles.kicker}>BIBLIOTECA SFIQ</Text>
        <Text style={styles.title}>Guías financieras</Text>
        <Text style={styles.subtitle}>
          12 contenidos públicos sobre presupuesto, ahorro, deudas, crédito y gastos en pareja.
        </Text>

        <View style={styles.list}>
          {guides.map(([category, title, slug], index) => (
            <TouchableOpacity
              key={slug}
              style={styles.card}
              onPress={() => void openGuide(slug)}
              activeOpacity={0.8}
            >
              <View style={styles.numberWrap}>
                <Text style={styles.number}>{String(index + 1).padStart(2, '0')}</Text>
              </View>
              <View style={styles.copy}>
                <Text style={styles.category}>{category}</Text>
                <Text style={styles.guideTitle}>{title}</Text>
                <Text style={styles.open}>Abrir guía →</Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.note}>
          <Text style={styles.noteTitle}>Contenido educativo</Text>
          <Text style={styles.noteText}>
            Las guías se abren en sfiq.app y no sustituyen asesoría financiera, contable, tributaria,
            legal o de inversión.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#07111F' },
  content: { padding: 20, paddingBottom: 44 },
  back: { color: '#60A5FA', fontSize: 15, fontWeight: '800' },
  kicker: { color: '#60A5FA', fontSize: 10, fontWeight: '900', letterSpacing: 1.2, marginTop: 24 },
  title: { color: '#FFFFFF', fontSize: 30, fontWeight: '900', marginTop: 8 },
  subtitle: { color: '#94A3B8', fontSize: 12, lineHeight: 19, marginTop: 7 },
  list: { marginTop: 18, gap: 10 },
  card: {
    flexDirection: 'row',
    gap: 12,
    padding: 14,
    borderRadius: 17,
    backgroundColor: '#0E1A2A',
    borderWidth: 1,
    borderColor: '#1B2B40',
  },
  numberWrap: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: '#102C4E',
    alignItems: 'center',
    justifyContent: 'center',
  },
  number: { color: '#60A5FA', fontSize: 11, fontWeight: '900' },
  copy: { flex: 1 },
  category: { color: '#64748B', fontSize: 8, fontWeight: '900', letterSpacing: 0.8 },
  guideTitle: { color: '#FFFFFF', fontSize: 13, lineHeight: 18, fontWeight: '900', marginTop: 4 },
  open: { color: '#60A5FA', fontSize: 9, fontWeight: '900', marginTop: 8 },
  note: {
    marginTop: 18,
    padding: 14,
    borderRadius: 16,
    backgroundColor: '#101A29',
    borderWidth: 1,
    borderColor: '#1B2B40',
  },
  noteTitle: { color: '#FFFFFF', fontSize: 12, fontWeight: '900' },
  noteText: { color: '#94A3B8', fontSize: 9, lineHeight: 15, marginTop: 5 },
});
