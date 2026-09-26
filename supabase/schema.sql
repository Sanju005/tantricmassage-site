-- Private chat schema. Run once in Supabase: SQL Editor -> New query -> paste -> Run.
-- Prerequisites (Dashboard -> Authentication):
--   * Sign In / Providers: enable "Allow anonymous sign-ins"
--   * Sign In / Providers -> Email: turn OFF "Allow new users to sign up" AFTER you create your admin user

create extension if not exists pgcrypto;

create table if not exists public.admins (
  user_id uuid primary key references auth.users(id) on delete cascade
);
alter table public.admins enable row level security;
-- no policies on purpose: nobody can read/write admins through the API

create or replace function public.is_admin()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (select 1 from public.admins where user_id = auth.uid());
$$;

create table if not exists public.conversations (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null default auth.uid(),
  contact text check (contact is null or char_length(contact) <= 200),
  created_at timestamptz not null default now(),
  last_message_at timestamptz not null default now(),
  last_message_preview text not null default '',
  last_sender text not null default 'customer' check (last_sender in ('customer','admin'))
);
create index if not exists conversations_customer_idx on public.conversations (customer_id);
create index if not exists conversations_last_idx on public.conversations (last_message_at desc);

create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  sender text not null check (sender in ('customer','admin')),
  body text not null check (char_length(body) between 1 and 2000),
  created_at timestamptz not null default now()
);
create index if not exists messages_conv_idx on public.messages (conversation_id, created_at);

alter table public.conversations enable row level security;
alter table public.messages enable row level security;

drop policy if exists conv_select on public.conversations;
create policy conv_select on public.conversations for select to authenticated
  using (customer_id = auth.uid() or public.is_admin());

drop policy if exists conv_insert on public.conversations;
create policy conv_insert on public.conversations for insert to authenticated
  with check (customer_id = auth.uid());

drop policy if exists msg_select on public.messages;
create policy msg_select on public.messages for select to authenticated
  using (
    public.is_admin()
    or exists (select 1 from public.conversations c where c.id = conversation_id and c.customer_id = auth.uid())
  );

drop policy if exists msg_insert_customer on public.messages;
create policy msg_insert_customer on public.messages for insert to authenticated
  with check (
    sender = 'customer'
    and exists (select 1 from public.conversations c where c.id = conversation_id and c.customer_id = auth.uid())
  );

drop policy if exists msg_insert_admin on public.messages;
create policy msg_insert_admin on public.messages for insert to authenticated
  with check (sender = 'admin' and public.is_admin());

-- Keep conversation summary fresh and rate-limit customers (10 messages / minute / conversation).
create or replace function public.on_message_insert()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.sender = 'customer' then
    if (select count(*) from public.messages
        where conversation_id = new.conversation_id
          and sender = 'customer'
          and created_at > now() - interval '1 minute') >= 10 then
      raise exception 'Too many messages, please wait a moment.';
    end if;
  end if;

  update public.conversations
     set last_message_at = new.created_at,
         last_message_preview = left(new.body, 160),
         last_sender = new.sender
   where id = new.conversation_id;
  return new;
end;
$$;

drop trigger if exists messages_before_insert on public.messages;
create trigger messages_before_insert before insert on public.messages
  for each row execute function public.on_message_insert();

-- Limit how many conversations one anonymous customer can open.
create or replace function public.limit_conversations()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if (select count(*) from public.conversations
       where customer_id = new.customer_id
         and created_at > now() - interval '1 hour') >= 5 then
    raise exception 'Too many conversations, please wait.';
  end if;
  return new;
end;
$$;

drop trigger if exists conversations_before_insert on public.conversations;
create trigger conversations_before_insert before insert on public.conversations
  for each row execute function public.limit_conversations();

-- Realtime (live replies in the chat box and live inbox for you)
alter publication supabase_realtime add table public.messages;
alter publication supabase_realtime add table public.conversations;

-- AFTER creating your admin login (Authentication -> Users -> Add user), run this once,
-- replacing the email with yours:
-- insert into public.admins (user_id) select id from auth.users where email = 'YOUR-EMAIL-HERE';
