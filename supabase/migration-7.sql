-- Migration 7: optional customer nickname, shown to the admin instead of a bare
-- timestamp, and used for the customer's own avatar initial in the chat.
-- Run once in the SQL Editor.

alter table public.conversations add column if not exists nickname text
  check (nickname is null or char_length(nickname) <= 40);

NOTIFY pgrst, 'reload schema';
