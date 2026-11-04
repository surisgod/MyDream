import { state } from './state.js';
import { registerActions, initActionDelegation } from './core/actions.js';
import { resolveCurrentUser, renderLoginScreen } from './services/auth.js';
import { authenticate } from './services/session.js';
import { clearUser } from './services/localStore.js';

import { initStickyHeader } from './ui/stickyHeader.js';
import { loadNotes } from './features/notes/notesController.js';

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

function showAuthError(error, credentials) {
  console.error(error);
  // сохранённый вход устарел — просим войти заново
  if (credentials.widget && error.status === 401) {
    clearUser();
    renderLoginScreen();
    return;
  }
  const denied = error.status === 401 || error.status === 403;
  document.querySelector('header').style.display = 'none';
  document.getElementById('notesContainer').innerHTML = denied
    ? `<p class="text-red-400 text-center py-10">⛔ Доступ запрещен</p>`
    : `<p class="text-red-400 text-center py-10">Не удалось подключиться к серверу авторизации. Попробуйте позже.</p>`;
}

async function startApp({ user, credentials }) {
  try {
    await authenticate(credentials);
  } catch (error) {
    showAuthError(error, credentials);
    return;
  }

  state.user = user;
  document.getElementById('userInfo').innerHTML = `👤 ${user.first_name || 'Владелец'}`;

  initSearch();
  initEditor();
  initPhotoUploader();
  initCarousel();
  initImageViewer();

  await loadNotes();
}

initActionDelegation();
initStickyHeader();

const session = resolveCurrentUser();
if (session) startApp(session);
else renderLoginScreen();
