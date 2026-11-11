import { supabaseClient } from '../../services/supabase.js';
import { fetchAllPhotoRefs } from '../../services/notesApi.js';
import { deletePhotos } from '../../services/photoStorage.js';
import { PHOTOS_BUCKET } from '../../config.js';
import { parsePhotos, toStoragePath } from '../../utils/photos.js';
import { formatMB } from '../../utils/text.js';

// Файлы моложе этого возраста не трогаем: возможно, их только что загрузили в редактор,
// открытый в другой вкладке, и запись ещё не сохранена.
const MIN_AGE_MS = 60 * 60 * 1000;
const LIST_PAGE = 100;

// Все файлы бакета, включая вложенные папки: [{ path, size, createdAt }]
async function listAllFiles(folder = '') {
  const bucket = supabaseClient.storage.from(PHOTOS_BUCKET);
  const files = [];
  for (let offset = 0; ; offset += LIST_PAGE) {
    const { data, error } = await bucket.list(folder, {
      limit: LIST_PAGE, offset, sortBy: { column: 'name', order: 'asc' },
    });
    if (error) throw error;
    for (const item of data) {
      if (item.name.startsWith('.')) continue;                       // служебные файлы (.emptyFolderPlaceholder)
      const path = folder ? `${folder}/${item.name}` : item.name;
      if (item.id === null) files.push(...await listAllFiles(path)); // папка
      else files.push({ path, size: item.metadata?.size || 0, createdAt: item.created_at });
    }
    if (data.length < LIST_PAGE) return files;
  }
}

// Файлы бакета, на которые не ссылается ни одна запись. Ничего не удаляет.
export async function findUnusedPhotos() {
  const [files, refs] = await Promise.all([listAllFiles(), fetchAllPhotoRefs()]);

  // Файл считается используемым, если его путь разобран из записи ИЛИ просто встречается в тексте
  // photo_url (на случай формата, который код не разобрал): лучше оставить лишнее, чем удалить нужное.
  const parsed = new Set(
    refs.flatMap(ref => parsePhotos(ref)).map(p => toStoragePath(p.url)).filter(Boolean)
  );
  const rawText = refs.join('\n');
  const isUsed = (path) => parsed.has(path) || rawText.includes(path) || rawText.includes(encodeURI(path));

  const now = Date.now();
  const isFresh = (file) => file.createdAt && now - new Date(file.createdAt).getTime() < MIN_AGE_MS;

  return {
    total: files.length,
    unused: files.filter(file => !isUsed(file.path) && !isFresh(file)),
  };
}

// Кнопка «Очистить неиспользуемые фото»: проверка → подтверждение → удаление → результат рядом с кнопкой
export async function cleanupPhotos() {
  const button = document.getElementById('cleanupBtn');
  const out = document.getElementById('cleanupResult');
  const say = (text, tone = 'text-slate-400') => {
    out.textContent = text;
    out.className = `text-xs ${tone}`;
  };

  button.disabled = true;
  say('Проверяю…');
  try {
    const { unused } = await findUnusedPhotos();
    if (!unused.length) {
      say('Лишних фото нет', 'text-green-400');
      return;
    }

    const bytes = unused.reduce((sum, file) => sum + file.size, 0);
    const sizeText = bytes ? ` (${formatMB(bytes)} МБ)` : '';
    if (!confirm(`Найдено неиспользуемых фото: ${unused.length}${sizeText}.\nОни не привязаны ни к одной записи. Удалить безвозвратно?`)) {
      say(`Найдено ${unused.length}, ничего не удалено`);
      return;
    }

    say('Удаляю…');
    const removed = await deletePhotos(unused.map(file => file.path));
    if (removed === unused.length) {
      say(`Удалено: ${removed} фото${sizeText}`, 'text-green-400');
    } else {
      say(`Удалено ${removed} из ${unused.length} — проверьте политику DELETE у бакета`, 'text-red-400');
    }
  } catch (error) {
    console.error(error);
    say('Не удалось выполнить очистку. Ничего не удалено.', 'text-red-400');
  } finally {
    button.disabled = false;
  }
}
