-- Public creator flag so the "Criador Verificado" badge is visible to EVERYONE
-- (user_roles is RLS-restricted to self/admin, so it could never drive a public badge).
-- The flag is kept in sync automatically by a trigger on creator_applications:
-- approving a candidatura lights the badge; rejecting/suspending clears it.

alter table public.profiles add column if not exists is_creator boolean not null default false;

create or replace function public.sync_creator_status()
returns trigger
language plpgsql
security definer
set search_path = public
as $fn$
begin
  if new.status = 'approved' then
    update public.profiles set is_creator = true where id = new.user_id;
  elsif new.status in ('rejected','suspended') then
    -- only clear if they have no OTHER approved application
    if not exists (
      select 1 from public.creator_applications
      where user_id = new.user_id and status = 'approved' and id <> new.id
    ) then
      update public.profiles set is_creator = false where id = new.user_id;
    end if;
  end if;
  return new;
end;
$fn$;

drop trigger if exists trg_sync_creator_status on public.creator_applications;
create trigger trg_sync_creator_status
after insert or update of status on public.creator_applications
for each row execute function public.sync_creator_status();

-- Backfill any already-approved creators
update public.profiles p set is_creator = true
from public.creator_applications ca
where ca.user_id = p.id and ca.status = 'approved' and p.is_creator = false;
