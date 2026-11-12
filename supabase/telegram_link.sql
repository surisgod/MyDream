-- Привязка Telegram к аккаунту сайта (вход через Telegram как второй способ входа).
-- Выполнить в Supabase → SQL Editor. Нужна, только если на сайте включён вход через Telegram
-- (TELEGRAM_ENABLED = true в js/config.js).

create table if not exists public.telegram_links (
  telegram_id    bigint primary key,
  user_id        uuid not null unique references auth.users(id) on delete cascade,
  first_name     text,
  username       text,
  last_auth_date bigint not null default 0,   -- защита от повторного использования одних и тех же данных Telegram
  linked_at      timestamptz not null default now()
);

alter table public.telegram_links enable row level security;

-- Сайт может только прочитать свою привязку (чтобы показать «Привязан: …» в настройках)
create policy "telegram_links: read own"
on public.telegram_links for select to authenticated
using (user_id = auth.uid());

-- Политик на запись нет намеренно: привязывает и отвязывает только сервер (бот на Render)
-- своим сервисным ключом, проверив и вход на сайте, и подпись Telegram.
