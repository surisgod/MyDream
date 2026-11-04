// Все настройки и константы приложения — в одном месте.
export const SUPABASE_URL = 'https://oblwxfefeltikdkmodon.supabase.co';
export const SUPABASE_ANON_KEY = 'sb_publishable_bhvGHwhyHMBsG7amxcEw0g_fkWowvv6';

// Адрес бота на Render, где работает эндпоинт /auth/telegram
export const AUTH_API_URL = 'https://YOUR-BOT.onrender.com';

export const BOT_USERNAME = 'OmoriDiarybot';

export const NOTES_TABLE = 'notes';
export const PHOTOS_BUCKET = 'diary_photos';
export const PHOTOS_PATH_PREFIX = 'notes/web_uploads';

export const MAX_PHOTOS = 4;
export const MAX_TOTAL_BYTES = 40 * 1024 * 1024; // 40 МБ на запись
export const FAV_TAG = '__fav__';

export const STORAGE_KEYS = { user: 'tg_user', draft: 'diary_draft' };
