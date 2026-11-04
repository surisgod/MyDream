import { state } from '../../state.js';
import { FAV_TAG } from '../../config.js';
import { updateNote } from '../../services/notesApi.js';
import { favBtnClass } from './noteCard.js';
import { renderNotes } from './feed.js';

export function updateFavButtons(id) {
  const note = state.allNotes.find(n => n.id === id);
  if (!note) return;
  document.querySelectorAll(`[data-fav-id="${id}"]`).forEach(btn => {
    btn.textContent = note.is_favorite ? '★' : '☆';
    btn.className = favBtnClass(note.is_favorite);
    btn.title = note.is_favorite ? 'Убрать из избранного' : 'В избранное';
  });
}

export async function toggleFavorite(id) {
  const note = state.allNotes.find(n => n.id === id);
  if (!note) return;

  const newValue = !note.is_favorite;
  note.is_favorite = newValue;
  updateFavButtons(id);

  const { error } = await updateNote(id, { is_favorite: newValue });

  if (error) {
    console.error(error);
    note.is_favorite = !newValue;
    updateFavButtons(id);
    alert('Не удалось обновить избранное. Проверьте, что в таблице notes есть колонка is_favorite.');
    return;
  }

  if (state.selectedTag === FAV_TAG) renderNotes();
}

export const actions = {
  toggleFavorite: (el) => toggleFavorite(Number(el.dataset.id)),
};
