import { supabaseClient } from './supabase.js';
import { PHOTOS_BUCKET, PHOTOS_PATH_PREFIX } from '../config.js';

// Загружает файл в хранилище. Возвращает { url } или { error }.
export async function uploadPhoto(file) {
  let ext = (file.name && file.name.includes('.')) ? file.name.split('.').pop() : (file.type.split('/')[1] || 'jpg');
  ext = ext.toLowerCase().replace(/[^a-z0-9]/g, '') || 'jpg';
  const filePath = `${PHOTOS_PATH_PREFIX}/web_${Date.now()}_${Math.random().toString(36).slice(2, 8)}.${ext}`;

  const { error } = await supabaseClient.storage
    .from(PHOTOS_BUCKET)
    .upload(filePath, file, { contentType: file.type });
  if (error) return { error };

  const { data } = supabaseClient.storage.from(PHOTOS_BUCKET).getPublicUrl(filePath);
  return { url: data.publicUrl };
}
