export const state = {
  user: null,            // пользователь Telegram: { id, first_name, ... }
  allNotes: [],
  currentEditingId: null,
  selectedTag: null,
  searchQuery: '',
  openDays: {},
  currentTab: 'feed',
  currentPage: 1,        // страница ленты (1 = самый свежий месяц)
  currentCalSubTab: 'calendar',
  selectedEmoji: null,
  currentPhotos: [],
  isUploading: false,
  sessionUploads: [],    // файлы, загруженные в бакет за время открытия окна редактора (ещё не сохранены в записи)
  editorSession: 0,      // номер открытия окна: если изменился, пока шла загрузка, окно закрыли
  calCurrentDate: new Date(),
};
