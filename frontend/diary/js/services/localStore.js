import { STORAGE_KEYS } from '../config.js';

export const getSavedUser = () => JSON.parse(localStorage.getItem(STORAGE_KEYS.user) || 'null');
export const saveUser = (user) => localStorage.setItem(STORAGE_KEYS.user, JSON.stringify(user));

export const getDraft = () => localStorage.getItem(STORAGE_KEYS.draft) || '';
export const saveDraft = (text) => localStorage.setItem(STORAGE_KEYS.draft, text);
export const clearDraft = () => localStorage.removeItem(STORAGE_KEYS.draft);
