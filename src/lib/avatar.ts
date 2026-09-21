import { supabase } from '@/lib/supabase';

export type BasicProfile = {
  id: string;
  display_name: string | null;
  avatar_path: string | null;
};

export async function getAvatarUrl(path: string | null | undefined) {
  if (!path) return null;

  const { data, error } = await supabase.storage
    .from('avatars')
    .createSignedUrl(path, 60 * 60);

  if (error) return null;
  return data.signedUrl;
}

export async function getProfiles(ids: string[]) {
  if (ids.length === 0) return [] as BasicProfile[];

  const { data, error } = await supabase
    .from('profiles')
    .select('id, display_name, avatar_path')
    .in('id', ids);

  if (error) throw error;
  return (data ?? []) as BasicProfile[];
}

export async function uploadAvatar({
  userId,
  uri,
  mimeType,
  previousPath,
}: {
  userId: string;
  uri: string;
  mimeType?: string | null;
  previousPath?: string | null;
}) {
  const response = await fetch(uri);
  const bytes = await response.arrayBuffer();
  const extension =
    mimeType === 'image/png'
      ? 'png'
      : mimeType === 'image/webp'
      ? 'webp'
      : 'jpg';
  const path = `${userId}/avatar-${Date.now()}.${extension}`;

  const { error: uploadError } = await supabase.storage
    .from('avatars')
    .upload(path, bytes, {
      contentType: mimeType || 'image/jpeg',
      upsert: false,
      cacheControl: '3600',
    });

  if (uploadError) throw uploadError;

  const { error: profileError } = await supabase
    .from('profiles')
    .update({ avatar_path: path, updated_at: new Date().toISOString() })
    .eq('id', userId);

  if (profileError) {
    await supabase.storage.from('avatars').remove([path]);
    throw profileError;
  }

  if (previousPath && previousPath !== path) {
    await supabase.storage.from('avatars').remove([previousPath]);
  }

  return path;
}
