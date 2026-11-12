import { TELEGRAM_ENABLED } from '../../config.js';
import {
  mountTelegramWidget, linkTelegram, unlinkTelegram, getTelegramLink, telegramErrorText,
} from '../../services/telegramAuth.js';

// Раздел «Telegram» в настройках: привязка Telegram к аккаунту, чтобы входить через него
const $ = (id) => document.getElementById(id);
let widgetMounted = false;

function say(text, tone = 'text-slate-400') {
  const el = $('telegramMessage');
  el.textContent = text;
  el.className = `text-xs ${tone}`;
}

async function refresh() {
  const status = $('telegramStatus');
  try {
    const link = await getTelegramLink();
    if (link) {
      const name = link.first_name || 'Telegram';
      status.textContent = `Привязан: ${name}${link.username ? ` (@${link.username})` : ''}`;
      status.className = 'text-xs text-green-400';
      $('telegramLinkButton').classList.add('hidden');
      $('telegramUnlinkBtn').classList.remove('hidden');
    } else {
      status.textContent = 'Не привязан';
      status.className = 'text-xs text-slate-400';
      $('telegramUnlinkBtn').classList.add('hidden');
      $('telegramLinkButton').classList.remove('hidden');
      if (!widgetMounted) {
        widgetMounted = true;
        mountTelegramWidget($('telegramLinkButton'), onWidgetUser);
      }
    }
  } catch (error) {
    console.error(error);
    status.textContent = 'Не удалось получить статус привязки. Выполнен ли SQL из supabase/telegram_link.sql?';
    status.className = 'text-xs text-red-400';
  }
}

async function onWidgetUser(user) {
  say('Привязываю…');
  try {
    await linkTelegram(user);
    say('Telegram привязан', 'text-green-400');
  } catch (error) {
    console.error(error);
    say(telegramErrorText(error), 'text-red-400');
  }
  await refresh();
}

async function unlink() {
  if (!confirm('Отвязать Telegram? Входить на сайт можно будет только по почте и паролю.')) return;
  say('Отвязываю…');
  try {
    await unlinkTelegram();
    say('Telegram отвязан', 'text-green-400');
  } catch (error) {
    console.error(error);
    say(telegramErrorText(error), 'text-red-400');
  }
  await refresh();
}

export function initTelegramSection() {
  if (!TELEGRAM_ENABLED) return;
  $('telegramSection').classList.remove('hidden');
  refresh();
}

export const actions = {
  unlinkTelegram: () => unlink(),
};
