import { state } from '../../state.js';
import { FAV_TAG } from '../../config.js';
import { MONTH_NAMES, groupByDate } from '../../utils/date.js';
import { renderPagination } from '../../utils/Paginator.js';
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

// Одна страница = один месяц (только те месяцы, где есть записи после фильтров).
// Месяцы идут от новых к старым, страница 1 — самый свежий месяц.
function groupByMonth(filteredGroups) {
  const months = new Map();
  Object.entries(filteredGroups).forEach(([dateStr, notes]) => {
    const d = new Date(notes[0].created_at);
    const key = `${d.getFullYear()}-${d.getMonth()}`;
    if (!months.has(key)) {
      months.set(key, { title: `${MONTH_NAMES[d.getMonth()]} ${d.getFullYear()}`, groups: {} });
    }
    months.get(key).groups[dateStr] = notes;
  });
  return [...months.values()];
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

  const pages = groupByMonth(filteredGroups);
  state.currentPage = Math.min(Math.max(state.currentPage, 1), pages.length);
  const page = pages[state.currentPage - 1];

  container.innerHTML = `
    <h2 class="text-xs font-semibold text-slate-500 uppercase tracking-wider px-1">${page.title}</h2>
    ${Object.keys(page.groups).map(date => renderDayGroup(date, page.groups[date])).join('')}
    ${renderPagination(state.currentPage, pages.length)}
  `;
}

export function goToPage(page) {
  state.currentPage = page;
  renderNotes();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

export function toggleDay(dateStr) {
  state.openDays[dateStr] = !state.openDays[dateStr];
  renderNotes();
}

export function initSearch() {
  document.getElementById('searchInput').addEventListener('input', (e) => {
    state.searchQuery = e.target.value.toLowerCase().trim();
    state.currentPage = 1;
    if (state.searchQuery) {
      Object.keys(state.openDays).forEach(d => state.openDays[d] = true);
    }
    renderNotes();
  });
}

export const actions = {
  toggleDay: (el) => toggleDay(el.dataset.date),
  goToPage: (el) => goToPage(Number(el.dataset.page)),
};
