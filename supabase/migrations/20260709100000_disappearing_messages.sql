-- Make "Disappearing Messages" actually work.
--
-- Until now the conversation stored a duration but nothing acted on it: no
-- message ever got an expires_at, nothing filtered or deleted expired ones.
-- This wires the full lifecycle server-side.

-- 1) On insert, stamp expires_at from the conversation's chosen duration.
create or replace function public.set_message_expiry()
returns trigger
language plpgsql
security definer
set search_path to 'public'
as $$
declare
  v_dur text;
begin
  -- Respect an explicitly provided value (e.g. view-once media flows).
  if new.expires_at is not null then
    return new;
  end if;

  select disappearing_messages_duration into v_dur
  from public.conversations
  where id = new.conversation_id;

  if v_dur is null then
    return new;
  end if;

  new.expires_at := now() + case v_dur
    when '24h' then interval '24 hours'
    when '7d'  then interval '7 days'
    when '90d' then interval '90 days'
    else null
  end;

  return new;
end;
$$;

drop trigger if exists trg_set_message_expiry on public.messages;
create trigger trg_set_message_expiry
  before insert on public.messages
  for each row execute function public.set_message_expiry();

-- 2) Hard-delete expired messages regularly (so they truly disappear, not just
--    hidden). pg_cron runs in the database; every 10 minutes is plenty.
create extension if not exists pg_cron;

do $$
begin
  perform cron.unschedule('purge-expired-messages');
exception when others then
  null; -- job didn't exist yet
end $$;

select cron.schedule(
  'purge-expired-messages',
  '*/10 * * * *',
  $$delete from public.messages where expires_at is not null and expires_at < now()$$
);
