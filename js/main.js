import { state } from './state.js';
import { registerActions, initActionDelegation } from './core/actions.js';
import { resolveCurrentUser } from './services/auth.js';
import { authenticate } from './services/session.js';
import { clearUser } from './services/localStore.js';

import { initStickyHeader } from './ui/stickyHeader.js';
import { loadNotes } from './features/notes/notesController.js';

import { actions as loginActions, initLoginModal } from './features/auth/loginModal.js';
import { actions as navigationActions } from './features/navigation.js';
import { actions as feedActions, initSearch } from './features/feed/feed.js';
import { actions as tagsActions } from './features/feed/tags.js';
import { actions as favoritesActions } from './features/feed/favorites.js';
import { actions as carouselActions, initCarousel } from './features/feed/carousel.js';
import { actions as calendarActions } from './features/calendar/calendar.js';
import { actions as editorActions, initEditor } from './features/editor/editorModal.js';
import { actions as emojiActions } from './features/editor/emoji.js';
import { actions as markdownActions } from './features/editor/markdownToolbar.js';
import { actions as photoActions, initPhotoUploader } from './features/editor/photoUploader.js';
import { actions as viewerActions, initImageViewer } from './features/viewer/imageViewer.js';

// Новый модуль подключается так: импортировать его actions/init и добавить сюда.
registerActions({
  ...loginActions,
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

// Гость: видит только визитку. Дневник и запросы к данным не запускаются.
function showVisitCard() {
  hide('appLoader');
  hide('appRoot');
  show('visitCard');
}

function showStatus(text, isError = false) {
  const el = document.getElementById('appLoader');
  el.textContent = text;
  el.className = `text-center py-24 ${isError ? 'text-red-400' : 'text-slate-500'}`;
  hide('visitCard');
  hide('appRoot');
}

function showAuthError(error, credentials) {
  console.error(error);
  // сохранённый вход устарел — возвращаем на визитку, войти можно через аватарку
  if (credentials.widget && error.status === 401) {
    clearUser();
    showVisitCard();
    return;
  }
  const denied = error.status === 401 || error.status === 403;
  showStatus(denied
    ? '⛔ Доступ запрещен'
    : 'Не удалось подключиться к серверу авторизации. Попробуйте позже.', true);
}

// Дневник загружается только после успешной авторизации
async function startApp({ user, credentials }) {
  showStatus('Загрузка…');
  try {
    await authenticate(credentials);
  } catch (error) {
    showAuthError(error, credentials);
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
initLoginModal();

const session = resolveCurrentUser();
if (session) startApp(session);
else showVisitCard();
