import { supabase } from '@/lib/supabase';

function extensionFromFile(file: File) {
  const byName = file.name.split('.').pop()?.toLowerCase();
  if (byName && ['jpg', 'jpeg', 'png', 'webp', 'heic', 'heif'].includes(byName)) {
    return byName === 'jpeg' ? 'jpg' : byName;
  }

  if (file.type === 'image/png') return 'png';
  if (file.type === 'image/webp') return 'webp';
  if (file.type === 'image/heic') return 'heic';
  if (file.type === 'image/heif') return 'heif';
  return 'jpg';
}

export async function createReceiptFromFile({
  userId,
  file,
  scope,
  householdId,
  payerId,
}: {
  userId: string;
  file: File;
  scope: 'personal' | 'pareja';
  householdId?: string | null;
  payerId: string;
}) {
  const extension = extensionFromFile(file);
  const randomPart =
    typeof crypto !== 'undefined' && 'randomUUID' in crypto
      ? crypto.randomUUID().slice(0, 8)
      : Math.random().toString(36).slice(2, 10);
  const path =
    userId + '/receipt-' + Date.now() + '-' + randomPart + '.' + extension;

  const { error: uploadError } = await supabase.storage
    .from('receipts')
    .upload(path, file, {
      contentType: file.type || 'image/jpeg',
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
      original_filename: file.name || null,
      mime_type: file.type || 'image/jpeg',
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
