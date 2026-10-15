import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useFinance } from '@/context/finance-context';
import { supabase } from '@/lib/supabase';

export default function ContactoScreen() {
  const { user } = useFinance();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [subject, setSubject] = useState('Consulta general');
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (user?.email) setEmail(user.email);
  }, [user?.email]);

  async function submit() {
    const cleanEmail = email.trim();
    const cleanMessage = message.trim();

    if (!cleanEmail.includes('@')) {
      Alert.alert('Correo inválido', 'Escribe un correo válido para poder responderte.');
      return;
    }
    if (cleanMessage.length < 10) {
      Alert.alert('Falta contexto', 'Cuéntanos un poco más sobre tu consulta.');
      return;
    }

    try {
      setSending(true);
      const { error } = await supabase.from('contact_messages').insert({
        name: name.trim() || null,
        email: cleanEmail,
        subject: subject.trim() || 'Consulta general',
        message: cleanMessage,
        source: 'mobile',
      });
      if (error) throw error;
      setMessage('');
      Alert.alert('Mensaje enviado', 'Tu consulta quedó registrada.');
    } catch (error: any) {
      Alert.alert('No se pudo enviar', error?.message ?? 'Inténtalo nuevamente en unos minutos.');
    } finally {
      setSending(false);
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.back}>‹ Volver</Text>
        </TouchableOpacity>
        <Text style={styles.kicker}>SFIQ · CONTACTO</Text>
        <Text style={styles.title}>¿En qué podemos ayudarte?</Text>
        <Text style={styles.intro}>
          Consultas de soporte, privacidad o correcciones de contenido.
        </Text>

        <View style={styles.card}>
          <Label text="Nombre" />
          <TextInput style={styles.input} value={name} onChangeText={setName} placeholder="Cómo te llamamos" placeholderTextColor="#64748B" maxLength={100} />

          <Label text="Correo para responderte" />
          <TextInput style={styles.input} value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" placeholder="tu@correo.com" placeholderTextColor="#64748B" maxLength={254} />

          <Label text="Motivo" />
          <TextInput style={styles.input} value={subject} onChangeText={setSubject} placeholder="Consulta general" placeholderTextColor="#64748B" maxLength={80} />

          <Label text="Mensaje" />
          <TextInput
            style={[styles.input, styles.textarea]}
            value={message}
            onChangeText={setMessage}
            multiline
            textAlignVertical="top"
            placeholder="Describe tu consulta o el problema que encontraste."
            placeholderTextColor="#64748B"
            maxLength={4000}
          />

          <Text style={styles.safety}>
            No envíes contraseñas, números completos de tarjetas ni credenciales bancarias.
          </Text>

          <TouchableOpacity style={[styles.button, sending && styles.disabled]} onPress={submit} disabled={sending}>
            <Text style={styles.buttonText}>{sending ? 'Enviando...' : 'Enviar mensaje'}</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function Label({ text }: { text: string }) {
  return <Text style={styles.label}>{text}</Text>;
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#07111F' },
  content: { padding: 20, paddingBottom: 44 },
  back: { color: '#60A5FA', fontSize: 15, fontWeight: '800' },
  kicker: { color: '#60A5FA', fontSize: 10, fontWeight: '900', letterSpacing: 1.2, marginTop: 24 },
  title: { color: '#FFFFFF', fontSize: 30, lineHeight: 35, fontWeight: '900', marginTop: 10 },
  intro: { color: '#94A3B8', fontSize: 13, lineHeight: 20, marginTop: 10, marginBottom: 14 },
  card: { backgroundColor: '#0E1A2A', borderWidth: 1, borderColor: '#1B2B40', borderRadius: 18, padding: 16 },
  label: { color: '#CBD5E1', fontSize: 10, fontWeight: '900', marginTop: 12, marginBottom: 6 },
  input: { minHeight: 48, borderRadius: 13, borderWidth: 1, borderColor: '#20334B', backgroundColor: '#07111F', color: '#FFFFFF', paddingHorizontal: 13, paddingVertical: 11, fontSize: 13 },
  textarea: { minHeight: 140 },
  safety: { color: '#64748B', fontSize: 9, lineHeight: 14, marginTop: 12 },
  button: { marginTop: 16, backgroundColor: '#1677FF', borderRadius: 13, paddingVertical: 14, alignItems: 'center' },
  buttonText: { color: '#FFFFFF', fontSize: 12, fontWeight: '900' },
  disabled: { opacity: 0.5 },
});
