export const tg = window.Telegram.WebApp;
tg.ready();
tg.expand();

export function getInitData() {
  return tg.initData;
}

export function getTelegramUser() {
  return tg.initDataUnsafe?.user;
}
