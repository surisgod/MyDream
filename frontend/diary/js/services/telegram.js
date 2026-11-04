export const tg = window.Telegram.WebApp;
tg.ready();
tg.expand();

export function getTelegramUser() {
  return tg.initDataUnsafe?.user;
}
