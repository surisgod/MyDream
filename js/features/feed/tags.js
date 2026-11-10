import { state } from '../../state.js';
import { FAV_TAG } from '../../config.js';
import { renderNotes } from './feed.js';

export function getAllTags() {
  const tagsSet = new Set();
  state.allNotes.forEach(note => {
    const text = note.text || '';
    const matches = text.match(/#[\wа-яё]+/gi);
    if (matches) matches.forEach(tag => tagsSet.add(tag));
  });
  return Array.from(tagsSet);
}

export function renderTags() {
  const tagsContainer = document.getElementById('tagsContainer');
  const tags = getAllTags();
  const on = 'bg-purple-600 text-white';
  const off = 'bg-slate-900 text-slate-400 hover:bg-slate-800 border border-slate-800';

  // "Все" и ⭐ всегда стоят первыми, дальше — обычные теги
  let html = `<button data-action="filterByTag" class="px-3 py-1 rounded-full shrink-0 font-medium transition ${state.selectedTag === null ? on : off}">Все</button>`;
  html += `<button data-action="filterByTag" data-tag="${FAV_TAG}" title="Избранное" class="px-3 py-1 rounded-full shrink-0 font-medium transition ${state.selectedTag === FAV_TAG ? on : off}">⭐</button>`;

  tags.forEach(tag => {
    html += `<button data-action="filterByTag" data-tag="${tag}" class="px-3 py-1 rounded-full shrink-0 font-medium transition ${state.selectedTag === tag ? on : off}">${tag}</button>`;
  });

  tagsContainer.innerHTML = html;
}

export function filterByTag(tag) {
  state.selectedTag = tag;
  state.currentPage = 1;
  renderTags();
  renderNotes();
}

export const actions = {
  filterByTag: (el) => filterByTag(el.dataset.tag || null),
};
