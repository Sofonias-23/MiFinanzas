import { router, useLocalSearchParams } from 'expo-router';
import { type ReactNode, useCallback, useEffect, useState } from 'react';
import {
  Alert,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppIcon } from '@/components/app-icon';
import { PaymentBrandIcon } from '@/components/payment-brand-icon';
import { useFinance } from '@/context/finance-context';
import { getProfiles } from '@/lib/avatar';
import { getReceiptImageUrl } from '@/lib/receipts';
import { supabase } from '@/lib/supabase';

type ReceiptRow = {
  id: string;
  created_by: string;
  household_id: string | null;
  payer_id: string;
  scope: 'personal' | 'pareja';
  image_path: string;
  merchant_name: string | null;
  merchant_tax_id: string | null;
  document_type: 'boleta' | 'factura' | 'ticket' | 'recibo' | 'otro' | null;
  document_number: string | null;
  issued_at: string | null;
  total_amount: number | null;
  payment_method: string | null;
  status: string;
};

type PartnerStatus = {
  household_id: string | null;
  partner_name: string | null;
  member_count: number;
};

type ReceiptItem = {
  id: string;
  line_number: number;
  description: string;
  quantity: number | null;
  unit_price: number | null;
  line_total: number | null;
  category: string | null;
  confidence: number | null;
};

const DOCUMENT_TYPES = ['boleta', 'factura', 'ticket', 'recibo', 'otro'] as const;

function dateInputValue(value: string | null) {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return year + '-' + month + '-' + day;
}

export default function ComprobanteScreen() {
  const params = useLocalSearchParams<{ id?: string | string[] }>();
  const receiptId = Array.isArray(params.id) ? params.id[0] : params.id;
  const { user, authLoading, paymentMethods, categories } = useFinance();

  const [receipt, setReceipt] = useState<ReceiptRow | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [partnerStatus, setPartnerStatus] = useState<PartnerStatus | null>(null);
  const [partnerId, setPartnerId] = useState<string | null>(null);
  const [myName, setMyName] = useState('Tú');
  const [partnerName, setPartnerName] = useState('Tu pareja');

  const [merchant, setMerchant] = useState('');
  const [taxId, setTaxId] = useState('');
  const [documentType, setDocumentType] = useState<ReceiptRow['document_type']>(null);
  const [documentNumber, setDocumentNumber] = useState('');
  const [issuedDate, setIssuedDate] = useState('');
  const [total, setTotal] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('');
  const [scope, setScope] = useState<'personal' | 'pareja'>('personal');
  const [payerId, setPayerId] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [items, setItems] = useState<ReceiptItem[]>([]);

  useEffect(() => {
    if (!authLoading && !user) router.replace('/login');
  }, [authLoading, user]);

  const load = useCallback(async () => {
    if (!user || !receiptId) return;

    setLoading(true);

    const [{ data: row, error }, { data: statusData }, itemResult] = await Promise.all([
      supabase
        .from('receipts')
        .select(
          'id, created_by, household_id, payer_id, scope, image_path, merchant_name, merchant_tax_id, document_type, document_number, issued_at, total_amount, payment_method, status'
        )
        .eq('id', receiptId)
        .maybeSingle(),
      supabase.rpc('get_partner_status'),
      supabase
        .from('receipt_items')
        .select('id, line_number, description, quantity, unit_price, line_total, category, confidence')
        .eq('receipt_id', receiptId)
        .order('line_number', { ascending: true }),
    ]);

    if (error || !row) {
      Alert.alert('Comprobante no encontrado', error?.message ?? 'No se pudo cargar.');
      setLoading(false);
      return;
    }

    const next = row as ReceiptRow;
    const status = (statusData?.[0] ?? null) as PartnerStatus | null;

    setReceipt(next);
    setPartnerStatus(status);
    setItems(
      ((itemResult.data ?? []) as ReceiptItem[]).map((item) => ({
        ...item,
        quantity: item.quantity == null ? null : Number(item.quantity),
        unit_price: item.unit_price == null ? null : Number(item.unit_price),
        line_total: item.line_total == null ? null : Number(item.line_total),
        confidence: item.confidence == null ? null : Number(item.confidence),
      }))
    );
    setMerchant(next.merchant_name ?? '');
    setTaxId(next.merchant_tax_id ?? '');
    setDocumentType(next.document_type);
    setDocumentNumber(next.document_number ?? '');
    setIssuedDate(dateInputValue(next.issued_at));
    setTotal(next.total_amount == null ? '' : String(Number(next.total_amount).toFixed(2)));
    setPaymentMethod(next.payment_method ?? '');
    setScope(next.scope);
    setPayerId(next.payer_id || user.id);
    setPartnerName(status?.partner_name || 'Tu pareja');
    setImageUrl(await getReceiptImageUrl(next.image_path));

    const ownProfiles = await getProfiles([user.id]);
    const own = ownProfiles.find((item) => item.id === user.id);
    setMyName(
      own?.display_name?.trim() ||
        user.user_metadata?.display_name?.trim() ||
        user.email?.split('@')[0] ||
        'Tú'
    );

    if (status?.household_id && (status.member_count ?? 0) >= 2) {
      const { data: member } = await supabase
        .from('household_members')
        .select('user_id')
        .eq('household_id', status.household_id)
        .neq('user_id', user.id)
        .limit(1)
        .maybeSingle();

      setPartnerId(member?.user_id ?? null);

      if (member?.user_id) {
        const profiles = await getProfiles([member.user_id]);
        const partner = profiles.find((item) => item.id === member.user_id);
        if (partner?.display_name?.trim()) setPartnerName(partner.display_name.trim());
      }
    } else {
      setPartnerId(null);
    }

    setLoading(false);
  }, [receiptId, user]);

  useEffect(() => {
    void load();
  }, [load]);

  const chooseScope = (next: 'personal' | 'pareja') => {
    if (!user) return;

    if (next === 'pareja') {
      const linked =
        (partnerStatus?.member_count ?? 0) >= 2 && Boolean(partnerStatus?.household_id);
      if (!linked) {
        Alert.alert('Pareja no vinculada', 'Primero vincula a tu pareja.');
        return;
      }
    }

    setScope(next);
    if (next === 'personal') setPayerId(user.id);
  };

  const analyzeWithAI = async () => {
    if (!user || !receipt) return;

    if (receipt.created_by !== user.id) {
      Alert.alert('Solo lectura', 'Solo quien subió el comprobante puede analizarlo.');
      return;
    }

    try {
      setAnalyzing(true);
      const { data, error } = await supabase.functions.invoke('analyze-receipt', {
        body: { receiptId: receipt.id },
      });

      if (error) {
        let message = error.message || 'No se pudo analizar el comprobante.';
        const context = (error as any)?.context;
        if (context) {
          try {
            const body = await context.json();
            if (body?.error) message = body.error;
          } catch {
            // Keep the original message.
          }
        }
        throw new Error(message);
      }

      await load();

      Alert.alert(
        'Análisis completado',
        data?.itemCount
          ? `La IA detectó ${data.itemCount} producto(s). Revisa los datos antes de guardar.`
          : 'La IA completó los datos visibles. Revísalos antes de guardar.'
      );
    } catch (error: any) {
      Alert.alert(
        'No se pudo analizar',
        error?.message ?? 'Inténtalo nuevamente.'
      );
    } finally {
      setAnalyzing(false);
    }
  };

  const saveReview = async () => {
    if (!user || !receipt) return;

    if (receipt.created_by !== user.id) {
      Alert.alert('Solo lectura', 'Solo quien subió el comprobante puede editarlo.');
      return;
    }

    const parsedTotal = total.trim() ? Number(total.replace(',', '.')) : null;
    if (parsedTotal != null && (!Number.isFinite(parsedTotal) || parsedTotal < 0)) {
      Alert.alert('Total inválido', 'Revisa el monto total.');
      return;
    }

    if (issuedDate && !/^\d{4}-\d{2}-\d{2}$/.test(issuedDate)) {
      Alert.alert('Fecha inválida', 'Usa el formato AAAA-MM-DD.');
      return;
    }

    if (scope === 'pareja' && !partnerStatus?.household_id) {
      Alert.alert('Pareja no vinculada', 'Primero vincula a tu pareja.');
      return;
    }

    try {
      setSaving(true);
      const issuedAt = issuedDate
        ? new Date(issuedDate + 'T12:00:00').toISOString()
        : null;

      const { error } = await supabase
        .from('receipts')
        .update({
          merchant_name: merchant.trim() || null,
          merchant_tax_id: taxId.trim() || null,
          document_type: documentType,
          document_number: documentNumber.trim() || null,
          issued_at: issuedAt,
          total_amount: parsedTotal,
          payment_method: paymentMethod || null,
          scope,
          household_id: scope === 'pareja' ? partnerStatus.household_id : null,
          payer_id: scope === 'pareja' ? payerId || user.id : user.id,
          status: 'revisado',
          updated_at: new Date().toISOString(),
        })
        .eq('id', receipt.id)
        .eq('created_by', user.id);

      if (error) throw error;

      Alert.alert(
        'Revisión guardada',
        'Los datos del comprobante se guardaron correctamente.'
      );
      await load();
    } catch (error: any) {
      Alert.alert('No se pudo guardar', error?.message ?? 'Inténtalo nuevamente.');
    } finally {
      setSaving(false);
    }
  };

  if (authLoading || !user || loading) return null;

  if (!receipt) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.center}>
          <Text style={styles.muted}>No se pudo cargar el comprobante.</Text>
        </View>
      </SafeAreaView>
    );
  }

  const editable = receipt.created_by === user.id;

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.replace('/mi-dinero')}>
            <AppIcon name="back" size={17} color="#23A7FF" />
          </TouchableOpacity>
          <View style={styles.headerText}>
            <Text style={styles.headerTitle}>Revisar comprobante</Text>
            <Text style={styles.headerSub}>
              {receipt.status === 'revisado' ? 'Revisión guardada' : 'Pendiente de revisión'}
            </Text>
          </View>
          <View style={styles.headerSpacer} />
        </View>

        {imageUrl ? (
          <Image source={{ uri: imageUrl }} style={styles.receiptImage} resizeMode="contain" />
        ) : (
          <View style={styles.imageFallback}>
            <AppIcon name="receipt" size={40} color="#64748B" />
            <Text style={styles.muted}>No se pudo mostrar la imagen.</Text>
          </View>
        )}

        <View style={styles.aiNote}>
          <Text style={styles.aiTitle}>Lectura automática con IA</Text>
          <Text style={styles.aiText}>
            Analiza la foto para detectar comercio, RUC, fecha, total, método de pago, productos y categorías.
            Siempre podrás corregir los datos antes de guardarlos.
          </Text>
          {editable ? (
            <TouchableOpacity
              style={[styles.aiButton, analyzing && styles.aiButtonDisabled]}
              onPress={analyzeWithAI}
              disabled={analyzing}
            >
              <AppIcon name="camera" size={17} color="#FFFFFF" />
              <Text style={styles.aiButtonText}>
                {analyzing ? 'Analizando comprobante...' : items.length ? 'Analizar nuevamente' : 'Analizar con IA'}
              </Text>
            </TouchableOpacity>
          ) : null}
        </View>

        <Section title="Destino">
          <View style={styles.scopeRow}>
            <Choice
              active={scope === 'personal'}
              label="Personal"
              onPress={() => chooseScope('personal')}
              disabled={!editable}
            />
            <Choice
              active={scope === 'pareja'}
              label="Pareja"
              onPress={() => chooseScope('pareja')}
              pink
              disabled={!editable}
            />
          </View>
        </Section>

        <Section title="Comercio">
          <TextInput
            style={styles.input}
            value={merchant}
            onChangeText={setMerchant}
            placeholder="Ej. Tottus, Metro, Primax..."
            placeholderTextColor="#64748B"
            editable={editable}
          />
        </Section>

        <Section title="RUC / identificación del comercio">
          <TextInput
            style={styles.input}
            value={taxId}
            onChangeText={setTaxId}
            placeholder="Opcional"
            placeholderTextColor="#64748B"
            editable={editable}
          />
        </Section>

        <Section title="Tipo de comprobante">
          <View style={styles.chips}>
            {DOCUMENT_TYPES.map((item) => (
              <TouchableOpacity
                key={item}
                style={[styles.chip, documentType === item && styles.chipActive]}
                onPress={() => editable && setDocumentType(item)}
                disabled={!editable}
              >
                <Text style={[styles.chipText, documentType === item && styles.chipTextActive]}>
                  {item.charAt(0).toUpperCase() + item.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </Section>

        <Section title="Número de comprobante">
          <TextInput
            style={styles.input}
            value={documentNumber}
            onChangeText={setDocumentNumber}
            placeholder="Opcional"
            placeholderTextColor="#64748B"
            editable={editable}
          />
        </Section>

        <View style={styles.twoColumns}>
          <View style={styles.column}>
            <Section title="Fecha">
              <TextInput
                style={styles.input}
                value={issuedDate}
                onChangeText={setIssuedDate}
                placeholder="AAAA-MM-DD"
                placeholderTextColor="#64748B"
                editable={editable}
              />
            </Section>
          </View>
          <View style={styles.column}>
            <Section title="Total">
              <TextInput
                style={styles.input}
                value={total}
                onChangeText={setTotal}
                keyboardType="decimal-pad"
                placeholder="0.00"
                placeholderTextColor="#64748B"
                editable={editable}
              />
            </Section>
          </View>
        </View>

        <Section title="Método de pago">
          <View style={styles.paymentGrid}>
            {paymentMethods.map((item) => {
              const active = paymentMethod === item.slug;
              return (
                <TouchableOpacity
                  key={item.id}
                  style={[styles.paymentItem, active && styles.paymentActive]}
                  onPress={() => editable && setPaymentMethod(item.slug)}
                  disabled={!editable}
                >
                  <PaymentBrandIcon slug={item.slug} size={36} selected={active} />
                  <Text style={[styles.paymentText, active && styles.paymentTextActive]}>
                    {item.name}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </Section>

        {scope === 'pareja' ? (
          <Section title="¿Quién pagó?">
            <View style={styles.scopeRow}>
              <Choice
                active={payerId === user.id}
                label={myName}
                onPress={() => editable && setPayerId(user.id)}
                disabled={!editable}
              />
              <Choice
                active={payerId === partnerId}
                label={partnerName}
                onPress={() => editable && partnerId && setPayerId(partnerId)}
                pink
                disabled={!editable || !partnerId}
              />
            </View>
          </Section>
        ) : null}

        <View style={styles.pendingCard}>
          <Text style={styles.pendingTitle}>
            Productos {items.length ? `(${items.length})` : ''}
          </Text>
          {items.length ? (
            <View style={styles.itemList}>
              {items.map((item) => {
                const categoryName =
                  categories.find((category) => category.slug === item.category)?.name ??
                  item.category ??
                  'Sin categoría';
                const amount =
                  item.line_total != null
                    ? `S/ ${item.line_total.toFixed(2)}`
                    : item.unit_price != null
                    ? `S/ ${item.unit_price.toFixed(2)}`
                    : '—';

                return (
                  <View key={item.id} style={styles.itemRow}>
                    <View style={styles.itemCopy}>
                      <Text style={styles.itemTitle}>{item.description}</Text>
                      <Text style={styles.itemMeta}>
                        {item.quantity != null ? `Cant. ${item.quantity} · ` : ''}
                        {categoryName}
                        {item.confidence != null ? ` · ${Math.round(item.confidence * 100)}% confianza` : ''}
                      </Text>
                    </View>
                    <Text style={styles.itemAmount}>{amount}</Text>
                  </View>
                );
              })}
            </View>
          ) : (
            <Text style={styles.pendingText}>
              Aún no hay productos detectados. Pulsa “Analizar con IA”.
            </Text>
          )}
        </View>

        {editable ? (
          <TouchableOpacity
            style={[styles.saveButton, saving && styles.saveDisabled]}
            onPress={saveReview}
            disabled={saving}
          >
            <Text style={styles.saveText}>{saving ? 'Guardando...' : 'Guardar revisión'}</Text>
          </TouchableOpacity>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {children}
    </View>
  );
}

function Choice({
  active,
  label,
  onPress,
  pink = false,
  disabled = false,
}: {
  active: boolean;
  label: string;
  onPress: () => void;
  pink?: boolean;
  disabled?: boolean;
}) {
  return (
    <TouchableOpacity
      style={[
        styles.choice,
        active && (pink ? styles.choicePink : styles.choiceBlue),
        disabled && styles.choiceDisabled,
      ]}
      onPress={onPress}
      disabled={disabled}
    >
      <Text style={styles.choiceText}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#07111F' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  content: { padding: 18, paddingBottom: 38 },
  muted: { color: '#64748B', fontSize: 11 },
  header: { flexDirection: 'row', alignItems: 'center', marginBottom: 14 },
  backButton: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: '#0E1A2A',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerText: { flex: 1, marginLeft: 12 },
  headerTitle: { color: '#FFFFFF', fontSize: 19, fontWeight: '900' },
  headerSub: { color: '#64748B', fontSize: 10, marginTop: 2 },
  headerSpacer: { width: 38 },
  receiptImage: {
    width: '100%',
    height: 390,
    borderRadius: 18,
    backgroundColor: '#0A1524',
    borderWidth: 1,
    borderColor: '#1B2B40',
  },
  imageFallback: {
    height: 220,
    borderRadius: 18,
    backgroundColor: '#0E1A2A',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  aiNote: {
    marginTop: 13,
    padding: 14,
    borderRadius: 16,
    backgroundColor: '#10233B',
    borderWidth: 1,
    borderColor: '#1E4774',
  },
  aiTitle: { color: '#7CC4FF', fontWeight: '900', fontSize: 12 },
  aiText: { color: '#94A3B8', fontSize: 10, lineHeight: 16, marginTop: 5 },
  aiButton: {
    marginTop: 11,
    minHeight: 46,
    borderRadius: 13,
    backgroundColor: '#1677FF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
  },
  aiButtonDisabled: { opacity: 0.55 },
  aiButtonText: { color: '#FFFFFF', fontSize: 11, fontWeight: '900' },
  section: {
    marginTop: 13,
    padding: 14,
    borderRadius: 16,
    backgroundColor: '#0E1A2A',
    borderWidth: 1,
    borderColor: '#1B2B40',
  },
  sectionTitle: { color: '#CBD5E1', fontSize: 10, fontWeight: '900', marginBottom: 9 },
  input: {
    minHeight: 47,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#29405E',
    backgroundColor: '#091827',
    paddingHorizontal: 12,
    color: '#FFFFFF',
    fontSize: 12,
  },
  scopeRow: { flexDirection: 'row', gap: 8 },
  choice: {
    flex: 1,
    minHeight: 45,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#2A3C55',
    backgroundColor: '#142033',
    alignItems: 'center',
    justifyContent: 'center',
  },
  choiceBlue: { backgroundColor: '#1458A6', borderColor: '#2F8CFF' },
  choicePink: { backgroundColor: '#7A204D', borderColor: '#F43F75' },
  choiceDisabled: { opacity: 0.45 },
  choiceText: { color: '#FFFFFF', fontSize: 11, fontWeight: '900' },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 7 },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 999,
    backgroundColor: '#142033',
    borderWidth: 1,
    borderColor: '#29405E',
  },
  chipActive: { backgroundColor: '#1458A6', borderColor: '#2F8CFF' },
  chipText: { color: '#94A3B8', fontSize: 10, fontWeight: '800' },
  chipTextActive: { color: '#FFFFFF' },
  twoColumns: { flexDirection: 'row', gap: 8 },
  column: { flex: 1 },
  paymentGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  paymentItem: {
    width: '31%',
    minHeight: 76,
    borderRadius: 12,
    backgroundColor: '#142033',
    borderWidth: 1,
    borderColor: '#29405E',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 6,
  },
  paymentActive: { borderColor: '#2F8CFF', backgroundColor: '#102B55' },
  paymentText: { color: '#94A3B8', fontSize: 8, fontWeight: '800', marginTop: 3 },
  paymentTextActive: { color: '#FFFFFF' },
  pendingCard: {
    marginTop: 13,
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: '#315177',
    backgroundColor: '#091827',
  },
  pendingTitle: { color: '#FFFFFF', fontWeight: '900', fontSize: 12 },
  pendingText: { color: '#64748B', fontSize: 10, lineHeight: 16, marginTop: 4 },
  itemList: { marginTop: 9, gap: 7 },
  itemRow: {
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: '#1B2B40',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  itemCopy: { flex: 1, paddingRight: 10 },
  itemTitle: { color: '#FFFFFF', fontSize: 10.5, fontWeight: '900' },
  itemMeta: { color: '#64748B', fontSize: 8, lineHeight: 12, marginTop: 3 },
  itemAmount: { color: '#7CC4FF', fontSize: 10, fontWeight: '900' },
  saveButton: {
    marginTop: 15,
    minHeight: 54,
    borderRadius: 16,
    backgroundColor: '#1677FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveDisabled: { opacity: 0.5 },
  saveText: { color: '#FFFFFF', fontWeight: '900', fontSize: 13 },
});
