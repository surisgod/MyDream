import { mountTelegramWidget } from '../../services/auth.js';

// Окно входа для автора сайта. Кнопка Telegram подгружается только при первом открытии.
let widgetMounted = false;

// message — необязательная пометка в окне (например, «вход устарел»)
export function openLoginModal(message = '') {
  const note = document.getElementById('loginModalMessage');
  note.textContent = message;
  note.classList.toggle('hidden', !message);
  const modal = document.getElementById('loginModal');
  modal.classList.remove('hidden');
  modal.classList.add('flex');
  if (!widgetMounted) {
    mountTelegramWidget(document.getElementById('telegramLoginButton'));
    widgetMounted = true;
  }
}

export function closeLoginModal() {
  const modal = document.getElementById('loginModal');
  modal.classList.add('hidden');
  modal.classList.remove('flex');
}

export function initLoginModal() {
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeLoginModal();
  });
}

export const actions = {
  openLoginModal: () => openLoginModal(),
  closeLoginModal: () => closeLoginModal(),
  closeLoginModalOnBackdrop: (el, event) => { if (event.target === el) closeLoginModal(); },
};
