import * as ImagePicker from 'expo-image-picker';

import { supabase } from '@/lib/supabase';

const BUCKET = 'org-media'; // supabase/migrations/*_org_media.sql
const MAX_BYTES = 2 * 1024 * 1024; // same limit as the bucket
const TYPES = ['image/png', 'image/jpeg', 'image/webp'];

/**
 * Lets the user pick an image, uploads it to org-media/<org id>/, and returns its public URL.
 * Returns null if they cancel. Throws a readable Error for a wrong type or size.
 */
export async function pickAndUploadImage(orgId: string, kind: 'logo' | 'banner'): Promise<string | null> {
  const picked = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ['images'],
    allowsEditing: true,
    aspect: kind === 'logo' ? [1, 1] : [4, 1],
    quality: 0.8,
  });
  if (picked.canceled) return null;

  const asset = picked.assets[0];
  const type = asset.mimeType ?? 'image/jpeg';
  if (!TYPES.includes(type)) throw new Error('Use a PNG, JPG, or WebP image.');
  const body = await (await fetch(asset.uri)).arrayBuffer();
  if (body.byteLength > MAX_BYTES) throw new Error('Images must be 2 MB or smaller.');

  const path = `${orgId}/${kind}-${Date.now()}.${type.split('/')[1]}`;
  const { error } = await supabase.storage.from(BUCKET).upload(path, body, { contentType: type });
  if (error) throw error;
  return supabase.storage.from(BUCKET).getPublicUrl(path).data.publicUrl;
}
