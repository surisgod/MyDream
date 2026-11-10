// Пагинация: ← 1 2 3 4 5 … 12 →
// Всего в ряду не больше MAX_PAGE_SLOTS кнопок с номерами (многоточие тоже занимает место).
// Формула рассчитана на нечётное число слотов от 5 и больше.
export const MAX_PAGE_SLOTS = 7;

export function buildPageList(current, total, slots = MAX_PAGE_SLOTS) {
  if (total <= slots) return Array.from({ length: total }, (_, i) => i + 1);

  const edge = slots - 2;                      // сколько страниц подряд у начала/конца
  const half = Math.floor((slots - 5) / 2);    // сколько соседей вокруг текущей страницы
  const range = (from, to) => Array.from({ length: to - from + 1 }, (_, i) => from + i);

  if (current <= edge - 1) return [...range(1, edge), '…', total];
  if (current >= total - edge + 2) return [1, '…', ...range(total - edge + 1, total)];
  return [1, '…', ...range(current - half, current + half), '…', total];
}

const BTN = 'min-w-8 h-8 px-2 inline-flex items-center justify-center text-xs rounded-lg transition';
const BTN_ON = 'bg-purple-600 text-white font-medium';
const BTN_OFF = 'bg-slate-900 border border-slate-800 text-slate-300 hover:bg-slate-800';
const BTN_DISABLED = 'bg-slate-900/40 border border-slate-800/60 text-slate-700 cursor-not-allowed';

function arrow(label, symbol, targetPage, enabled) {
  return enabled
    ? `<button data-action="goToPage" data-page="${targetPage}" aria-label="${label}" class="${BTN} ${BTN_OFF}">${symbol}</button>`
    : `<button disabled aria-label="${label}" class="${BTN} ${BTN_DISABLED}">${symbol}</button>`;
}

// HTML блока пагинации. Для одной страницы возвращает пустую строку.
export function renderPagination(current, total) {
  if (total <= 1) return '';

  const items = buildPageList(current, total).map(item => {
    if (item === '…') return `<span class="min-w-8 h-8 inline-flex items-center justify-center text-xs text-slate-600">…</span>`;
    return item === current
      ? `<button aria-current="page" class="${BTN} ${BTN_ON}">${item}</button>`
      : `<button data-action="goToPage" data-page="${item}" class="${BTN} ${BTN_OFF}">${item}</button>`;
  });

  return `
    <nav aria-label="Страницы" class="flex justify-center items-center flex-wrap gap-1 pt-2">
      ${arrow('Назад', '←', current - 1, current > 1)}
      ${items.join('')}
      ${arrow('Вперёд', '→', current + 1, current < total)}
    </nav>
  `;
}
