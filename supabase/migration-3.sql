-- Migration 3: admin can ban users / IPs and delete messages or whole chats.
-- Run once in Supabase SQL Editor. (No secrets in this file.)

-- ---------- ban lists (admin only) ----------
alter table public.conversations add column if not exists ip text;

create table if not exists public.banned_users (
  customer_id uuid primary key,
  reason text,
  created_at timestamptz not null default now()
);
create table if not exists public.banned_ips (
  ip text primary key,
  reason text,
  created_at timestamptz not null default now()
);
alter table public.banned_users enable row level security;
alter table public.banned_ips enable row level security;

drop policy if exists banned_users_admin on public.banned_users;
create policy banned_users_admin on public.banned_users for all to authenticated
  using (public.is_admin()) with check (public.is_admin());
drop policy if exists banned_ips_admin on public.banned_ips;
create policy banned_ips_admin on public.banned_ips for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

-- ---------- who is calling? ----------
create or replace function public.request_ip()
returns text
language sql
stable
as $$
  select nullif(trim(coalesce(
    nullif(current_setting('request.headers', true), '')::json ->> 'cf-connecting-ip',
    split_part(coalesce(nullif(current_setting('request.headers', true), '')::json ->> 'x-forwarded-for', ''), ',', 1)
  )), '');
$$;

create or replace function public.is_banned()
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (select 1 from public.banned_users where customer_id = auth.uid())
      or exists (select 1 from public.banned_ips where ip = public.request_ip());
$$;

-- ---------- enforce bans + record the customer's IP ----------
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
  end if;
  if public.is_banned() then
    raise exception 'chat_blocked';
  end if;
  return new;
end;
$$;

drop trigger if exists messages_block_banned on public.messages;
create trigger messages_block_banned before insert on public.messages
  for each row execute function public.block_banned();

drop trigger if exists conversations_block_banned on public.conversations;
create trigger conversations_block_banned before insert on public.conversations
  for each row execute function public.block_banned();

-- banned customers cannot upload photos either
drop policy if exists chat_img_insert on storage.objects;
create policy chat_img_insert on storage.objects for insert to authenticated
  with check (
    bucket_id = 'chat-images'
    and (
      public.is_admin()
      or (
        not public.is_banned()
        and exists (select 1 from public.conversations c
                     where c.id::text = (storage.foldername(name))[1] and c.customer_id = auth.uid())
      )
    )
  );

-- ---------- admin-only deletes ----------
drop policy if exists msg_delete_admin on public.messages;
create policy msg_delete_admin on public.messages for delete to authenticated using (public.is_admin());

drop policy if exists conv_delete_admin on public.conversations;
create policy conv_delete_admin on public.conversations for delete to authenticated using (public.is_admin());

drop policy if exists chat_img_delete on storage.objects;
create policy chat_img_delete on storage.objects for delete to authenticated
  using (bucket_id = 'chat-images' and public.is_admin());

-- keep the inbox preview correct after a message is deleted
create or replace function public.on_message_delete()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare m record;
begin
  select body, sender, created_at into m
    from public.messages where conversation_id = old.conversation_id
    order by created_at desc limit 1;
  if found then
    update public.conversations
       set last_message_at = m.created_at,
           last_message_preview = left(case when m.body <> '' then m.body else '[Photo]' end, 160),
           last_sender = m.sender
     where id = old.conversation_id;
  end if;
  return old;
end;
$$;

drop trigger if exists messages_after_delete on public.messages;
create trigger messages_after_delete after delete on public.messages
  for each row execute function public.on_message_delete();
