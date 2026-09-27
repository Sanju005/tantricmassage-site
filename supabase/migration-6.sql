-- Migration 6: track whether a conversation has already received its automatic
-- welcome reply, so it only ever gets sent once. Run once in the SQL Editor.

alter table public.conversations add column if not exists welcomed boolean not null default false;

NOTIFY pgrst, 'reload schema';
