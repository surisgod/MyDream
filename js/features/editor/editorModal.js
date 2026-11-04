import { state } from '../../state.js';
import { insertNote, updateNote, deleteNote } from '../../services/notesApi.js';
import { getDraft, saveDraft, clearDraft } from '../../services/localStore.js';
import { formatDateRu } from '../../utils/date.js';
import { parsePhotos, serializePhotos } from '../../utils/photos.js';
import { loadNotes } from '../notes/notesController.js';
import { updateEmojiSelection } from './emoji.js';
import { renderModalImage } from './photoUploader.js';

export function updateCounters() {
  const text = document.getElementById('modalText').value;
  const chars = text.length;
  const words = text.trim() ? text.trim().split(/\s+/).length : 0;
  document.getElementById('charCount').innerText = `${chars} симв. / ${words} слов`;
}

export function handleTextDraftInput() {
  updateCounters();
  if (state.currentEditingId === null) {
    saveDraft(document.getElementById('modalText').value);
  }
}

export function openCreateModal() {
  state.currentEditingId = null;
  state.currentPhotos = [];
  document.getElementById('modalTitle').innerText = 'Новая запись';
  const savedDraft = getDraft();
  document.getElementById('modalText').value = savedDraft;
  renderModalImage();
  document.getElementById('deleteBtn').classList.add('hidden');
  state.selectedEmoji = null;
  updateEmojiSelection();
  updateCounters();
  document.getElementById('editModal').classList.remove('hidden');
  document.getElementById('editModal').classList.add('flex');
}

export function openEditModal(id) {
  state.currentEditingId = id;
  const note = state.allNotes.find(n => n.id === id);
  if (!note) return;

  document.getElementById('modalTitle').innerText = 'Редактирование заметки';
  document.getElementById('modalText').value = note.text || '';
  state.selectedEmoji = note.emoji || null;
  updateEmojiSelection();
  state.currentPhotos = parsePhotos(note.photo_url);
  renderModalImage();
  document.getElementById('deleteBtn').classList.remove('hidden');
  updateCounters();
  document.getElementById('editModal').classList.remove('hidden');
  document.getElementById('editModal').classList.add('flex');
}

export function closeModal() {
  document.getElementById('editModal').classList.add('hidden');
  document.getElementById('editModal').classList.remove('flex');
  state.currentEditingId = null;
  state.currentPhotos = [];
}

export async function saveCurrentNote() {
  if (state.isUploading) {
    alert('Дождитесь окончания загрузки фото');
    return;
  }

  const text = document.getElementById('modalText').value.trim();
  if (!text && !state.currentPhotos.length) {
    alert('Заметка не может быть пустой');
    return;
  }

  const fields = {
    text,
    emoji: state.selectedEmoji,
    photo_url: serializePhotos(state.currentPhotos),
  };

  if (state.currentEditingId === null) {
    const { error } = await insertNote(state.user.id, fields);
    if (!error) {
      clearDraft();
      closeModal();
      state.openDays[formatDateRu(new Date())] = true;
      await loadNotes();
    } else {
      alert('Ошибка при создании записи');
      console.error(error);
    }
  } else {
    const { error } = await updateNote(state.user.id, state.currentEditingId, fields);
    if (!error) {
      closeModal();
      await loadNotes();
    } else {
      alert('Ошибка при сохранении');
    }
  }
}

export async function deleteCurrentNote() {
  if (!confirm('⚠️ Внимание! Запись будет удалена безвозвратно. Вы абсолютно уверены?')) return;

  const { error } = await deleteNote(state.user.id, state.currentEditingId);
  if (!error) {
    closeModal();
    await loadNotes();
  } else {
    alert('Ошибка при удалении');
  }
}

export function initEditor() {
  document.getElementById('modalText').addEventListener('input', handleTextDraftInput);
}

export const actions = {
  openCreateModal: () => openCreateModal(),
  closeModal: () => closeModal(),
  saveCurrentNote: () => saveCurrentNote(),
  deleteCurrentNote: () => deleteCurrentNote(),
  openEditModal: (el) => openEditModal(Number(el.dataset.id)),
};
