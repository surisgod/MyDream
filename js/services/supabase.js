import { SUPABASE_URL, SUPABASE_ANON_KEY } from '../config.js';
import { getAccessToken } from './session.js';

// window.supabase подключается через CDN в index.html.
// Каждый запрос подписывается JWT, который выдал бот (см. session.js).
export const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  accessToken: getAccessToken,
});
