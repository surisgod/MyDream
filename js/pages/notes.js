import { state } from '../state.js';
import { registerActions, initActionDelegation } from '../core/actions.js';
import { startProtectedPage } from '../core/protectedPage.js';

import { initStickyHeader } from '../ui/stickyHeader.js';
import { initPhotoUrlRefresh } from '../services/photoUrls.js';
import { loadNotes } from '../features/notes/notesController.js';

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

initActionDelegation();

startProtectedPage(async (user) => {
  state.user = user;
  document.getElementById('userInfo').innerHTML = `👤 ${user.first_name || 'Владелец'}`;

  initStickyHeader();   // после показа страницы, чтобы шапка измерилась корректно
  initSearch();
  initEditor();
  initPhotoUploader();
  initCarousel();
  initImageViewer();
  initPhotoUrlRefresh();

  await loadNotes();
});
