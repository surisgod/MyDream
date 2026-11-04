# Мой Дневник — структура проекта

Запускать нужно через HTTP(S)-сервер (ES-модули не работают с `file://`).
Для Telegram Mini App это и так хостинг по https.

```
index.html              разметка (без логики и стилей)
css/
  base.css              шапка, скроллбары
  markdown.css          стили отрендеренного markdown
js/
  main.js               точка входа: регистрация модулей и запуск
  config.js             ключи, лимиты, названия таблиц/бакетов
  state.js              общее состояние приложения
  core/
    actions.js          делегирование кликов (data-action="...")
  services/             всё, что общается с внешним миром
    supabase.js         клиент Supabase
    notesApi.js         CRUD записей
    photoStorage.js     загрузка фото в Storage
    telegram.js         Telegram WebApp
    auth.js             определение пользователя, экран входа
    localStore.js       localStorage (пользователь, черновик)
  utils/                чистые функции без DOM и состояния
    date.js  text.js  photos.js
  ui/
    stickyHeader.js     скрытие шапки при скролле
  features/             функциональные модули сайта
    navigation.js       переключение вкладок
    notes/notesController.js   загрузка записей + перерисовка экрана
    feed/               лента: feed, noteCard, tags, favorites, carousel
    calendar/           calendar, stats
    editor/             модалка записи: editorModal, emoji, markdownToolbar, photoUploader
    viewer/imageViewer.js      просмотр фото на весь экран
```

## Правила

- `services/` не знает про DOM, `features/` не ходят в Supabase напрямую.
- Клики: в разметке `data-action="имя"` + `data-*` параметры; обработчик
  объявляется в `export const actions` нужного модуля и подключается в `main.js`.
- Состояние только через `state`, константы только из `config.js`.

## Как добавить новый раздел (например, «Теги-облако»)

1. Создать `js/features/cloud/cloud.js` с `renderCloud()` и `export const actions = {...}`.
2. Добавить контейнер и кнопку вкладки в `index.html` (`data-action="switchTab" data-tab="cloud"`).
3. В `features/navigation.js` добавить ветку для вкладки в `switchTab`.
4. В `main.js` импортировать `actions` и добавить в `registerActions({...})`.
5. Если раздел зависит от списка записей — вызвать его рендер в `notesController.js`.
