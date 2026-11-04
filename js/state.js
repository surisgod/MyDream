// Единое изменяемое состояние приложения.
// Модули импортируют `state` и читают/пишут его поля напрямую.
export const state = {
  allNotes: [],
  currentEditingId: null,
  selectedTag: null,
  searchQuery: '',
  openDays: {},
  currentTab: 'feed',
  currentCalSubTab: 'calendar',
  selectedEmoji: null,   // по умолчанию без эмодзи
  currentPhotos: [],     // [{url, size}] — фото редактируемой записи
  isUploading: false,
  calCurrentDate: new Date(),
};
