import { registerActions, initActionDelegation } from '../core/actions.js';
import { startProtectedPage } from '../core/protectedPage.js';
import { actions as settingsActions } from '../features/settings/settings.js';

// Новый раздел настроек подключается так: импортировать его actions и добавить сюда.
registerActions({
  ...settingsActions,
});

initActionDelegation();

startProtectedPage((user) => {
  document.getElementById('accountName').textContent = user.first_name || 'Владелец';
});
