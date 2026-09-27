-- Migration 5: customer-controlled chat retention (auto-hide after 30 days, or keep).
-- This only affects what the CUSTOMER sees in their own chat box. It never deletes
-- any data by itself -- the admin inbox always keeps full history, and the admin's
-- own "Delete chat" / "Delete message" buttons remain the only real deletion.
-- Run once in the SQL Editor.

alter table public.conversations add column if not exists retain text not null default 'auto_30'
  check (retain in ('auto_30', 'keep'));

create or replace function public.set_chat_retention(conv uuid, keep boolean)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not exists (select 1 from public.conversations c where c.id = conv and c.customer_id = auth.uid()) then
    return;
  end if;
  update public.conversations set retain = case when keep then 'keep' else 'auto_30' end where id = conv;
end;
$$;
revoke all on function public.set_chat_retention(uuid, boolean) from public;
grant execute on function public.set_chat_retention(uuid, boolean) to authenticated;

-- Without this, PostgREST can keep serving 404s for the new function for a while
-- after it is created -- this is what caused the earlier "read/delivered" bug.
NOTIFY pgrst, 'reload schema';
