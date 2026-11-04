const DATE_OPTIONS = { day: 'numeric', month: 'long', year: 'numeric' };

export const MONTH_NAMES = ['Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь', 'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'];

export function formatDateRu(date) {
  return new Date(date).toLocaleDateString('ru-RU', DATE_OPTIONS);
}

export function formatTimeRu(date) {
  return new Date(date).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
}

export function groupByDate(notesList) {
  const groups = {};
  notesList.forEach(note => {
    const dateStr = formatDateRu(note.created_at);
    if (!groups[dateStr]) groups[dateStr] = [];
    groups[dateStr].push(note);
  });
  return groups;
}
