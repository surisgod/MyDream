import { SUPABASE_URL, SUPABASE_ANON_KEY } from '../config.js';

// window.supabase подключается через CDN в index.html
export const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
