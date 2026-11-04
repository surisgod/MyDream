import { BOT_USERNAME } from '../config.js';
import { getTelegramUser, getInitData } from './telegram.js';
import { getSavedUser, saveUser } from './localStore.js';

// Возвращает { user, credentials } или null, если нужно показать экран входа.
// credentials уходят на сервер, который проверяет подпись Telegram.
export function resolveCurrentUser() {
  const tgUser = getTelegramUser();
  if (tgUser && tgUser.id) {
    if (window.location.search || window.location.hash.includes('tgWebAppData')) {
      window.history.replaceState({}, document.title, window.location.pathname);
    }
    return { user: tgUser, credentials: { init_data: getInitData() } };
  }
  const saved = getSavedUser();
  return saved ? { user: saved, credentials: { widget: saved } } : null;
}


export function renderLoginScreen() {
  document.querySelector('header').style.display = 'none';
  document.getElementById('notesContainer').innerHTML = `
    <div class="text-center py-16 space-y-4">
      <h2 class="text-lg font-medium text-slate-300">Авторизуйтесь для доступа к дневнику</h2>
      <div id="telegramLoginButton" class="flex justify-center pt-2"></div>
    </div>
  `;
  const script = document.createElement('script');
  script.async = true;
  script.src = "https://telegram.org/js/telegram-widget.js?22";
  script.setAttribute('data-telegram-login', BOT_USERNAME);
  script.setAttribute('data-size', 'large');
  script.setAttribute('data-onauth', 'onTelegramAuth(user)');
  document.getElementById('telegramLoginButton').appendChild(script);
}

// Вызывается виджетом Telegram, поэтому должна быть глобальной
window.onTelegramAuth = function (user) {
  saveUser(user);
  location.reload();
};
