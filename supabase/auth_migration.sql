-- Переход сайта на вход через Supabase Auth (почта + пароль).
-- Выполнять в Supabase → SQL Editor, ПОСЛЕ создания своего пользователя и ПЕРЕД выкладкой нового сайта.
--
-- Что нужно изменить: ТОЛЬКО одну строку ниже — вместо ВАШ-UUID вставьте User UID
-- из Authentication → Users → ваш пользователь. Оставьте кавычки:  '1a2b3c4d-....'

-- 1. Владелец записи — пользователь Supabase Auth. Старая колонка user_id (Telegram ID) остаётся:
--    её по-прежнему заполняет бот, но сайт ею больше не пользуется.
do $$
declare
  owner uuid := 'ВАШ-UUID';   -- <-- единственное место, которое нужно заменить
begin
  if not exists (select 1 from auth.users where id = owner) then
    raise exception 'Пользователь с UUID % не найден в Authentication → Users', owner;
  end if;

  alter table public.notes add column if not exists owner_id uuid;
  update public.notes set owner_id = owner where owner_id is null;

  -- записи, которые бот добавляет в обход сайта, автоматически получают владельца
  execute format('alter table public.notes alter column owner_id set default %L', owner);
  alter table public.notes alter column owner_id set not null;
  alter table public.notes alter column user_id drop not null;
end $$;

-- 2. Доступ: только владелец своих записей
alter table public.notes enable row level security;

drop policy if exists "notes: owner only" on public.notes;
create policy "notes: owner only"
on public.notes for all to authenticated
using (owner_id = auth.uid())
with check (owner_id = auth.uid());

-- 3. Проверка (выполнить отдельно, после шагов 1–2):
--    without_owner должно быть 0
--      select count(*) filter (where owner_id is null) as without_owner, count(*) as total from public.notes;
--    список политик на notes:
--      select policyname, cmd, roles, qual from pg_policies where schemaname = 'public' and tablename = 'notes';
--    старые политики (сравнивали user_id с токеном от бота) удалите по одной:
--      drop policy "ИМЯ-СТАРОЙ-ПОЛИТИКИ" on public.notes;
--    оставить нужно только "notes: owner only".
--    Политики хранилища diary_photos (для роли authenticated) менять не нужно.
