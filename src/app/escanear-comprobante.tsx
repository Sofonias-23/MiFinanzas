import * as ImagePicker from 'expo-image-picker';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  Alert,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppIcon } from '@/components/app-icon';
import { useFinance } from '@/context/finance-context';
import { createReceiptFromImage } from '@/lib/receipts';
import { supabase } from '@/lib/supabase';

type PartnerStatus = {
  household_id: string | null;
  member_count: number;
};

export default function EscanearComprobanteScreen() {
  const params = useLocalSearchParams<{ scope?: string | string[] }>();
  const { user, authLoading } = useFinance();
  const [scope, setScope] = useState<'personal' | 'pareja'>(
    params.scope === 'pareja' ? 'pareja' : 'personal'
  );
  const [asset, setAsset] = useState<ImagePicker.ImagePickerAsset | null>(null);
  const [partnerStatus, setPartnerStatus] = useState<PartnerStatus | null>(null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) router.replace('/login');
  }, [authLoading, user]);

  useEffect(() => {
    if (!user) return;

    supabase
      .rpc('get_partner_status')
      .then(({ data }) => {
        setPartnerStatus((data?.[0] ?? null) as PartnerStatus | null);
      });
  }, [user]);

  const chooseImage = async (source: 'camera' | 'library') => {
    try {
      if (source === 'camera') {
        const permission = await ImagePicker.requestCameraPermissionsAsync();
        if (!permission.granted) {
          Alert.alert(
            'Permiso necesario',
            'Activa el acceso a la cámara para fotografiar tus comprobantes.'
          );
          return;
        }
      } else {
        const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (!permission.granted) {
          Alert.alert(
            'Permiso necesario',
            'Activa el acceso a tus fotos para elegir un comprobante.'
          );
          return;
        }
      }

      const result =
        source === 'camera'
          ? await ImagePicker.launchCameraAsync({
              mediaTypes: ['images'],
              allowsEditing: false,
              quality: 0.9,
            })
          : await ImagePicker.launchImageLibraryAsync({
              mediaTypes: ['images'],
              allowsEditing: false,
              quality: 0.9,
            });

      if (result.canceled || !result.assets[0]) return;

      const next = result.assets[0];
      if (next.fileSize && next.fileSize > 15 * 1024 * 1024) {
        Alert.alert('Imagen demasiado grande', 'Usa una imagen menor de 15 MB.');
        return;
      }

      setAsset(next);
    } catch (error: any) {
      Alert.alert(
        'No se pudo abrir la imagen',
        error?.message ?? 'Inténtalo nuevamente.'
      );
    }
  };

  const continueToReview = async () => {
    if (!user || !asset) {
      Alert.alert('Falta el comprobante', 'Toma una foto o elige una imagen.');
      return;
    }

    if (scope === 'pareja') {
      const linked =
        (partnerStatus?.member_count ?? 0) >= 2 && Boolean(partnerStatus?.household_id);
      if (!linked) {
        Alert.alert(
          'Pareja no vinculada',
          'Vincula primero a tu pareja antes de guardar un comprobante compartido.'
        );
        return;
      }
    }

    try {
      setUploading(true);
      const receiptId = await createReceiptFromImage({
        userId: user.id,
        uri: asset.uri,
        mimeType: asset.mimeType,
        fileName: asset.fileName,
        scope,
        householdId: scope === 'pareja' ? partnerStatus?.household_id : null,
        payerId: user.id,
      });

      router.replace(('/comprobante?id=' + receiptId) as any);
    } catch (error: any) {
      Alert.alert(
        'No se pudo guardar el comprobante',
        error?.message ?? 'Inténtalo nuevamente.'
      );
    } finally {
      setUploading(false);
    }
  };

  if (authLoading || !user) return null;

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <AppIcon name="back" size={17} color="#23A7FF" />
          </TouchableOpacity>
          <View style={styles.headerText}>
            <Text style={styles.headerTitle}>Escanear comprobante</Text>
            <Text style={styles.headerSub}>Boletas, facturas, tickets y recibos</Text>
          </View>
          <View style={styles.headerSpacer} />
        </View>

        <View style={styles.scopeCard}>
          <Text style={styles.label}>¿Dónde irá este gasto?</Text>
          <View style={styles.scopeRow}>
            <TouchableOpacity
              style={[styles.scopeButton, scope === 'personal' && styles.scopeButtonBlue]}
              onPress={() => setScope('personal')}
            >
              <AppIcon name="lock" size={17} color="#FFFFFF" />
              <Text style={styles.scopeText}>Personal</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.scopeButton, scope === 'pareja' && styles.scopeButtonPink]}
              onPress={() => setScope('pareja')}
            >
              <AppIcon name="heart" size={17} color="#FFFFFF" />
              <Text style={styles.scopeText}>Pareja</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.captureCard}>
          {asset ? (
            <>
              <Image source={{ uri: asset.uri }} style={styles.preview} resizeMode="contain" />
              <Text style={styles.previewHint}>
                Revisa que el comercio, productos, total y fecha se lean con claridad.
              </Text>
            </>
          ) : (
            <View style={styles.emptyPreview}>
              <AppIcon name="receipt" size={46} color="#60A5FA" />
              <Text style={styles.emptyTitle}>Fotografía el comprobante completo</Text>
              <Text style={styles.emptyText}>
                Evita sombras, reflejos y bordes cortados. La imagen se guarda de forma privada.
              </Text>
            </View>
          )}

          <View style={styles.captureActions}>
            <TouchableOpacity
              style={[styles.captureButton, styles.cameraButton]}
              onPress={() => chooseImage('camera')}
              disabled={uploading}
            >
              <AppIcon name="camera" size={18} color="#FFFFFF" />
              <Text style={styles.captureButtonText}>Tomar foto</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.captureButton}
              onPress={() => chooseImage('library')}
              disabled={uploading}
            >
              <AppIcon name="receipt" size={18} color="#CBD5E1" />
              <Text style={styles.captureButtonText}>Elegir foto</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.infoCard}>
          <Text style={styles.infoTitle}>Qué pasará después</Text>
          <Text style={styles.infoText}>
            Primero guardarás la imagen y revisarás los datos. La lectura automática con IA se conectará
            sobre esta misma pantalla, sin cambiar el flujo.
          </Text>
        </View>

        <TouchableOpacity
          style={[styles.primaryButton, (!asset || uploading) && styles.primaryDisabled]}
          onPress={continueToReview}
          disabled={!asset || uploading}
        >
          <Text style={styles.primaryText}>
            {uploading ? 'Guardando...' : 'Continuar a revisión'}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#07111F' },
  content: { padding: 18, paddingBottom: 34 },
  header: { flexDirection: 'row', alignItems: 'center', marginBottom: 18 },
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
  scopeCard: {
    borderRadius: 18,
    padding: 15,
    backgroundColor: '#0E1A2A',
    borderWidth: 1,
    borderColor: '#1B2B40',
  },
  label: { color: '#CBD5E1', fontSize: 11, fontWeight: '800', marginBottom: 10 },
  scopeRow: { flexDirection: 'row', gap: 9 },
  scopeButton: {
    flex: 1,
    minHeight: 46,
    borderRadius: 13,
    backgroundColor: '#182336',
    borderWidth: 1,
    borderColor: '#263A54',
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 7,
  },
  scopeButtonBlue: { backgroundColor: '#1458A6', borderColor: '#2F8CFF' },
  scopeButtonPink: { backgroundColor: '#7A204D', borderColor: '#F43F75' },
  scopeText: { color: '#FFFFFF', fontWeight: '900', fontSize: 12 },
  captureCard: {
    marginTop: 13,
    borderRadius: 20,
    padding: 14,
    backgroundColor: '#0E1A2A',
    borderWidth: 1,
    borderColor: '#1B2B40',
  },
  emptyPreview: {
    minHeight: 250,
    borderRadius: 16,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: '#315177',
    backgroundColor: '#091827',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 26,
  },
  emptyTitle: { color: '#FFFFFF', fontWeight: '900', fontSize: 15, marginTop: 14 },
  emptyText: {
    color: '#64748B',
    textAlign: 'center',
    fontSize: 10,
    lineHeight: 16,
    marginTop: 7,
  },
  preview: { width: '100%', height: 360, borderRadius: 16, backgroundColor: '#07111F' },
  previewHint: {
    color: '#94A3B8',
    fontSize: 10,
    lineHeight: 15,
    textAlign: 'center',
    marginTop: 10,
  },
  captureActions: { flexDirection: 'row', gap: 9, marginTop: 12 },
  captureButton: {
    flex: 1,
    minHeight: 48,
    borderRadius: 13,
    borderWidth: 1,
    borderColor: '#29405E',
    backgroundColor: '#142033',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
  },
  cameraButton: { backgroundColor: '#1677FF', borderColor: '#3B92FF' },
  captureButtonText: { color: '#FFFFFF', fontSize: 11, fontWeight: '900' },
  infoCard: {
    marginTop: 13,
    borderRadius: 16,
    padding: 14,
    backgroundColor: '#10233B',
    borderWidth: 1,
    borderColor: '#1E4774',
  },
  infoTitle: { color: '#FFFFFF', fontWeight: '900', fontSize: 12 },
  infoText: { color: '#94A3B8', fontSize: 10, lineHeight: 16, marginTop: 5 },
  primaryButton: {
    marginTop: 15,
    minHeight: 54,
    borderRadius: 16,
    backgroundColor: '#1677FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryDisabled: { opacity: 0.45 },
  primaryText: { color: '#FFFFFF', fontSize: 13, fontWeight: '900' },
});
