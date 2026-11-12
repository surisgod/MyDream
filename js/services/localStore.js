import { STORAGE_KEYS, OWN_KEY_PREFIXES, LEGACY_KEYS, OBSOLETE_KEYS } from '../config.js';

export const getDraft = () => localStorage.getItem(STORAGE_KEYS.draft) || '';
export const saveDraft = (text) => localStorage.setItem(STORAGE_KEYS.draft, text);
export const clearDraft = () => localStorage.removeItem(STORAGE_KEYS.draft);

const isOwnKey = (key) => OWN_KEY_PREFIXES.some(prefix => key.startsWith(prefix));

function ownKeys(storage) {
  const keys = [];
  for (let i = 0; i < storage.length; i++) {
    const key = storage.key(i);
    if (key && isOwnKey(key)) keys.push(key);
  }
  return keys;
}

// Удаляет из localStorage и sessionStorage ТОЛЬКО ключи этого сайта (вход, черновик и т.д.),
// не трогая данные других сайтов с тем же адресом, и проверяет, что наших ключей не осталось.
// Возвращает true, если всё очищено.
export function wipeLocalData() {
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      for (const storage of [localStorage, sessionStorage]) {
        ownKeys(storage).forEach(key => storage.removeItem(key));
      }
      if (!ownKeys(localStorage).length && !ownKeys(sessionStorage).length) return true;
    } catch (e) {
      console.error(e);
    }
  }
  return false;
}

// Вызывается при загрузке каждой страницы (pages/*.js). Один раз переносит данные прошлой версии (ключи без префикса) под новые имена
// и удаляет ключи входа через Telegram, которые больше не используются
export function migrateLegacyKeys() {
  try {
    OBSOLETE_KEYS.forEach(key => localStorage.removeItem(key));
    for (const [oldKey, newKey] of Object.entries(LEGACY_KEYS)) {
      const value = localStorage.getItem(oldKey);
      if (value === null) continue;
      if (localStorage.getItem(newKey) === null) localStorage.setItem(newKey, value);
      localStorage.removeItem(oldKey);
    }
  } catch (e) { /* хранилище недоступно — ничего не переносим */ }
}
