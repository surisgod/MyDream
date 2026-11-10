import { VISIT_URL } from '../config.js';
import { resolveCurrentUser } from '../services/auth.js';
import { authenticate } from '../services/session.js';
import { clearUser } from '../services/localStore.js';

// Защита страниц дневника (notes/, notes/settings/ и будущих). На странице должны быть блоки:
//   #appLoader (с #appLoaderText и ссылкой #appLoaderBack) — виден, пока идёт проверка;
//   #appRoot — содержимое страницы, скрыто до успешной проверки.
// Гость и тот, чей вход не прошёл проверку на сервере, отправляется на визитку и ничего не видит.

const show = (id) => document.getElementById(id).classList.remove('hidden');
const hide = (id) => document.getElementById(id).classList.add('hidden');

// reason — почему вернули: 'expired' | 'denied' (визитка покажет это в окне входа)
export function goToVisit(reason) {
  location.replace(reason ? `${VISIT_URL}?e=${reason}` : VISIT_URL);
}

function showStatus(text, { error = false, canGoBack = false } = {}) {
  const textEl = document.getElementById('appLoaderText');
  textEl.textContent = text;
  textEl.className = error ? 'text-red-400' : 'text-slate-500';
  document.getElementById('appLoaderBack').classList.toggle('hidden', !canGoBack);
  hide('appRoot');
  show('appLoader');
}

function handleAuthError(error, credentials) {
  console.error(error);
  const denied = error.status === 401 || error.status === 403;

  // сохранённый вход устарел или аккаунт не подходит — забываем его; войти можно через аватарку на визитке
  if (credentials.widget && denied) {
    clearUser();
    goToVisit(error.status === 403 ? 'denied' : 'expired');
    return;
  }

  showStatus(denied
    ? '⛔ Доступ запрещен'
    : 'Не удалось подключиться к серверу авторизации. Попробуйте позже.', { error: true, canGoBack: true });
}

// onReady(user) вызывается после успешной проверки, когда страница уже показана
export async function startProtectedPage(onReady) {
  // Вернулись кнопкой «Назад» на страницу из кэша браузера, а вход уже сброшен — дневник не показываем
  window.addEventListener('pageshow', (event) => {
    if (event.persisted && !resolveCurrentUser()) goToVisit();
  });

  const session = resolveCurrentUser();
  if (!session) {
    goToVisit();
    return;
  }

  try {
    await authenticate(session.credentials);
  } catch (error) {
    handleAuthError(error, session.credentials);
    return;
  }

  hide('appLoader');
  show('appRoot');
  await onReady(session.user);
}
