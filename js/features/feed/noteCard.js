import { formatTimeRu } from '../../utils/date.js';
import { renderPhotoCarousel } from './carousel.js';

export function favBtnClass(isFav) {
  return `text-lg leading-none px-1 transition ${isFav ? 'text-yellow-400' : 'text-slate-500 hover:text-yellow-300'}`;
}

// HTML одной записи в ленте
export function renderNoteCard(note) {
  const renderedHtml = marked.parse(note.text || '');
  const time = formatTimeRu(note.created_at);

  return `
    <div class="px-5 py-4 space-y-3 hover:bg-slate-800/30 transition">
      <div class="flex items-center justify-between">
        <div class="flex items-center space-x-2">
          ${note.emoji ? `<span class="text-base">${note.emoji}</span>` : ''}
          <span class="text-xs text-slate-500">${time}</span>
        </div>
        <div class="flex items-center space-x-2">
          <button data-fav-id="${note.id}" data-action="toggleFavorite" data-id="${note.id}" title="${note.is_favorite ? 'Убрать из избранного' : 'В избранное'}" class="${favBtnClass(note.is_favorite)}">${note.is_favorite ? '★' : '☆'}</button>
          <button data-action="openEditModal" data-id="${note.id}" class="text-xs text-purple-400 hover:text-purple-300 bg-purple-950/40 px-2.5 py-1 rounded-lg border border-purple-900/40 transition">Редактировать</button>
        </div>
      </div>

      ${renderPhotoCarousel(note)}

      <div class="markdown-body text-sm text-slate-200">
        ${renderedHtml || '<span class="text-slate-500 italic">Без текста</span>'}
      </div>
    </div>
  `;
}
