import { VISIT_URL } from '../config.js';
import { hasSavedSession, forgetSession, getVerifiedUser, isNetworkError } from '../services/auth.js';

// Защита страниц дневника (notes/, notes/settings/ и будущих). На странице должны быть блоки:
//   #appLoader (с #appLoaderText и ссылкой #appLoaderBack) — виден, пока идёт проверка;
//   #appRoot — содержимое страницы, скрыто до успешной проверки.
// Гость и тот, чей вход не прошёл проверку на сервере, отправляется на визитку и ничего не видит.

const show = (id) => document.getElementById(id).classList.remove('hidden');
const hide = (id) => document.getElementById(id).classList.add('hidden');

// reason — почему вернули: 'expired' (визитка покажет это в окне входа)
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

function handleAuthError(error) {
  console.error(error);

  // Сервер входа недоступен — это не повод разлогинивать: показываем ошибку и ссылку на визитку
  if (isNetworkError(error)) {
    showStatus('Не удалось связаться с сервером. Проверьте интернет и попробуйте позже.', { error: true, canGoBack: true });
    return;
  }

  // Вход недействителен (истёк, отозван) — забываем его, войти заново можно через аватарку на визитке
  forgetSession();
  goToVisit('expired');
}

// onReady(user) вызывается после успешной проверки, когда страница уже показана; user = { id, email }
export async function startProtectedPage(onReady) {
  // Вернулись кнопкой «Назад» на страницу из кэша браузера, а вход уже сброшен — дневник не показываем
  window.addEventListener('pageshow', (event) => {
    if (event.persisted && !hasSavedSession()) goToVisit();
  });

  if (!hasSavedSession()) {
    goToVisit();
    return;
  }

  let user;
  try {
    user = await getVerifiedUser();
  } catch (error) {
    handleAuthError(error);
    return;
  }

  hide('appLoader');
  show('appRoot');
  await onReady(user);
}
