-- Free-tier limits for Mokubico conversas: 1 live per host, auto-end at 60 min.
-- (Participant cap of 8 = host + 7 invited guests is enforced in the client.)

create unique index if not exists mokubico_one_live_per_host
  on public.mokubico_conversas (host_id) where status = 'live';

do $$ begin perform cron.unschedule('mokubico-conversa-expiry'); exception when others then null; end $$;
select cron.schedule(
  'mokubico-conversa-expiry', '*/5 * * * *',
  $$update public.mokubico_conversas set status='ended', ended_at=now()
    where status='live' and started_at < now() - interval '60 minutes'$$
);
