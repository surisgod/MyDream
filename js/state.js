export const state = {
  user: null,            // пользователь Telegram: { id, first_name, ... }
  allNotes: [],
  currentEditingId: null,
  selectedTag: null,
  searchQuery: '',
  openDays: {},
  currentTab: 'feed',
  currentCalSubTab: 'calendar',
  selectedEmoji: null,
  currentPhotos: [],
  isUploading: false,
  calCurrentDate: new Date(),
};
