import { registerActions, initActionDelegation } from '../core/actions.js';
import { startProtectedPage } from '../core/protectedPage.js';
import { migrateLegacyKeys } from '../services/localStore.js';
import { actions as settingsActions } from '../features/settings/settings.js';
import { initTelegramSection } from '../features/settings/telegramLink.js';

// Новый раздел настроек подключается так: импортировать его actions и добавить сюда.
registerActions({
  ...settingsActions,
});

migrateLegacyKeys();
initActionDelegation();

startProtectedPage((user) => {
  document.getElementById('accountName').textContent = user.email || 'Владелец';
  initTelegramSection();
});
