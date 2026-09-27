-- Migration 8: track which website a conversation came from, now that the same
-- Supabase backend will serve multiple sites for this business.
-- Run once in the SQL Editor.

alter table public.conversations add column if not exists source_site text
  check (source_site is null or char_length(source_site) <= 100);

NOTIFY pgrst, 'reload schema';
