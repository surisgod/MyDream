import { state } from '../../state.js';
import { fetchNotes } from '../../services/notesApi.js';
import { groupByDate } from '../../utils/date.js';
import { parsePhotos, toStoragePath } from '../../utils/photos.js';
import { ensurePhotoUrls } from '../../services/photoUrls.js';
import { renderTags } from '../feed/tags.js';
import { renderNotes } from '../feed/feed.js';
import { renderCalendar } from '../calendar/calendar.js';
import { renderStats } from '../calendar/stats.js';

// Загружает записи и перерисовывает активный экран.
// Новый раздел сайта, зависящий от списка записей, подключается здесь.
export async function loadNotes() {
  const { data, error } = await fetchNotes(state.user.id);
  if (error) {
    console.error(error);
    return;
  }
  state.allNotes = data || [];

  // фото лежат в приватном бакете — до показа получаем временные ссылки
  const photoPaths = state.allNotes
    .flatMap(note => parsePhotos(note.photo_url))
    .map(photo => toStoragePath(photo.url))
    .filter(Boolean);
  await ensurePhotoUrls(photoPaths);

  const groups = groupByDate(state.allNotes);
  Object.keys(groups).forEach(date => {
    if (state.openDays[date] === undefined) state.openDays[date] = false;
  });

  renderTags();
  if (state.currentTab === 'feed') renderNotes();
  else if (state.currentCalSubTab === 'calendar') renderCalendar();
  else renderStats();
}
