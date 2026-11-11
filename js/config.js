// Все настройки и константы приложения — в одном месте.
export const SUPABASE_URL = 'https://oblwxfefeltikdkmodon.supabase.co';
export const SUPABASE_ANON_KEY = 'sb_publishable_bhvGHwhyHMBsG7amxcEw0g_fkWowvv6';

// Адрес бота на Render, где работает эндпоинт /auth/telegram
export const AUTH_API_URL = 'https://mydream-g0y6.onrender.com';

export const BOT_USERNAME = 'OmoriDiarybot';

export const NOTES_TABLE = 'notes';
export const PHOTOS_BUCKET = 'diary_photos';
export const PHOTOS_PATH_PREFIX = 'notes/web_uploads';
export const PHOTO_URL_TTL = 3600; // сколько секунд живёт временная ссылка на фото (бакет приватный)

export const MAX_PHOTOS = 4;
export const MAX_TOTAL_BYTES = 40 * 1024 * 1024; // 40 МБ на запись
export const FAV_TAG = '__fav__';

// Всё, что сайт хранит в браузере, лежит под префиксом. Хранилище общее для всех сайтов
// с тем же адресом (имя.github.io), поэтому при выходе удаляются только ключи с этими префиксами.
export const STORAGE_PREFIX = 'mydream:';
export const STORAGE_KEYS = { user: `${STORAGE_PREFIX}tg_user`, draft: `${STORAGE_PREFIX}diary_draft` };
// Ключи, которые клиент Supabase может создать сам (sb-<проект>-...) — тоже наши
const SUPABASE_REF = new URL(SUPABASE_URL).hostname.split('.')[0];
export const OWN_KEY_PREFIXES = [STORAGE_PREFIX, `sb-${SUPABASE_REF}-`];
// Названия из прошлой версии сайта (без префикса) — переносятся один раз при первом запуске
export const LEGACY_KEYS = { tg_user: STORAGE_KEYS.user, diary_draft: STORAGE_KEYS.draft };

// Страницы сайта. Адреса считаются от места этого файла (js/config.js), поэтому
// одинаково работают с любой страницы и любой вложенности (visit/, notes/, notes/settings/).
const SITE_ROOT = new URL('../', import.meta.url);
export const VISIT_URL = new URL('visit/', SITE_ROOT).href;
export const NOTES_URL = new URL('notes/', SITE_ROOT).href;
export const SETTINGS_URL = new URL('notes/settings/', SITE_ROOT).href;
