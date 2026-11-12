import { AUTH_API_URL, BOT_USERNAME } from '../config.js';
import { getAuthClient } from './auth.js';

// Telegram как второй способ входа. Подпись Telegram проверяет сервер бота (backend/main.py);
// сайт получает от него одноразовый вход и обменивает на обычную сессию Supabase.
// Весь этот файл нужен только при TELEGRAM_ENABLED = true (см. config.js).

const REQUEST_TIMEOUT_MS = 90_000;   // бесплатный Render может «просыпаться» около минуты

async function callApi(path, body, accessToken) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    const headers = { 'Content-Type': 'application/json' };
    if (accessToken) headers.Authorization = `Bearer ${accessToken}`;
    const response = await fetch(`${AUTH_API_URL}${path}`, {
      method: 'POST',
      headers,
      body: body ? JSON.stringify(body) : undefined,
      signal: controller.signal,
    });
    let data = null;
    try { data = await response.json(); } catch (e) { /* ответ без тела */ }
    if (!response.ok) {
      throw Object.assign(new Error((data && data.detail) || 'Ошибка сервера'),
        { status: response.status, detail: data && data.detail });
    }
    return data;
  } finally {
    clearTimeout(timer);
  }
}

// Кнопка Telegram Login Widget. onAuth(user) вызывается, когда человек подтвердил вход в Telegram.
let widgetHandler = null;
window.onTelegramWidgetAuth = (user) => { if (widgetHandler) widgetHandler(user); };   // её вызывает виджет

export function mountTelegramWidget(container, onAuth) {
  widgetHandler = onAuth;
  const script = document.createElement('script');
  script.async = true;
  script.src = 'https://telegram.org/js/telegram-widget.js?22';
  script.setAttribute('data-telegram-login', BOT_USERNAME);
  script.setAttribute('data-size', 'large');
  script.setAttribute('data-onauth', 'onTelegramWidgetAuth(user)');
  container.appendChild(script);
}

// Вход: сервер проверяет Telegram и отдаёт одноразовый token_hash, сайт меняет его на сессию Supabase
export async function loginWithTelegram(widgetUser) {
  const { token_hash } = await callApi('/auth/telegram', { widget: widgetUser });
  const client = await getAuthClient();
  const { error } = await client.auth.verifyOtp({ token_hash, type: 'magiclink' });
  if (error) throw error;
}

async function accessToken() {
  const client = await getAuthClient();
  const { data } = await client.auth.getSession();
  if (!data || !data.session) throw Object.assign(new Error('Нет входа'), { status: 401 });
  return data.session.access_token;
}

// Привязка и отвязка работают только для вошедшего на сайте: сервер проверяет и его токен, и подпись Telegram
export async function linkTelegram(widgetUser) {
  await callApi('/telegram/link', { widget: widgetUser }, await accessToken());
}

export async function unlinkTelegram() {
  await callApi('/telegram/unlink', null, await accessToken());
}

// Текущая привязка вошедшего пользователя или null (читается напрямую из базы, доступ закрыт политикой RLS)
export async function getTelegramLink() {
  const client = await getAuthClient();
  const { data, error } = await client.from('telegram_links')
    .select('telegram_id, first_name, username, linked_at').maybeSingle();
  if (error) throw error;
  return data;
}

export function telegramErrorText(error) {
  if (error.name === 'AbortError' || error instanceof TypeError) {
    return 'Сервер не отвечает. Бесплатный сервер может просыпаться до минуты — попробуйте ещё раз.';
  }
  if (error.status === 404 && error.detail === 'not_linked') {
    return 'Этот Telegram не привязан к аккаунту. Войдите по почте и паролю и привяжите его в настройках.';
  }
  if (error.status === 403) return 'Этот Telegram нельзя привязать: он не принадлежит владельцу.';
  if (error.status === 409) return 'Этот Telegram уже привязан к другому аккаунту.';
  if (error.status === 401) return 'Не удалось подтвердить Telegram. Попробуйте ещё раз.';
  return 'Не удалось выполнить операцию. Попробуйте позже.';
}
