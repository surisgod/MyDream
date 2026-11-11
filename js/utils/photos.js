import { PHOTOS_BUCKET } from '../config.js';

// В записи хранится путь файла в приватном бакете (например notes/web_uploads/web_123.jpg).
// В старых записях и у бота там была публичная ссылка на этот же файл — она тоже понимается.
const PUBLIC_MARK = `/storage/v1/object/public/${PHOTOS_BUCKET}/`;

// Публичная ссылка или путь → путь в бакете. Чужая внешняя ссылка → null (её показываем как есть).
export function toStoragePath(value) {
  const v = String(value || '').trim();
  const i = v.indexOf(PUBLIC_MARK);
  if (i !== -1) {
    const raw = v.slice(i + PUBLIC_MARK.length).split('?')[0];
    try { return decodeURIComponent(raw); } catch (e) { return raw; }
  }
  if (/^https?:\/\//i.test(v)) return null;
  return v;
}

// Приводит всё к путям: при следующем сохранении записи старые ссылки заменятся на пути сами.
const normalize = (url) => toStoragePath(url) ?? url;

export function parsePhotos(raw) {
  if (!raw) return [];
  const str = String(raw).trim();
  if (str.startsWith('[')) {
    try {
      const arr = JSON.parse(str);
      return arr
        .map(i => typeof i === 'string' ? { url: i, size: 0 } : { url: i.url, size: i.size || 0 })
        .filter(i => i.url)
        .map(i => ({ ...i, url: normalize(i.url) }));
    } catch (e) { /* не JSON — считаем обычной ссылкой */ }
  }
  return [{ url: normalize(str), size: 0 }];
}

export function serializePhotos(list) {
  if (!list.length) return null;
  return JSON.stringify(list.map(p => ({ url: p.url, size: p.size || 0 })));
}
