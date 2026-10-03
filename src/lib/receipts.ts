import { supabase } from '@/lib/supabase';

function extensionFromMime(mimeType?: string | null, fileName?: string | null) {
  const normalized = (mimeType || '').toLowerCase();
  if (normalized === 'image/png') return 'png';
  if (normalized === 'image/webp') return 'webp';
  if (normalized === 'image/heic') return 'heic';
  if (normalized === 'image/heif') return 'heif';

  const fromName = fileName?.split('.').pop()?.toLowerCase();
  if (fromName && ['jpg', 'jpeg', 'png', 'webp', 'heic', 'heif'].includes(fromName)) {
    return fromName === 'jpeg' ? 'jpg' : fromName;
  }

  return 'jpg';
}

export async function createReceiptFromImage({
  userId,
  uri,
  mimeType,
  fileName,
  scope,
  householdId,
  payerId,
}: {
  userId: string;
  uri: string;
  mimeType?: string | null;
  fileName?: string | null;
  scope: 'personal' | 'pareja';
  householdId?: string | null;
  payerId: string;
}) {
  const response = await fetch(uri);
  const bytes = await response.arrayBuffer();
  const extension = extensionFromMime(mimeType, fileName);
  const path = `${userId}/receipt-${Date.now()}-${Math.random()
    .toString(36)
    .slice(2, 8)}.${extension}`;

  const { error: uploadError } = await supabase.storage.from('receipts').upload(path, bytes, {
    contentType: mimeType || 'image/jpeg',
    upsert: false,
    cacheControl: '3600',
  });

  if (uploadError) throw uploadError;

  const { data, error: insertError } = await supabase
    .from('receipts')
    .insert({
      created_by: userId,
      payer_id: payerId,
      household_id: scope === 'pareja' ? householdId ?? null : null,
      scope,
      image_path: path,
      original_filename: fileName || null,
      mime_type: mimeType || 'image/jpeg',
      status: 'pendiente_revision',
    })
    .select('id')
    .single();

  if (insertError) {
    await supabase.storage.from('receipts').remove([path]);
    throw insertError;
  }

  return data.id as string;
}

export async function getReceiptImageUrl(path?: string | null) {
  if (!path) return null;

  const { data, error } = await supabase.storage
    .from('receipts')
    .createSignedUrl(path, 60 * 60);

  if (error) return null;
  return data.signedUrl;
}
