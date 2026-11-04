import { state } from '../../state.js';

export function setEmoji(emoji) {
  state.selectedEmoji = (state.selectedEmoji === emoji) ? null : emoji;
  updateEmojiSelection();
}

export function updateEmojiSelection() {
  document.querySelectorAll('.emoji-option').forEach(btn => {
    const active = !!state.selectedEmoji && btn.textContent.trim() === state.selectedEmoji;
    btn.classList.toggle('border', active);
    btn.classList.toggle('border-purple-500', active);
    btn.classList.toggle('bg-purple-950/50', active);
  });
}

export const actions = {
  setEmoji: (el) => setEmoji(el.dataset.emoji),
};
