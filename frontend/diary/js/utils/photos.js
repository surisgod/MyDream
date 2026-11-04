// В колонке photo_url хранится либо одна ссылка (старые записи и бот),
// либо JSON-массив [{url, size}] (несколько фото).

export function parsePhotos(raw) {
  if (!raw) return [];
  const str = String(raw).trim();
  if (str.startsWith('[')) {
    try {
      const arr = JSON.parse(str);
      return arr
        .map(i => typeof i === 'string' ? { url: i, size: 0 } : { url: i.url, size: i.size || 0 })
        .filter(i => i.url);
    } catch (e) { /* не JSON — считаем обычной ссылкой */ }
  }
  return [{ url: str, size: 0 }];
}

export function serializePhotos(list) {
  if (!list.length) return null;
  return JSON.stringify(list.map(p => ({ url: p.url, size: p.size || 0 })));
}
