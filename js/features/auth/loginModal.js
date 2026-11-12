import { signIn, preloadAuth } from '../../services/auth.js';
import { NOTES_URL, TELEGRAM_ENABLED } from '../../config.js';
import { mountTelegramWidget, loginWithTelegram, telegramErrorText } from '../../services/telegramAuth.js';

// Окно входа для автора сайта: почта + пароль (Supabase Auth) или, если привязан, Telegram.
const $ = (id) => document.getElementById(id);

function setMessage(text) {
  const note = $('loginModalMessage');
  note.textContent = text;
  note.classList.toggle('hidden', !text);
}

function setStatus(text) {
  const status = $('loginModalStatus');
  status.textContent = text;
  status.classList.toggle('hidden', !text);
}

function errorText(error) {
  if (error instanceof TypeError || error.name === 'AuthRetryableFetchError') return 'Не удалось подключиться. Проверьте интернет.';
  if (error.status === 429) return 'Слишком много попыток. Подождите немного и попробуйте снова.';
  switch (error.code) {
    case 'invalid_credentials': return 'Неверная почта или пароль.';
    case 'email_not_confirmed': return 'Почта не подтверждена: подтвердите пользователя в панели Supabase.';
    case 'email_provider_disabled': return 'Вход по почте отключён в настройках Supabase.';
  }
  return error.status === 400 ? 'Неверная почта или пароль.' : 'Не удалось войти. Попробуйте позже.';
}

// Кнопка Telegram: показывается только если вход через Telegram включён, и подгружается при первом открытии окна
let telegramMounted = false;
function mountTelegramOnce() {
  if (!TELEGRAM_ENABLED || telegramMounted) return;
  telegramMounted = true;
  $('telegramLogin').classList.remove('hidden');
  mountTelegramWidget($('telegramLoginButton'), onTelegramUser);
}

async function onTelegramUser(user) {
  setMessage('');
  setStatus('Входим через Telegram… Если сервер спал, это может занять до минуты.');
  $('loginSubmit').disabled = true;
  try {
    await loginWithTelegram(user);
    location.href = NOTES_URL;
    return;
  } catch (error) {
    console.error(error);
    setMessage(telegramErrorText(error));
  }
  setStatus('');
  $('loginSubmit').disabled = false;
}

// message — необязательная пометка в окне (например, «вход устарел»)
export function openLoginModal(message = '') {
  setMessage(message);
  const modal = $('loginModal');
  modal.classList.remove('hidden');
  modal.classList.add('flex');
  preloadAuth();               // подгружаем клиент Supabase, пока человек вводит данные
  mountTelegramOnce();
  $('loginEmail').focus();
}

export function closeLoginModal() {
  const modal = $('loginModal');
  modal.classList.add('hidden');
  modal.classList.remove('flex');
}

async function onSubmit(event) {
  event.preventDefault();
  const button = $('loginSubmit');
  setMessage('');
  button.disabled = true;
  button.textContent = 'Входим…';

  try {
    await signIn($('loginEmail').value.trim(), $('loginPassword').value);
    location.href = NOTES_URL;
    return;                    // кнопка остаётся неактивной до перехода
  } catch (error) {
    console.error(error);
    setMessage(errorText(error));
    $('loginPassword').value = '';
    $('loginPassword').focus();
  }
  button.disabled = false;
  button.textContent = 'Войти';
}

export function initLoginModal() {
  $('loginForm').addEventListener('submit', onSubmit);
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeLoginModal();
  });
}

export const actions = {
  openLoginModal: () => openLoginModal(),
  closeLoginModal: () => closeLoginModal(),
  closeLoginModalOnBackdrop: (el, event) => { if (event.target === el) closeLoginModal(); },
};
