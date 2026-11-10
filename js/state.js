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
  calCurrentDate: new Date(),
};
