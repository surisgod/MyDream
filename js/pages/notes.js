import { state } from '../state.js';
import { registerActions, initActionDelegation } from '../core/actions.js';
import { resolveCurrentUser } from '../services/auth.js';
import { authenticate } from '../services/session.js';
import { clearUser } from '../services/localStore.js';
import { VISIT_URL } from '../config.js';

import { initStickyHeader } from '../ui/stickyHeader.js';
import { loadNotes } from '../features/notes/notesController.js';

import { actions as settingsActions, initSettings } from '../features/settings/settings.js';
import { actions as navigationActions } from '../features/navigation.js';
import { actions as feedActions, initSearch } from '../features/feed/feed.js';
import { actions as tagsActions } from '../features/feed/tags.js';
import { actions as favoritesActions } from '../features/feed/favorites.js';
import { actions as carouselActions, initCarousel } from '../features/feed/carousel.js';
import { actions as calendarActions } from '../features/calendar/calendar.js';
import { actions as editorActions, initEditor } from '../features/editor/editorModal.js';
import { actions as emojiActions } from '../features/editor/emoji.js';
import { actions as markdownActions } from '../features/editor/markdownToolbar.js';
import { actions as photoActions, initPhotoUploader } from '../features/editor/photoUploader.js';
import { actions as viewerActions, initImageViewer } from '../features/viewer/imageViewer.js';

// Новый модуль подключается так: импортировать его actions/init и добавить сюда.
registerActions({
  ...settingsActions,
  ...navigationActions,
  ...feedActions,
  ...tagsActions,
  ...favoritesActions,
  ...carouselActions,
  ...calendarActions,
  ...editorActions,
  ...emojiActions,
  ...markdownActions,
  ...photoActions,
  ...viewerActions,
});

const show = (id) => document.getElementById(id).classList.remove('hidden');
const hide = (id) => document.getElementById(id).classList.add('hidden');

// Гостя и тех, чей вход не прошёл проверку, отправляем на визитку; дневник им не показывается.
function goToVisit(reason) {
  location.replace(reason ? `${VISIT_URL}?e=${reason}` : VISIT_URL);
}

function showStatus(text, { error = false, canGoBack = false } = {}) {
  const textEl = document.getElementById('appLoaderText');
  textEl.textContent = text;
  textEl.className = error ? 'text-red-400' : 'text-slate-500';
  document.getElementById('appLoaderBack').classList.toggle('hidden', !canGoBack);
  hide('appRoot');
  show('appLoader');
}

function handleAuthError(error, credentials) {
  console.error(error);
  const denied = error.status === 401 || error.status === 403;

  // сохранённый вход устарел или аккаунт не подходит — забываем его; войти можно через аватарку на визитке
  if (credentials.widget && denied) {
    clearUser();
    goToVisit(error.status === 403 ? 'denied' : 'expired');
    return;
  }

  showStatus(denied
    ? '⛔ Доступ запрещен'
    : 'Не удалось подключиться к серверу авторизации. Попробуйте позже.', { error: true, canGoBack: true });
}

// Дневник показывается и загружает записи только после успешной проверки входа на сервере
async function startApp({ user, credentials }) {
  try {
    await authenticate(credentials);
  } catch (error) {
    handleAuthError(error, credentials);
    return;
  }

  state.user = user;
  hide('appLoader');
  show('appRoot');
  document.getElementById('userInfo').innerHTML = `👤 ${user.first_name || 'Владелец'}`;

  initStickyHeader();   // после показа, чтобы шапка измерилась корректно
  initSearch();
  initEditor();
  initPhotoUploader();
  initCarousel();
  initImageViewer();

  await loadNotes();
}

initActionDelegation();
initSettings();

// Вернулись кнопкой «Назад» на страницу из кэша браузера, а вход уже сброшен — не показываем дневник
window.addEventListener('pageshow', (event) => {
  if (event.persisted && !resolveCurrentUser()) goToVisit();
});

const session = resolveCurrentUser();
if (session) startApp(session);
else goToVisit();
