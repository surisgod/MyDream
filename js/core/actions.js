// Делегирование кликов: вместо onclick="fn()" в разметке используется
// data-action="fn" + data-* параметры. Каждый модуль регистрирует свои действия.
const registry = {};

export function registerActions(map) {
  for (const [name, handler] of Object.entries(map)) {
    if (registry[name]) console.warn(`Действие "${name}" зарегистрировано повторно`);
    registry[name] = handler;
  }
}

export function initActionDelegation() {
  document.addEventListener('click', (event) => {
    const el = event.target.closest('[data-action]');
    if (!el) return;
    const handler = registry[el.dataset.action];
    if (!handler) {
      console.warn(`Неизвестное действие: ${el.dataset.action}`);
      return;
    }
    handler(el, event);
  });
}
