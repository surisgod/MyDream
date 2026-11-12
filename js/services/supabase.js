import { SUPABASE_URL, SUPABASE_ANON_KEY, AUTH_STORAGE_KEY } from '../config.js';

// window.supabase подключается скриптом с CDN (в HTML страницы или services/auth.js).
// Вход хранит и сам обновляет клиент Supabase; запросы подписываются токеном вошедшего пользователя.
export const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storageKey: AUTH_STORAGE_KEY,
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: false,
  },
});
