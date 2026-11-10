import { registerActions, initActionDelegation } from '../core/actions.js';
import { resolveCurrentUser } from '../services/auth.js';
import { actions as loginActions, initLoginModal, openLoginModal } from '../features/auth/loginModal.js';
import { NOTES_URL } from '../config.js';

// Причины, по которым дневник вернул человека на визитку (см. goToVisit в pages/notes.js)
const REASONS = {
  expired: 'Вход устарел. Войдите заново.',
  denied: 'Этот аккаунт не подходит. Войдите в аккаунт автора.',
};

registerActions({
  ...loginActions,
  // Аватарка: есть сохранённый вход — идём в дневник (он сам перепроверит вход на сервере
  // и вернёт сюда, если вход не подошёл); нет — открываем окно входа.
  onAvatarClick: () => {
    if (resolveCurrentUser()) location.href = NOTES_URL;
    else openLoginModal();
  },
});

initActionDelegation();
initLoginModal();

const reason = new URLSearchParams(location.search).get('e');
if (reason) {
  history.replaceState({}, '', location.pathname);
  if (REASONS[reason]) openLoginModal(REASONS[reason]);
}
