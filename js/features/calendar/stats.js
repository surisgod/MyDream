import { state } from '../../state.js';

export function renderStats() {
  let totalWords = 0;
  let totalChars = 0;
  let totalNotesCount = state.allNotes.length;

  state.allNotes.forEach(note => {
    const text = note.text || '';
    totalChars += text.length;
    totalWords += text.trim() ? text.trim().split(/\s+/).length : 0;
  });

  const avgWords = totalNotesCount > 0 ? Math.round(totalWords / totalNotesCount) : 0;

  document.getElementById('statsContent').innerHTML = `
    <div class="bg-slate-950 border border-slate-800 p-4 rounded-xl space-y-1">
      <span class="text-xs text-slate-400">Всего записей</span>
      <p class="text-2xl font-bold text-purple-400">${totalNotesCount}</p>
    </div>
    <div class="bg-slate-950 border border-slate-800 p-4 rounded-xl space-y-1">
      <span class="text-xs text-slate-400">Всего слов в дневнике</span>
      <p class="text-2xl font-bold text-purple-400">${totalWords.toLocaleString('ru-RU')}</p>
    </div>
    <div class="bg-slate-950 border border-slate-800 p-4 rounded-xl space-y-1">
      <span class="text-xs text-slate-400">Средне в 1 записи</span>
      <p class="text-2xl font-bold text-purple-400">${avgWords} слов</p>
    </div>
  `;
}
