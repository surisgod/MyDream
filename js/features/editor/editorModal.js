import { state } from '../../state.js';
import { insertNote, updateNote, deleteNote } from '../../services/notesApi.js';
import { getDraft, saveDraft, clearDraft } from '../../services/localStore.js';
import { formatDateRu } from '../../utils/date.js';
import { parsePhotos, serializePhotos } from '../../utils/photos.js';
import { deletePhotos } from '../../services/photoStorage.js';
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

// Каждое открытие окна — новая «сессия»: считаем, какие фото в нём загружены
function startEditorSession() {
  state.editorSession += 1;
  state.sessionUploads = [];
}

// Файлы, которые после сохранения записи больше не нужны: убранные из записи
// и загруженные в окне, но не оставленные в ней.
function unusedPhotos(originalNote) {
  const kept = new Set(state.currentPhotos.map(p => p.url));
  const before = originalNote ? parsePhotos(originalNote.photo_url).map(p => p.url) : [];
  return [...before, ...state.sessionUploads].filter(url => !kept.has(url));
}

export function openCreateModal() {
  startEditorSession();
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
  const note = state.allNotes.find(n => n.id === id);
  if (!note) return;
  startEditorSession();
  state.currentEditingId = id;

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
  state.sessionUploads = [];
  state.editorSession += 1;
}

// «Отмена» / ✕: загруженные в окне, но не сохранённые фото удаляем из бакета
export function cancelModal() {
  const abandoned = state.sessionUploads;
  closeModal();
  deletePhotos(abandoned);
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

  const originalNote = state.allNotes.find(n => n.id === state.currentEditingId) || null;
  const unused = unusedPhotos(originalNote);

  if (state.currentEditingId === null) {
    const { error } = await insertNote(state.user.id, fields);
    if (!error) {
      deletePhotos(unused);
      clearDraft();
      closeModal();
      state.openDays[formatDateRu(new Date())] = true;
      state.currentPage = 1;
      await loadNotes();
    } else {
      alert('Ошибка при создании записи');
      console.error(error);
    }
  } else {
    const { error } = await updateNote(state.user.id, state.currentEditingId, fields);
    if (!error) {
      deletePhotos(unused);
      closeModal();
      await loadNotes();
    } else {
      alert('Ошибка при сохранении');
    }
  }
}

export async function deleteCurrentNote() {
  if (!confirm('⚠️ Внимание! Запись будет удалена безвозвратно. Вы абсолютно уверены?')) return;

  const note = state.allNotes.find(n => n.id === state.currentEditingId);
  const photos = [...(note ? parsePhotos(note.photo_url).map(p => p.url) : []), ...state.sessionUploads];

  const { error } = await deleteNote(state.user.id, state.currentEditingId);
  if (!error) {
    deletePhotos(photos);
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
  closeModal: () => cancelModal(),
  saveCurrentNote: () => saveCurrentNote(),
  deleteCurrentNote: () => deleteCurrentNote(),
  openEditModal: (el) => openEditModal(Number(el.dataset.id)),
};
