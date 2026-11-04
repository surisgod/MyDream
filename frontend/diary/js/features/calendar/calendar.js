import { state } from '../../state.js';
import { MONTH_NAMES, groupByDate, formatDateRu } from '../../utils/date.js';
import { countWords } from '../../utils/text.js';

export function getTopEmoji(notes) {
  const counts = new Map(); // порядок вставки: от новых записей к старым
  notes.forEach(n => {
    if (n.emoji) counts.set(n.emoji, (counts.get(n.emoji) || 0) + 1);
  });
  let best = '';
  let bestCount = 0;
  counts.forEach((c, e) => {
    if (c > bestCount) { best = e; bestCount = c; }
  });
  return best;
}

export function renderCalendar() {
  const year = state.calCurrentDate.getFullYear();
  const month = state.calCurrentDate.getMonth();

  document.getElementById('calMonthTitle').innerText = `${MONTH_NAMES[month]} ${year}`;

  const firstDayIndex = (new Date(year, month, 1).getDay() + 6) % 7;
  const totalDays = new Date(year, month + 1, 0).getDate();
  const groups = groupByDate(state.allNotes);

  let html = '';
  let monthWords = 0;

  for (let i = 0; i < firstDayIndex; i++) {
    html += `<div class="min-h-[3.5rem] bg-slate-950/40 rounded-xl opacity-20"></div>`;
  }

  for (let day = 1; day <= totalDays; day++) {
    const checkDate = new Date(year, month, day);
    const dateStrRu = formatDateRu(checkDate);

    const notesOnThisDay = groups[dateStrRu] || [];
    const hasNotes = notesOnThisDay.length > 0;
    const dayWords = notesOnThisDay.reduce((sum, n) => sum + countWords(n.text), 0);
    monthWords += dayWords;
    const topEmoji = getTopEmoji(notesOnThisDay);

    html += `
      <div data-action="openDayFromCalendar" data-date="${dateStrRu}" class="min-h-[3.5rem] py-1 bg-slate-950 border ${hasNotes ? 'border-purple-600/60 bg-purple-950/20 cursor-pointer hover:bg-purple-900/30' : 'border-slate-800/80'} rounded-xl flex flex-col items-center justify-center transition">
        <span class="text-xs leading-none ${hasNotes ? 'text-purple-300 font-bold' : 'text-slate-500'}">${day}</span>
        <span class="text-xs h-4 leading-4 mt-0.5">${topEmoji}</span>
        <span class="text-[9px] leading-none text-slate-400">${hasNotes ? dayWords : ''}</span>
      </div>
    `;
  }

  document.getElementById('calGrid').innerHTML = html;
  document.getElementById('calMonthWords').textContent = monthWords.toLocaleString('ru-RU');
}

export function changeMonth(direction) {
  state.calCurrentDate.setMonth(state.calCurrentDate.getMonth() + direction);
  renderCalendar();
}

export function resetCalendarToCurrent() {
  state.calCurrentDate = new Date();
  renderCalendar();
}

export const actions = {
  changeMonth: (el) => changeMonth(Number(el.dataset.dir)),
  resetCalendarToCurrent: () => resetCalendarToCurrent(),
};
