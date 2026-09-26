-- Migration 4: record device and location details for the admin. Run once in the Supabase SQL Editor.
-- (No secrets in this file.)

alter table public.conversations add column if not exists user_agent text;
alter table public.conversations add column if not exists country text;
alter table public.conversations add column if not exists location text;
alter table public.conversations add column if not exists device_info jsonb
  check (device_info is null or pg_column_size(device_info) < 3000);

create or replace function public.request_header(name text)
returns text
language sql
stable
as $$
  select nullif(nullif(current_setting('request.headers', true), '')::json ->> name, '');
$$;

-- Server fills IP, browser string and country itself, so customers cannot fake them.
create or replace function public.block_banned()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_table_name = 'messages' and new.sender <> 'customer' then
    return new;
  end if;
  if tg_table_name = 'conversations' then
    new.ip := public.request_ip();
    new.user_agent := left(public.request_header('user-agent'), 400);
    new.country := left(public.request_header('cf-ipcountry'), 8);
    new.location := null;
  end if;
  if public.is_banned() then
    raise exception 'chat_blocked';
  end if;
  return new;
end;
$$;
