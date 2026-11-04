import { state } from '../state.js';
import { renderNotes } from './feed/feed.js';
import { renderCalendar, resetCalendarToCurrent } from './calendar/calendar.js';
import { renderStats } from './calendar/stats.js';

export function switchTab(tab) {
  state.currentTab = tab;
  const feedBtn = document.getElementById('tabFeedBtn');
  const calBtn = document.getElementById('tabCalBtn');
  const notesContainer = document.getElementById('notesContainer');
  const calendarContainer = document.getElementById('calendarContainer');
  const searchWrapper = document.getElementById('searchWrapper');
  const tagsContainer = document.getElementById('tagsContainer');

  if (tab === 'feed') {
    feedBtn.className = "flex-1 py-1.5 text-xs font-medium rounded-lg bg-purple-600 text-white transition";
    calBtn.className = "flex-1 py-1.5 text-xs font-medium rounded-lg text-slate-400 hover:text-white transition";
    notesContainer.classList.remove('hidden');
    searchWrapper.classList.remove('hidden');
    tagsContainer.classList.remove('hidden');
    calendarContainer.classList.add('hidden');
    renderNotes();
  } else {
    calBtn.className = "flex-1 py-1.5 text-xs font-medium rounded-lg bg-purple-600 text-white transition";
    feedBtn.className = "flex-1 py-1.5 text-xs font-medium rounded-lg text-slate-400 hover:text-white transition";
    notesContainer.classList.add('hidden');
    searchWrapper.classList.add('hidden');
    tagsContainer.classList.add('hidden');
    calendarContainer.classList.remove('hidden');
    resetCalendarToCurrent();
  }
}

export function switchCalSubTab(subTab) {
  state.currentCalSubTab = subTab;
  const subTabCalBtn = document.getElementById('subTabCalBtn');
  const subTabStatBtn = document.getElementById('subTabStatBtn');
  const calendarViewBlock = document.getElementById('calendarViewBlock');
  const statsViewBlock = document.getElementById('statsViewBlock');

  if (subTab === 'calendar') {
    subTabCalBtn.className = "flex-1 py-1 text-xs font-medium rounded-lg bg-purple-600 text-white transition";
    subTabStatBtn.className = "flex-1 py-1 text-xs font-medium rounded-lg text-slate-400 hover:text-white transition";
    calendarViewBlock.classList.remove('hidden');
    statsViewBlock.classList.add('hidden');
    renderCalendar();
  } else {
    subTabStatBtn.className = "flex-1 py-1 text-xs font-medium rounded-lg bg-purple-600 text-white transition";
    subTabCalBtn.className = "flex-1 py-1 text-xs font-medium rounded-lg text-slate-400 hover:text-white transition";
    calendarViewBlock.classList.add('hidden');
    statsViewBlock.classList.remove('hidden');
    renderStats();
  }
}

export function openDayFromCalendar(dateStr) {
  switchTab('feed');
  state.openDays[dateStr] = true;
  state.searchQuery = dateStr.toLowerCase();
  document.getElementById('searchInput').value = dateStr;
  renderNotes();
}

export const actions = {
  switchTab: (el) => switchTab(el.dataset.tab),
  switchCalSubTab: (el) => switchCalSubTab(el.dataset.tab),
  openDayFromCalendar: (el) => openDayFromCalendar(el.dataset.date),
};
