-- Migration 2: delivered/read ticks, image attachments, push subscriptions.
-- Run once in Supabase SQL Editor. BEFORE running, replace PASTE_YOUR_WEBHOOK_SECRET (last block)
-- with your WEBHOOK_SECRET. Do not commit the real secret.

-- ---------- columns ----------
alter table public.messages add column if not exists image_path text check (image_path is null or char_length(image_path) <= 200);
alter table public.messages add column if not exists delivered_at timestamptz;
alter table public.messages add column if not exists read_at timestamptz;

alter table public.messages drop constraint if exists messages_body_check;
alter table public.messages drop constraint if exists messages_body_or_image;
alter table public.messages add constraint messages_body_or_image
  check (char_length(body) <= 2000 and (char_length(body) >= 1 or image_path is not null));

-- image path must live in the conversation's own folder
drop policy if exists msg_insert_customer on public.messages;
create policy msg_insert_customer on public.messages for insert to authenticated
  with check (
    sender = 'customer'
    and (image_path is null or image_path like conversation_id::text || '/%')
    and exists (select 1 from public.conversations c where c.id = conversation_id and c.customer_id = auth.uid())
  );

drop policy if exists msg_insert_admin on public.messages;
create policy msg_insert_admin on public.messages for insert to authenticated
  with check (
    sender = 'admin'
    and public.is_admin()
    and (image_path is null or image_path like conversation_id::text || '/%')
  );

-- ---------- conversation summary + rate limit (now aware of photos) ----------
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
         last_message_preview = left(case when new.body <> '' then new.body else '[Photo]' end, 160),
         last_sender = new.sender
   where id = new.conversation_id;
  return new;
end;
$$;

-- ---------- delivered / read ----------
create or replace function public.mark_messages(conv uuid, kind text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare who text;
begin
  if kind not in ('delivered', 'read') then raise exception 'bad kind'; end if;
  if public.is_admin() then
    who := 'customer';
  elsif exists (select 1 from public.conversations c where c.id = conv and c.customer_id = auth.uid()) then
    who := 'admin';
  else
    return;
  end if;

  if kind = 'delivered' then
    update public.messages set delivered_at = now()
     where conversation_id = conv and sender = who and delivered_at is null;
  else
    update public.messages set delivered_at = coalesce(delivered_at, now()), read_at = now()
     where conversation_id = conv and sender = who and read_at is null;
  end if;
end;
$$;
revoke all on function public.mark_messages(uuid, text) from public;
grant execute on function public.mark_messages(uuid, text) to authenticated;

-- ---------- push subscriptions ----------
create table if not exists public.push_subscriptions (
  endpoint text not null,
  user_id uuid not null default auth.uid(),
  subscription jsonb not null,
  page_url text check (page_url is null or char_length(page_url) <= 500),
  created_at timestamptz not null default now(),
  primary key (endpoint, user_id)
);
alter table public.push_subscriptions enable row level security;

drop policy if exists push_select on public.push_subscriptions;
create policy push_select on public.push_subscriptions for select to authenticated using (user_id = auth.uid());
drop policy if exists push_insert on public.push_subscriptions;
create policy push_insert on public.push_subscriptions for insert to authenticated with check (user_id = auth.uid());
drop policy if exists push_update on public.push_subscriptions;
create policy push_update on public.push_subscriptions for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
drop policy if exists push_delete on public.push_subscriptions;
create policy push_delete on public.push_subscriptions for delete to authenticated using (user_id = auth.uid());

-- ---------- private image storage (max 5 MB, jpeg/png/webp) ----------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('chat-images', 'chat-images', false, 5242880, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do update
  set file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists chat_img_insert on storage.objects;
create policy chat_img_insert on storage.objects for insert to authenticated
  with check (
    bucket_id = 'chat-images'
    and (
      public.is_admin()
      or exists (select 1 from public.conversations c
                  where c.id::text = (storage.foldername(name))[1] and c.customer_id = auth.uid())
    )
  );

drop policy if exists chat_img_select on storage.objects;
create policy chat_img_select on storage.objects for select to authenticated
  using (
    bucket_id = 'chat-images'
    and (
      public.is_admin()
      or exists (select 1 from public.conversations c
                  where c.id::text = (storage.foldername(name))[1] and c.customer_id = auth.uid())
    )
  );

-- ---------- alert trigger: now fires for every message (customer + admin) ----------
-- The function decides: customer message -> Telegram + push to you; admin reply -> push to the customer.
create or replace function public.notify_telegram_on_message()
returns trigger
language plpgsql
security definer
set search_path = public, extensions
as $$
begin
  perform net.http_post(
    url := 'https://kejtfhaxrlvlckfrviju.supabase.co/functions/v1/notify-telegram',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-webhook-secret', 'PASTE_YOUR_WEBHOOK_SECRET'
    ),
    body := jsonb_build_object('type', 'INSERT', 'record', to_jsonb(new))
  );
  return new;
end;
$$;
