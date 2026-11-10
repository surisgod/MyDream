import { getDraft, wipeLocalData } from '../../services/localStore.js';
import { clearSession } from '../../services/session.js';
import { VISIT_URL } from '../../config.js';
import { closeModal } from '../editor/editorModal.js';
import { closeImageModal } from '../viewer/imageViewer.js';

export function openSettings() {
  const modal = document.getElementById('settingsModal');
  modal.classList.remove('hidden');
  modal.classList.add('flex');
}

export function closeSettings() {
  const modal = document.getElementById('settingsModal');
  modal.classList.add('hidden');
  modal.classList.remove('flex');
}

// Выход из аккаунта: забываем вход и всё, что этот сайт сохранил в браузере, и уходим на визитку.
// Переход на другую страницу сбрасывает память — ни токена, ни записей не остаётся.
// replace (а не обычный переход) убирает дневник из истории: кнопка «Назад» его не вернёт.
export function logout() {
  if (getDraft().trim() && !confirm('Несохранённый черновик будет удалён. Выйти из аккаунта?')) return;

  // сначала закрываем всё, что могло бы снова что-то записать в хранилище
  closeModal();
  document.getElementById('modalText').value = '';
  closeImageModal();
  closeSettings();

  clearSession();
  if (!wipeLocalData()) console.error('Не удалось полностью очистить хранилище');

  location.replace(VISIT_URL);
}

export function initSettings() {
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeSettings();
  });
}

export const actions = {
  openSettings: () => openSettings(),
  closeSettings: () => closeSettings(),
  closeSettingsOnBackdrop: (el, event) => { if (event.target === el) closeSettings(); },
  logout: () => logout(),
};
