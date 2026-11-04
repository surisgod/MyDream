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
