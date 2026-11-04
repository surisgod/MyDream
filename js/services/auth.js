import { BOT_USERNAME } from '../config.js';
import { getTelegramUser } from './telegram.js';
import { getSavedUser, saveUser } from './localStore.js';

export function resolveCurrentUser() {
  const tgUser = getTelegramUser();
  if (tgUser && tgUser.id) {
    if (window.location.search || window.location.hash.includes('tgWebAppData')) {
      window.history.replaceState({}, document.title, window.location.pathname);
    }
    return tgUser;
  }
  return getSavedUser();
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
