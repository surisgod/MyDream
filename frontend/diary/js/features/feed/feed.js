import { state } from '../../state.js';
import { FAV_TAG } from '../../config.js';
import { groupByDate } from '../../utils/date.js';
import { renderNoteCard } from './noteCard.js';

function matchesFilters(note, dateStr) {
  const text = (note.text || '').toLowerCase();
  const matchesText = text.includes(state.searchQuery);
  const matchesDate = dateStr.toLowerCase().includes(state.searchQuery);
  const matchesTag =
    state.selectedTag === null ? true :
    state.selectedTag === FAV_TAG ? !!note.is_favorite :
    text.includes(state.selectedTag.toLowerCase());

  return (matchesText || matchesDate) && matchesTag;
}

function notesWord(count) {
  return count === 1 ? 'запись' : count < 5 ? 'записи' : 'записей';
}

function renderDayGroup(date, notesList) {
  const isOpen = state.openDays[date] || false;
  const count = notesList.length;

  return `
    <div class="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden transition">
      <button data-action="toggleDay" data-date="${date}" class="w-full px-5 py-3 flex items-center justify-between bg-slate-900 hover:bg-slate-800/60 transition text-left">
        <div class="flex items-center space-x-3">
          <span class="text-xs text-purple-400 font-semibold uppercase tracking-wider">${date}</span>
          <span class="text-[10px] bg-slate-800 text-slate-400 px-2 py-0.5 rounded-full">${count} ${notesWord(count)}</span>
        </div>
        <span class="text-slate-400 text-sm transform transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}">▼</span>
      </button>

      <div class="${isOpen ? 'block' : 'hidden'} divide-y divide-slate-800/60 border-t border-slate-800/60">
        ${notesList.map(renderNoteCard).join('')}
      </div>
    </div>
  `;
}

export function renderNotes() {
  const container = document.getElementById('notesContainer');
  const groups = groupByDate(state.allNotes);
  const filteredGroups = {};

  Object.keys(groups).forEach(dateStr => {
    const matched = groups[dateStr].filter(note => matchesFilters(note, dateStr));
    if (matched.length > 0) filteredGroups[dateStr] = matched;
  });

  if (Object.keys(filteredGroups).length === 0) {
    container.innerHTML = (state.selectedTag === FAV_TAG && !state.searchQuery)
      ? '<p class="text-slate-500 text-center py-10">В избранном пока пусто. Нажмите ☆ у записи.</p>'
      : '<p class="text-slate-500 text-center py-10">Записей не найдено.</p>';
    return;
  }

  container.innerHTML = Object.keys(filteredGroups)
    .map(date => renderDayGroup(date, filteredGroups[date]))
    .join('');
}

export function toggleDay(dateStr) {
  state.openDays[dateStr] = !state.openDays[dateStr];
  renderNotes();
}

export function initSearch() {
  document.getElementById('searchInput').addEventListener('input', (e) => {
    state.searchQuery = e.target.value.toLowerCase().trim();
    if (state.searchQuery) {
      Object.keys(state.openDays).forEach(d => state.openDays[d] = true);
    }
    renderNotes();
  });
}

export const actions = {
  toggleDay: (el) => toggleDay(el.dataset.date),
};
