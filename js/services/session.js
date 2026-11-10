import { AUTH_API_URL } from '../config.js';

// Сессия сайта: обменивает подписанные данные Telegram на JWT от бота.
// Токен хранится только в памяти и обновляется автоматически.
export class AuthError extends Error {
  constructor(message, status) {
    super(message);
    this.status = status;
  }
}

let credentials = null;   // { init_data } или { widget }
let token = null;
let expiresAt = 0;
let inFlight = null;

async function requestToken() {
  let res;
  try {
    res = await fetch(`${AUTH_API_URL}/auth/telegram`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(credentials),
    });
  } catch (e) {
    throw new AuthError('Сервер авторизации недоступен', 0);
  }
  if (!res.ok) throw new AuthError(`Ошибка авторизации (${res.status})`, res.status);

  const data = await res.json();
  token = data.access_token;
  expiresAt = Date.now() + data.expires_in * 1000;
  return token;
}

// Используется клиентом Supabase как accessToken
export async function getAccessToken() {
  if (!credentials) return null;
  if (token && Date.now() < expiresAt - 60_000) return token;
  if (!inFlight) inFlight = requestToken().finally(() => { inFlight = null; });
  return inFlight;
}

export async function authenticate(newCredentials) {
  credentials = newCredentials;
  token = null;
  await getAccessToken();
}

// Забывает токен и данные входа в памяти (при выходе из аккаунта)
export function clearSession() {
  credentials = null;
  token = null;
  expiresAt = 0;
  inFlight = null;
}
