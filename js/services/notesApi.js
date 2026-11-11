import { supabaseClient } from './supabase.js';
import { NOTES_TABLE } from '../config.js';

// Все функции возвращают результат Supabase как есть: { data, error }.
// Каждая запись принадлежит пользователю Telegram (колонка user_id).
const table = () => supabaseClient.from(NOTES_TABLE);

export const fetchNotes = (userId) =>
  table().select('*').eq('user_id', userId).order('created_at', { ascending: false });

export const insertNote = (userId, fields) =>
  table().insert([{ ...fields, user_id: userId }]);

export const updateNote = (userId, id, fields) =>
  table().update(fields).eq('id', id).eq('user_id', userId);

export const deleteNote = (userId, id) =>
  table().delete().eq('id', id).eq('user_id', userId);

// photo_url всех записей, у которых есть фото. Читаем постранично: за один запрос Supabase
// отдаёт не больше 1000 строк, и без этого ссылки из «хвоста» таблицы потерялись бы.
// При любой ошибке бросает исключение — неполный список использовать нельзя.
export async function fetchAllPhotoRefs() {
  const PAGE = 1000;
  const refs = [];
  for (let from = 0; ; from += PAGE) {
    const { data, error } = await table()
      .select('photo_url')
      .not('photo_url', 'is', null)
      .order('id', { ascending: true })
      .range(from, from + PAGE - 1);
    if (error) throw error;
    refs.push(...data.map(row => row.photo_url));
    if (data.length < PAGE) return refs;
  }
}
