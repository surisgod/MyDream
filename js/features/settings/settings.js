import { getDraft, wipeLocalData } from '../../services/localStore.js';
import { clearSession } from '../../services/session.js';
import { VISIT_URL } from '../../config.js';

// Выход из аккаунта: забываем вход и всё, что этот сайт сохранил в браузере, и уходим на визитку.
// Переход на другую страницу сбрасывает память — ни токена, ни записей не остаётся.
// replace (а не обычный переход) убирает эту страницу из истории.
export function logout() {
  if (getDraft().trim() && !confirm('Несохранённый черновик будет удалён. Выйти из аккаунта?')) return;

  clearSession();
  if (!wipeLocalData()) console.error('Не удалось полностью очистить хранилище');

  location.replace(VISIT_URL);
}

export const actions = {
  logout: () => logout(),
};
