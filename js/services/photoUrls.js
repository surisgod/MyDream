import { supabaseClient } from './supabase.js';
import { PHOTOS_BUCKET, PHOTO_URL_TTL } from '../config.js';
import { toStoragePath } from '../utils/photos.js';

// Бакет с фото приватный: показываются они по временным подписанным ссылкам.
// Ссылки выдаёт Supabase только по токену владельца, срок жизни — PHOTO_URL_TTL секунд.
const cache = new Map();                    // путь в бакете → { url, expiresAt }
const REFRESH_MARGIN_MS = 5 * 60 * 1000;    // обновляем ссылку заранее, за 5 минут до конца
const CHUNK = 100;

const isFresh = (path) => {
  const entry = cache.get(path);
  return !!entry && entry.expiresAt - Date.now() > REFRESH_MARGIN_MS;
};

// Получает временные ссылки для списка путей (одним запросом на 100 штук). Уже готовые не запрашивает.
export async function ensurePhotoUrls(paths, { force = false } = {}) {
  const need = [...new Set(paths)].filter(p => p && (force || !isFresh(p)));
  for (let i = 0; i < need.length; i += CHUNK) {
    const { data, error } = await supabaseClient.storage
      .from(PHOTOS_BUCKET)
      .createSignedUrls(need.slice(i, i + CHUNK), PHOTO_URL_TTL);
    if (error) { console.error(error); continue; }
    (data || []).forEach(item => {
      if (item.signedUrl) {
        cache.set(item.path, { url: item.signedUrl, expiresAt: Date.now() + PHOTO_URL_TTL * 1000 });
      } else {
        console.error('Не удалось получить ссылку на фото', item.path, item.error);
      }
    });
  }
}

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');

// Атрибуты для <img>: src с временной ссылкой и путь для автообновления. Вставлять в шаблон: <img ${photoImgAttrs(p)}>
export function photoImgAttrs(photo) {
  const path = toStoragePath(photo.url);
  if (path === null) return `src="${esc(photo.url)}"`;     // внешняя ссылка — как есть
  const entry = cache.get(path);
  return `${entry ? `src="${esc(entry.url)}" ` : ''}data-path="${esc(path)}"`;
}

// Если картинка не загрузилась (например, ссылка истекла, пока страница была открыта) —
// один раз просим новую ссылку и подставляем её.
export function initPhotoUrlRefresh() {
  document.addEventListener('error', async (event) => {
    const img = event.target;
    if (!(img instanceof HTMLImageElement) || !img.dataset.path || img.dataset.retried) return;
    img.dataset.retried = '1';
    await ensurePhotoUrls([img.dataset.path], { force: true });
    const entry = cache.get(img.dataset.path);
    if (entry) img.src = entry.url;
  }, true);
}
