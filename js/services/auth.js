import { AUTH_STORAGE_KEY, SUPABASE_CDN } from '../config.js';

// Вход через Supabase Auth (почта + пароль). Это единственный модуль, который знает, КАК человек входит:
// другой способ входа (ссылка на почту, пароль + код и т.п.) меняется здесь, остальной сайт не затрагивается.

// Есть ли сохранённый вход (без запросов в сеть). Настоящая проверка — getVerifiedUser().
export function hasSavedSession() {
  try { return localStorage.getItem(AUTH_STORAGE_KEY) !== null; } catch (e) { return false; }
}

// Забывает сохранённый вход в этом браузере
export function forgetSession() {
  try { localStorage.removeItem(AUTH_STORAGE_KEY); } catch (e) { /* хранилище недоступно */ }
}

function loadSupabaseScript() {
  if (window.supabase) return Promise.resolve();
  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = SUPABASE_CDN;
    script.onload = resolve;
    script.onerror = () => reject(new TypeError('Не удалось загрузить Supabase'));
    document.head.appendChild(script);
  });
}

// Клиент Supabase. На визитке скрипт подгружается только когда он нужен (окно входа),
// на страницах дневника и настроек он уже подключён в HTML.
let clientPromise = null;
export function getAuthClient() {
  if (!clientPromise) {
    clientPromise = loadSupabaseScript()
      .then(() => import('./supabase.js'))
      .then(module => module.supabaseClient)
      .catch(error => { clientPromise = null; throw error; });
  }
  return clientPromise;
}

// Подгрузить заранее (например, при открытии окна входа), чтобы вход прошёл быстрее
export const preloadAuth = () => getAuthClient().catch(() => {});

const toUser = (user) => ({ id: user.id, email: user.email || '' });

export async function signIn(email, password) {
  const client = await getAuthClient();
  const { data, error } = await client.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return toUser(data.user);
}

// Проверяет вход на сервере Supabase (при необходимости обновляя токен).
// Бросает ошибку, если входа нет или он недействителен.
export async function getVerifiedUser() {
  const client = await getAuthClient();
  const { data, error } = await client.auth.getUser();
  if (error) throw error;
  if (!data || !data.user) throw new Error('Нет входа');
  return toUser(data.user);
}

// Выход на этом устройстве. Если сервер недоступен, вход всё равно забывается локально.
export async function signOut() {
  try {
    const client = await getAuthClient();
    await Promise.race([
      client.auth.signOut({ scope: 'local' }),
      new Promise(resolve => setTimeout(resolve, 3000)),
    ]);
  } catch (error) {
    console.error(error);
  } finally {
    forgetSession();
  }
}

// Ошибка связана с сетью или сервером (а не с тем, что вход недействителен)?
export function isNetworkError(error) {
  return error instanceof TypeError
    || (error && error.name === 'AuthRetryableFetchError')
    || (error && (error.status === 0 || error.status >= 500));
}
