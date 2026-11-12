import { getDraft, wipeLocalData } from '../../services/localStore.js';
import { signOut } from '../../services/auth.js';
import { VISIT_URL } from '../../config.js';
import { cleanupPhotos } from './photoCleanup.js';
import { actions as telegramActions } from './telegramLink.js';

// Выход из аккаунта: забываем вход и всё, что этот сайт сохранил в браузере, и уходим на визитку.
// Переход на другую страницу сбрасывает память — ни токена, ни записей не остаётся.
// replace (а не обычный переход) убирает эту страницу из истории.
export async function logout() {
  if (getDraft().trim() && !confirm('Несохранённый черновик будет удалён. Выйти из аккаунта?')) return;

  await signOut();   // завершает вход на этом устройстве
  if (!wipeLocalData()) console.error('Не удалось полностью очистить хранилище');

  location.replace(VISIT_URL);
}

export const actions = {
  logout: () => logout(),
  cleanupPhotos: () => cleanupPhotos(),
  ...telegramActions,
};
