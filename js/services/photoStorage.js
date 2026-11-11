import { supabaseClient } from './supabase.js';
import { PHOTOS_BUCKET, PHOTOS_PATH_PREFIX } from '../config.js';
import { ensurePhotoUrls } from './photoUrls.js';
import { toStoragePath } from '../utils/photos.js';

// Загружает файл в приватный бакет. Возвращает { url } (путь файла в бакете) или { error }.
export async function uploadPhoto(file) {
  let ext = (file.name && file.name.includes('.')) ? file.name.split('.').pop() : (file.type.split('/')[1] || 'jpg');
  ext = ext.toLowerCase().replace(/[^a-z0-9]/g, '') || 'jpg';
  const filePath = `${PHOTOS_PATH_PREFIX}/web_${Date.now()}_${Math.random().toString(36).slice(2, 8)}.${ext}`;

  const { error } = await supabaseClient.storage
    .from(PHOTOS_BUCKET)
    .upload(filePath, file, { contentType: file.type });
  if (error) return { error };

  await ensurePhotoUrls([filePath]);   // чтобы сразу показать превью в редакторе
  return { url: filePath };
}

// Удаляет файлы из бакета. Принимает пути или старые публичные ссылки; чужие внешние ссылки пропускает.
// Не бросает ошибок: если удалить не вышло, запись всё равно сохранена, а причина остаётся в консоли.
export async function deletePhotos(urls) {
  const paths = [...new Set((urls || []).map(toStoragePath).filter(Boolean))];
  if (!paths.length) return;

  const { data, error } = await supabaseClient.storage.from(PHOTOS_BUCKET).remove(paths);
  if (error) {
    console.error('Не удалось удалить фото из хранилища', error);
  } else if ((data || []).length < paths.length) {
    // Supabase молча пропускает файлы, на удаление которых нет прав (политика DELETE для authenticated)
    console.warn(`Удалено ${(data || []).length} из ${paths.length} фото — проверьте политику DELETE у бакета`, paths);
  }
}
