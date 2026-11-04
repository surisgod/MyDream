import { supabaseClient } from './supabase.js';
import { NOTES_TABLE, MY_TELEGRAM_ID } from '../config.js';

// Все функции возвращают результат Supabase как есть: { data, error }
const table = () => supabaseClient.from(NOTES_TABLE);

export const fetchNotes = () => table().select('*').order('created_at', { ascending: false });
export const insertNote = (fields) => {
  const dataWithUser = {
    ...fields,
    user_id: MY_TELEGRAM_ID
  };
  return table().insert([dataWithUser]);
};
export const updateNote = (id, fields) => table().update(fields).eq('id', id);
export const deleteNote = (id) => table().delete().eq('id', id);